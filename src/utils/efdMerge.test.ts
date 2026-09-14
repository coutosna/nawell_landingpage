import { describe, expect, it } from 'vitest';
import { parseEFD } from './efdParser';
import { mergeEFDData, mergeEFDContents } from './efdMerge';

/**
 * Cria conteúdo fiscal com período e apuração customizados.
 * Dados baseados no arquivo real de nov/2025 — apenas período e valores
 * do E110/E116/E520 variam entre as "competências".
 */
const makeFiscal = (ini: string, fin: string, e110Recolher: number, e116Valor: number) => [
  '|0000|019|0|' + ini + '|' + fin + '|EMPRESA TESTE|33109356000460||RJ|3304557|||A|0|',
  '|E100|' + ini + '|' + fin + '|',
  '|E110|10000,00|0|0|0|5000,00|0|0|0|0|0|0|' + e110Recolher.toFixed(2).replace('.', ',') + '|0|0|',
  '|E111|RJ020004|Ajuste teste|5000,00||',
  '|E116|090|' + e116Valor.toFixed(2).replace('.', ',') + '|10022025|0272||||ICMS Recolher|' + ini.substring(2, 6) + '|',
  '|E500|0|' + ini + '|' + fin + '|',
  '|E510|5101|50|100000,00|50000,00|3000,00|',
  '|E520|0|3000,00|1500,00|0|0|0|1500,00|',
  '|9999|9|',
].join('\n');

describe('mergeEFDData para SPED Fiscal (efd-icms-ipi)', () => {
  const janeiro = { ...parseEFD(makeFiscal('01012025', '31012025', 2500, 12500)), fontes: { arquivos: ['jan-2025.txt'], quantidade: 1 } };
  const fevereiro = { ...parseEFD(makeFiscal('01022025', '28022025', 3200, 800)), fontes: { arquivos: ['fev-2025.txt'], quantidade: 1 } };
  const consolidado = mergeEFDData([janeiro, fevereiro]);

  it('identifica leiaute fiscal e união de períodos', () => {
    expect(consolidado.leiaute).toBe('efd-icms-ipi');
    expect(consolidado.cadastro.periodoInicial).toBe('01012025');
    expect(consolidado.cadastro.periodoFinal).toBe('28022025');
  });

  it('soma os valores do E110 (apuração ICMS)', () => {
    const e110 = consolidado.icmsIpi?.apuracaoIcms.e110;
    expect(e110).not.toBeNull();
    expect(e110!.vlIcmsRecolher).toBeCloseTo(5700, 2);
    expect(e110!.vlTotDebito).toBeCloseTo(20000, 2);
    expect(e110!.vlTotCredito).toBeCloseTo(10000, 2);
  });

  it('concatena obrigações E116 mês a mês', () => {
    const e116 = consolidado.icmsIpi?.apuracaoIcms.e116 ?? [];
    expect(e116).toHaveLength(2);
    expect(e116[0].valor).toBeCloseTo(12500, 2);
    expect(e116[1].valor).toBeCloseTo(800, 2);
  });

  it('concatena conferências preservando uma de cada tipo por arquivo', () => {
    const conferencias = consolidado.icmsIpi?.conferencias ?? [];
    expect(conferencias.length).toBe(6);
    const ids = conferencias.map((c) => c.id);
    expect(ids.filter((id) => id === 'icms-e110')).toHaveLength(2);
    expect(ids.filter((id) => id === 'ipi-e520')).toHaveLength(2);
  });

  it('soma os valores do E520 (apuração IPI)', () => {
    const e520 = consolidado.icmsIpi?.apuracaoIpi.e520;
    expect(e520).not.toBeNull();
    expect(e520!.vlDebIpi).toBeCloseTo(6000, 2);
    expect(e520!.vlCredIpi).toBeCloseTo(3000, 2);
  });

  it('preserva fontes dos dois arquivos', () => {
    expect(consolidado.fontes?.arquivos).toHaveLength(2);
    expect(consolidado.fontes?.quantidade).toBe(2);
  });
});

describe('mergeEFDContents', () => {
  it('junta textos preservando a ordem', () => {
    expect(mergeEFDContents(['Linha1', 'Linha2'])).toBe('Linha1\nLinha2');
  });
});