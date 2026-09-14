/**
 * CFOP Policy Monolith - v3.0
 * 
 * Centraliza toda a inteligência de CFOP do motor:
 * - Classifica CFOPs (entradas/saídas/serviços/energia/combustíveis/ST/exportação)
 * - Define se CFOP de SAÍDA conta como Receita Bruta
 * - Mapeia CFOP de ENTRADA → Natureza da Base do Crédito (01/02/03/12/13)
 * - Expõe APIs para normalização, classificação e agregação
 */

// ============================================================
// Tipos
// ============================================================
export interface CfopInfo {
  cfop: string;
  descricao: string;
  eixo: 'entrada' | 'saida' | 'desconhecido';
  abrangencia: 'interna' | 'interestadual' | 'exterior' | 'desconhecido';
}

export interface CfopClassification {
  grupo: 'saida' | 'entrada' | 'servico' | 'energia' | 'combustivel';
  uf_scope: 'interna' | 'interestadual' | 'exterior' | null;
  gera_receita: boolean;
  eh_devolucao: boolean;
  eh_st: boolean;
  natureza_credito: string | null; // "01"|"02"|"03"|"12"|"13"
  tipo_receita?: 'mercadorias' | 'comunicacao' | 'transporte' | 'energia' | 'combustiveis' | 'exportacoes' | 'outros';
}

// ============================================================
// Normalização e Classificações Básicas
// ============================================================
export function normCfop(cfop: string | number | null | undefined): string {
  const s = String(cfop || '').trim();
  const digits = s.replace(/\D/g, '');
  return digits.length >= 4 ? digits.substring(0, 4) : s;
}

export function eixoOperacao(cfop: string | number | null | undefined): 'entrada' | 'saida' | 'desconhecido' {
  const c = normCfop(cfop);
  if (!c) return 'desconhecido';
  const first = c[0];
  if (['1', '2', '3'].includes(first)) return 'entrada';
  if (['5', '6', '7'].includes(first)) return 'saida';
  return 'desconhecido';
}

export function abrangenciaOperacao(cfop: string | number | null | undefined): 'interna' | 'interestadual' | 'exterior' | 'desconhecido' {
  const c = normCfop(cfop);
  if (!c) return 'desconhecido';
  const map: Record<string, 'interna' | 'interestadual' | 'exterior'> = {
    '1': 'interna',
    '2': 'interestadual',
    '3': 'exterior',
    '5': 'interna',
    '6': 'interestadual',
    '7': 'exterior'
  };
  return map[c[0]] || 'desconhecido';
}

// ============================================================
// Devoluções e Anulações (NÃO reduzem receita bruta)
// ============================================================
const DEVOLUCOES_COD12 = new Set([
  '1201', '1202', '1203', '1204', '1410', '1411', '1660', '1661', '1662',
  '2201', '2202', '2410', '2411', '2660', '2661', '2662',
  '1215', '1216', '2215', '2216'
]);

const ANULACOES_COD13 = new Set(['1922', '2922']);

export function isDevolucao(cfop: string | number | null | undefined): boolean {
  return DEVOLUCOES_COD12.has(normCfop(cfop));
}

export function isAnulacaoSimplesFaturamento(cfop: string | number | null | undefined): boolean {
  return ANULACOES_COD13.has(normCfop(cfop));
}

// ============================================================
// CFOPs de SAÍDA que geram RECEITA BRUTA (tabela completa)
// ============================================================
const CFOPS_SAIDA_RECEITA: Record<string, string> = {
  // 5.1xx — Vendas internas de mercadorias
  '5101': 'Venda de produção do estabelecimento',
  '5102': 'Venda de mercadoria adquirida ou recebida de terceiros',
  '5103': 'Venda de produção do estabelecimento, efetuada fora do estabelecimento',
  '5104': 'Venda de mercadoria adquirida ou recebida de terceiros, efetuada fora do estabelecimento',
  '5105': 'Venda de produção do estabelecimento que não deva por ele transitar',
  '5106': 'Venda de mercadoria adquirida ou recebida de terceiros, que não deva por ele transitar',
  '5109': 'Venda de produção do estabelecimento, destinada à ZFM/ALC',
  '5110': 'Venda de mercadoria de terceiros, destinada à ZFM/ALC',
  '5111': 'Venda produção remetida em consignação industrial',
  '5112': 'Venda terceiros remetida em consignação industrial',
  '5113': 'Venda produção remetida em consignação mercantil',
  '5114': 'Venda terceiros remetida em consignação mercantil',
  '5115': 'Venda mercadoria de terceiros recebida anteriormente em consignação mercantil',
  '5116': 'Venda produção originada de encomenda p/ entrega futura',
  '5117': 'Venda terceiros originada de encomenda p/ entrega futura',
  '5118': 'Venda produção entregue por conta e ordem (venda à ordem)',
  '5119': 'Venda terceiros entregue por conta e ordem (venda à ordem)',
  '5120': 'Venda terceiros entregue pelo vendedor remetente (venda à ordem)',
  '5122': 'Venda produção remetida p/ industrialização por conta e ordem',
  '5123': 'Venda terceiros remetida p/ industrialização por conta e ordem',
  '5124': 'Industrialização efetuada para outra empresa',
  '5125': 'Industrialização p/ outra empresa s/ trânsito pelo adquirente',
  
  // Energia elétrica 52x
  '5251': 'Venda de energia elétrica para distribuição/comercialização',
  '5252': 'Venda de energia elétrica para estabelecimento industrial',
  '5253': 'Venda de energia elétrica para estabelecimento comercial',
  '5254': 'Venda de energia elétrica p/ prestador transporte',
  '5255': 'Venda de energia elétrica p/ prestador comunicação',
  '5256': 'Venda de energia elétrica p/ produtor rural',
  '5257': 'Venda de energia elétrica p/ consumo por demanda contratada',
  '5258': 'Venda de energia elétrica a não contribuinte',
  
  // Comunicação 53xx
  '5301': 'Prestação de serviço de comunicação p/ execução da mesma natureza',
  '5302': 'Prest. comunicação a estabelecimento industrial',
  '5303': 'Prest. comunicação a estabelecimento comercial',
  '5304': 'Prest. comunicação a prestador de transporte',
  '5305': 'Prest. comunicação a geradora/distribuidora energia',
  '5306': 'Prest. comunicação a produtor rural',
  '5307': 'Prest. comunicação a não contribuinte',
  
  // Transporte 535x/5359/5360
  '5351': 'Prest. serviço de transporte p/ execução da mesma natureza',
  '5352': 'Prest. transporte a estabelecimento industrial',
  '5353': 'Prest. transporte a estabelecimento comercial',
  '5354': 'Prest. transporte a prestador de comunicação',
  '5355': 'Prest. transporte a geradora/distribuidora energia',
  '5356': 'Prest. transporte a produtor rural',
  '5357': 'Prest. transporte a não contribuinte',
  '5359': 'Prest. transporte dispensa NF mercadoria',
  '5360': 'Prest. transporte a contribuinte substituto',
  
  // Substituição tributária – vendas 54xx
  '5401': 'Venda produção com ST, contrib. substituto',
  '5402': 'Venda produção com ST entre substitutos',
  '5403': 'Venda mercadoria de terceiros com ST, substituto',
  '5405': 'Venda mercadoria de terceiros com ST, substituído',
  
  // Combustíveis 565x e 5667
  '5651': 'Venda combustível/lubrificante produção p/ industrialização',
  '5652': 'Venda combustível/lubrificante produção p/ comercialização',
  '5653': 'Venda combustível/lubrificante produção p/ consumidor final',
  '5654': 'Venda combustível/lubrificante terceiros p/ industrialização',
  '5655': 'Venda combustível/lubrificante terceiros p/ comercialização',
  '5656': 'Venda combustível/lubrificante terceiros p/ consumidor final',
  '5667': 'Venda combustível/lubrificante a consumidor final em outra UF',
  
  // 59xx — serviços específicos
  '5932': 'Prest. transporte iniciada em UF diversa',
  '5933': 'Prest. serviço tributado pelo ISSQN',
  
  // 6.1xx — Vendas interestaduais de mercadorias
  '6101': 'Venda de produção do estabelecimento',
  '6102': 'Venda de mercadoria adquirida ou recebida de terceiros',
  '6103': 'Venda de produção efetuada fora do estabelecimento',
  '6104': 'Venda de mercadoria de terceiros efetuada fora do estabelecimento',
  '6105': 'Venda de produção que não deva transitar pelo estabelecimento',
  '6106': 'Venda de mercadoria de terceiros que não deva transitar',
  '6107': 'Venda produção a não contribuinte',
  '6108': 'Venda terceiros a não contribuinte',
  '6109': 'Venda produção p/ ZFM/ALC',
  '6110': 'Venda terceiros p/ ZFM/ALC',
  '6111': 'Venda produção consignação industrial',
  '6112': 'Venda terceiros consignação industrial',
  '6113': 'Venda produção consignação mercantil',
  '6114': 'Venda terceiros consignação mercantil',
  '6115': 'Venda terceiros recebida anteriormente em consignação',
  '6116': 'Venda produção encomenda p/ entrega futura',
  '6117': 'Venda terceiros encomenda p/ entrega futura',
  '6118': 'Venda produção entregue por conta e ordem (venda à ordem)',
  '6119': 'Venda terceiros entregue por conta e ordem (venda à ordem)',
  '6120': 'Venda terceiros entregue pelo vendedor remetente (venda à ordem)',
  '6122': 'Venda produção p/ industrialização por conta e ordem',
  '6123': 'Venda terceiros p/ industrialização por conta e ordem',
  '6124': 'Industrialização efetuada para outra empresa',
  '6125': 'Industrialização p/ outra empresa s/ trânsito pelo adquirente',
  
  // Energia 62x
  '6251': 'Venda de energia elétrica p/ distribuição/comercialização',
  '6252': 'Venda de energia elétrica p/ estabelecimento industrial',
  '6253': 'Venda de energia elétrica p/ estabelecimento comercial',
  '6254': 'Venda de energia elétrica p/ prestador de transporte',
  '6255': 'Venda de energia elétrica p/ prestador de comunicação',
  '6256': 'Venda de energia elétrica p/ produtor rural',
  '6257': 'Venda de energia elétrica p/ consumo por demanda contratada',
  '6258': 'Venda de energia elétrica a não contribuinte',
  
  // Comunicação 63xx
  '6301': 'Prest. comunicação p/ execução da mesma natureza',
  '6302': 'Prest. comunicação a estabelecimento industrial',
  '6303': 'Prest. comunicação a estabelecimento comercial',
  '6304': 'Prest. comunicação a prestador de transporte',
  '6305': 'Prest. comunicação a geradora/distribuidora energia',
  '6306': 'Prest. comunicação a produtor rural',
  '6307': 'Prest. comunicação a não contribuinte',
  
  // Transporte 635x/6359/6360
  '6351': 'Prest. transporte p/ execução da mesma natureza',
  '6352': 'Prest. transporte a estabelecimento industrial',
  '6353': 'Prest. transporte a estabelecimento comercial',
  '6354': 'Prest. transporte a prestador de comunicação',
  '6355': 'Prest. transporte a geradora/distribuidora energia',
  '6356': 'Prest. transporte a produtor rural',
  '6357': 'Prest. transporte a não contribuinte',
  '6359': 'Prest. transporte dispensa NF mercadoria',
  '6360': 'Prest. transporte a contribuinte substituto',
  
  // ST 64xx
  '6401': 'Venda produção com ST — substituto',
  '6402': 'Venda produção com ST entre substitutos',
  '6403': 'Venda mercadoria terceiros com ST — substituto',
  '6404': 'Venda mercadoria com ST já retida anteriormente',
  
  // Combustíveis 665x/6667
  '6651': 'Venda comb./lub. produção p/ industrialização (interestadual)',
  '6652': 'Venda comb./lub. produção p/ comercialização (interestadual)',
  '6653': 'Venda comb./lub. produção p/ consumidor final (interestadual)',
  '6654': 'Venda comb./lub. terceiros p/ industrialização (interestadual)',
  '6655': 'Venda comb./lub. terceiros p/ comercialização (interestadual)',
  '6656': 'Venda comb./lub. terceiros p/ consumidor final (interestadual)',
  '6667': 'Venda comb./lub. a consumidor final em outra UF (interestadual)',
  
  // 69xx
  '6932': 'Prest. transporte iniciada em UF diversa (interestadual)',
  '6933': 'Prest. serviço tributado pelo ISSQN (interestadual)',
  
  // 7.xxx — Exterior (exportações e serviços ao exterior)
  '7101': 'Venda de produção do estabelecimento',
  '7102': 'Venda de mercadoria adquirida de terceiros',
  '7105': 'Venda de produção que não deva transitar',
  '7106': 'Venda de mercadoria de terceiros que não deva transitar',
  '7127': 'Venda produção sob drawback',
  '7251': 'Venda de energia elétrica para o exterior',
  '7301': 'Prestação de serviço de comunicação — exterior',
  '7358': 'Prestação de serviço de transporte — exterior',
  '7501': 'Exportação de mercadorias recebidas p/ fim específico de exportação',
  '7651': 'Venda comb./lub. produção p/ industrialização — exterior',
  '7654': 'Venda comb./lub. terceiros p/ industrialização — exterior',
  '7667': 'Venda comb./lub. a consumidor/usuário final — exterior',
};

export function isCfopSaidaReceita(cfop: string | number | null | undefined): boolean {
  const c = normCfop(cfop);
  if (!c) return false;
  if (isDevolucao(c) || isAnulacaoSimplesFaturamento(c)) return false;
  return c in CFOPS_SAIDA_RECEITA;
}

// ============================================================
// CFOPs de ENTRADA com Natureza de Crédito (tabela completa)
// ============================================================
interface EntradaNatureza {
  descricao: string;
  natureza: string; // "01"|"02"|"03"|"12"|"13"
}

const CFOPS_ENTRADA_NATUREZA: Record<string, EntradaNatureza> = {
  // Natureza 01 - Comercialização
  '1102': { descricao: 'Compra p/ comercialização', natureza: '01' },
  '1113': { descricao: 'Compra p/ comercialização consignação mercantil', natureza: '01' },
  '1117': { descricao: 'Compra p/ comercialização encomenda receb. futuro', natureza: '01' },
  '1118': { descricao: 'Compra p/ comercialização em venda à ordem (entrega a terceiro)', natureza: '01' },
  '1121': { descricao: 'Compra p/ comercialização, venda à ordem, já recebida', natureza: '01' },
  '1251': { descricao: 'Compra de energia elétrica p/ distribuição/comercialização', natureza: '01' },
  '1403': { descricao: 'Compra p/ comercialização com ST (bares, restaurantes etc.)', natureza: '01' },
  '1652': { descricao: 'Compra de combustível/lubrificante p/ comercialização', natureza: '01' },
  '2102': { descricao: 'Compra p/ comercialização', natureza: '01' },
  '2113': { descricao: 'Compra p/ comercialização consignação mercantil', natureza: '01' },
  '2117': { descricao: 'Compra p/ comercialização encomenda receb. futuro', natureza: '01' },
  '2118': { descricao: 'Compra p/ comercialização em venda à ordem (entrega a terceiro)', natureza: '01' },
  '2121': { descricao: 'Compra p/ comercialização, venda à ordem, já recebida', natureza: '01' },
  '2251': { descricao: 'Compra de energia elétrica p/ distribuição/comercialização', natureza: '01' },
  '2403': { descricao: 'Compra p/ comercialização com ST (bares, restaurantes etc.)', natureza: '01' },
  '2652': { descricao: 'Compra de combustível/lubrificante p/ comercialização', natureza: '01' },
  '3102': { descricao: 'Compra p/ comercialização (Importação)', natureza: '01' },
  '3251': { descricao: 'Compra de energia elétrica p/ distribuição/comercialização (Importação)', natureza: '01' },
  '3652': { descricao: 'Compra de combustível/lubrificante p/ comercialização (Importação)', natureza: '01' },
  '1159': { descricao: 'Entrada decorrente de fornecimento — ato cooperativo', natureza: '01' },
  '2159': { descricao: 'Entrada decorrente de fornecimento — ato cooperativo (interestadual)', natureza: '01' },

  // Natureza 02 - Industrialização/Produção/Insumo
  '1101': { descricao: 'Compra p/ industrialização ou Produção Rural', natureza: '02' },
  '1111': { descricao: 'Compra p/ industrialização — consignação industrial', natureza: '02' },
  '1116': { descricao: 'Compra p/ industrialização — encomenda receb. futuro', natureza: '02' },
  '1120': { descricao: 'Compra p/ industrialização — venda à ordem já recebida', natureza: '02' },
  '1122': { descricao: 'Compra p/ industrialização com remessa direta ao industrializador', natureza: '02' },
  '1126': { descricao: 'Compra p/ utilização na prestação de serviço (ICMS)', natureza: '02' },
  '1128': { descricao: 'Compra p/ utilização na prestação de serviço (ISSQN)', natureza: '02' },
  '1401': { descricao: 'Compra p/ industrialização com ST', natureza: '02' },
  '1407': { descricao: 'Compra p/ uso/consumo com ST (ICMS)', natureza: '02' },
  '1556': { descricao: 'Compra de material p/ uso ou consumo', natureza: '02' },
  '1651': { descricao: 'Compra de combustível/lubrificante p/ industrialização', natureza: '02' },
  '1653': { descricao: 'Compra de combustível/lubrificante por consumidor final', natureza: '02' },
  '2101': { descricao: 'Compra p/ industrialização ou Produção Rural', natureza: '02' },
  '2111': { descricao: 'Compra p/ industrialização — consignação industrial', natureza: '02' },
  '2116': { descricao: 'Compra p/ industrialização — encomenda receb. futuro', natureza: '02' },
  '2120': { descricao: 'Compra p/ industrialização — venda à ordem já recebida', natureza: '02' },
  '2122': { descricao: 'Compra p/ industrialização com remessa direta ao industrializador', natureza: '02' },
  '2126': { descricao: 'Compra p/ utilização na prestação de serviço', natureza: '02' },
  '2128': { descricao: 'Compra p/ utilização na prestação de serviço (ISSQN)', natureza: '02' },
  '2401': { descricao: 'Compra p/ industrialização com ST', natureza: '02' },
  '2407': { descricao: 'Compra p/ uso/consumo com ST (ICMS)', natureza: '02' },
  '2556': { descricao: 'Compra de material p/ uso ou consumo', natureza: '02' },
  '2651': { descricao: 'Compra de combustível/lubrificante p/ industrialização', natureza: '02' },
  '2653': { descricao: 'Compra de combustível/lubrificante por consumidor final', natureza: '02' },
  '3101': { descricao: 'Compra p/ industrialização ou Produção Rural (Importação)', natureza: '02' },
  '3126': { descricao: 'Compra p/ utilização na prestação de serviço (Importação)', natureza: '02' },
  '3128': { descricao: 'Compra p/ utilização na prestação de serviço (ISSQN) (Importação)', natureza: '02' },
  '3556': { descricao: 'Compra de material p/ uso ou consumo (Importação)', natureza: '02' },
  '3651': { descricao: 'Compra de combustível/lubrificante p/ industrialização (Importação)', natureza: '02' },
  '3653': { descricao: 'Compra de combustível/lubrificante por consumidor final (Importação)', natureza: '02' },
  '1135': { descricao: 'Fixação de preço produção — ato cooperativo (industrialização)', natureza: '02' },
  '2135': { descricao: 'Fixação de preço produção — ato cooperativo (industrialização)', natureza: '02' },
  '1132': { descricao: 'Fixação de preço produção — ato cooperativo (comercialização)', natureza: '02' },
  '2132': { descricao: 'Fixação de preço produção — ato cooperativo (comercialização)', natureza: '02' },
  '1456': { descricao: 'Remuneração do produtor no Sistema de Integração/Parceria Rural', natureza: '02' },
  '2456': { descricao: 'Remuneração do produtor — interestadual', natureza: '02' },

  // Natureza 03 - Industrialização por terceiros/ISS
  '1124': { descricao: 'Industrialização efetuada por outra empresa', natureza: '03' },
  '1125': { descricao: 'Industrialização por outra empresa s/ trânsito pelo adquirente', natureza: '03' },
  '1933': { descricao: 'Aquisição de serviço tributado pelo ISSQN', natureza: '03' },
  '2124': { descricao: 'Industrialização efetuada por outra empresa', natureza: '03' },
  '2125': { descricao: 'Industrialização por outra empresa s/ trânsito pelo adquirente', natureza: '03' },
  '2933': { descricao: 'Aquisição de serviço tributado pelo ISSQN (importação)', natureza: '03' },

  // Natureza 12 - Devoluções (geram crédito, não reduzem receita bruta)
  '1201': { descricao: 'Devolução de venda de produção do estabelecimento', natureza: '12' },
  '1202': { descricao: 'Devolução de venda de mercadoria de terceiros', natureza: '12' },
  '1203': { descricao: 'Devolução venda produção — ZFM/ALC', natureza: '12' },
  '1204': { descricao: 'Devolução venda terceiros — ZFM/ALC', natureza: '12' },
  '1410': { descricao: 'Devolução venda produção com ST', natureza: '12' },
  '1411': { descricao: 'Devolução venda terceiros com ST', natureza: '12' },
  '1660': { descricao: 'Devolução venda combustível/lubrificante p/ industrialização', natureza: '12' },
  '1661': { descricao: 'Devolução venda combustível/lubrificante p/ comercialização', natureza: '12' },
  '1662': { descricao: 'Devolução venda combustível/lubrificante a consumidor final', natureza: '12' },
  '2201': { descricao: 'Devolução venda produção (interestadual)', natureza: '12' },
  '2202': { descricao: 'Devolução venda terceiros (interestadual)', natureza: '12' },
  '2410': { descricao: 'Devolução venda produção com ST (interestadual)', natureza: '12' },
  '2411': { descricao: 'Devolução venda terceiros com ST (interestadual)', natureza: '12' },
  '2660': { descricao: 'Devolução venda combustível p/ industrialização (interestadual)', natureza: '12' },
  '2661': { descricao: 'Devolução venda combustível p/ comercialização (interestadual)', natureza: '12' },
  '2662': { descricao: 'Devolução venda combustível a consumidor final (interestadual)', natureza: '12' },
  '1215': { descricao: 'Devolução de fornecimento produção — ato cooperativo', natureza: '12' },
  '1216': { descricao: 'Devolução fornecimento mercadoria de terceiros — ato cooperativo', natureza: '12' },
  '2215': { descricao: 'Devolução fornecimento produção — ato cooperativo (interestadual)', natureza: '12' },
  '2216': { descricao: 'Devolução fornecimento terceiros — ato cooperativo (interestadual)', natureza: '12' },

  // Natureza 13 - Simples faturamento (não receita)
  '1922': { descricao: 'Simples faturamento p/ recebimento futuro', natureza: '13' },
  '2922': { descricao: 'Simples faturamento p/ recebimento futuro (interestadual)', natureza: '13' },
};

export function naturezaCreditoPorCfopEntrada(cfop: string | number | null | undefined): string | null {
  const c = normCfop(cfop);
  return CFOPS_ENTRADA_NATUREZA[c]?.natureza || null;
}

export function descricaoCfopEntrada(cfop: string | number | null | undefined): string | null {
  const c = normCfop(cfop);
  return CFOPS_ENTRADA_NATUREZA[c]?.descricao || null;
}

export function descricaoCfopSaida(cfop: string | number | null | undefined): string | null {
  const c = normCfop(cfop);
  return CFOPS_SAIDA_RECEITA[c] || null;
}

// ============================================================
// Classificação completa de CFOP
// ============================================================
export function classifyCfop(cfop: string | number | null | undefined): CfopClassification {
  const c = normCfop(cfop);
  const eixo = eixoOperacao(c);
  const abrangencia = abrangenciaOperacao(c);
  const devolucao = isDevolucao(c);
  const anulacao = isAnulacaoSimplesFaturamento(c);
  
  // Determinar se gera receita
  const geraReceita = eixo === 'saida' && !devolucao && !anulacao && (c in CFOPS_SAIDA_RECEITA);
  
  // Natureza de crédito (só para entradas)
  const naturezaCredito = eixo === 'entrada' ? naturezaCreditoPorCfopEntrada(c) : null;
  
  // Determinar grupo
  let grupo: CfopClassification['grupo'] = eixo === 'entrada' ? 'entrada' : 'saida';
  if (c.startsWith('53') || c.startsWith('63') || c.startsWith('73')) grupo = 'servico';
  if (c.startsWith('525') || c.startsWith('625') || c.startsWith('725')) grupo = 'energia';
  if (c.startsWith('565') || c.startsWith('665') || c.startsWith('765')) grupo = 'combustivel';
  
  // Determinar se é ST
  const ehSt = c.startsWith('54') || c.startsWith('64') || c.startsWith('14') || c.startsWith('24');
  
  return {
    grupo,
    uf_scope: abrangencia === 'desconhecido' ? null : abrangencia,
    gera_receita: geraReceita,
    eh_devolucao: devolucao,
    eh_st: ehSt,
    natureza_credito: naturezaCredito,
    tipo_receita: geraReceita ? bucketTipoReceita(c) : undefined
  };
}

// ============================================================
// Buckets por tipo de receita (para dashboards)
// ============================================================
const BUCKET_MERCADORIAS = new Set([
  '5101', '5102', '5103', '5104', '5105', '5106', '5109', '5110', '5111', '5112', '5113', '5114', '5115',
  '5116', '5117', '5118', '5119', '5120', '5122', '5123', '5124', '5125',
  '6101', '6102', '6103', '6104', '6105', '6106', '6107', '6108', '6109', '6110', '6111', '6112', '6113',
  '6114', '6115', '6116', '6117', '6118', '6119', '6120', '6122', '6123', '6124', '6125',
  '7101', '7102', '7105', '7106', '7127', '7501'
]);

const BUCKET_COMUNICACAO = new Set([
  '5301', '5302', '5303', '5304', '5305', '5306', '5307',
  '6301', '6302', '6303', '6304', '6305', '6306', '6307',
  '7301'
]);

const BUCKET_TRANSPORTE = new Set([
  '5351', '5352', '5353', '5354', '5355', '5356', '5357', '5359', '5360',
  '6351', '6352', '6353', '6354', '6355', '6356', '6357', '6359', '6360', '6932',
  '7358'
]);

const BUCKET_ENERGIA = new Set([
  '5251', '5252', '5253', '5254', '5255', '5256', '5257', '5258',
  '6251', '6252', '6253', '6254', '6255', '6256', '6257', '6258',
  '7251'
]);

const BUCKET_COMBUSTIVEIS = new Set([
  '5651', '5652', '5653', '5654', '5655', '5656', '5667',
  '6651', '6652', '6653', '6654', '6655', '6656', '6667',
  '7651', '7654', '7667'
]);

const BUCKET_EXPORTACOES = new Set([
  '7101', '7102', '7105', '7106', '7127', '7251', '7301', '7358', '7501', '7651', '7654', '7667'
]);

export function bucketTipoReceita(cfop: string | number | null | undefined): 'mercadorias' | 'comunicacao' | 'transporte' | 'energia' | 'combustiveis' | 'exportacoes' | 'outros' {
  const c = normCfop(cfop);
  if (BUCKET_COMUNICACAO.has(c)) return 'comunicacao';
  if (BUCKET_TRANSPORTE.has(c)) return 'transporte';
  if (BUCKET_ENERGIA.has(c)) return 'energia';
  if (BUCKET_COMBUSTIVEIS.has(c)) return 'combustiveis';
  if (BUCKET_EXPORTACOES.has(c)) return 'exportacoes';
  if (BUCKET_MERCADORIAS.has(c)) return 'mercadorias';
  return 'outros';
}

// ============================================================
// Info completa do CFOP
// ============================================================
export function infoCfop(cfop: string | number | null | undefined): CfopInfo | null {
  const c = normCfop(cfop);
  if (!c || c.length !== 4) return null;
  
  const desc = CFOPS_SAIDA_RECEITA[c] || CFOPS_ENTRADA_NATUREZA[c]?.descricao || '';
  
  return {
    cfop: c,
    descricao: desc,
    eixo: eixoOperacao(c),
    abrangencia: abrangenciaOperacao(c)
  };
}

// ============================================================
// Agregação e filtros
// ============================================================
export interface ItemComCfop {
  cfop?: string | number;
  vl_item?: number | string;
  [key: string]: any;
}

export function filtrarReceitaSaida(itens: ItemComCfop[]): ItemComCfop[] {
  return itens.filter(item => {
    const c = normCfop(item.cfop);
    return c && c in CFOPS_SAIDA_RECEITA && !isDevolucao(c) && !isAnulacaoSimplesFaturamento(c);
  });
}

export function filtrarEntradasPorNatureza(itens: ItemComCfop[], natureza: string): ItemComCfop[] {
  return itens.filter(item => {
    const c = normCfop(item.cfop);
    if (eixoOperacao(c) !== 'entrada') return false;
    return CFOPS_ENTRADA_NATUREZA[c]?.natureza === natureza;
  });
}

export interface AgrupadoPorCfop {
  [cfop: string]: {
    qtd_linhas: number;
    vl_total: number;
  };
}

export function agruparPorCfop(itens: ItemComCfop[]): AgrupadoPorCfop {
  const acc: AgrupadoPorCfop = {};
  
  for (const item of itens) {
    const c = normCfop(item.cfop);
    if (c.length !== 4) continue;
    
    const valor = typeof item.vl_item === 'string' 
      ? parseFloat(item.vl_item.replace(',', '.')) || 0
      : Number(item.vl_item) || 0;
    
    if (!acc[c]) {
      acc[c] = { qtd_linhas: 0, vl_total: 0 };
    }
    
    acc[c].qtd_linhas += 1;
    acc[c].vl_total += valor;
  }
  
  return acc;
}

export interface BucketAbrangencia {
  interna: number;
  interestadual: number;
  exterior: number;
}

export function bucketAbrangenciaReceita(itensSaidaReceita: ItemComCfop[]): BucketAbrangencia {
  const buckets: BucketAbrangencia = { interna: 0, interestadual: 0, exterior: 0 };
  
  for (const item of itensSaidaReceita) {
    const c = normCfop(item.cfop);
    if (!isCfopSaidaReceita(c)) continue;
    
    const valor = typeof item.vl_item === 'string'
      ? parseFloat(item.vl_item.replace(',', '.')) || 0
      : Number(item.vl_item) || 0;
    
    const ab = abrangenciaOperacao(c);
    if (ab !== 'desconhecido') {
      buckets[ab] += valor;
    }
  }
  
  return buckets;
}

export function detectarCfopsSuspeitosParaReceita(itens: ItemComCfop[]): string[] {
  const vistos = new Set<string>();
  const suspeitos = new Set<string>();
  
  for (const item of itens) {
    const c = normCfop(item.cfop);
    if (!c || vistos.has(c)) continue;
    vistos.add(c);
    
    if (eixoOperacao(c) === 'saida' && 
        !(c in CFOPS_SAIDA_RECEITA) && 
        !isDevolucao(c) && 
        !isAnulacaoSimplesFaturamento(c)) {
      suspeitos.add(c);
    }
  }
  
  return Array.from(suspeitos).sort();
}

export interface CoberturaCfop {
  policy_version: string;
  total_cfop_saida_encontrados: number;
  cobertos_por_tabela: number;
  percentual_coberto: number;
  nao_cobertos: string[];
}

export function coberturaCfopSaida(usadosNoPeriodo: string[]): CoberturaCfop {
  const usadosNorm = new Set(usadosNoPeriodo.map(c => normCfop(c)).filter(c => c));
  const usadosSaida = Array.from(usadosNorm).filter(c => eixoOperacao(c) === 'saida');
  const cobertos = usadosSaida.filter(c => c in CFOPS_SAIDA_RECEITA);
  const naoCobertos = usadosSaida.filter(c => !(c in CFOPS_SAIDA_RECEITA)).sort();
  const total = usadosSaida.length || 1;
  
  return {
    policy_version: 'v3.0',
    total_cfop_saida_encontrados: usadosSaida.length,
    cobertos_por_tabela: cobertos.length,
    percentual_coberto: parseFloat((cobertos.length / total).toFixed(4)),
    nao_cobertos: naoCobertos
  };
}
