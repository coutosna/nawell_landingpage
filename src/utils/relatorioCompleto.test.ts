import { describe, it, expect } from 'vitest';
import { parseEFD } from './efdParser';
import { calcularPeriodosPorMes, calcularPeriodosPorAno } from './relatorioCompleto';
import { EFD_TEXTO_COMPLETO } from '@/test/fixtures/efdTextoCompleto';

describe('relatorioCompleto - agregação por período', () => {
  const data = parseEFD(EFD_TEXTO_COMPLETO);

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
    // Risco estimado: multa 20% + juros
    expect(jun.multa).toBeCloseTo(2.86, 2);
    expect(jun.totalComplementar).toBeGreaterThan(17.1);
    expect(jun.totalComplementar).toBeLessThan(17.5);
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