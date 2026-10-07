/**
 * Alíquotas de PIS/COFINS por NCM a partir das tabelas oficiais do SPED:
 * 4.3.10 (monofásico ad valorem), 4.3.11 (por unidade de medida) e 4.3.13 (alíquota zero).
 * Atualizar com `npm run atualizar-tabelas-sped`.
 */

import tabelasSped from '@/data/oficial/spedPisCofins.json';

interface LinhaTabela {
  codigo: string;
  descricao: string;
  inicio: string | null;
  fim: string | null;
  ncms: string[];
}

interface LinhaAdValorem extends LinhaTabela {
  aliquotaPIS: number;
  aliquotaCOFINS: number;
}

interface LinhaPorUnidade extends LinhaAdValorem {
  unidade: string;
}

export interface NCMAliquota {
  codigo: string;
  descricao: string;
  aliquotaPIS: number; // Em percentual (ex: 2.1 para 2,1%)
  aliquotaCOFINS: number; // Em percentual (ex: 9.9 para 9,9%)
  vigenciaInicio: string | null;
  vigenciaFim: string | null;
  /** Tributação concentrada no industrial/importador; revenda sai à alíquota zero */
  monofasico: boolean;
  obs: string;
}

export interface ClassificacaoNCM {
  /** NCM consta da Tabela 4.3.10 na data — produto monofásico */
  monofasico: boolean;
  /** Alíquota única aplicável; null quando a tabela traz mais de uma (depende do vendedor, comprador ou embalagem) */
  aliquota: NCMAliquota | null;
  candidatos: NCMAliquota[];
}

const MONOFASICO = tabelasSped.monofasicoAdValorem as LinhaAdValorem[];
const POR_UNIDADE = tabelasSped.porUnidade as LinhaPorUnidade[];
const ALIQUOTA_ZERO = tabelasSped.aliquotaZero as LinhaTabela[];

/** DD/MM/AAAA → AAAA-MM-DD; datas inválidas não filtram vigência */
const isoDaOperacao = (data?: string): string | null => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(data || '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};

const vigente = (linha: LinhaTabela, iso: string | null): boolean =>
  !iso || ((!linha.inicio || linha.inicio <= iso) && (!linha.fim || linha.fim >= iso));

const cobreNcm = (linha: LinhaTabela, ncm: string): boolean =>
  linha.ncms.some(prefixo => ncm.startsWith(prefixo));

const normalizarNcm = (ncm: string): string => String(ncm || '').replace(/\D/g, '');

const linhasDoNcm = <T extends LinhaTabela>(tabela: T[], ncm: string, data?: string): T[] => {
  const n = normalizarNcm(ncm);
  if (n.length < 8) return [];
  const iso = isoDaOperacao(data);
  return tabela.filter(l => l.ncms.length > 0 && cobreNcm(l, n) && vigente(l, iso));
};

const paraAliquota = (l: LinhaAdValorem, tabela: string): NCMAliquota => ({
  codigo: l.codigo,
  descricao: l.descricao,
  aliquotaPIS: l.aliquotaPIS,
  aliquotaCOFINS: l.aliquotaCOFINS,
  vigenciaInicio: l.inicio,
  vigenciaFim: l.fim,
  monofasico: true,
  obs: `Tabela ${tabela} do SPED, código ${l.codigo}`,
});

/** Classifica o NCM na data da operação contra a Tabela 4.3.10 */
export const classificarNCM = (ncm: string, data?: string): ClassificacaoNCM => {
  const candidatos = linhasDoNcm(MONOFASICO, ncm, data).map(l => paraAliquota(l, '4.3.10'));
  const pares = new Set(candidatos.map(c => `${c.aliquotaPIS}|${c.aliquotaCOFINS}`));
  return {
    monofasico: candidatos.length > 0,
    aliquota: pares.size === 1 ? candidatos[0] : null,
    candidatos,
  };
};

/**
 * Alíquota ad valorem aplicável ao NCM na data (Tabela 4.3.10).
 * Retorna null quando o NCM não consta ou quando a tabela traz alíquotas diferentes para ele.
 */
export const buscarAliquotaNCM = (ncm: string, data?: string): NCMAliquota | null =>
  classificarNCM(ncm, data).aliquota;

/** Alíquota por unidade de medida (Tabela 4.3.11), só quando única para o NCM na data */
export const buscarAliquotaPorUnidade = (
  ncm: string,
  data?: string
): { aliquotaPIS: number; aliquotaCOFINS: number; unidade: string; codigo: string } | null => {
  const linhas = linhasDoNcm(POR_UNIDADE, ncm, data);
  const pares = new Set(linhas.map(l => `${l.aliquotaPIS}|${l.aliquotaCOFINS}|${l.unidade}`));
  if (pares.size !== 1) return null;
  const { aliquotaPIS, aliquotaCOFINS, unidade, codigo } = linhas[0];
  return { aliquotaPIS, aliquotaCOFINS, unidade, codigo };
};

/** Linhas da Tabela 4.3.13 (alíquota zero) que citam o NCM na data */
export const buscarAliquotaZero = (ncm: string, data?: string): Array<{ codigo: string; descricao: string }> =>
  linhasDoNcm(ALIQUOTA_ZERO, ncm, data).map(({ codigo, descricao }) => ({ codigo, descricao }));

/** Versões das tabelas oficiais embutidas */
export const VERSOES_TABELAS_SPED = tabelasSped.versoes;

/** CFOPs de venda de produção do estabelecimento (tabela oficial de CFOP) */
const CFOP_VENDA_PRODUCAO = new Set([
  '5101', '5103', '5105', '5109', '5111', '5113', '5116', '5118', '5122', '5401', '5402', '5651', '5652', '5653',
  '6101', '6103', '6105', '6107', '6109', '6111', '6113', '6116', '6118', '6122', '6401', '6402', '6651', '6652', '6653',
]);

/** CFOPs de venda de mercadoria adquirida ou recebida de terceiros (tabela oficial de CFOP) */
const CFOP_VENDA_TERCEIROS = new Set([
  '5102', '5104', '5106', '5110', '5112', '5114', '5115', '5117', '5119', '5120', '5123', '5403', '5405', '5654', '5655', '5656',
  '6102', '6104', '6106', '6108', '6110', '6112', '6114', '6115', '6117', '6119', '6120', '6123', '6403', '6654', '6655', '6656',
]);

/** Revenda confirmada pelo especialista; os demais CFOPs de terceiros ficam como suspeitos */
export const CFOP_VENDA_REVENDA = new Set(['5102', '6102']);

export type TipoVendaCfop = 'producao' | 'revenda-confirmada' | 'revenda' | 'outra';

export const tipoVendaCfop = (cfop: string): TipoVendaCfop => {
  const c = String(cfop || '').trim();
  if (CFOP_VENDA_REVENDA.has(c)) return 'revenda-confirmada';
  if (CFOP_VENDA_TERCEIROS.has(c)) return 'revenda';
  if (CFOP_VENDA_PRODUCAO.has(c)) return 'producao';
  return 'outra';
};

/** Revenda de monofásico sai à alíquota zero (art. 2º, Lei 10.147/2000 e correlatas) */
export const isRevendaMonofasico = (cfop: string, ncm: string, data?: string): boolean => {
  const tipo = tipoVendaCfop(cfop);
  return (tipo === 'revenda-confirmada' || tipo === 'revenda') && classificarNCM(ncm, data).monofasico;
};
