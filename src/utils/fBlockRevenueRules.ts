/**
 * Regras para o Bloco F (Demais Documentos e Operações)
 * Define como tratar cada tipo de documento do bloco F na receita
 */

export interface FBlockRevenueRule {
  tipoDoc: string;
  descricao: string;
  geraReceita: boolean;
  considerarNaReceita: boolean;
  observacao?: string;
}

/**
 * Tabela de tipos de documento do Bloco F
 * Baseado na tabela 4.1.1 do guia EFD-Contribuições
 */
export const F_DOCUMENT_RULES: Record<string, FBlockRevenueRule> = {
  '01': {
    tipoDoc: '01',
    descricao: 'Nota Fiscal',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'Nota Fiscal - gera receita',
  },
  '02': {
    tipoDoc: '02',
    descricao: 'Nota Fiscal Avulsa',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'Nota Fiscal Avulsa - gera receita',
  },
  '03': {
    tipoDoc: '03',
    descricao: 'Nota Fiscal de Venda a Consumidor',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'Nota Fiscal ao Consumidor - gera receita',
  },
  '04': {
    tipoDoc: '04',
    descricao: 'Nota Fiscal de Produtor',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'Nota Fiscal de Produtor - gera receita',
  },
  '06': {
    tipoDoc: '06',
    descricao: 'Nota Fiscal/Conta de Energia Elétrica',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'Fatura de Energia - gera receita',
  },
  '07': {
    tipoDoc: '07',
    descricao: 'Nota Fiscal de Serviço de Transporte',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'NF de Transporte - gera receita',
  },
  '08': {
    tipoDoc: '08',
    descricao: 'Conhecimento de Transporte Rodoviário de Cargas',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'CTRC - gera receita',
  },
  '09': {
    tipoDoc: '09',
    descricao: 'Conhecimento de Transporte Aquaviário de Cargas',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'CTA - gera receita',
  },
  '10': {
    tipoDoc: '10',
    descricao: 'Conhecimento Aéreo',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'CA - gera receita',
  },
  '11': {
    tipoDoc: '11',
    descricao: 'Conhecimento de Transporte Ferroviário de Cargas',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'CTFC - gera receita',
  },
  '13': {
    tipoDoc: '13',
    descricao: 'Bilhete de Passagem Rodoviário',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'Bilhete de Passagem - gera receita',
  },
  '14': {
    tipoDoc: '14',
    descricao: 'Bilhete de Passagem Aquaviário',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'Bilhete de Passagem - gera receita',
  },
  '15': {
    tipoDoc: '15',
    descricao: 'Bilhete de Passagem e Nota de Bagagem',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'Bilhete de Passagem - gera receita',
  },
  '16': {
    tipoDoc: '16',
    descricao: 'Bilhete de Passagem Ferroviário',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'Bilhete de Passagem - gera receita',
  },
  '17': {
    tipoDoc: '17',
    descricao: 'Despacho de Transporte',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'Despacho - gera receita',
  },
  '18': {
    tipoDoc: '18',
    descricao: 'Resumo de Movimento Diário',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'Resumo de Movimento - gera receita',
  },
  '21': {
    tipoDoc: '21',
    descricao: 'Nota Fiscal de Serviço de Comunicação',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'NF de Comunicação - gera receita',
  },
  '22': {
    tipoDoc: '22',
    descricao: 'Nota Fiscal de Serviço de Telecomunicação',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'NF de Telecomunicação - gera receita',
  },
  '55': {
    tipoDoc: '55',
    descricao: 'Nota Fiscal Eletrônica (NF-e)',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'NF-e - gera receita',
  },
  '57': {
    tipoDoc: '57',
    descricao: 'Conhecimento de Transporte Eletrônico (CT-e)',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'CT-e - gera receita',
  },
  '59': {
    tipoDoc: '59',
    descricao: 'Cupom Fiscal Eletrônico (CF-e/SAT)',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'CF-e - gera receita',
  },
  '60': {
    tipoDoc: '60',
    descricao: 'Cupom Fiscal Eletrônico ECF',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'CF-e ECF - gera receita',
  },
  '63': {
    tipoDoc: '63',
    descricao: 'Bilhete de Passagem Eletrônico',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'BP-e - gera receita',
  },
  '65': {
    tipoDoc: '65',
    descricao: 'Nota Fiscal de Consumidor Eletrônica (NFC-e)',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'NFC-e - gera receita',
  },
  '67': {
    tipoDoc: '67',
    descricao: 'Conhecimento de Transporte Eletrônico para Outros Serviços',
    geraReceita: true,
    considerarNaReceita: true,
    observacao: 'CT-e OS - gera receita',
  },
};

/**
 * Retorna a regra de receita para um tipo de documento do Bloco F
 */
export const getFBlockRevenueRule = (tipoDoc: string): FBlockRevenueRule => {
  return (
    F_DOCUMENT_RULES[tipoDoc] || {
      tipoDoc: tipoDoc,
      descricao: 'Documento não catalogado',
      geraReceita: false,
      considerarNaReceita: false,
      observacao: 'Tipo de documento desconhecido',
    }
  );
};
