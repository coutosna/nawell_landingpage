import { describe, it, expect } from 'vitest';
import { parseEFD, isCfopSaida, cstPermiteDebito, apuraDebitoPisCofins } from './efdParser';
import { EFD_TEXTO_COMPLETO } from '@/test/fixtures/efdTextoCompleto';

/**
 * Fixtures mínimas no layout EFD-Contribuições.
 * Valores conferidos à mão:
 *   - Venda 500,00 alíquota básica (regime não-cumulativo): PIS 500×1,65%=8,25 / COFINS 500×7,60%=38,00
 *   - Fármaco (NCM 3004/3005, Lei 10.147/2000): PIS 2,1% / COFINS 9,9%
 */

const fixtureVendaRegimeBasico = [
  '|0000|017|0|||01062026|30062026|EMPRESA TESTE LTDA|12345678000199|SP|3550308||00|0|',
  '|0110|1|2|0|0|',
  '|0200|P01|Notebook|||UN|00|84713012||32||18|',
  '|C001|0|',
  '|C100|1|0|CLI|55|00|1|1000|CHV0001|15062026|15062026|500,00|0|0,00|0,00|500,00|0|0,00|0,00|0,00|500,00|90,00|0,00|0,00|0,00|8,25|38,00|0,00|0,00|',
  '|C170|1|P01|Notebook|1,00|UN|500,00|0,00|0|000|5101|84713012|500,00|18,00|90,00|0,00|0,00|0,00|0|99||0,00|0,00|0,00|01|500,00|1,65|||8,25|01|500,00|7,60|||38,00||0,00|',
  '|C990|3|',
  '|9999|9|',
].join('\n');

const fixtureComEntrada = [
  '|0000|017|0|||01062026|30062026|EMPRESA TESTE LTDA|12345678000199|SP|3550308||00|0|',
  '|0110|1|2|0|0|',
  '|0200|P01|Notebook|||UN|00|84713012||32||18|',
  '|C001|0|',
  '|C100|1|0|CLI|55|00|1|1000|CHV0001|15062026|15062026|500,00|0|0,00|0,00|500,00|0|0,00|0,00|0,00|500,00|90,00|0,00|0,00|0,00|8,25|38,00|0,00|0,00|',
  '|C170|1|P01|Notebook|1,00|UN|500,00|0,00|0|000|5101|84713012|500,00|18,00|90,00|0,00|0,00|0,00|0|99||0,00|0,00|0,00|01|500,00|1,65|||8,25|01|500,00|7,60|||38,00||0,00|',
  '|C100|0|1|FOR|55|00|1|2000|CHV0002|05062026|05062026|1000,00|0|0,00|0,00|1000,00|0|0,00|0,00|0,00|1000,00|180,00|0,00|0,00|0,00|0,00|0,00|0,00|0,00|',
  '|C170|1|P01|Insumo|2,00|UN|1000,00|0,00|0|000|1102|84713012|1000,00|18,00|180,00|0,00|0,00|0,00|0|99||0,00|0,00|0,00|50|1000,00|1,65|||0,00|50|1000,00|7,60|||0,00||0,00|',
  '|C990|5|',
  '|9999|11|',
].join('\n');

const fixtureFarmacoDivergente = [
  '|0000|017|0|||01062026|30062026|EMPRESA TESTE LTDA|12345678000199|SP|3550308||00|0|',
  '|0110|1|2|0|0|',
  '|0200|P02|Xarope Infantil|||UN|00|30049015||32||18|',
  '|C001|0|',
  '|C100|1|0|CLI|55|00|1|1001|CHV1001|15062026|15062026|520,00|0|0,00|0,00|520,00|0|0,00|0,00|0,00|520,00|93,60|0,00|0,00|0,00|8,58|39,52|0,00|0,00|',
  '|C170|1|P02|Xarope Infantil|13,00|UN|520,00|0,00|0|000|5101|30049015|520,00|18,00|93,60|0,00|0,00|0,00|0|99||0,00|0,00|0,00|01|520,00|1,65|||8,58|01|520,00|7,60|||39,52||0,00|',
  '|C990|3|',
  '|9999|9|',
].join('\n');

const fixtureSemIncidencia = [
  '|0000|017|0|||01062026|30062026|EMPRESA TESTE LTDA|12345678000199|SP|3550308||00|0|',
  '|0110|1|2|0|0|',
  '|0200|P01|Notebook|||UN|00|84713012||32||18|',
  '|C001|0|',
  '|C100|1|0|CLI|55|00|1|1002|CHV1002|20062026|20062026|1000,00|0|0,00|0,00|1000,00|0|0,00|0,00|0,00|1000,00|0,00|0,00|0,00|0,00|0,00|0,00|0,00|',
  '|C170|1|P01|Notebook Export|2,00|UN|1000,00|0,00|0|000|7102|84713012|0,00|0,00|0,00|0,00|0,00|0,00|0|99||0,00|0,00|0,00|08|0,00|0,00|||0,00|08|0,00|0,00|||0,00||0,00|',
  '|C990|3|',
  '|9999|9|',
].join('\n');

describe('apuraDebitoPisCofins (regra de semântica)', () => {
  it('identifica saída com CST de débito', () => {
    expect(apuraDebitoPisCofins({ cfop: '5101', pisCst: '01', cofinsCst: '01' })).toBe(true);
  });

  it('exclui entrada (CFOP 1102)', () => {
    expect(apuraDebitoPisCofins({ cfop: '1102', pisCst: '50', cofinsCst: '50' })).toBe(false);
  });

  it('exclui exportação (CFOP 7102) mesmo com CST de débito', () => {
    expect(apuraDebitoPisCofins({ cfop: '7102', pisCst: '01', cofinsCst: '01' })).toBe(false);
  });

  it('exclui CST sem incidência (04, 06, 07, 08, 09)', () => {
    expect(cstPermiteDebito('01')).toBe(true);
    expect(cstPermiteDebito('08')).toBe(false);
    expect(apuraDebitoPisCofins({ cfop: '5101', pisCst: '08', cofinsCst: '08' })).toBe(false);
    expect(isCfopSaida('6101')).toBe(true);
    expect(isCfopSaida('1102')).toBe(false);
  });
});

describe('parseEFD - venda regime básico (valores conferidos à mão)', () => {
  const data = parseEFD(fixtureVendaRegimeBasico);

  it('extrai o item C170 corretamente', () => {
    expect(data.vendas).toHaveLength(1);
    const v = data.vendas[0];
    expect(v.produto).toBe('Notebook');
    expect(v.ncm).toBe('84713012');
    expect(v.cfop).toBe('5101');
    expect(v.pisCst).toBe('01');
    expect(v.cofinsCst).toBe('01');
    expect(v.pisAliquota).toBeCloseTo(1.65, 4);
    expect(v.cofinsAliquota).toBeCloseTo(7.6, 4);
    expect(v.pisValor).toBeCloseTo(8.25, 2);
    expect(v.cofinsValor).toBeCloseTo(38, 2);
    expect(v.data).toBe('15/06/2026');
  });

  it('calcula devido = informado (sem divergência, NCM fora da tabela)', () => {
    expect(data.resumo.totalVendas).toBeCloseTo(500, 2);
    expect(data.resumo.pisInformado).toBeCloseTo(8.25, 2);
    expect(data.resumo.pisDevido).toBeCloseTo(8.25, 2);
    expect(data.resumo.cofinsInformado).toBeCloseTo(38, 2);
    expect(data.resumo.cofinsDevido).toBeCloseTo(38, 2);
    expect(data.resumo.pisDiferenca).toBe(0);
    expect(data.resumo.cofinsDiferenca).toBe(0);
    expect(data.riscoFiscal.itens).toHaveLength(0);
  });

  it('não apura débito em operações de entrada (CST 50)', () => {
    const d2 = parseEFD(fixtureComEntrada);
    expect(d2.vendas).toHaveLength(2);
    const entrada = d2.vendas.find(v => v.cfop === '1102');
    expect(entrada).toBeTruthy();
    // Entrada não entra na receita de vendas
    expect(d2.resumo.totalVendas).toBeCloseTo(500, 2);
    expect(d2.resumo.pisInformado).toBeCloseTo(8.25, 2);
    expect(d2.resumo.cofinsInformado).toBeCloseTo(38, 2);
    // Receita documental do bloco C usa o VL_DOC do C100 (500), uma vez por documento
    expect(d2.receitaDocumental.blocoC).toBeCloseTo(500, 2);
    // Entrada com CST 50 não gera divergência de débito
    expect(d2.riscoFiscal.itens).toHaveLength(0);
  });
});

describe('parseEFD - fármaco com alíquota informada abaixo da NCM', () => {
  const data = parseEFD(fixtureFarmacoDivergente);

  it('gera divergência estimada somente pela diferença ad valorem do NCM', () => {
    // 520 × 2,1% = 10,92 (PIS devido) vs informado 8,58 → dif 2,34
    // 520 × 9,9% = 51,48 (COFINS devido) vs informado 39,52 → dif 11,96
    expect(data.resumo.pisDevido).toBeCloseTo(10.92, 2);
    expect(data.resumo.cofinsDevido).toBeCloseTo(51.48, 2);
    expect(data.resumo.pisInformado).toBeCloseTo(8.58, 2);
    expect(data.resumo.cofinsInformado).toBeCloseTo(39.52, 2);
    expect(data.resumo.pisDiferenca).toBeCloseTo(2.34, 2);
    expect(data.resumo.cofinsDiferenca).toBeCloseTo(11.96, 2);

    expect(data.riscoFiscal.itens).toHaveLength(1);
    const item = data.riscoFiscal.itens[0];
    expect(item.principalDiferenca).toBeCloseTo(14.3, 2);
    expect(item.multa).toBeCloseTo(2.86, 2); // 20% sobre o principal
    expect(item.jurosEstimado).toBeGreaterThanOrEqual(item.principalDiferenca * 0.01);
    expect(item.totalComMultaJuros).toBeCloseTo(item.principalDiferenca + item.multa + item.jurosEstimado, 2);
  });
});

describe('parseEFD - exportação com CST 08 não gera débito', () => {
  const data = parseEFD(fixtureSemIncidencia);

  it('conta a receita, mas não apura débito nem divergência', () => {
    expect(data.vendas).toHaveLength(1);
    expect(data.resumo.totalVendas).toBeCloseTo(1000, 2);
    expect(data.receitaDocumental.blocoC).toBeCloseTo(1000, 2);
    expect(data.resumo.pisInformado).toBe(0);
    expect(data.resumo.pisDevido).toBe(0);
    expect(data.resumo.pisDiferenca).toBe(0);
    expect(data.riscoFiscal.itens).toHaveLength(0);
  });
});

describe('parseEFD - documento completo (valores conferidos à mão)', () => {
  const data = parseEFD(EFD_TEXTO_COMPLETO);

  it('receita total de vendas soma apenas saídas (6.860,00)', () => {
    // Saídas: 4.000,00 (P01) + 520,00 (P02) + 2.340,00 (P03) = 6.860,00
    expect(data.resumo.totalVendas).toBeCloseTo(6860, 2);
  });

  it('a compra de insumo (CST 50 / CFOP 1102) não gera divergência de débito', () => {
    const itensDebito = data.riscoFiscal.itens.filter(i => i.baseCalculo === 6000);
    expect(itensDebito).toHaveLength(0);
  });

  it('reconcilia receita documental (17.610,00) com o bloco M (17.310,00)', () => {
    // A 8.000 + C 6.860 + D 950 + F 1.800 = 17.610
    expect(data.receitaDocumental.blocoA).toBeCloseTo(8000, 2);
    expect(data.receitaDocumental.blocoC).toBeCloseTo(6860, 2);
    expect(data.receitaDocumental.blocoD).toBeCloseTo(950, 2);
    expect(data.receitaDocumental.blocoF).toBeCloseTo(1800, 2);
    expect(data.receitaDocumental.total).toBeCloseTo(17610, 2);
    // Receita apurada vem do M210/M610 (VL_REC_BRT), somando por código de contribuição
    expect(data.receitaApurada.pisM210).toBeCloseTo(17310, 2);
    expect(data.receitaApurada.cofinsM610).toBeCloseTo(17310, 2);
    expect(data.apuracaoPIS.totalReceitas).toBeCloseTo(17310, 2);
    expect(data.apuracaoCOFINS.totalReceitas).toBeCloseTo(17310, 2);
  });

  it('M100/M500 alimentam crédito (VL_CRED, campo 08) e não receita', () => {
    expect(data.apuracaoPIS.creditos['101']).toBeCloseTo(99, 2);
    expect(data.apuracaoPIS.totalCreditos).toBeCloseTo(99, 2);
    expect(data.apuracaoCOFINS.creditos['101']).toBeCloseTo(456, 2);
    expect(data.apuracaoCOFINS.totalCreditos).toBeCloseTo(456, 2);
  });

  it('M200/M600 leem o total a recolher (campo 13), não só a parcela cumulativa', () => {
    expect(data.apuracaoPIS.saldoDevedor).toBeCloseTo(186.62, 2);
    expect(data.apuracaoCOFINS.saldoDevedor).toBeCloseTo(859.56, 2);
  });

  it('C191/C195 alimentam a compra com PIS e COFINS do campo 11', () => {
    expect(data.compras).toHaveLength(1);
    expect(data.compras[0].valor).toBeCloseTo(6000, 2);
    expect(data.compras[0].pisValor).toBeCloseTo(99, 2);
    expect(data.compras[0].cofinsValor).toBeCloseTo(456, 2);
    expect(data.resumo.totalCompras).toBeCloseTo(6000, 2);
  });

  it('identifica o arquivo como EFD-Contribuições', () => {
    expect(data.leiaute).toBe('efd-contribuicoes');
  });

  it('única divergência estimada: fármaco P02 na venda (14,30 de principal)', () => {
    // P02 (NCM 3004, Lei 10.147/2000): devido 2,1%/9,9% vs informado 1,65%/7,6%
    // PIS: 10,92 - 8,58 = 2,34 · COFINS: 51,48 - 39,52 = 11,96 · principal = 14,30
    const principal = data.riscoFiscal.totalPrincipal;
    expect(principal).toBeCloseTo(14.3, 2);
    expect(data.riscoFiscal.itens).toHaveLength(1);
    expect(data.riscoFiscal.totalMulta).toBeCloseTo(2.86, 2);
  });
});