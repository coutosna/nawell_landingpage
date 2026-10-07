import { describe, it, expect } from 'vitest';
import { parseEFD, analisarAlertas, apurarDevidoItem } from './efdParser';
import { buscarAliquotaNCM, classificarNCM, buscarAliquotaPorUnidade } from './ncmTable';
import { detectarTodasOportunidades } from './detectarOportunidadesTributarias';
import { analisarCreditosPorNatureza } from './creditosPorNatureza';

const CAB = [
  '|0000|017|0|||01062026|30062026|EMPRESA TESTE LTDA|12345678000199|SP|3550308||00|0|',
];

/** C100 de saída: VL_DOC=12, VL_ICMS=22, VL_ICMS_ST=24, VL_IPI=25 */
const c100 = (o: { indOper?: string; chave: string; vlDoc: string; icms?: string; icmsSt?: string; ipi?: string }) =>
  `|C100|${o.indOper ?? '1'}|0|CLI|55|00|1|${o.chave}|${o.chave}|15062026|15062026|${o.vlDoc}|0|0,00|0,00|${o.vlDoc}|0|0,00|0,00|0,00|${o.vlDoc}|${o.icms ?? '0,00'}|0,00|${o.icmsSt ?? '0,00'}|${o.ipi ?? '0,00'}|0,00|0,00|0,00|0,00|`;

/** C170 com campos de PIS (25–30) e COFINS (31–36), inclusive quantidade e alíquota por unidade */
const c170 = (o: {
  item: string; cfop: string; valor: string; cst: string;
  aliqPis?: string; vlPis?: string; aliqCofins?: string; vlCofins?: string;
  qtd?: string; aliqPisQuant?: string; aliqCofinsQuant?: string;
}) =>
  `|C170|1|${o.item}|Item|1,00|UN|${o.valor}|0,00|0|000|${o.cfop}||${o.valor}|18,00|0,00|0,00|0,00|0,00|0|99||0,00|0,00|0,00|` +
  `${o.cst}|${o.valor}|${o.aliqPis ?? ''}|${o.qtd ?? ''}|${o.aliqPisQuant ?? ''}|${o.vlPis ?? '0,00'}|` +
  `${o.cst}|${o.valor}|${o.aliqCofins ?? ''}|${o.qtd ?? ''}|${o.aliqCofinsQuant ?? ''}|${o.vlCofins ?? '0,00'}||0,00|`;

const efd = (regime: string, linhas: string[]) =>
  [...CAB, `|0110|${regime}|2|0|0|`, ...linhas, '|9999|1|'].join('\n');

const produto = (codigo: string, ncm: string) => `|0200|${codigo}|Produto ${codigo}|||UN|00|${ncm}||32||18|`;

describe('R6 — receita do bloco C sem IPI e ICMS-ST', () => {
  it('desconta IPI e ICMS-ST do VL_DOC e registra o ICMS próprio como exclusão', () => {
    const data = parseEFD(efd('1', [
      produto('P1', '84713012'),
      c100({ chave: 'N1', vlDoc: '1130,00', icms: '180,00', icmsSt: '30,00', ipi: '100,00' }),
      c170({ item: 'P1', cfop: '5101', valor: '1000,00', cst: '01', aliqPis: '1,65', vlPis: '16,50', aliqCofins: '7,60', vlCofins: '76,00' }),
    ]));
    expect(data.receitaDocumental.blocoC).toBeCloseTo(1000, 2);
    expect(data.receitaDocumental.exclusoes).toEqual({ ipi: 100, icmsSt: 30, icmsProprio: 180 });
  });
});

describe('R4/R8 — bloco F completo', () => {
  it('F100 com IND_OPER 2 (sem incidência) entra na receita bruta', () => {
    const data = parseEFD(efd('1', [
      '|F100|2|C001||20062026|500,00|06|500,00|0|0|06|500,00|0|0|||3100||Receita alíquota zero|',
      '|F100|1|C001||20062026|300,00|01|300,00|1,65|4,95|01|300,00|7,60|22,80|||3100||Receita tributada|',
      '|F100|0|C001||20062026|999,00|50|999,00|1,65|16,48|50|999,00|7,60|75,92|||3100||Aquisição|',
    ]));
    expect(data.receitaDocumental.blocoF).toBeCloseTo(800, 2);
    expect(data.receitaDocumental.naoTributadaF100).toBeCloseTo(500, 2);
  });

  it('F500 e F550 (lucro presumido consolidado) entram na receita', () => {
    const data = parseEFD(efd('2', [
      '|F500|1200,00|01|0|1200,00|0,65|7,80|01|0|1200,00|3,00|36,00|55|5102||Caixa|',
      '|F550|800,00|01|0|800,00|0,65|5,20|01|0|800,00|3,00|24,00|55|5102||Competência|',
    ]));
    expect(data.receitaDocumental.blocoF).toBeCloseTo(2000, 2);
  });
});

describe('Reconciliação inclui M400/M800 (receita não tributada)', () => {
  it('não alerta quando documentos = M210 + M400', () => {
    const data = parseEFD(efd('1', [
      '|F100|1|C001||20062026|1000,00|01|1000,00|1,65|16,50|01|1000,00|7,60|76,00|||3100||Tributada|',
      '|F100|2|C001||20062026|500,00|06|500,00|0|0|06|500,00|0|0|||3100||Alíquota zero|',
      '|M210|01|1000,00|1000,00|0|0|1000,00|1,65|||16,50|0|0|0|0|16,50|',
      '|M400|06|500,00||Alíquota zero|',
      '|M610|01|1000,00|1000,00|0|0|1000,00|7,60|||76,00|0|0|0|0|76,00|',
      '|M800|06|500,00||Alíquota zero|',
    ]));
    expect(data.receitaApurada.pisM400).toBeCloseTo(500, 2);
    expect(analisarAlertas(data).filter(a => a.grupo === 'G3')).toHaveLength(0);
  });
});

describe('R14 — CST 03 calculado por unidade de medida', () => {
  it('devido = quantidade × alíquota em reais, não percentual sobre o valor', () => {
    const venda = {
      ncm: '27101259', data: '15/06/2026', cfop: '5652', valor: 10000, pisCst: '03', cofinsCst: '03',
      pisAliquota: 0, cofinsAliquota: 0, pisValor: 1411, cofinsValor: 6514,
      pisQuantidadeBase: 10, pisAliquotaQuant: 141.1, cofinsQuantidadeBase: 10, cofinsAliquotaQuant: 651.4,
    };
    const devido = apurarDevidoItem(venda, { codigo: '1', descricao: 'Não Cumulativo', pisAliquota: 1.65, cofinsAliquota: 7.6 });
    expect(devido.origem).toBe('unidade');
    expect(devido.pisDevido).toBeCloseTo(1411, 2);
    expect(devido.cofinsDevido).toBeCloseTo(6514, 2);
  });

  it('Tabela 4.3.11 traz a alíquota por unidade vigente da gasolina', () => {
    expect(buscarAliquotaPorUnidade('27101259', '15/06/2026')).toMatchObject({ aliquotaPIS: 141.1, unidade: 'Metro Cúbico' });
  });
});

describe('R2 — regime misto sem alíquota no item', () => {
  it('fica não avaliável: devido assume o informado em vez da alíquota não cumulativa', () => {
    const data = parseEFD(efd('3', [
      produto('P1', '84713012'),
      c100({ chave: 'N1', vlDoc: '1000,00' }),
      c170({ item: 'P1', cfop: '5101', valor: '1000,00', cst: '01', vlPis: '6,50', vlCofins: '30,00' }),
    ]));
    expect(data.resumo.itensNaoAvaliaveis).toBe(1);
    expect(data.resumo.pisDevido).toBeCloseTo(6.5, 2);
    expect(data.resumo.pisDiferenca).toBe(0);
  });
});

describe('R12/R13 — Tabela 4.3.10 oficial com vigência', () => {
  it('perfumaria vale desde 2009 (não 2015) e inclui 3401.11.90', () => {
    expect(buscarAliquotaNCM('33049990', '10/03/2012')?.aliquotaPIS).toBe(2.2);
    expect(buscarAliquotaNCM('34011190', '10/03/2026')?.aliquotaCOFINS).toBe(10.3);
  });

  it('operação anterior à vigência da tabela não recebe alíquota', () => {
    expect(buscarAliquotaNCM('33061000', '15/06/2008')).toBeNull();
  });

  it('NCM com alíquotas condicionadas (cerveja) é monofásico sem alíquota única', () => {
    const c = classificarNCM('22030000', '15/06/2026');
    expect(c.monofasico).toBe(true);
    expect(c.aliquota).toBeNull();
  });
});

describe('R20 — crédito básico separado do presumido', () => {
  const entrada = (cst: string, ncm: string) => efd('1', [
    produto('E1', ncm),
    c100({ indOper: '0', chave: 'E1', vlDoc: '1000,00' }),
    c170({ item: 'E1', cfop: '1102', valor: '1000,00', cst, aliqPis: '1,65', vlPis: '0,00', aliqCofins: '7,60', vlCofins: '0,00' }),
  ]);
  const creditos = (txt: string) => detectarTodasOportunidades(parseEFD(txt)).filter(o => o.tipo === 'CREDITO_NAO_APROVEITADO');

  it('CST 50 sem crédito escriturado vira oportunidade à alíquota cheia', () => {
    expect(creditos(entrada('50', '84713012'))[0]?.impactoFinanceiro).toBeCloseTo(92.5, 2);
  });

  it('CST 60 (presumido agroindustrial) não é recalculado com alíquota cheia', () => {
    expect(creditos(entrada('60', '84713012'))).toHaveLength(0);
  });

  it('entrada de monofásico não gera crédito potencial', () => {
    expect(creditos(entrada('50', '33049990'))).toHaveLength(0);
  });
});

describe('R22 — saídas de terceiros além de 5102/6102 ficam como suspeitas', () => {
  it('5405 com monofásico tributado vira auditoria sem valor no total', () => {
    const data = parseEFD(efd('1', [
      produto('P1', '33049990'),
      c100({ chave: 'N1', vlDoc: '1000,00' }),
      c170({ item: 'P1', cfop: '5405', valor: '1000,00', cst: '01', aliqPis: '2,20', vlPis: '22,00', aliqCofins: '10,30', vlCofins: '103,00' }),
    ]));
    const mono = detectarTodasOportunidades(data).filter(o => o.tipo === 'MONOFASICO_INCORRETO');
    expect(mono).toHaveLength(1);
    expect(mono[0].status).toBe('Auditoria');
    expect(mono[0].impactoFinanceiro).toBe(0);
    expect(data.riscoFiscal.itens).toHaveLength(0);
  });
});

describe('R25 — natureza do crédito: M105 × CFOP', () => {
  it('confronta a base declarada com a deduzida do C170 e alerta a divergência', () => {
    const data = parseEFD(efd('1', [
      produto('E1', '84713012'),
      c100({ indOper: '0', chave: 'E1', vlDoc: '1000,00' }),
      c170({ item: 'E1', cfop: '1102', valor: '1000,00', cst: '50', aliqPis: '1,65', vlPis: '16,50', aliqCofins: '7,60', vlCofins: '76,00' }),
      '|M105|01|50|1500,00|0,00|1500,00|1500,00|||',
      '|M505|01|50|1500,00|0,00|1500,00|1500,00|||',
    ]));
    const linha = analisarCreditosPorNatureza(data).linhas.find(l => l.natureza === '01');
    expect(linha?.baseDeclaradaPIS).toBeCloseTo(1500, 2);
    expect(linha?.baseDeduzidaC170).toBeCloseTo(1000, 2);
    expect(linha?.divergencia).toBeCloseTo(500, 2);
    expect(analisarAlertas(data).some(a => a.tipo === 'Natureza do crédito: M105 × CFOP')).toBe(true);
  });
});

describe('Tabela 4.3.13 — NCM de alíquota zero tributado', () => {
  it('gera alerta informativo sem impacto', () => {
    const data = parseEFD(efd('1', [
      produto('P1', '11010010'),
      c100({ chave: 'N1', vlDoc: '1000,00' }),
      c170({ item: 'P1', cfop: '5101', valor: '1000,00', cst: '01', aliqPis: '1,65', vlPis: '16,50', aliqCofins: '7,60', vlCofins: '76,00' }),
    ]));
    const alerta = analisarAlertas(data).find(a => a.tipo === 'NCM consta da Tabela 4.3.13 (alíquota zero)');
    expect(alerta?.detalhes.impacto).toBe(0);
  });
});
