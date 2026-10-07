import { describe, it, expect } from 'vitest';
import { parseEFD, analisarAlertas, RegimeInvalidoError } from './efdParser';
import { buscarAliquotaNCM } from './ncmTable';
import { detectarTodasOportunidades } from './detectarOportunidadesTributarias';

/** EFD-Contribuições mínima com uma venda; parâmetros mudam regime, NCM, CFOP, CST e alíquotas */
const montarEfd = (opts: {
  registro0110?: string | null;
  ncm?: string;
  cfop?: string;
  cst?: string;
  aliqPis?: string;
  aliqCofins?: string;
  vlPis?: string;
  vlCofins?: string;
}) => {
  const {
    registro0110 = '|0110|1|2|0|0|',
    ncm = '33049996',
    cfop = '5102',
    cst = '01',
    aliqPis = '2,20',
    aliqCofins = '10,30',
    vlPis = '22,00',
    vlCofins = '103,00',
  } = opts;
  return [
    '|0000|017|0|||01062026|30062026|EMPRESA TESTE LTDA|12345678000199|SP|3550308||00|0|',
    registro0110,
    `|0200|P01|Produto teste|||UN|00|${ncm}||32||18|`,
    '|C001|0|',
    `|C100|1|0|CLI|55|00|1|1000|CHV0001|15062026|15062026|1000,00|0|0,00|0,00|1000,00|0|0,00|0,00|0,00|1000,00|180,00|0,00|0,00|0,00|${vlPis}|${vlCofins}|0,00|0,00|`,
    `|C170|1|P01|Produto teste|1,00|UN|1000,00|0,00|0|000|${cfop}|${ncm}|1000,00|18,00|180,00|0,00|0,00|0,00|0|99||0,00|0,00|0,00|${cst}|1000,00|${aliqPis}|||${vlPis}|${cst}|1000,00|${aliqCofins}|||${vlCofins}||0,00|`,
    '|C990|3|',
    '|M001|0|',
    '|M210|01|1000,00|1000,00|0|0|1000,00|1,65|||16,50|0|0|0|0|16,50|',
    '|9999|9|',
  ]
    .filter(Boolean)
    .join('\n');
};

describe('R3 — registro 0110 obrigatório', () => {
  it('recusa EFD-Contribuições sem 0110', () => {
    expect(() => parseEFD(montarEfd({ registro0110: null }))).toThrow(RegimeInvalidoError);
  });

  it('recusa código de incidência fora de 1, 2 e 3', () => {
    expect(() => parseEFD(montarEfd({ registro0110: '|0110|4|2|0|0|' }))).toThrow(/código de incidência inválido/);
  });

  it('aceita os códigos 1, 2 e 3', () => {
    ['1', '2', '3'].forEach(codigo => {
      expect(() => parseEFD(montarEfd({ registro0110: `|0110|${codigo}|2|0|0|` }))).not.toThrow();
    });
  });
});

describe('R12 — tabela NCM cobre 33.03 a 33.07', () => {
  it('higiene bucal (33.06) recebe a alíquota de perfumaria', () => {
    const aliq = buscarAliquotaNCM('33061000');
    expect(aliq?.aliquotaPIS).toBe(2.2);
    expect(aliq?.aliquotaCOFINS).toBe(10.3);
    expect(aliq?.monofasico).toBe(true);
  });
});

describe('R22 — monofásico só é recuperável na revenda', () => {
  it('revenda (5102) de monofásico tributada vira oportunidade de recuperação', () => {
    const ops = detectarTodasOportunidades(parseEFD(montarEfd({ cfop: '5102' })));
    const mono = ops.filter(o => o.tipo === 'MONOFASICO_INCORRETO');
    expect(mono).toHaveLength(1);
    expect(mono[0].impactoFinanceiro).toBeCloseTo(125, 2);
  });

  it('venda de produção própria (5101) não é apontada: o industrial deve a alíquota concentrada', () => {
    const ops = detectarTodasOportunidades(parseEFD(montarEfd({ cfop: '5101' })));
    expect(ops.filter(o => o.tipo === 'MONOFASICO_INCORRETO')).toHaveLength(0);
  });

  it('revendedor de monofásico não tem devido pela alíquota concentrada', () => {
    const data = parseEFD(montarEfd({ cfop: '5102', aliqPis: '1,65', aliqCofins: '7,60', vlPis: '16,50', vlCofins: '76,00' }));
    expect(data.resumo.pisDevido).toBe(0);
    expect(data.riscoFiscal.itens).toHaveLength(0);
  });

  it('industrial que destaca a alíquota básica em monofásico continua com risco', () => {
    const data = parseEFD(montarEfd({ cfop: '5101', aliqPis: '1,65', aliqCofins: '7,60', vlPis: '16,50', vlCofins: '76,00' }));
    expect(data.riscoFiscal.itens).toHaveLength(1);
    expect(data.riscoFiscal.totalPrincipal).toBeCloseTo(32.5, 2);
  });
});

describe('R23 — CST 01/02 é normal no não cumulativo', () => {
  it('não gera inconsistência de CST para saída tributada com CST 01', () => {
    const ops = detectarTodasOportunidades(parseEFD(montarEfd({ ncm: '84713012', cfop: '5101', aliqPis: '1,65', aliqCofins: '7,60', vlPis: '16,50', vlCofins: '76,00' })));
    expect(ops.filter(o => o.tipo === 'INCONSISTENCIA_CST')).toHaveLength(0);
  });
});

describe('R11 — alíquota do C170 divergente do regime fica registrada', () => {
  it('alerta (sem impacto) quando o C170 usa alíquota diferente do regime e o NCM não está na tabela', () => {
    const data = parseEFD(montarEfd({ ncm: '84713012', cfop: '5101', aliqPis: '0,65', aliqCofins: '3,00', vlPis: '6,50', vlCofins: '30,00' }));
    const g2 = analisarAlertas(data).filter(a => a.grupo === 'G2');
    expect(g2).toHaveLength(1);
    expect(g2[0].detalhes.impacto).toBe(0);
  });

  it('regime misto aceita os dois pares de alíquota sem alerta', () => {
    const data = parseEFD(montarEfd({ registro0110: '|0110|3|2|0|0|', ncm: '84713012', cfop: '5101', aliqPis: '0,65', aliqCofins: '3,00', vlPis: '6,50', vlCofins: '30,00' }));
    expect(analisarAlertas(data).filter(a => a.grupo === 'G2')).toHaveLength(0);
  });

  it('sem alerta quando o C170 usa a alíquota do regime', () => {
    const data = parseEFD(montarEfd({ ncm: '84713012', cfop: '5101', aliqPis: '1,65', aliqCofins: '7,60', vlPis: '16,50', vlCofins: '76,00' }));
    expect(analisarAlertas(data).filter(a => a.grupo === 'G2')).toHaveLength(0);
  });
});
