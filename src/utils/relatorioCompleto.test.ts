import { describe, it, expect, vi, afterAll } from 'vitest';
import { parseEFD } from './efdParser';
import { calcularPeriodosPorMes, calcularPeriodosPorAno } from './relatorioCompleto';
import { EFD_TEXTO_COMPLETO } from '@/test/fixtures/efdTextoCompleto';

describe('relatorioCompleto - agregação por período', () => {
  // Juros e multa dependem da data de referência: fixa em 07/10/2026
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 7));
  const data = parseEFD(EFD_TEXTO_COMPLETO);
  afterAll(() => vi.useRealTimers());

  it('receita por mês inclui somente saídas (6.860,00 em junho/2026)', () => {
    const mensal = calcularPeriodosPorMes(data);
    expect(mensal).toHaveLength(1);
    const jun = mensal[0];
    expect(jun.label).toBe('Junho/2026');
    expect(jun.receita).toBeCloseTo(6860, 2);
    expect(jun.qtdVendas).toBe(3);
    // Compra do insumo (6.000) não entra na receita
    expect(jun.receita).not.toBeCloseTo(12860, 2);
  });

  it('divergência por mês reflete apenas o fármaco P02 (2,34 PIS / 11,96 COFINS)', () => {
    const mensal = calcularPeriodosPorMes(data);
    const jun = mensal[0];
    expect(jun.pisDiferenca).toBeCloseTo(2.34, 2);
    expect(jun.cofinsDiferenca).toBeCloseTo(11.96, 2);
    // Informado: P01 66,00 + P02 8,58 + P03 51,48 = 126,06 (PIS)
    //            P01 304,00 + P02 39,52 + P03 241,02 = 584,54 (COFINS)
    expect(jun.pisInformado).toBeCloseTo(126.06, 2);
    expect(jun.cofinsInformado).toBeCloseTo(584.54, 2);
    // Vence 24/07/2026 (25 é sábado): 75 dias de atraso → mora de 20%
    expect(jun.multa).toBeCloseTo(2.86, 2);
    // Juros: Selic ago/2026 1,09% + set/2026 1,08% + 1% do mês do pagamento = 3,17%
    expect(jun.juros).toBeCloseTo(0.45, 2);
    expect(jun.totalComplementar).toBeCloseTo(17.61, 2);
  });

  it('agregação anual é a soma das linhas mensais', () => {
    const mensal = calcularPeriodosPorMes(data);
    const anual = calcularPeriodosPorAno(data);
    expect(anual).toHaveLength(1);
    expect(anual[0].receita).toBeCloseTo(6860, 2);
    expect(anual[0].pisInformado).toBeCloseTo(mensal[0].pisInformado, 2);
    expect(anual[0].cofinsInformado).toBeCloseTo(mensal[0].cofinsInformado, 2);
    expect(anual[0].pisDiferenca).toBeCloseTo(mensal[0].pisDiferenca, 2);
    expect(anual[0].cofinsDiferenca).toBeCloseTo(mensal[0].cofinsDiferenca, 2);
  });
});