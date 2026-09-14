// Parser de EFD para Reforma Tributária

import { classificarCfop, ItemEfd } from './reformaTributariaCalculations';

function safeFloat(valor: string): number {
  const v = (valor || "").trim().replace(",", ".");
  if (!v) return 0;
  const num = parseFloat(v);
  return isNaN(num) ? 0 : num;
}

export interface EfdParsedData {
  cnpjProprio: string;
  itens: ItemEfd[];
}

export function parsearEfdParaReformaConsumo(conteudo: string): EfdParsedData {
  const linhas = conteudo.split('\n');
  
  let cnpjProprio = "";
  const participantes: Map<string, string> = new Map();
  const itens: ItemEfd[] = [];

  let currentIndOper: string | null = null;
  let currentCodPart: string | null = null;
  let docTemC170 = false;
  const bufferC190: { cfop: string; valor: number }[] = [];

  // Fallback: documento de saída consolidado em C190 quando não há itens C170
  const finalizarDocumento = () => {
    if (currentIndOper === "1" && !docTemC170 && bufferC190.length > 0) {
      const cnpjDestinatario = participantes.get(currentCodPart || "") || "";
      for (const bucket of bufferC190) {
        if (bucket.valor <= 0) continue;
        itens.push({
          valorMercadoria: bucket.valor,
          cfop: bucket.cfop,
          categoriaCfop: classificarCfop(bucket.cfop),
          cnpjEmitente: cnpjProprio,
          cnpjDestinatario,
        });
      }
    }
    bufferC190.length = 0;
    docTemC170 = false;
  };

  for (const linha of linhas) {
    const linhaLimpa = linha.trim();
    if (!linhaLimpa.startsWith("|")) continue;

    const partes = linhaLimpa.split("|");
    if (partes.length < 2) continue;

    const reg = partes[1];

    // Registro 0000: CNPJ do contribuinte
    if (reg === "0000") {
      if (partes.length > 7) {
        cnpjProprio = partes[7];
      }
    }
    
    // Registro 0150: participantes
    else if (reg === "0150") {
      const codPart = partes.length > 2 ? partes[2] : "";
      let cnpjPart = "";
      if (partes.length > 5 && partes[5].trim()) {
        cnpjPart = partes[5];
      } else if (partes.length > 6 && partes[6].trim()) {
        cnpjPart = partes[6];
      }
      participantes.set(codPart, cnpjPart);
    }
    
    // Registro C100: cabeçalho do documento
    else if (reg === "C100") {
      finalizarDocumento();
      currentIndOper = partes.length > 2 ? partes[2] : null;
      currentCodPart = partes.length > 4 ? partes[4] : null;
    }

    // Registro C190: consolidação por CST/CFOP/ALIQ (fallback para saídas sem C170)
    else if (reg === "C190") {
      if (currentIndOper !== "1") continue;
      const cfop = partes.length > 3 ? partes[3] : "";
      const vlOpr = partes.length > 5 ? safeFloat(partes[5]) : 0;
      if (cfop && vlOpr > 0) {
        bufferC190.push({ cfop, valor: vlOpr });
      }
    }
    
    // Registro C170: itens
    else if (reg === "C170") {
      if (currentIndOper === null) continue;
      
      // Apenas saídas (IND_OPER = '1')
      if (currentIndOper !== "1") continue;

      docTemC170 = true;

      const vlItem = partes.length > 7 ? safeFloat(partes[7]) : 0;
      const vlDesc = partes.length > 8 ? safeFloat(partes[8]) : 0;
      const cfop = partes.length > 11 ? partes[11] : "";

      const valorLiquido = Math.max(vlItem - vlDesc, 0);
      if (valorLiquido <= 0) continue;

      const categoria = classificarCfop(cfop);
      const cnpjDestinatario = participantes.get(currentCodPart || "") || "";

      itens.push({
        valorMercadoria: valorLiquido,
        cfop,
        categoriaCfop: categoria,
        cnpjEmitente: cnpjProprio,
        cnpjDestinatario,
      });
    }
  }

  // Último documento do arquivo
  finalizarDocumento();

  return {
    cnpjProprio,
    itens,
  };
}
