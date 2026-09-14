import { ECFDocumento } from "./ecfParser";

// Configuração de Percentuais de Presunção
export interface ConfigPresuncao {
  [atividade: string]: {
    irpj: number;
    csll: number;
  };
}

// Default: percentuais mais comuns
const PERCENTUAIS_PADRAO: ConfigPresuncao = {
  "COMERCIO": { irpj: 0.08, csll: 0.12 },
  "INDUSTRIA": { irpj: 0.08, csll: 0.12 },
  "SERVICOS": { irpj: 0.32, csll: 0.32 },
  "TRANSPORTE": { irpj: 0.16, csll: 0.12 },
  "SERVICOS_HOSPITALARES": { irpj: 0.08, csll: 0.12 },
  "REVENDA_COMBUSTIVEIS": { irpj: 0.016, csll: 0.12 },
  "DEFAULT": { irpj: 0.32, csll: 0.32 },
};

export interface TotaisOficiais {
  // IRPJ (M300)
  m300_93_adicoes: number;
  m300_168_exclusoes: number;
  m300_175_base: number;
  // CSLL (M350)
  m350_93_adicoes: number;
  m350_168_exclusoes: number;
  m350_175_base: number;
}

export interface ResultadoApuracao {
  baseIRPJ: number;
  baseCSLL: number;
  adicionalIRPJ: number;
  irpj: number;
  csll: number;
  totalTributos: number;
}

export interface Flags {
  irpjEndFallback: boolean;
  csllAusente: boolean;
}

// Estruturas Lucro Presumido
export interface ItemPresumido {
  atividade: string;
  natureza: string;
  receitaBruta: number;
  pctPresuncaoIRPJ: number;
  pctPresuncaoCSLL: number;
  basePresumidaIRPJ: number;
  basePresumidaCSLL: number;
}

export interface PeriodoPresumido {
  periodo: string; // T01-T04 ou A00
  itens: ItemPresumido[];
  totaisPeriodo: {
    receitaBrutaTotal: number;
    basePresumidaIRPJ: number;
    basePresumidaCSLL: number;
    irpj15: number;
    irpjAdicional: number;
    irpjTotal: number;
    csllTotal: number;
  };
}

export interface DadosPresumido {
  periodicidade: "trimestral" | "anual";
  receitasPorPeriodo: PeriodoPresumido[];
  totaisAnuais: {
    receitaBrutaTotal: number;
    basePresumidaIRPJ: number;
    basePresumidaCSLL: number;
    irpjTotal: number;
    csllTotal: number;
  };
}

export interface ECFAnaliseCompleta {
  documento: ECFDocumento;
  regimeTributario: string;
  totais: TotaisOficiais;
  apuracao: ResultadoApuracao;
  flags: Flags;
  periodoApuracao: string;
  presumido?: DadosPresumido;
}

const ALIQ_IRPJ = 0.15;
const ALIQ_CSLL = 0.09;
const FAIXA_ADICIONAL = 240000.0;
const ALIQ_ADICIONAL = 0.10;

export function extrairTotaisOficiais(doc: ECFDocumento): { totais: TotaisOficiais; flags: Flags } {
  const totais: TotaisOficiais = {
    m300_93_adicoes: 0,
    m300_168_exclusoes: 0,
    m300_175_base: 0,
    m350_93_adicoes: 0,
    m350_168_exclusoes: 0,
    m350_175_base: 0,
  };

  const flags: Flags = {
    irpjEndFallback: false,
    csllAusente: false,
  };

  // Encontrar a janela A00 (período anual consolidado)
  let indexInicioA00 = -1;
  let indexFimA00 = doc.m300.length;

  for (let i = 0; i < doc.m030.length; i++) {
    const perApur = (doc.m030[i].campos.PER_APUR || "").toString().trim();
    if (perApur === "A00") {
      // Encontrar o índice inicial no array m300
      const dtIniA00 = doc.m030[i].campos.DT_INI;
      for (let j = 0; j < doc.m300.length; j++) {
        // Procurar por um registro que seja após esse M030
        if (j > indexInicioA00) {
          indexInicioA00 = j;
          break;
        }
      }
      
      // Encontrar o próximo M030 (se houver)
      if (i + 1 < doc.m030.length) {
        // Procurar onde termina a janela A00
        for (let j = indexInicioA00 + 1; j < doc.m300.length; j++) {
          // Janela termina antes do próximo período
          indexFimA00 = j;
        }
      }
      break;
    }
  }

  // Busca simplificada: percorrer M300 e encontrar os códigos 93, 168, 175, 176
  let ultimoM300_176_idx = -1;
  
  for (let i = 0; i < doc.m300.length; i++) {
    const reg = doc.m300[i];
    const codigo = (reg.campos.CODIGO || "").toString().trim();
    const tipo = (reg.campos.TIPO_LANCAMENTO || "").toString().trim();
    const valor = reg.campos.VALOR || 0;

    if (codigo === "93" && tipo === "A" && totais.m300_93_adicoes === 0) {
      totais.m300_93_adicoes = valor;
    } else if (codigo === "168" && tipo === "E" && totais.m300_168_exclusoes === 0) {
      totais.m300_168_exclusoes = valor;
    } else if (codigo === "175" && totais.m300_175_base === 0) {
      totais.m300_175_base = valor;
    } else if (codigo === "176" && ultimoM300_176_idx === -1) {
      ultimoM300_176_idx = i;
    }
  }

  if (ultimoM300_176_idx === -1) {
    flags.irpjEndFallback = true;
  }

  // Buscar M350 (CSLL) após o último M300/176
  const startM350 = ultimoM300_176_idx > 0 ? ultimoM300_176_idx : 0;
  
  for (let i = 0; i < doc.m350.length; i++) {
    const reg = doc.m350[i];
    const codigo = (reg.campos.CODIGO || "").toString().trim();
    const tipo = (reg.campos.TIPO_LANCAMENTO || "").toString().trim();
    const valor = reg.campos.VALOR || 0;

    if (codigo === "93" && tipo === "A" && totais.m350_93_adicoes === 0) {
      totais.m350_93_adicoes = valor;
    } else if (codigo === "168" && tipo === "E" && totais.m350_168_exclusoes === 0) {
      totais.m350_168_exclusoes = valor;
    } else if (codigo === "175" && totais.m350_175_base === 0) {
      totais.m350_175_base = valor;
    }
  }

  if (totais.m350_93_adicoes === 0 && totais.m350_168_exclusoes === 0 && totais.m350_175_base === 0) {
    flags.csllAusente = true;
  }

  return { totais, flags };
}

export function calcularApuracao(totais: TotaisOficiais): ResultadoApuracao {
  const baseIRPJ = totais.m300_175_base;
  const baseCSLL = totais.m350_175_base;

  const adicionalIRPJ = Math.max(0, (baseIRPJ - FAIXA_ADICIONAL)) * ALIQ_ADICIONAL;
  const irpj = baseIRPJ * ALIQ_IRPJ + adicionalIRPJ;
  const csll = baseCSLL * ALIQ_CSLL;
  const totalTributos = irpj + csll;

  return {
    baseIRPJ,
    baseCSLL,
    adicionalIRPJ,
    irpj,
    csll,
    totalTributos,
  };
}

export function analisarECF(doc: ECFDocumento): ECFAnaliseCompleta {
  const regimeTributario = doc.regimeTributario || "Lucro Real";
  const { totais, flags } = extrairTotaisOficiais(doc);
  const apuracao = calcularApuracao(totais);

  // Determinar período de apuração
  let periodoApuracao = "Anual";
  if (doc.m030.length > 0) {
    const m030 = doc.m030[doc.m030.length - 1];
    const perApur = m030.campos.PER_APUR || "";
    if (perApur.startsWith("T")) {
      periodoApuracao = `Trimestral - ${perApur}`;
    } else if (perApur.startsWith("A") && perApur !== "A00") {
      periodoApuracao = `Mensal - ${perApur}`;
    }
  }

  // Se for Lucro Presumido, calcular dados específicos
  let presumido: DadosPresumido | undefined;
  if (regimeTributario === "Lucro Presumido") {
    presumido = calcularLucroPresumido(doc);
  }

  return {
    documento: doc,
    regimeTributario,
    totais,
    apuracao,
    flags,
    periodoApuracao,
    presumido,
  };
}

// Calcular Lucro Presumido
function calcularLucroPresumido(doc: ECFDocumento): DadosPresumido {
  const periodicidade = doc.formaApuracao === "T" ? "trimestral" : "anual";
  const receitasPorPeriodo: PeriodoPresumido[] = [];
  
  // Agrupar por período (P100)
  const periodos = new Map<string, any>();
  
  for (const p100 of doc.p100) {
    const periodo = p100.campos.PER_APUR || "A00";
    const receitaBruta = p100.campos.VL_REC_BRUTA || 0;
    
    if (!periodos.has(periodo)) {
      periodos.set(periodo, {
        periodo,
        receitaBruta,
        itens: []
      });
    }
  }
  
  // Adicionar itens P110 (receitas por atividade)
  for (const p110 of doc.p110) {
    // P110 está sob P100, pegar o período do P100 mais recente
    const periodoAtual = Array.from(periodos.keys()).pop() || "A00";
    const data = periodos.get(periodoAtual);
    
    if (data) {
      const atividade = p110.campos.DESC_ATIV || p110.campos.COD_ATIV || "Não especificado";
      const natureza = p110.campos.NAT_REC || "GERAL";
      const receitaBruta = p110.campos.VL_REC || 0;
      
      // Obter percentuais (do arquivo ou padrão)
      let pctIRPJ = p110.campos.PCT_PRESUNC_IRPJ || 0;
      let pctCSLL = p110.campos.PCT_PRESUNC_CSLL || 0;
      
      // Se não tem percentual, usar padrão baseado na atividade
      if (pctIRPJ === 0 || pctCSLL === 0) {
        const atividadeKey = atividade.toUpperCase().includes("SERVICO") ? "SERVICOS" :
                            atividade.toUpperCase().includes("COMERCIO") ? "COMERCIO" :
                            atividade.toUpperCase().includes("INDUSTRIA") ? "INDUSTRIA" :
                            atividade.toUpperCase().includes("TRANSPORTE") ? "TRANSPORTE" :
                            "DEFAULT";
        const pcts = PERCENTUAIS_PADRAO[atividadeKey] || PERCENTUAIS_PADRAO.DEFAULT;
        pctIRPJ = pctIRPJ || pcts.irpj;
        pctCSLL = pctCSLL || pcts.csll;
      }
      
      const basePresumidaIRPJ = receitaBruta * pctIRPJ;
      const basePresumidaCSLL = receitaBruta * pctCSLL;
      
      data.itens.push({
        atividade,
        natureza,
        receitaBruta,
        pctPresuncaoIRPJ: pctIRPJ,
        pctPresuncaoCSLL: pctCSLL,
        basePresumidaIRPJ,
        basePresumidaCSLL,
      });
    }
  }
  
  // Calcular totais por período
  for (const [periodo, data] of periodos) {
    const receitaBrutaTotal = data.receitaBruta;
    let basePresumidaIRPJ = 0;
    let basePresumidaCSLL = 0;
    
    for (const item of data.itens) {
      basePresumidaIRPJ += item.basePresumidaIRPJ;
      basePresumidaCSLL += item.basePresumidaCSLL;
    }
    
    const irpj15 = basePresumidaIRPJ * ALIQ_IRPJ;
    const irpjAdicional = Math.max(0, (basePresumidaIRPJ - FAIXA_ADICIONAL)) * ALIQ_ADICIONAL;
    const irpjTotal = irpj15 + irpjAdicional;
    const csllTotal = basePresumidaCSLL * ALIQ_CSLL;
    
    receitasPorPeriodo.push({
      periodo,
      itens: data.itens,
      totaisPeriodo: {
        receitaBrutaTotal,
        basePresumidaIRPJ,
        basePresumidaCSLL,
        irpj15,
        irpjAdicional,
        irpjTotal,
        csllTotal,
      },
    });
  }
  
  // Calcular totais anuais
  const totaisAnuais = receitasPorPeriodo.reduce(
    (acc, p) => ({
      receitaBrutaTotal: acc.receitaBrutaTotal + p.totaisPeriodo.receitaBrutaTotal,
      basePresumidaIRPJ: acc.basePresumidaIRPJ + p.totaisPeriodo.basePresumidaIRPJ,
      basePresumidaCSLL: acc.basePresumidaCSLL + p.totaisPeriodo.basePresumidaCSLL,
      irpjTotal: acc.irpjTotal + p.totaisPeriodo.irpjTotal,
      csllTotal: acc.csllTotal + p.totaisPeriodo.csllTotal,
    }),
    {
      receitaBrutaTotal: 0,
      basePresumidaIRPJ: 0,
      basePresumidaCSLL: 0,
      irpjTotal: 0,
      csllTotal: 0,
    }
  );
  
  return {
    periodicidade,
    receitasPorPeriodo,
    totaisAnuais,
  };
}

// Validações e Alertas
export interface Alerta {
  codigo: string;
  mensagem: string;
  severidade: "alta" | "media" | "baixa";
  impacto?: string;
}

export function validarECF(analise: ECFAnaliseCompleta): Alerta[] {
  const alertas: Alerta[] = [];
  const { totais, apuracao, regimeTributario, presumido } = analise;

  // Alertas Lucro Presumido
  if (regimeTributario === "Lucro Presumido" && presumido) {
    // Alerta: Falta de período
    if (presumido.receitasPorPeriodo.length === 0) {
      alertas.push({
        codigo: "ECF-LP001",
        mensagem: "Nenhum período de apuração encontrado no Bloco P",
        severidade: "alta",
        impacto: "Não foi possível calcular bases presumidas. Verificar estrutura do arquivo ECF."
      });
    }

    // Alerta: Periodicidade inconsistente
    const esperado = analise.documento.formaApuracao === "T" ? 4 : 12;
    if (presumido.periodicidade === "trimestral" && presumido.receitasPorPeriodo.length < 4) {
      alertas.push({
        codigo: "ECF-LP002",
        mensagem: `Apuração trimestral incompleta - esperados 4 trimestres, encontrados ${presumido.receitasPorPeriodo.length}`,
        severidade: "media",
        impacto: "Pode indicar período parcial ou arquivo incompleto."
      });
    }

    // Alerta: Atividades sem percentual definido
    for (const periodo of presumido.receitasPorPeriodo) {
      for (const item of periodo.itens) {
        if (item.pctPresuncaoIRPJ === 0.32 && item.atividade.includes("Não especificado")) {
          alertas.push({
            codigo: "ECF-LP003",
            mensagem: `Atividade sem percentual específico no período ${periodo.periodo}`,
            severidade: "baixa",
            impacto: "Utilizando percentual padrão de 32%. Verificar se está correto para a atividade."
          });
        }
      }
    }

    // Alerta: Base muito baixa
    if (presumido.totaisAnuais.basePresumidaIRPJ < 10000) {
      alertas.push({
        codigo: "ECF-LP004",
        mensagem: "Base presumida de IRPJ muito baixa",
        severidade: "media",
        impacto: "Verificar se todas as receitas foram informadas corretamente no Bloco P."
      });
    }

    return alertas;
  }

  // Alertas Lucro Real
  if (apuracao.baseIRPJ < 0) {
    alertas.push({
      codigo: "ECF001",
      mensagem: "Base de cálculo do IRPJ negativa",
      severidade: "alta",
      impacto: "Prejuízo fiscal identificado. Verificar compensações futuras."
    });
  }

  if (apuracao.baseCSLL < 0) {
    alertas.push({
      codigo: "ECF002",
      mensagem: "Base de cálculo da CSLL negativa",
      severidade: "alta",
      impacto: "Base negativa de CSLL identificada. Verificar adições e exclusões."
    });
  }

  // Alerta: Proporção anormal entre adições e exclusões
  if (totais.m300_93_adicoes > 0 && totais.m300_168_exclusoes > totais.m300_93_adicoes * 2) {
    alertas.push({
      codigo: "ECF003",
      mensagem: "Volume de exclusões muito superior às adições (IRPJ)",
      severidade: "media",
      impacto: "Revisar se as exclusões estão corretamente classificadas."
    });
  }

  return alertas;
}
