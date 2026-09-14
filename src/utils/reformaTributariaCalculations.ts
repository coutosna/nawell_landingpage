// Cálculos da Reforma Tributária (CBS/IBS) 2026-2033

export interface AliquotasAno {
  cbs: number;
  ibs: number;
  pis_cofins: number;
  icms: number;
}

export const ALIQUOTAS_TRANSICAO: Record<number, AliquotasAno> = {
  2026: { cbs: 0.0090, ibs: 0.0010, pis_cofins: 0.0925, icms: 0.18 },
  2027: { cbs: 0.0870, ibs: 0.0010, pis_cofins: 0.0, icms: 0.18 },
  2028: { cbs: 0.0870, ibs: 0.0010, pis_cofins: 0.0, icms: 0.18 },
  2029: { cbs: 0.0880, ibs: 0.0177, pis_cofins: 0.0, icms: 0.162 },
  2030: { cbs: 0.0880, ibs: 0.0354, pis_cofins: 0.0, icms: 0.144 },
  2031: { cbs: 0.0880, ibs: 0.0531, pis_cofins: 0.0, icms: 0.126 },
  2032: { cbs: 0.0880, ibs: 0.0708, pis_cofins: 0.0, icms: 0.108 },
  2033: { cbs: 0.0880, ibs: 0.1770, pis_cofins: 0.0, icms: 0.0 },
};

export interface CategoriaTributacao {
  tributa: boolean;
}

export const CATEGORIA_TRIBUTACAO: Record<string, CategoriaTributacao> = {
  "Anulação": { tributa: false },
  "Devolução": { tributa: false },
  "Entrada": { tributa: false },
  "Exportação": { tributa: false },
  "Industrialização": { tributa: true },
  "Lançamento": { tributa: false },
  "Outra": { tributa: false },
  "Prestação": { tributa: true },
  "Remessa": { tributa: true },
  "Ressarcimento": { tributa: false },
  "Retorno": { tributa: false },
  "Transferência": { tributa: true },
  "Utilização": { tributa: false },
  "Venda": { tributa: true },
};

export const CFOPS_REMESSA_SEM_FATO = new Set([
  "5904", "6904", "5905", "6905"
]);

export const TRANSFERENCIA_CFOPS = new Set([
  "5151", "5152", "5153", "5155", "5156",
  "5408", "5409", "5552", "5557", "5658", "5659",
  "6151", "6152", "6153", "6155", "6156",
  "6408", "6409", "6552", "6557", "6658", "6659",
  "6901", "6902"
]);

export const EXPORTACAO_CFOPS = new Set([
  "5501", "5502", "5504", "5505",
  "6501", "6502", "6504", "6505",
  "7501"
]);

export const CFOP_CATEGORIA_OVERRIDE: Record<string, string> = {
  "5101": "Venda",
  "5102": "Venda",
  "5301": "Prestação",
  "5409": "Transferência",
  "5904": "Remessa",
  "6904": "Remessa",
  "7501": "Exportação",
};

export function normalizarCnpj(cnpj?: string): string {
  if (!cnpj) return "";
  return cnpj.replace(/\D/g, "").trim();
}

export function mesmaRaizCnpj(cnpj1?: string, cnpj2?: string): boolean {
  const n1 = normalizarCnpj(cnpj1);
  const n2 = normalizarCnpj(cnpj2);
  if (n1.length < 8 || n2.length < 8) return false;
  return n1.substring(0, 8) === n2.substring(0, 8);
}

export function classificarCfop(cfop: string): string {
  cfop = (cfop || "").trim();
  if (!cfop || cfop.length < 4) return "Outra";

  const primeira = cfop[0];
  
  if (["1", "2", "3"].includes(primeira)) {
    return "Entrada";
  }

  if (CFOP_CATEGORIA_OVERRIDE[cfop]) {
    return CFOP_CATEGORIA_OVERRIDE[cfop];
  }

  if (TRANSFERENCIA_CFOPS.has(cfop)) {
    return "Transferência";
  }

  if (EXPORTACAO_CFOPS.has(cfop) || cfop.startsWith("7")) {
    return "Exportação";
  }

  const segunda = cfop[1];

  switch (segunda) {
    case "1": return "Venda";
    case "2": return "Devolução";
    case "3": return "Prestação";
    case "4": return "Venda";
    case "5": return "Remessa";
    case "6": return "Lançamento";
    case "9": return "Remessa";
    default: return "Outra";
  }
}

export function incideCbsIbsSobreItem(
  categoria: string,
  cfop: string,
  cnpjEmitente?: string,
  cnpjDestinatario?: string
): boolean {
  cfop = (cfop || "").trim();
  const regraCategoria = CATEGORIA_TRIBUTACAO[categoria] || { tributa: false };
  const tributaCategoria = regraCategoria.tributa;

  if (categoria === "Transferência" && mesmaRaizCnpj(cnpjEmitente, cnpjDestinatario)) {
    return false;
  }

  if (categoria === "Remessa" && CFOPS_REMESSA_SEM_FATO.has(cfop)) {
    return false;
  }

  return tributaCategoria;
}

export function calcularPorDentro(baseLiquida: number, aliquota: number): number {
  if (!aliquota || aliquota <= 0) return 0;
  return baseLiquida * (aliquota / (1.0 - aliquota));
}

export function calcularCbsIbsItem(
  valorLiquido: number,
  ano: number,
  incide: boolean
): { cbs: number; ibs: number } {
  if (!ALIQUOTAS_TRANSICAO[ano] || !incide) {
    return { cbs: 0, ibs: 0 };
  }

  const cfg = ALIQUOTAS_TRANSICAO[ano];
  return {
    cbs: valorLiquido * cfg.cbs,
    ibs: valorLiquido * cfg.ibs
  };
}

export function calcularPisCofinsItem(
  valorLiquido: number,
  ano: number,
  incide: boolean
): number {
  if (!incide) return 0;

  const cfg = ALIQUOTAS_TRANSICAO[ano];
  if (!cfg) return 0;

  const aliqPis = cfg.pis_cofins;
  if (aliqPis <= 0) return 0;

  return calcularPorDentro(valorLiquido, aliqPis);
}

export function calcularIcmsItem(
  valorLiquido: number,
  cbs: number,
  ibs: number,
  ano: number,
  incide: boolean
): number {
  if (!incide) return 0;

  const cfg = ALIQUOTAS_TRANSICAO[ano];
  if (!cfg) return 0;

  const aliqIcms = cfg.icms;
  if (aliqIcms <= 0) return 0;

  let baseIcms: number;
  if (ano === 2026) {
    baseIcms = valorLiquido;
  } else {
    baseIcms = valorLiquido + cbs + ibs;
  }

  return calcularPorDentro(baseIcms, aliqIcms);
}

export interface ItemEfd {
  valorMercadoria: number;
  cfop: string;
  categoriaCfop: string;
  cnpjEmitente?: string;
  cnpjDestinatario?: string;
}

export interface ResumoAno {
  ano: number;
  baseTotal: number;
  totalCbs: number;
  totalIbs: number;
  totalPisCofins: number;
  totalIcms: number;
  totalTributos: number;
  aliquotaEfetiva: number;
}

export function simularTransicaoReformaConsumo(itens: ItemEfd[]): ResumoAno[] {
  if (!itens || itens.length === 0) {
    return [];
  }

  const baseTotal = itens.reduce((sum, item) => sum + item.valorMercadoria, 0);
  const anos = Object.keys(ALIQUOTAS_TRANSICAO).map(Number).sort();

  const resumo: ResumoAno[] = [];

  for (const ano of anos) {
    let totalCbs = 0;
    let totalIbs = 0;
    let totalPisCofins = 0;
    let totalIcms = 0;

    for (const item of itens) {
      const incide = incideCbsIbsSobreItem(
        item.categoriaCfop,
        item.cfop,
        item.cnpjEmitente,
        item.cnpjDestinatario
      );

      const { cbs, ibs } = calcularCbsIbsItem(item.valorMercadoria, ano, incide);
      const pisCofins = calcularPisCofinsItem(item.valorMercadoria, ano, incide);
      const icms = calcularIcmsItem(item.valorMercadoria, cbs, ibs, ano, incide);

      totalCbs += cbs;
      totalIbs += ibs;
      totalPisCofins += pisCofins;
      totalIcms += icms;
    }

    const totalTributos = totalCbs + totalIbs + totalPisCofins + totalIcms;
    const aliquotaEfetiva = baseTotal > 0 ? (totalTributos / baseTotal) * 100 : 0;

    resumo.push({
      ano,
      baseTotal: Math.round(baseTotal * 100) / 100,
      totalCbs: Math.round(totalCbs * 100) / 100,
      totalIbs: Math.round(totalIbs * 100) / 100,
      totalPisCofins: Math.round(totalPisCofins * 100) / 100,
      totalIcms: Math.round(totalIcms * 100) / 100,
      totalTributos: Math.round(totalTributos * 100) / 100,
      aliquotaEfetiva: Math.round(aliquotaEfetiva * 100) / 100,
    });
  }

  return resumo;
}
