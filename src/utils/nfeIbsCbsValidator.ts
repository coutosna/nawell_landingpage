// Motor de validação de qualidade tributária IBS/CBS.
// Porte fiel de validador.py: cruza cada item de cada nota contra as tabelas oficiais
// (NCM/TIPI, CFOP/CONFAZ, CST-IBS/CBS + cClassTrib/Portal NF-e, CNAE/IBGE) e aponta
// inconsistências. Gera um score de risco por nota e a exposição financeira em R$.

import { NCM_SET, CFOP_SET, CCLASS_BY_CODE, CNAE_SET } from "@/data/oficial";
import type { Nota, ItemNota, Achado, ResultadoValidacao } from "@/types/nfe";

const CFOP_ENTRADA_PREFIXOS = ["1.", "2.", "3."]; // entradas/aquisições; incompatível com nota de saída (venda)

const PESO_SEVERIDADE: Record<string, number> = { alta: 20, media: 8 };

export function cnpjValido(cnpj: string): boolean {
  if (!cnpj || cnpj.length !== 14 || !/^\d{14}$/.test(cnpj)) return false;

  const calc = (digs: string, pesos: number[]) => {
    const soma = digs.split("").reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calc(cnpj.slice(0, 12), pesos1);
  const d2 = calc(cnpj.slice(0, 12) + String(d1), [6, ...pesos1]);
  return cnpj.slice(12) === `${d1}${d2}`;
}

function parseData(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function parseDataOficial(s: string | null): Date | null {
  if (!s) return null;
  return new Date(s.replace(" ", "T"));
}

export function validarItem(item: ItemNota, dataEmissao: Date): Achado[] {
  const achados: Achado[] = [];

  // 1. Formato do NCM: exatamente 8 dígitos numéricos
  if (!(item.ncm.length === 8 && /^\d{8}$/.test(item.ncm))) {
    achados.push({
      nItem: item.nItem,
      tipo: "ncm_formato_invalido",
      severidade: "media",
      detalhe: `NCM '${item.ncm}' não tem os 8 dígitos exigidos`,
    });
  } else if (!NCM_SET.has(item.ncm)) {
    // 1b. NCM existe na TIPI? (só faz sentido checar se o formato já é válido)
    achados.push({
      nItem: item.nItem,
      tipo: "ncm_invalido",
      severidade: "alta",
      detalhe: `NCM ${item.ncm} não consta na tabela TIPI vigente`,
    });
  }

  // 1c. Coerência aritmética: valor_unitario x quantidade == valor_total
  const esperado = Math.round(item.valor_unitario * item.quantidade * 100) / 100;
  if (Math.abs(esperado - item.valor_total) > 0.02) {
    achados.push({
      nItem: item.nItem,
      tipo: "valor_incoerente",
      severidade: "media",
      detalhe: `valor_total (${item.valor_total}) não bate com valor_unitario x quantidade (${esperado})`,
    });
  }

  // 2. CFOP é código de entrada numa nota de saída (venda)?
  if (CFOP_ENTRADA_PREFIXOS.some((p) => item.cfop.startsWith(p))) {
    achados.push({
      nItem: item.nItem,
      tipo: "cfop_incompativel_operacao",
      severidade: "alta",
      detalhe: `CFOP ${item.cfop} é código de entrada, incompatível com nota de saída (venda)`,
    });
  } else if (!CFOP_SET.has(item.cfop)) {
    achados.push({
      nItem: item.nItem,
      tipo: "cfop_invalido",
      severidade: "alta",
      detalhe: `CFOP ${item.cfop} não existe na tabela oficial do CONFAZ`,
    });
  }

  // 3. cClassTrib declarado bate com o CST-IBS/CBS informado?
  const cclassCode = item.cclasstrib;
  const cstDeclarado = String(item.cst_ibs_cbs);
  const cclassRef = cclassCode ? CCLASS_BY_CODE.get(cclassCode) : undefined;

  if (!cclassRef) {
    achados.push({
      nItem: item.nItem,
      tipo: "cclasstrib_invalido",
      severidade: "alta",
      detalhe: `cClassTrib ${cclassCode} não existe na tabela oficial`,
    });
  } else {
    const cstOficial = String(cclassRef["CST-IBS/CBS"]);
    if (cstOficial !== cstDeclarado) {
      achados.push({
        nItem: item.nItem,
        tipo: "cst_cclasstrib_mismatch",
        severidade: "alta",
        detalhe: `CST declarado ${cstDeclarado} não bate com cClassTrib ${cclassCode} (pertence ao CST ${cstOficial})`,
      });
    }

    // 3b. cClassTrib habilitado para uso em NF-e?
    if (cclassRef.indNFe === 0) {
      achados.push({
        nItem: item.nItem,
        tipo: "cclasstrib_documento_incompativel",
        severidade: "alta",
        detalhe: `cClassTrib ${cclassCode} não é habilitado para uso em NF-e (indNFe=0)`,
      });
    }

    // 3c. Percentual de redução declarado no item bate com o oficial do cClassTrib?
    const pRedIbsOficial = cclassRef.pRedIBS ?? 0;
    const pRedCbsOficial = cclassRef.pRedCBS ?? 0;
    const pRedIbsDecl = item.pRedIBS_declarado;
    const pRedCbsDecl = item.pRedCBS_declarado;
    if (
      (pRedIbsDecl !== undefined && pRedIbsDecl !== pRedIbsOficial) ||
      (pRedCbsDecl !== undefined && pRedCbsDecl !== pRedCbsOficial)
    ) {
      achados.push({
        nItem: item.nItem,
        tipo: "aliquota_reducao_divergente",
        severidade: "alta",
        detalhe: `Redução declarada (IBS ${pRedIbsDecl}%, CBS ${pRedCbsDecl}%) não bate com o oficial do cClassTrib ${cclassCode} (IBS ${pRedIbsOficial}%, CBS ${pRedCbsOficial}%)`,
      });
    }

    // 4. Vigência: nota emitida fora do período dIniVig/dFimVig do cClassTrib?
    const dIni = parseDataOficial(cclassRef.dIniVig);
    const dFim = parseDataOficial(cclassRef.dFimVig);
    if (dIni && dataEmissao < dIni) {
      achados.push({
        nItem: item.nItem,
        tipo: "cclasstrib_fora_vigencia",
        severidade: "alta",
        detalhe: `cClassTrib ${cclassCode} só é válido a partir de ${dIni.toISOString().slice(0, 10)}, nota emitida em ${dataEmissao.toISOString().slice(0, 10)}`,
      });
    }
    if (dFim && dataEmissao > dFim) {
      achados.push({
        nItem: item.nItem,
        tipo: "cclasstrib_fora_vigencia",
        severidade: "alta",
        detalhe: `cClassTrib ${cclassCode} deixou de valer em ${dFim.toISOString().slice(0, 10)}, nota emitida em ${dataEmissao.toISOString().slice(0, 10)}`,
      });
    }
  }

  return achados;
}

export function validarNota(nota: Nota): ResultadoValidacao {
  const dataEmissao = parseData(nota.data_emissao);
  const achados: Achado[] = [];

  const cnpj = nota.emitente.cnpj;
  if (!cnpjValido(cnpj)) {
    achados.push({ nItem: null, tipo: "cnpj_invalido", severidade: "media", detalhe: `CNPJ ${cnpj} tem dígito verificador inválido` });
  }

  const cnae = nota.emitente.cnae;
  if (!CNAE_SET.has(cnae)) {
    achados.push({ nItem: null, tipo: "cnae_invalido", severidade: "media", detalhe: `CNAE ${cnae} não consta na tabela oficial do IBGE` });
  }

  for (const item of nota.itens) {
    achados.push(...validarItem(item, dataEmissao));
  }

  const penalidade = achados.reduce((acc, a) => acc + (PESO_SEVERIDADE[a.severidade] ?? 0), 0);
  const score = Math.max(0, 100 - penalidade);

  const itensComErroAlta = new Set(achados.filter((a) => a.severidade === "alta" && a.nItem !== null).map((a) => a.nItem));
  const exposicaoFinanceira =
    Math.round(nota.itens.filter((i) => itensComErroAlta.has(i.nItem)).reduce((acc, i) => acc + i.valor_total, 0) * 100) / 100;

  return {
    chave_nfe: nota.chave_nfe,
    score_qualidade: score,
    exposicao_financeira: exposicaoFinanceira,
    achados,
  };
}

export function validarNotas(notas: Nota[]): ResultadoValidacao[] {
  return notas.map(validarNota);
}
