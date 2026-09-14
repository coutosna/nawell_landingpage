/**
 * Utilitários para consolidar múltiplos arquivos EFD Contribuições
 * em uma única análise (ex.: vários meses em um dashboard consolidado)
 */

import { EFDData } from './efdParser';
import { consolidarRiscoFiscal } from './fiscalCalculations';
import { EFDIcmsIpiData, E110Icms, E520Ipi } from './efdIcmsIpiParser';

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
 * Soma os campos numéricos de objetos com a mesma forma (ex.: resumos, E110, E520).
 */
const somarCampos = <T extends Record<string, number>>(objetos: T[]): T => {
  const chaves = Object.keys(objetos[0] ?? {}) as Array<keyof T>;
  const out = {} as T;
  for (const k of chaves) {
    out[k] = objetos.reduce((acc, o) => acc + (o[k] ?? 0), 0) as T[keyof T];
  }
  return out;
};

const primeiroOuUltimo = (valores: string[], posicao: 'primeiro' | 'ultimo'): string => {
  const naoVazios = valores.filter(v => v !== '');
  if (naoVazios.length === 0) return '';
  return posicao === 'primeiro' ? naoVazios[0] : naoVazios[naoVazios.length - 1];
};

/**
 * Consolida os dados do bloco E (apuração ICMS/IPI) de múltiplos SPED Fiscal.
 * - E110/E520 são somados (apuração consolidada do período)
 * - E111/E115/E116/E510/E530 são concatenados (histórico mês a mês)
 * - Conferências de fechamento preservadas por arquivo/competência
 */
const mergeIcmsIpi = (datas: EFDData[]): EFDIcmsIpiData => {
  const fiscais = datas
    .map(d => d.icmsIpi)
    .filter((x): x is EFDIcmsIpiData => Boolean(x));

  const e110List = fiscais
    .map(f => f.apuracaoIcms.e110)
    .filter((x): x is E110Icms => Boolean(x));
  const e110: E110Icms | null =
    e110List.length === 0
      ? null
      : {
          ...somarCampos(e110List),
          debitos: e110List.reduce((acc, x) => acc + x.debitos, 0),
          creditos: e110List.reduce((acc, x) => acc + x.creditos, 0),
          saldoRecalculado: e110List.reduce((acc, x) => acc + x.debitos, 0) - e110List.reduce((acc, x) => acc + x.creditos, 0),
        };

  const e520List = fiscais
    .map(f => f.apuracaoIpi.e520)
    .filter((x): x is E520Ipi => Boolean(x));
  const e520: E520Ipi | null =
    e520List.length === 0
      ? null
      : (() => {
          const base = somarCampos(e520List);
          return {
            ...base,
            saldoRecalculado: e520List.reduce((acc, x) => acc + x.saldoRecalculado, 0),
            saldoDeclarado: e520List.reduce((acc, x) => acc + x.saldoDeclarado, 0),
          };
        })();

  return {
    cadastro: {
      cnpj: primeiroOuUltimo(fiscais.map(f => f.cadastro.cnpj), 'primeiro'),
      razaoSocial: primeiroOuUltimo(fiscais.map(f => f.cadastro.razaoSocial), 'primeiro'),
      uf: primeiroOuUltimo(fiscais.map(f => f.cadastro.uf), 'primeiro'),
      municipio: primeiroOuUltimo(fiscais.map(f => f.cadastro.municipio), 'primeiro'),
      periodoInicial: primeiroOuUltimo(fiscais.map(f => f.cadastro.periodoInicial), 'primeiro'),
      periodoFinal: primeiroOuUltimo(fiscais.map(f => f.cadastro.periodoFinal), 'ultimo'),
      periodoInicialDisplay: primeiroOuUltimo(fiscais.map(f => f.cadastro.periodoInicialDisplay), 'primeiro'),
      periodoFinalDisplay: primeiroOuUltimo(fiscais.map(f => f.cadastro.periodoFinalDisplay), 'ultimo'),
    },
    leiaute: 'efd-icms-ipi',
    registros: fiscais.reduce((acc, f) => {
      for (const [reg, qtd] of Object.entries(f.registros)) {
        acc[reg] = (acc[reg] ?? 0) + qtd;
      }
      return acc;
    }, {} as Record<string, number>),
    apuracaoIcms: {
      periodoInicio: primeiroOuUltimo(fiscais.map(f => f.apuracaoIcms.periodoInicio), 'primeiro'),
      periodoFim: primeiroOuUltimo(fiscais.map(f => f.apuracaoIcms.periodoFim), 'ultimo'),
      e110,
      e111: fiscais.flatMap(f => f.apuracaoIcms.e111),
      e115: fiscais.flatMap(f => f.apuracaoIcms.e115),
      e116: fiscais.flatMap(f => f.apuracaoIcms.e116),
    },
    apuracaoIpi: {
      indApur: primeiroOuUltimo(fiscais.map(f => f.apuracaoIpi.indApur), 'primeiro'),
      periodoInicio: primeiroOuUltimo(fiscais.map(f => f.apuracaoIpi.periodoInicio), 'primeiro'),
      periodoFim: primeiroOuUltimo(fiscais.map(f => f.apuracaoIpi.periodoFim), 'ultimo'),
      e520,
      e510: fiscais.flatMap(f => f.apuracaoIpi.e510),
      e530: fiscais.flatMap(f => f.apuracaoIpi.e530),
    },
    conferencias: fiscais.flatMap(f => f.conferencias),
    resumo: somarCampos(
      fiscais.map(f => f.resumo),
    ),
    fontes: {
      arquivos: fiscais.flatMap(f => f.fontes?.arquivos ?? []),
      quantidade: fiscais.length,
    },
  };
};

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
    icmsIpi: leiautes.size === 1 && base.leiaute === 'efd-icms-ipi' ? mergeIcmsIpi(sorted) : undefined,
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
