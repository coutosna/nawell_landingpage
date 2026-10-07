/**
 * Funções para cálculo de multas, juros SELIC e risco fiscal
 * Base legal: Lei 9.430/96, arts. 44 e 61; MP 2.158-35/2001, art. 18
 */

import { SELIC_MENSAL } from '@/data/selicMensal';

/** Multa de ofício do art. 44, I, da Lei 9.430/96 (lançamento de ofício, sem qualificação) */
export const PERCENTUAL_MULTA_OFICIO = 0.75;

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

  // Totais — cenário de regularização espontânea (multa de mora)
  principalDiferenca: number; // pisDiferenca + cofinsDiferenca
  multa: number;
  jurosEstimado: number;
  totalComMultaJuros: number;

  // Cenário de autuação (multa de ofício de 75%)
  multaOficio: number;
  totalComMultaOficio: number;

  // Metadata
  dataOperacao: string;
  dataVencimento: string;
  fonte: string;
}

export interface ResumoRiscoFiscal {
  totalPrincipal: number;
  totalMulta: number;
  totalJurosEstimado: number;
  totalGeral: number;
  totalMultaOficio: number;
  totalGeralOficio: number;
  itens: RiscoFiscalItem[];
}

const DIA_MS = 24 * 60 * 60 * 1000;

const formatarISO = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const parseISO = (iso: string): Date => {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
};

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher) */
const calcularPascoa = (ano: number): Date => {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
};

/** Feriados nacionais e bancários (Carnaval, Sexta-feira Santa, Corpus Christi) do ano */
export const feriadosNacionais = (ano: number): Set<string> => {
  const fixos = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25'];
  // Dia da Consciência Negra é feriado nacional desde a Lei 14.759/2023
  if (ano >= 2024) fixos.push('11-20');
  const datas = new Set(fixos.map(md => `${ano}-${md}`));
  const pascoa = calcularPascoa(ano).getTime();
  [-48, -47, -2, 60].forEach(offset => datas.add(formatarISO(new Date(pascoa + offset * DIA_MS))));
  return datas;
};

export const ehDiaUtil = (d: Date): boolean => {
  const diaSemana = d.getDay();
  if (diaSemana === 0 || diaSemana === 6) return false;
  return !feriadosNacionais(d.getFullYear()).has(formatarISO(d));
};

/**
 * Vencimento de PIS/COFINS: dia 25 do mês seguinte ao período de apuração,
 * antecipado para o dia útil anterior quando não for dia útil
 * (art. 18 da MP 2.158-35/2001, redação da Lei 11.933/2009).
 *
 * @param periodoApuracao - Data da operação no formato DD/MM/AAAA
 * @returns Data de vencimento no formato AAAA-MM-DD
 */
export const calcularDataVencimento = (periodoApuracao: string): string => {
  if (!periodoApuracao) return '';

  const partes = periodoApuracao.split('/');
  if (partes.length !== 3) return '';

  const mes = parseInt(partes[1]);
  const ano = parseInt(partes[2]);
  if (!mes || !ano) return '';

  const vencimento = new Date(ano, mes, 25); // mês seguinte (Date usa mês 0-based)
  while (!ehDiaUtil(vencimento)) vencimento.setDate(vencimento.getDate() - 1);
  return formatarISO(vencimento);
};

/**
 * Multa de mora do art. 61 da Lei 9.430/96: 0,33% por dia de atraso a partir do
 * dia seguinte ao vencimento, limitada a 20%.
 */
export const calcularMultaMora = (
  principal: number,
  dataVencimento: string,
  dataPagamento: Date = new Date()
): number => {
  if (principal <= 0 || !dataVencimento) return 0;
  const vencimento = parseISO(dataVencimento);
  const pagamento = new Date(dataPagamento.getFullYear(), dataPagamento.getMonth(), dataPagamento.getDate());
  const diasAtraso = Math.round((pagamento.getTime() - vencimento.getTime()) / DIA_MS);
  if (diasAtraso <= 0) return 0;
  const percentual = Math.min(0.2, diasAtraso * 0.0033);
  return Math.round(principal * percentual * 100) / 100;
};

/** Multa de ofício de 75% (art. 44, I, Lei 9.430/96) — cenário de autuação */
export const calcularMultaOficio = (principal: number): number =>
  principal > 0 ? Math.round(principal * PERCENTUAL_MULTA_OFICIO * 100) / 100 : 0;

const chaveMes = (ano: number, mes0: number): string => `${ano}-${String(mes0 + 1).padStart(2, '0')}`;

const MESES_SELIC = Object.keys(SELIC_MENSAL).sort();
const ULTIMA_SELIC = SELIC_MENSAL[MESES_SELIC[MESES_SELIC.length - 1]];

/** Último mês com Selic oficial na tabela embutida (AAAA-MM) */
export const selicDisponivelAte = MESES_SELIC[MESES_SELIC.length - 1];

/** A Selic de um mês sai no início do seguinte: faltar o mês retrasado indica que a atualização mensal falhou */
export const selicDesatualizada = (hoje: Date = new Date()): boolean => {
  const limite = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
  return selicDisponivelAte < chaveMes(limite.getFullYear(), limite.getMonth());
};

/**
 * Juros de mora do art. 61, §3º, da Lei 9.430/96: soma da Selic mensal (série 4390)
 * do mês seguinte ao vencimento até o mês anterior ao pagamento, mais 1% no mês do
 * pagamento. Meses ainda sem taxa publicada usam a última taxa conhecida.
 */
export const calcularJurosSELIC = (
  principal: number,
  dataVencimento: string,
  dataPagamento: Date = new Date()
): number => {
  if (principal <= 0 || !dataVencimento) return 0;
  const vencimento = parseISO(dataVencimento);
  const mesesAteVencimento = vencimento.getFullYear() * 12 + vencimento.getMonth();
  const mesesAtePagamento = dataPagamento.getFullYear() * 12 + dataPagamento.getMonth();
  if (mesesAtePagamento <= mesesAteVencimento) return 0;

  let percentual = 1; // mês do pagamento
  for (let m = mesesAteVencimento + 1; m < mesesAtePagamento; m++) {
    percentual += SELIC_MENSAL[chaveMes(Math.floor(m / 12), m % 12)] ?? ULTIMA_SELIC;
  }
  return Math.round(principal * percentual) / 100;
};

/**
 * Calcula o risco fiscal completo para um item
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
  dataReferencia?: Date;
}): RiscoFiscalItem => {
  // Calcula valores devidos
  const pisDevido = (params.baseCalculo * params.pisAliquotaDevida) / 100;
  const cofinsDevido = (params.baseCalculo * params.cofinsAliquotaDevida) / 100;

  // Calcula diferenças
  const pisDiferenca = Math.max(0, pisDevido - params.pisInformado);
  const cofinsDiferenca = Math.max(0, cofinsDevido - params.cofinsInformado);
  const principalDiferenca = pisDiferenca + cofinsDiferenca;

  const dataVencimento = calcularDataVencimento(params.dataOperacao);
  const referencia = params.dataReferencia ?? new Date();

  const multa = calcularMultaMora(principalDiferenca, dataVencimento, referencia);
  const jurosEstimado = calcularJurosSELIC(principalDiferenca, dataVencimento, referencia);
  const totalComMultaJuros = principalDiferenca + multa + jurosEstimado;
  const multaOficio = calcularMultaOficio(principalDiferenca);
  const totalComMultaOficio = principalDiferenca + multaOficio + jurosEstimado;

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
    multaOficio,
    totalComMultaOficio,

    dataOperacao: params.dataOperacao,
    dataVencimento,
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
      totalMultaOficio: acc.totalMultaOficio + (item.multaOficio ?? 0),
      totalGeralOficio: acc.totalGeralOficio + (item.totalComMultaOficio ?? 0),
    }),
    {
      totalPrincipal: 0,
      totalMulta: 0,
      totalJurosEstimado: 0,
      totalGeral: 0,
      totalMultaOficio: 0,
      totalGeralOficio: 0,
    }
  );

  return {
    ...totais,
    itens,
  };
};
