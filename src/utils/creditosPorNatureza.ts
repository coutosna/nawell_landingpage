/**
 * Crédito de PIS/COFINS por natureza da base (Tabela 4.3.7): o declarado no M105/M505
 * é a fonte primária; a natureza deduzida do CFOP de entrada (C170) é a verificação cruzada.
 */

import type { EFDData } from './efdParser';
import { naturezaCreditoPorCfopEntrada, eixoOperacao } from './cfopPolicyMonolith';

export const DESCRICAO_NATUREZA: Record<string, string> = {
  '01': 'Aquisição de bens para revenda',
  '02': 'Aquisição de bens utilizados como insumo',
  '03': 'Aquisição de serviços utilizados como insumo',
  '04': 'Energia elétrica e térmica',
  '05': 'Aluguéis de prédios',
  '06': 'Aluguéis de máquinas e equipamentos',
  '07': 'Armazenagem e frete na operação de venda',
  '08': 'Contraprestações de arrendamento mercantil',
  '09': 'Máquinas e equipamentos (depreciação)',
  '10': 'Máquinas e equipamentos (aquisição)',
  '11': 'Amortização e depreciação de edificações',
  '12': 'Devolução de vendas sujeitas à não cumulatividade',
  '13': 'Outras operações com direito a crédito',
  '18': 'Estoque de abertura de bens',
};

/** Naturezas que o motor consegue deduzir dos itens do C170 pelo CFOP */
const NATUREZAS_DEDUZIVEIS = new Set(['01', '02', '03', '12', '13']);

export interface LinhaNatureza {
  natureza: string;
  descricao: string;
  baseDeclaradaPIS: number;
  baseDeclaradaCOFINS: number;
  baseDeduzidaC170: number;
  creditoPISC170: number;
  creditoCOFINSC170: number;
  itensC170: number;
  /** Declarado − deduzido; só calculado quando a natureza é dedutível do C170 */
  divergencia: number | null;
}

export interface AnaliseCreditosNatureza {
  linhas: LinhaNatureza[];
  temDeclaracao: boolean;
  itensSemNatureza: number;
  baseSemNatureza: number;
}

const cstCredito = (cst: string) => {
  const n = parseInt(cst, 10);
  return n >= 50 && n <= 66;
};

export const analisarCreditosPorNatureza = (data: EFDData): AnaliseCreditosNatureza => {
  const mapa = new Map<string, LinhaNatureza>();
  const obter = (natureza: string): LinhaNatureza => {
    let linha = mapa.get(natureza);
    if (!linha) {
      linha = {
        natureza,
        descricao: DESCRICAO_NATUREZA[natureza] ?? `Natureza ${natureza}`,
        baseDeclaradaPIS: 0,
        baseDeclaradaCOFINS: 0,
        baseDeduzidaC170: 0,
        creditoPISC170: 0,
        creditoCOFINSC170: 0,
        itensC170: 0,
        divergencia: null,
      };
      mapa.set(natureza, linha);
    }
    return linha;
  };

  (data.creditosDeclarados ?? []).forEach(c => {
    const linha = obter(c.natureza);
    if (c.tributo === 'PIS') linha.baseDeclaradaPIS += c.base;
    else linha.baseDeclaradaCOFINS += c.base;
  });

  let itensSemNatureza = 0;
  let baseSemNatureza = 0;
  data.vendas.forEach(item => {
    if (eixoOperacao(item.cfop) !== 'entrada' || !cstCredito(item.pisCst)) return;
    const natureza = naturezaCreditoPorCfopEntrada(item.cfop);
    if (!natureza) {
      itensSemNatureza += 1;
      baseSemNatureza += item.pisBase;
      return;
    }
    const linha = obter(natureza);
    linha.baseDeduzidaC170 += item.pisBase;
    linha.creditoPISC170 += item.pisValor;
    linha.creditoCOFINSC170 += item.cofinsValor;
    linha.itensC170 += 1;
  });

  const temDeclaracao = (data.creditosDeclarados ?? []).length > 0;
  const linhas = Array.from(mapa.values())
    .map(l => ({
      ...l,
      divergencia: temDeclaracao && NATUREZAS_DEDUZIVEIS.has(l.natureza)
        ? Math.round((l.baseDeclaradaPIS - l.baseDeduzidaC170) * 100) / 100
        : null,
    }))
    .sort((a, b) => a.natureza.localeCompare(b.natureza));

  return { linhas, temDeclaracao, itensSemNatureza, baseSemNatureza };
};
