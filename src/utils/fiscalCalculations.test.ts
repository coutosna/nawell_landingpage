import { describe, it, expect } from 'vitest';
import {
  calcularDataVencimento,
  calcularMultaMora,
  calcularMultaOficio,
  calcularJurosSELIC,
  feriadosNacionais,
  selicDisponivelAte,
  selicDesatualizada,
} from './fiscalCalculations';

describe('vencimento de PIS/COFINS (R16)', () => {
  it('vence no dia 25 do mês seguinte quando é dia útil', () => {
    expect(calcularDataVencimento('15/08/2026')).toBe('2026-09-25');
  });

  it('antecipa para sexta quando o dia 25 cai no sábado', () => {
    expect(calcularDataVencimento('15/06/2026')).toBe('2026-07-24');
  });

  it('antecipa quando o dia 25 é Natal', () => {
    expect(calcularDataVencimento('10/11/2026')).toBe('2026-12-24');
  });

  it('antecipa sobre segunda e terça de Carnaval', () => {
    // 25/02/2020 foi terça de Carnaval e 24/02 a segunda
    expect(calcularDataVencimento('31/01/2020')).toBe('2020-02-21');
  });

  it('vira o ano: competência de dezembro vence em janeiro', () => {
    expect(calcularDataVencimento('31/12/2025')).toBe('2026-01-23');
  });

  it('inclui Consciência Negra só a partir de 2024', () => {
    expect(feriadosNacionais(2023).has('2023-11-20')).toBe(false);
    expect(feriadosNacionais(2024).has('2024-11-20')).toBe(true);
  });
});

describe('multa (R17)', () => {
  it('mora de 0,33% por dia de atraso', () => {
    expect(calcularMultaMora(1000, '2026-07-24', new Date(2026, 7, 3))).toBeCloseTo(33, 2);
  });

  it('mora limitada a 20%', () => {
    expect(calcularMultaMora(1000, '2026-07-24', new Date(2026, 9, 7))).toBe(200);
  });

  it('sem mora quando pago até o vencimento', () => {
    expect(calcularMultaMora(1000, '2026-07-24', new Date(2026, 6, 24))).toBe(0);
  });

  it('ofício de 75% sobre o principal', () => {
    expect(calcularMultaOficio(1000)).toBe(750);
  });
});

describe('juros Selic (R18)', () => {
  it('sem juros quando pago no próprio mês do vencimento', () => {
    expect(calcularJurosSELIC(1000, '2026-07-24', new Date(2026, 6, 30))).toBe(0);
  });

  it('apenas 1% quando pago no mês seguinte ao vencimento', () => {
    expect(calcularJurosSELIC(1000, '2026-07-24', new Date(2026, 7, 10))).toBe(10);
  });

  it('soma a Selic mensal dos meses intermediários + 1%', () => {
    // ago/2026 1,09% + set/2026 1,08% + 1% = 3,17%
    expect(calcularJurosSELIC(1000, '2026-07-24', new Date(2026, 9, 7))).toBeCloseTo(31.7, 2);
  });

  it('usa a última taxa conhecida para meses ainda sem Selic publicada', () => {
    const [ano, mes] = selicDisponivelAte.split('-').map(Number);
    const vencimento = `${ano}-${String(mes).padStart(2, '0')}-20`;
    // Pagamento três meses depois: dois meses sem taxa publicada + 1%
    const juros = calcularJurosSELIC(1000, vencimento, new Date(ano, mes + 2, 5));
    expect(juros).toBeGreaterThan(10);
  });
});

describe('aviso de Selic desatualizada', () => {
  it('não avisa no mês seguinte ao último publicado e avisa três meses depois', () => {
    const [ano, mes] = selicDisponivelAte.split('-').map(Number);
    expect(selicDesatualizada(new Date(ano, mes, 10))).toBe(false);
    expect(selicDesatualizada(new Date(ano, mes + 2, 10))).toBe(true);
  });
});
