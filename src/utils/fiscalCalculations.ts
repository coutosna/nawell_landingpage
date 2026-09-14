/**
 * Funções para cálculo de multas, juros SELIC e risco fiscal
 * Base legal: Lei 9.430/96, art. 61 e correlatos
 */

export interface RiscoFiscalItem {
  produto: string;
  ncm: string;
  documento: string;
  baseCalculo: number;
  
  // PIS
  pisInformado: number;
  pisAliquotaInformada: number;
  pisDevido: number;
  pisAliquotaDevida: number;
  pisDiferenca: number;
  
  // COFINS
  cofinsInformado: number;
  cofinsAliquotaInformada: number;
  cofinsDevido: number;
  cofinsAliquotaDevida: number;
  cofinsDiferenca: number;
  
  // Totais
  principalDiferenca: number; // pisDiferenca + cofinsDiferenca
  multa: number;
  jurosEstimado: number;
  totalComMultaJuros: number;
  
  // Metadata
  dataOperacao: string;
  fonte: string;
}

export interface ResumoRiscoFiscal {
  totalPrincipal: number;
  totalMulta: number;
  totalJurosEstimado: number;
  totalGeral: number;
  itens: RiscoFiscalItem[];
}

/**
 * Calcula a multa de mora conforme Lei 9.430/96
 * Multa de 0,33% ao dia, limitada a 20% do principal
 * 
 * @param principal - Valor principal em atraso
 * @param dataVencimento - Data de vencimento da obrigação
 * @param dataPagamento - Data do pagamento (default: hoje)
 * @returns Valor da multa
 */
export const calcularMultaMora = (
  principal: number,
  dataVencimento: string,
  dataPagamento?: Date
): number => {
  if (principal <= 0) return 0;
  
  // Aplica multa de 20% conforme Lei 9.430/96
  // Para análise de risco fiscal, considera-se a multa máxima
  return principal * 0.20;
};

/**
 * Busca taxas SELIC mensais acumuladas da API do Banco Central do Brasil
 * Série 11: Taxa SELIC acumulada no mês
 * 
 * @param dataInicio - Data de início (formato YYYY-MM-DD)
 * @param dataFim - Data de fim (formato YYYY-MM-DD)
 * @returns Array de taxas SELIC mensais
 */
const buscarSelicAPI = async (
  dataInicio: string,
  dataFim: string
): Promise<Array<{ data: string; valor: number }>> => {
  try {
    // Formata datas para API do BCB (DD/MM/YYYY)
    const formatDate = (date: Date) => {
      const d = date.getDate().toString().padStart(2, '0');
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    };
    
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados?formato=json&dataInicial=${formatDate(inicio)}&dataFinal=${formatDate(fim)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Erro ao buscar SELIC');
    }
    
    const dados = await response.json();
    return dados.map((item: any) => ({
      data: item.data,
      valor: parseFloat(item.valor),
    }));
  } catch (error) {
    console.error('Erro ao buscar SELIC da API BCB:', error);
    // Retorna array vazio em caso de erro - fallback para estimativa
    return [];
  }
};

/**
 * Calcula juros SELIC acumulados usando API do BCB
 * Acumula SELIC do mês seguinte ao vencimento até o mês anterior ao pagamento
 * + 1% no mês do pagamento (conforme Lei 9.430/96)
 * 
 * @param principal - Valor principal
 * @param dataVencimento - Data de vencimento
 * @param dataPagamento - Data do pagamento (default: hoje)
 * @returns Promise com valor dos juros SELIC
 */
export const calcularJurosSELIC = async (
  principal: number,
  dataVencimento: string,
  dataPagamento?: Date
): Promise<number> => {
  if (principal <= 0) return 0;
  
  const vencimento = new Date(dataVencimento);
  const pagamento = dataPagamento || new Date();
  
  // Primeiro dia do mês seguinte ao vencimento
  const inicioCorrecao = new Date(vencimento.getFullYear(), vencimento.getMonth() + 1, 1);
  
  // Último dia do mês anterior ao pagamento
  const fimCorrecao = new Date(pagamento.getFullYear(), pagamento.getMonth(), 0);
  
  if (inicioCorrecao > fimCorrecao) {
    // Vencimento no mês atual - aplica apenas 1% do mês de pagamento
    return principal * 0.01;
  }
  
  try {
    // Busca SELIC acumulada mensalmente
    const taxasSelic = await buscarSelicAPI(
      inicioCorrecao.toISOString().split('T')[0],
      fimCorrecao.toISOString().split('T')[0]
    );
    
    if (taxasSelic.length === 0) {
      // Fallback: estimativa com SELIC média
      return estimarJurosSELIC(principal, dataVencimento, dataPagamento);
    }
    
    // Calcula juros acumulados mês a mês
    let valorCorrigido = principal;
    taxasSelic.forEach(taxa => {
      const taxaDecimal = taxa.valor / 100;
      valorCorrigido += valorCorrigido * taxaDecimal;
    });
    
    // Adiciona 1% do mês de pagamento
    valorCorrigido += valorCorrigido * 0.01;
    
    // Retorna apenas os juros (valor corrigido - principal)
    return valorCorrigido - principal;
    
  } catch (error) {
    console.error('Erro ao calcular SELIC:', error);
    // Fallback para estimativa
    return estimarJurosSELIC(principal, dataVencimento, dataPagamento);
  }
};

/**
 * Estima juros SELIC acumulados (fallback quando API não está disponível)
 * NOTA: Esta é uma estimativa simplificada. 
 * Para cálculo exato, usar calcularJurosSELIC que integra com API do BCB
 * 
 * @param principal - Valor principal
 * @param dataVencimento - Data de vencimento
 * @param dataPagamento - Data do pagamento
 * @returns Valor estimado dos juros
 */
export const estimarJurosSELIC = (
  principal: number,
  dataVencimento: string,
  dataPagamento?: Date
): number => {
  if (principal <= 0) return 0;
  
  const vencimento = new Date(dataVencimento);
  const pagamento = dataPagamento || new Date();
  
  // Calcula meses em atraso
  const mesesAtraso = Math.floor(
    (pagamento.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  
  if (mesesAtraso <= 0) return principal * 0.01; // Apenas 1% do mês
  
  // SELIC média aproximada: 11% ao ano = ~0,87% ao mês
  // Mais 1% no mês do pagamento
  
  const selicMensalMedia = 0.0087;
  const jurosAcumulados = principal * selicMensalMedia * mesesAtraso;
  const jurosMesPagamento = principal * 0.01;
  
  return jurosAcumulados + jurosMesPagamento;
};

/**
 * Calcula a data de vencimento típica de PIS/COFINS
 * Regra: 25º dia do mês seguinte ao período de apuração
 * 
 * @param periodoApuracao - Data da operação no formato DD/MM/AAAA
 * @returns Data de vencimento no formato AAAA-MM-DD
 */
export const calcularDataVencimento = (periodoApuracao: string): string => {
  if (!periodoApuracao) return '';
  
  // Formato esperado: DD/MM/AAAA
  const partes = periodoApuracao.split('/');
  if (partes.length !== 3) return '';
  
  const mes = parseInt(partes[1]);
  const ano = parseInt(partes[2]);
  
  // Mês seguinte
  let mesVencimento = mes + 1;
  let anoVencimento = ano;
  
  if (mesVencimento > 12) {
    mesVencimento = 1;
    anoVencimento++;
  }
  
  // Dia 25 do mês seguinte
  return `${anoVencimento}-${String(mesVencimento).padStart(2, '0')}-25`;
};

/**
 * Calcula o risco fiscal completo para um item (versão síncrona com estimativa)
 * Para cálculo preciso com API do BCB, use calcularRiscoFiscalItemAsync
 * 
 * @param params - Parâmetros do item
 * @returns Objeto RiscoFiscalItem com todos os cálculos
 */
export const calcularRiscoFiscalItem = (params: {
  produto: string;
  ncm: string;
  documento: string;
  dataOperacao: string;
  baseCalculo: number;
  pisInformado: number;
  pisAliquotaInformada: number;
  pisAliquotaDevida: number;
  cofinsInformado: number;
  cofinsAliquotaInformada: number;
  cofinsAliquotaDevida: number;
  fonte: string;
}): RiscoFiscalItem => {
  // Calcula valores devidos
  const pisDevido = (params.baseCalculo * params.pisAliquotaDevida) / 100;
  const cofinsDevido = (params.baseCalculo * params.cofinsAliquotaDevida) / 100;
  
  // Calcula diferenças
  const pisDiferenca = Math.max(0, pisDevido - params.pisInformado);
  const cofinsDiferenca = Math.max(0, cofinsDevido - params.cofinsInformado);
  const principalDiferenca = pisDiferenca + cofinsDiferenca;
  
  // Calcula data de vencimento
  const dataVencimento = calcularDataVencimento(params.dataOperacao);
  
  // Calcula multa e juros (usando estimativa)
  const multa = calcularMultaMora(principalDiferenca, dataVencimento);
  const jurosEstimado = estimarJurosSELIC(principalDiferenca, dataVencimento);
  const totalComMultaJuros = principalDiferenca + multa + jurosEstimado;
  
  return {
    produto: params.produto,
    ncm: params.ncm,
    documento: params.documento,
    baseCalculo: params.baseCalculo,
    
    pisInformado: params.pisInformado,
    pisAliquotaInformada: params.pisAliquotaInformada,
    pisDevido,
    pisAliquotaDevida: params.pisAliquotaDevida,
    pisDiferenca,
    
    cofinsInformado: params.cofinsInformado,
    cofinsAliquotaInformada: params.cofinsAliquotaInformada,
    cofinsDevido,
    cofinsAliquotaDevida: params.cofinsAliquotaDevida,
    cofinsDiferenca,
    
    principalDiferenca,
    multa,
    jurosEstimado,
    totalComMultaJuros,
    
    dataOperacao: params.dataOperacao,
    fonte: params.fonte,
  };
};

/**
 * Calcula o risco fiscal completo para um item (versão assíncrona com API do BCB)
 * Usa a API do Banco Central para cálculo preciso dos juros SELIC
 * 
 * @param params - Parâmetros do item
 * @returns Promise com Objeto RiscoFiscalItem com todos os cálculos
 */
export const calcularRiscoFiscalItemAsync = async (params: {
  produto: string;
  ncm: string;
  documento: string;
  dataOperacao: string;
  baseCalculo: number;
  pisInformado: number;
  pisAliquotaInformada: number;
  pisAliquotaDevida: number;
  cofinsInformado: number;
  cofinsAliquotaInformada: number;
  cofinsAliquotaDevida: number;
  fonte: string;
}): Promise<RiscoFiscalItem> => {
  // Calcula valores devidos
  const pisDevido = (params.baseCalculo * params.pisAliquotaDevida) / 100;
  const cofinsDevido = (params.baseCalculo * params.cofinsAliquotaDevida) / 100;
  
  // Calcula diferenças
  const pisDiferenca = Math.max(0, pisDevido - params.pisInformado);
  const cofinsDiferenca = Math.max(0, cofinsDevido - params.cofinsInformado);
  const principalDiferenca = pisDiferenca + cofinsDiferenca;
  
  // Calcula data de vencimento
  const dataVencimento = calcularDataVencimento(params.dataOperacao);
  
  // Calcula multa e juros (usando API do BCB)
  const multa = calcularMultaMora(principalDiferenca, dataVencimento);
  const jurosEstimado = await calcularJurosSELIC(principalDiferenca, dataVencimento);
  const totalComMultaJuros = principalDiferenca + multa + jurosEstimado;
  
  return {
    produto: params.produto,
    ncm: params.ncm,
    documento: params.documento,
    baseCalculo: params.baseCalculo,
    
    pisInformado: params.pisInformado,
    pisAliquotaInformada: params.pisAliquotaInformada,
    pisDevido,
    pisAliquotaDevida: params.pisAliquotaDevida,
    pisDiferenca,
    
    cofinsInformado: params.cofinsInformado,
    cofinsAliquotaInformada: params.cofinsAliquotaInformada,
    cofinsDevido,
    cofinsAliquotaDevida: params.cofinsAliquotaDevida,
    cofinsDiferenca,
    
    principalDiferenca,
    multa,
    jurosEstimado,
    totalComMultaJuros,
    
    dataOperacao: params.dataOperacao,
    fonte: params.fonte,
  };
};

/**
 * Gera resumo consolidado de todos os riscos fiscais
 * 
 * @param itens - Array de itens de risco fiscal
 * @returns Resumo consolidado
 */
export const consolidarRiscoFiscal = (
  itens: RiscoFiscalItem[]
): ResumoRiscoFiscal => {
  const totais = itens.reduce(
    (acc, item) => ({
      totalPrincipal: acc.totalPrincipal + item.principalDiferenca,
      totalMulta: acc.totalMulta + item.multa,
      totalJurosEstimado: acc.totalJurosEstimado + item.jurosEstimado,
      totalGeral: acc.totalGeral + item.totalComMultaJuros,
    }),
    {
      totalPrincipal: 0,
      totalMulta: 0,
      totalJurosEstimado: 0,
      totalGeral: 0,
    }
  );
  
  return {
    ...totais,
    itens,
  };
};
