/**
 * Regras de CFOP para determinação de receita
 * Define quais CFOPs geram receita e como devem ser tratados
 */

export interface CFOPRevenueRule {
  cfop: string;
  geraReceita: boolean;
  tipo: 'venda' | 'devolucao_compra' | 'transferencia' | 'devolucao_venda' | 'outro';
  considerarNaReceita: boolean;
  observacao?: string;
}

/**
 * Determina se um CFOP gera receita tributável
 * 
 * Regras:
 * - CFOPs 5xxx e 6xxx (saídas) geralmente geram receita
 * - CFOPs 1xxx e 2xxx (entradas) geralmente não geram, exceto devoluções de compras
 * - Devoluções de vendas (5.2xx, 6.2xx) reduzem a receita
 * - Transferências não geram receita tributável
 */
export const getCFOPRevenueRule = (cfop: string): CFOPRevenueRule => {
  const cfopNum = cfop.replace(/\D/g, '');
  const firstDigit = cfopNum[0];
  const group = cfopNum.substring(1, 2);

  // Saídas estaduais (5xxx) e interestaduais (6xxx)
  if (firstDigit === '5' || firstDigit === '6') {
    // Grupo 2xx - Devoluções de compras (GERA RECEITA)
    if (group === '2') {
      return {
        cfop: cfop,
        geraReceita: true,
        tipo: 'devolucao_compra',
        considerarNaReceita: true,
        observacao: 'Devolução de compra - gera receita',
      };
    }

    // Grupo 5xx - Transferências (NÃO GERA RECEITA)
    if (group === '5') {
      return {
        cfop: cfop,
        geraReceita: false,
        tipo: 'transferencia',
        considerarNaReceita: false,
        observacao: 'Transferência entre estabelecimentos - não gera receita',
      };
    }

    // Grupo 9xx - Outras saídas (avaliar caso a caso)
    if (group === '9') {
      // 5.9xx / 6.9xx geralmente não geram receita (remessas, demonstrações, etc)
      return {
        cfop: cfop,
        geraReceita: false,
        tipo: 'outro',
        considerarNaReceita: false,
        observacao: 'Outras saídas - geralmente não geram receita',
      };
    }

    // Demais grupos de saída (1xx, 3xx, 4xx, 6xx, 7xx) - GERAM RECEITA
    return {
      cfop: cfop,
      geraReceita: true,
      tipo: 'venda',
      considerarNaReceita: true,
      observacao: 'Venda ou saída geradora de receita',
    };
  }

  // Entradas estaduais (1xxx) e interestaduais (2xxx)
  if (firstDigit === '1' || firstDigit === '2') {
    // Grupo 2xx - Devoluções de vendas (REDUZ RECEITA)
    if (group === '2') {
      return {
        cfop: cfop,
        geraReceita: false,
        tipo: 'devolucao_venda',
        considerarNaReceita: true, // Considerar para reduzir receita
        observacao: 'Devolução de venda - reduz receita',
      };
    }

    // Demais entradas não geram receita
    return {
      cfop: cfop,
      geraReceita: false,
      tipo: 'outro',
      considerarNaReceita: false,
      observacao: 'Entrada - não gera receita',
    };
  }

  // CFOPs desconhecidos
  return {
    cfop: cfop,
    geraReceita: false,
    tipo: 'outro',
    considerarNaReceita: false,
    observacao: 'CFOP não reconhecido',
  };
};

/**
 * Valida se IND_OPER está correto para o CFOP
 */
export const validarIndOperCFOP = (cfop: string, indOper: string): boolean => {
  const cfopNum = cfop.replace(/\D/g, '');
  const firstDigit = cfopNum[0];

  // IND_OPER: 0 = Entrada, 1 = Saída
  if (firstDigit === '1' || firstDigit === '2') {
    return indOper === '0'; // Entrada
  }

  if (firstDigit === '5' || firstDigit === '6') {
    return indOper === '1'; // Saída
  }

  return false;
};
