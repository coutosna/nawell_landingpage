/**
 * Utilitários para consolidar múltiplos arquivos EFD Contribuições
 * em uma única análise (ex.: vários meses em um dashboard consolidado)
 */

import { EFDData } from './efdParser';
import { consolidarRiscoFiscal } from './fiscalCalculations';

const formatDateExtended = (dateStr: string): string => {
  if (!dateStr || dateStr.length !== 8) return '';

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dia = dateStr.substring(0, 2);
  const mes = parseInt(dateStr.substring(2, 4), 10);
  const ano = dateStr.substring(4, 8);

  return `${dia} de ${meses[mes - 1]} de ${ano}`;
};

const sumRecords = (
  a: Record<string, number>,
  b: Record<string, number>
): Record<string, number> => {
  const out: Record<string, number> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    out[k] = (out[k] ?? 0) + v;
  }
  return out;
};

type Apuracao = EFDData['apuracaoPIS'];

const mergeApuracao = (apuracoes: Apuracao[]): Apuracao =>
  apuracoes.reduce((acc, cur) => ({
    receitas: sumRecords(acc.receitas, cur.receitas),
    creditos: sumRecords(acc.creditos, cur.creditos),
    totalReceitas: acc.totalReceitas + cur.totalReceitas,
    totalCreditos: acc.totalCreditos + cur.totalCreditos,
    saldoDevedor: acc.saldoDevedor + cur.saldoDevedor,
  }));

export const mergeEFDContents = (contents: string[]): string =>
  contents.filter(c => c && c.trim()).join('\n');

/**
 * Consolida os dados parseados de múltiplos arquivos EFD.
 * - Período do cadastro cobre a união dos períodos dos arquivos
 * - Produtos são deduplicados por código
 * - Valores monetários e apurações são somados
 * - Risco fiscal é recalculado a partir da união dos itens
 */
export const mergeEFDData = (datas: EFDData[]): EFDData => {
  if (datas.length === 0) {
    throw new Error('Nenhum dado EFD para consolidar');
  }
  if (datas.length === 1) return datas[0];

  // Ordena pelo período inicial (AAAAMMDD) — base é o arquivo mais antigo
  const sorted = [...datas].sort((a, b) =>
    a.cadastro.periodoInicial.localeCompare(b.cadastro.periodoInicial)
  );
  const base = sorted[0];
  const ultimo = sorted[sorted.length - 1];

  // Deduplica produtos por código
  const produtosMap = new Map<EFDData['produtos'][number]['codigo'], EFDData['produtos'][number]>();
  sorted.forEach(d => d.produtos.forEach(p => {
    if (!produtosMap.has(p.codigo)) produtosMap.set(p.codigo, p);
  }));

  const periodoInicial = base.cadastro.periodoInicial || ultimo.cadastro.periodoInicial;
  const periodoFinal = ultimo.cadastro.periodoFinal || base.cadastro.periodoFinal;

  const resumoChaves = Object.keys(base.resumo) as Array<keyof EFDData['resumo']>;
  const resumo = Object.fromEntries(
    resumoChaves.map(k => [k, sorted.reduce((acc, d) => acc + d.resumo[k], 0)])
  ) as EFDData['resumo'];

  const receitaDocumental = {
    blocoA: sorted.reduce((acc, d) => acc + d.receitaDocumental.blocoA, 0),
    blocoC: sorted.reduce((acc, d) => acc + d.receitaDocumental.blocoC, 0),
    blocoD: sorted.reduce((acc, d) => acc + d.receitaDocumental.blocoD, 0),
    blocoF: sorted.reduce((acc, d) => acc + d.receitaDocumental.blocoF, 0),
    total: sorted.reduce((acc, d) => acc + d.receitaDocumental.total, 0),
    detalhamento: sorted.flatMap(d => d.receitaDocumental.detalhamento),
  };

  const leiautes = new Set(sorted.map(d => d.leiaute));

  return {
    leiaute: leiautes.size === 1 ? base.leiaute : 'desconhecido',
    cadastro: {
      ...base.cadastro,
      periodoInicial,
      periodoFinal,
      periodoInicialDisplay: formatDateExtended(periodoInicial),
      periodoFinalDisplay: formatDateExtended(periodoFinal),
    },
    regime: { ...base.regime },
    produtos: Array.from(produtosMap.values()),
    vendas: sorted.flatMap(d => d.vendas),
    compras: sorted.flatMap(d => d.compras),
    apuracaoPIS: mergeApuracao(sorted.map(d => d.apuracaoPIS)),
    apuracaoCOFINS: mergeApuracao(sorted.map(d => d.apuracaoCOFINS)),
    resumo,
    receitaDocumental,
    receitaApurada: {
      pisM210: sorted.reduce((acc, d) => acc + d.receitaApurada.pisM210, 0),
      cofinsM610: sorted.reduce((acc, d) => acc + d.receitaApurada.cofinsM610, 0),
      total: sorted.reduce((acc, d) => acc + d.receitaApurada.total, 0),
    },
    riscoFiscal: consolidarRiscoFiscal(sorted.flatMap(d => d.riscoFiscal.itens)),
    fontes: {
      arquivos: sorted.flatMap(d => d.fontes?.arquivos ?? []),
      quantidade: datas.length,
    },
  };
};
