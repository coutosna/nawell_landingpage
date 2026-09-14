// ECF Parser - Equivalente ao ecf_motor Python
export interface ECFRegistro {
  linha: string;
  campos: Record<string, any>;
}

export interface ECFDocumento {
  cnpj?: string;
  nomeEmpresa?: string;
  dtInicio?: string;
  dtFim?: string;
  formaApuracao?: string; // "A" anual ou "T" trimestral
  formaTributacao?: string;
  regimeTributario?: string; // "Lucro Real" | "Lucro Presumido" | "Imune" | "Isenta"
  m030: ECFRegistro[];
  m300: ECFRegistro[];
  m305: ECFRegistro[];
  m310: ECFRegistro[];
  m350: ECFRegistro[];
  m360: ECFRegistro[];
  j050: ECFRegistro[];
  j051: ECFRegistro[];
  j100: ECFRegistro[];
  // Bloco P - Lucro Presumido
  p100: ECFRegistro[]; // Receita Bruta Total
  p110: ECFRegistro[]; // Receitas por Atividade/Natureza
  p150: ECFRegistro[]; // Outras Receitas
  p200: ECFRegistro[]; // Demonstração da Apuração IRPJ
  p300: ECFRegistro[]; // Demonstração da Apuração CSLL
}

const SEP = "|";

function splitCampos(linha: string): string[] {
  return linha.trim().split(SEP);
}

function toFloatBR(valor: string | undefined): number {
  if (!valor) return 0.0;
  const str = valor.trim();
  if (str === "" || str === "0") return 0.0;
  
  // Remove pontos de milhar e substitui vírgula por ponto
  const cleaned = str.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  
  if (isNaN(num)) {
    console.warn(`⚠️  Valor inválido para conversão: "${valor}"`);
    return 0.0;
  }
  
  return num;
}

function parse0000(linha: string): Partial<ECFDocumento> {
  const p = splitCampos(linha);
  return {
    cnpj: p[4] || undefined,
    nomeEmpresa: p[5] || undefined,
    dtInicio: p[9] || undefined,
    dtFim: p[10] || undefined,
  };
}

function parse0010(linha: string): Partial<ECFDocumento> {
  const p = splitCampos(linha);
  // Forma de apuração pode estar em diferentes posições
  const formaApurNovo = p[6];
  const formaApurAnt = p[7];
  return {
    formaApuracao: formaApurNovo || formaApurAnt,
    formaTributacao: p[5] || undefined,
  };
}

function parseM030(linha: string): ECFRegistro {
  const p = splitCampos(linha);
  return {
    linha,
    campos: {
      REG: p[1],
      DT_INI: p[2],
      DT_FIN: p[3],
      PER_APUR: p[4], // A00, A01-A12, T01-T04
    },
  };
}

function parseM300(linha: string): ECFRegistro {
  const p = splitCampos(linha);
  return {
    linha,
    campos: {
      REG: p[1],
      CODIGO: p[2],
      DESCRICAO: p[3],
      TIPO_LANCAMENTO: p[4],
      NIVEL: p[5],
      VALOR: toFloatBR(p[6]),
      COMPL: p[7],
    },
  };
}

function parseM305(linha: string): ECFRegistro {
  const p = splitCampos(linha);
  return {
    linha,
    campos: {
      REG: p[1],
      COD_CTRL: p[2],
      DESC_CTRL: p[3],
    },
  };
}

function parseM310(linha: string): ECFRegistro {
  const p = splitCampos(linha);
  return {
    linha,
    campos: {
      REG: p[1],
      COD_CTA: p[2],
      VL_CTA: toFloatBR(p[3]),
      IND_DC: p[4], // D/C
      NIVEL: p[5],
      CODIGO: p[6],
    },
  };
}

function parseM350(linha: string): ECFRegistro {
  const p = splitCampos(linha);
  return {
    linha,
    campos: {
      REG: p[1],
      CODIGO: p[2],
      DESCRICAO: p[3],
      TIPO_LANCAMENTO: p[4],
      NIVEL: p[5],
      VALOR: toFloatBR(p[6]),
      COMPL: p[7],
    },
  };
}

function parseM360(linha: string): ECFRegistro {
  const p = splitCampos(linha);
  return {
    linha,
    campos: {
      REG: p[1],
      COD_CTA: p[2],
      VL_CTA: toFloatBR(p[3]),
      IND_DC: p[4],
      NIVEL: p[5],
      CODIGO: p[6],
    },
  };
}

function parseJ050(linha: string): ECFRegistro {
  const p = splitCampos(linha);
  return {
    linha,
    campos: {
      REG: p[1],
      DT_INI: p[2],
      DT_FIN: p[3],
      COD_CTA: p[4],
      NOME_CTA: p[5],
      NIVEL: p[6],
      NAT_CTA: p[7],
    },
  };
}

function parseJ051(linha: string): ECFRegistro {
  const p = splitCampos(linha);
  return {
    linha,
    campos: {
      REG: p[1],
      COD_CTA: p[2],
      COD_AGL: p[3],
      COD_CTA_REF: p[4],
    },
  };
}

function parseJ100(linha: string): ECFRegistro {
  const p = splitCampos(linha);
  return {
    linha,
    campos: {
      REG: p[1],
      COD_CTA: p[2],
      VLR_CTA: toFloatBR(p[3]),
      IND_DC: p[4],
    },
  };
}

// Parsers Bloco P - Lucro Presumido
function parseP100(linha: string): ECFRegistro {
  const p = splitCampos(linha);
  return {
    linha,
    campos: {
      REG: p[1],
      PER_APUR: p[2], // T01-T04 ou A00
      VL_REC_TOTAL: toFloatBR(p[3]),
      VL_DEDUCOES: toFloatBR(p[4]),
      VL_REC_BRUTA: toFloatBR(p[5]),
    },
  };
}

function parseP110(linha: string): ECFRegistro {
  const p = splitCampos(linha);
  return {
    linha,
    campos: {
      REG: p[1],
      COD_ATIV: p[2],
      DESC_ATIV: p[3],
      NAT_REC: p[4],
      VL_REC: toFloatBR(p[5]),
      PCT_PRESUNC_IRPJ: toFloatBR(p[6]),
      PCT_PRESUNC_CSLL: toFloatBR(p[7]),
    },
  };
}

function parseP150(linha: string): ECFRegistro {
  const p = splitCampos(linha);
  return {
    linha,
    campos: {
      REG: p[1],
      TIPO_REC: p[2],
      DESC_REC: p[3],
      VL_REC: toFloatBR(p[4]),
    },
  };
}

function parseP200(linha: string): ECFRegistro {
  const p = splitCampos(linha);
  return {
    linha,
    campos: {
      REG: p[1],
      PER_APUR: p[2],
      BASE_CALC_IRPJ: toFloatBR(p[3]),
      IRPJ_15: toFloatBR(p[4]),
      IRPJ_ADIC: toFloatBR(p[5]),
      IRPJ_TOTAL: toFloatBR(p[6]),
    },
  };
}

function parseP300(linha: string): ECFRegistro {
  const p = splitCampos(linha);
  return {
    linha,
    campos: {
      REG: p[1],
      PER_APUR: p[2],
      BASE_CALC_CSLL: toFloatBR(p[3]),
      CSLL_TOTAL: toFloatBR(p[4]),
    },
  };
}

export function parseECF(conteudo: string): ECFDocumento {
  const linhas = conteudo.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  
  const doc: ECFDocumento = {
    m030: [],
    m300: [],
    m305: [],
    m310: [],
    m350: [],
    m360: [],
    j050: [],
    j051: [],
    j100: [],
    p100: [],
    p110: [],
    p150: [],
    p200: [],
    p300: [],
  };

  for (const linha of linhas) {
    if (linha.startsWith("|0000|")) {
      Object.assign(doc, parse0000(linha));
    } else if (linha.startsWith("|0010|")) {
      Object.assign(doc, parse0010(linha));
    } else if (linha.startsWith("|M030|")) {
      doc.m030.push(parseM030(linha));
    } else if (linha.startsWith("|M300|")) {
      doc.m300.push(parseM300(linha));
    } else if (linha.startsWith("|M305|")) {
      doc.m305.push(parseM305(linha));
    } else if (linha.startsWith("|M310|")) {
      doc.m310.push(parseM310(linha));
    } else if (linha.startsWith("|M350|")) {
      doc.m350.push(parseM350(linha));
    } else if (linha.startsWith("|M360|")) {
      doc.m360.push(parseM360(linha));
    } else if (linha.startsWith("|J050|")) {
      doc.j050.push(parseJ050(linha));
    } else if (linha.startsWith("|J051|")) {
      doc.j051.push(parseJ051(linha));
    } else if (linha.startsWith("|J100|")) {
      doc.j100.push(parseJ100(linha));
    } else if (linha.startsWith("|P100|")) {
      doc.p100.push(parseP100(linha));
    } else if (linha.startsWith("|P110|")) {
      doc.p110.push(parseP110(linha));
    } else if (linha.startsWith("|P150|")) {
      doc.p150.push(parseP150(linha));
    } else if (linha.startsWith("|P200|")) {
      doc.p200.push(parseP200(linha));
    } else if (linha.startsWith("|P300|")) {
      doc.p300.push(parseP300(linha));
    }
  }

  // Detectar regime tributário
  doc.regimeTributario = detectarRegimeTributario(doc);

  return doc;
}

function detectarRegimeTributario(doc: ECFDocumento): string {
  // Se tem Bloco P, é Lucro Presumido
  if (doc.p100.length > 0 || doc.p200.length > 0 || doc.p300.length > 0) {
    return "Lucro Presumido";
  }
  
  // Se tem M300/M350, é Lucro Real
  if (doc.m300.length > 0 || doc.m350.length > 0) {
    return "Lucro Real";
  }
  
  // Verificar pelo campo formaTributacao
  if (doc.formaTributacao) {
    const forma = doc.formaTributacao.toUpperCase();
    if (forma.includes("PRESUMIDO") || forma === "LP") return "Lucro Presumido";
    if (forma.includes("REAL") || forma === "LR") return "Lucro Real";
    if (forma.includes("IMUNE")) return "Imune";
    if (forma.includes("ISENTA")) return "Isenta";
  }
  
  return "Lucro Real"; // Default
}
