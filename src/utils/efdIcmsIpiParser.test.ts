import { describe, expect, it } from 'vitest';
import { parseEFDIcmsIpi, conferirApuracao } from './efdIcmsIpiParser';

/**
 * Números do arquivo real de nov/2025 (Casa Granado): o saldo do E110 e do
 * E520 fecha exatamente com o declarado. Se esta suíte quebrar, a leitura
 * deixou de reproduzir o que o arquivo declara.
 */
const APURACAO = [
  '|0000|019|0|01112025|30112025|CASA GRANADO LABORATORIOS FARMACIAS E DROGARIAS S A|33109356000460||RJ|3304557|||A|0|',
  '|E100|01112025|30112025|',
  '|E110|1665851,34|2972791,2|0|0|4535891,85|0|193457,68|0|83772,77|0|0|0|174479,76|1200556,6|',
  '|E111|RJ020004|ICMS-ST Energia Elétrica NF 319153 LIGHT|107895,16||',
  '|E111|RJ020002|ICMS-ST Energia Elétrica|22535,36||',
  '|E111|RJ028001|Ajuste de crédito|59001,74||',
  '|E111|RJ020029|Outro ajuste|4025,42||',
  '|E111|RJ050019|FECP diferencial de alíquotas|1139947,65||',
  '|E115|RJ802231|0||',
  '|E115|RJ818221|0||',
  '|E115|RJ802164|0||',
  '|E115|RJ821231|0||',
  '|E116|090|51700,25|10122025|0272||||ICMS a Recolher Dif. Alíquota|112025|',
  '|E116|090|8908,7|10122025|7501||||Imposto a Recolher - FECP|112025|',
  '|E116|090|1139947,65|20122025|0744|||||112025|',
  '|E500|0|01112025|30112025|',
  '|E510|5101|50|8000000,00|6000000,00|4789804,91|',
  '|E510|1101|00|4000000,00|3000000,00|2459211,67|',
  '|E520|0|4789804,91|2459211,67|11832,08|0|0|2342425,32|',
  '|E530|0|11832,08|199|9|||IPI Dev Compras 11/2025|',
  '|9999|27|',
].join('\n');

describe('parser da EFD ICMS/IPI (bloco E)', () => {
  const dados = parseEFDIcmsIpi(APURACAO);

  it('identifica o leiaute e lê o cadastro', () => {
    expect(dados.leiaute).toBe('efd-icms-ipi');
    expect(dados.cadastro.cnpj).toBe('33109356000460');
    expect(dados.cadastro.razaoSocial).toContain('CASA GRANADO');
    expect(dados.cadastro.uf).toBe('RJ');
    expect(dados.cadastro.periodoInicial).toBe('01112025');
    expect(dados.cadastro.periodoFinal).toBe('30112025');
  });

  it('lê o fechamento do ICMS (E110) e recalcula o saldo', () => {
    const e110 = dados.apuracaoIcms.e110!;
    expect(e110.vlTotDebito).toBeCloseTo(1665851.34, 2);
    expect(e110.vlAjusDebitoOs).toBeCloseTo(2972791.2, 2);
    expect(e110.vlTotCredito).toBeCloseTo(4535891.85, 2);
    expect(e110.vlTotAjusCredito).toBeCloseTo(193457.68, 2);
    expect(e110.vlSldCredorAnt).toBeCloseTo(83772.77, 2);
    expect(e110.debEsp).toBeCloseTo(1200556.6, 2);
    expect(e110.debitos).toBeCloseTo(4638642.54, 2);
    expect(e110.creditos).toBeCloseTo(4813122.3, 2);
    expect(e110.saldoRecalculado).toBeCloseTo(-174479.76, 2);
  });

  it('lê ajustes, informações adicionais e obrigações a recolher', () => {
    expect(dados.apuracaoIcms.e111).toHaveLength(5);
    expect(dados.apuracaoIcms.e111[0]).toMatchObject({ codigo: 'RJ020004', valor: 107895.16 });
    expect(dados.apuracaoIcms.e115).toHaveLength(4);
    expect(dados.apuracaoIcms.e116).toHaveLength(3);
    expect(dados.apuracaoIcms.e116[0]).toMatchObject({ codigo: '090', valor: 51700.25, data: '10/12/2025', competencia: '112025' });
  });

  it('lê o fechamento do IPI (E520) e recalcula o saldo', () => {
    const e520 = dados.apuracaoIpi.e520!;
    expect(dados.apuracaoIpi.indApur).toBe('0');
    expect(e520.vlDebIpi).toBeCloseTo(4789804.91, 2);
    expect(e520.vlCredIpi).toBeCloseTo(2459211.67, 2);
    expect(e520.vlOdIpi).toBeCloseTo(11832.08, 2);
    expect(e520.vlSdIpi).toBeCloseTo(2342425.32, 2);
    expect(e520.saldoRecalculado).toBeCloseTo(2342425.32, 2);
    expect(e520.saldoDeclarado).toBeCloseTo(2342425.32, 2);
  });

  it('lê a consolidação por CFOP (E510) e os ajustes (E530)', () => {
    expect(dados.apuracaoIpi.e510).toHaveLength(2);
    expect(dados.apuracaoIpi.e510.find(l => l.cfop === '5101')!.vlIpi).toBeCloseTo(4789804.91, 2);
    expect(dados.apuracaoIpi.e530).toHaveLength(1);
    expect(dados.apuracaoIpi.e530[0]).toMatchObject({ codigo: '199', valor: 11832.08 });
  });

  it('conclui que o fechamento confere quando os saldos casam', () => {
    expect(dados.conferencias.map(c => c.id).sort()).toEqual([
      'icms-e110',
      'ipi-e510-x-e520',
      'ipi-e520',
    ]);
    for (const c of dados.conferencias) {
      expect(c.fechou).toBe(true);
      expect(c.diferenca).toBeLessThanOrEqual(0.02);
    }
  });

  it('marca inconsistência quando o saldo do ICMS diverge', () => {
    const comErro = parseEFDIcmsIpi(APURACAO.replace('174479,76|1200556,6', '0|1200556,6'));
    const conferencia = comErro.conferencias.find(c => c.id === 'icms-e110')!;
    expect(conferencia.fechou).toBe(false);
    expect(conferencia.diferenca).toBeCloseTo(174479.76, 2);
  });

  it('marca inconsistência quando a consolidação do IPI não fecha com o E520', () => {
    const comErro = parseEFDIcmsIpi(APURACAO.replace('2459211,67|', '2459210,00|'));
    const conferencia = comErro.conferencias.find(c => c.id === 'ipi-e510-x-e520')!;
    expect(conferencia.fechou).toBe(false);
    expect(conferencia.diferenca).toBeCloseTo(1.67, 2);
  });
});

describe('conferirApuracao com dados vazios', () => {
  it('retorna lista vazia sem E110 nem E520', () => {
    expect(conferirApuracao(
      { periodoInicio: '', periodoFim: '', e110: null, e111: [], e115: [], e116: [] },
      { indApur: '', periodoInicio: '', periodoFim: '', e520: null, e510: [], e530: [] },
    )).toEqual([]);
  });
});