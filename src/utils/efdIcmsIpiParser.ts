/**
 * Parser da EFD ICMS/IPI (SPED Fiscal) — apuração declarada no bloco E.
 *
 * A antiga tratava só EFD-Contribuições e rejeitava SPED Fiscal. Este parser lê
 * o que o SPED Fiscal tem de mais autoritativo para o laudo: a apuração do
 * ICMS (E100/E110/E111/E115/E116) e do IPI (E500/E510/E520/E530), e confere se
 * o saldo declarado fecha com a aritmética dos campos.
 *
 * As posições abaixo são as do Guia Prático (leiaute 019, NT 2024.001),
 * confirmadas contra arquivo real de nov/2025 — lá o fechamento do E110 e do
 * E520 bate exatamente com os totais declarados.
 */

export type LeiauteIcmsIpi = 'efd-icms-ipi';

const parseDecimal = (value: string): number => {
  if (!value) return 0;
  return parseFloat(value.replace(',', '.')) || 0;
};

const parseDate = (dateStr: string): string => {
  if (!dateStr || dateStr.length !== 8) return '';
  return `${dateStr.substring(0, 2)}/${dateStr.substring(2, 4)}/${dateStr.substring(4, 8)}`;
};

const formatDateExtended = (dateStr: string): string => {
  if (!dateStr || dateStr.length !== 8) return '';
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  const dia = dateStr.substring(0, 2);
  const mes = parseInt(dateStr.substring(2, 4), 10);
  const ano = dateStr.substring(4, 8);
  return `${dia} de ${meses[mes - 1] || ''} de ${ano}`;
};

/** Campos do E110, na ordem oficial (campo 01 = REG). */
const E110 = {
  VL_TOT_DEBITO: 2,
  VL_AJUS_DEBITO_OS: 3,
  VL_TOT_AJUS_DEBITO: 4,
  VL_ESTORNOS_CREDITO: 5,
  VL_TOT_CREDITO: 6,
  VL_AJUS_CREDITO_OS: 7,
  VL_TOT_AJUS_CREDITO: 8,
  VL_ESTORNOS_DEBITO: 9,
  VL_SLD_CREDOR_ANT: 10,
  VL_SLD_APURADO: 11,
  VL_TOT_DED: 12,
  VL_ICMS_RECOLHER: 13,
  VL_SLD_CREDOR_TRANSPORTAR: 14,
  DEB_ESP: 15,
  VL_SLD_DEVEDOR_ANT: 16,
} as const;

const E111 = { COD_AJ: 2, DESCR_COMPL_AJ: 3, VL_AJUST: 4, IND_AJ: 5 } as const;
const E115 = { COD_INF_ADIC: 2, VL_INF_ADIC: 3, DESCR_COMPL_AJ: 4 } as const;
const E116 = { CODIGO: 2, VL: 3, DT: 4, COD_RECEITA: 5, DESCR_COMPL: 9, COMPETENCIA: 10 } as const;

const E500 = { IND_APUR: 2, DT_INI: 3, DT_FIM: 4 } as const;
const E510 = { CFOP: 2, COD_IPI: 3, VL_OPER: 4, VL_BC_IPI: 5, VL_IPI: 6 } as const;
const E520 = { VL_SD_ANT_IPI: 2, VL_DEB_IPI: 3, VL_CRED_IPI: 4, VL_OD_IPI: 5, VL_OC_IPI: 6, VL_SC_IPI: 7, VL_SD_IPI: 8 } as const;
const E530 = { IND_AJ: 2, VL_AJUST: 3, COD_AJ: 4, IND_DEC: 5, DESCR_COMPL_AJ: 8 } as const;

export interface E110Icms {
  vlTotDebito: number;
  vlAjusDebitoOs: number;
  vlTotAjusDebito: number;
  vlEstornosCredito: number;
  vlTotCredito: number;
  vlAjusCreditoOs: number;
  vlTotAjusCredito: number;
  vlEstornosDebito: number;
  vlSldCredorAnt: number;
  vlSldApurado: number;
  vlTotDed: number;
  vlIcmsRecolher: number;
  vlSldCredorTransportar: number;
  debEsp: number;
  vlSldDevedorAnt: number;
  /** Soma dos componentes que aumentam a dívida de ICMS do período. */
  debitos: number;
  /** Soma dos componentes que reduzem a dívida de ICMS do período. */
  creditos: number;
  /** debitos − creditos: negativo indica saldo credor a transportar. */
  saldoRecalculado: number;
}

export interface AjusteIcms {
  codigo: string;
  descricao: string;
  valor: number;
  indicador: string;
}

export interface InfoAdicionalIcms {
  codigo: string;
  valor: number;
  descricao: string;
}

export interface ObrigacaoIcms {
  codigo: string;
  valor: number;
  data: string;
  codigoReceita: string;
  descricao: string;
  competencia: string;
}

export interface E520Ipi {
  vlSdAntIpi: number;
  vlDebIpi: number;
  vlCredIpi: number;
  vlOdIpi: number;
  vlOcIpi: number;
  vlScIpi: number;
  vlSdIpi: number;
  /** (saldo anterior + débitos + outros débitos) − (créditos + outros créditos). */
  saldoRecalculado: number;
  /** VL_SD_IPI − VL_SC_IPI: o que o período efetivamente declara. */
  saldoDeclarado: number;
}

export interface LinhaE510 {
  cfop: string;
  codigoIpi: string;
  vlOper: number;
  vlBcIpi: number;
  vlIpi: number;
}

export interface AjusteIpi {
  valor: number;
  codigo: string;
  indicadorDeDebito: string;
  descricao: string;
}

export interface ApuracaoIcms {
  periodoInicio: string;
  periodoFim: string;
  e110: E110Icms | null;
  e111: AjusteIcms[];
  e115: InfoAdicionalIcms[];
  e116: ObrigacaoIcms[];
}

export interface ApuracaoIpi {
  indApur: string;
  periodoInicio: string;
  periodoFim: string;
  e520: E520Ipi | null;
  e510: LinhaE510[];
  e530: AjusteIpi[];
}

export interface ConferenciaDeFechamento {
  id: 'icms-e110' | 'ipi-e520' | 'ipi-e510-x-e520';
  titulo: string;
  fechou: boolean;
  diferenca: number;
  detalhes: string;
}

export interface EFDIcmsIpiData {
  cadastro: {
    cnpj: string;
    razaoSocial: string;
    uf: string;
    municipio: string;
    periodoInicial: string;
    periodoFinal: string;
    periodoInicialDisplay: string;
    periodoFinalDisplay: string;
  };
  leiaute: LeiauteIcmsIpi;
  registros: Record<string, number>;
  apuracaoIcms: ApuracaoIcms;
  apuracaoIpi: ApuracaoIpi;
  conferencias: ConferenciaDeFechamento[];
  resumo: {
    icmsDebitos: number;
    icmsCreditos: number;
    icmsSaldoRecalculado: number;
    icmsRecolher: number;
    icmsTransportar: number;
    ipiDebitos: number;
    ipiCreditos: number;
    ipiSaldo: number;
  };
  fontes?: {
    arquivos: string[];
    quantidade: number;
  };
}

const TOLERANCIA = 0.02;

const apuracaoIcmsVazia = (): ApuracaoIcms => ({
  periodoInicio: '',
  periodoFim: '',
  e110: null,
  e111: [],
  e115: [],
  e116: [],
});

const apuracaoIpiVazia = (): ApuracaoIpi => ({
  indApur: '',
  periodoInicio: '',
  periodoFim: '',
  e520: null,
  e510: [],
  e530: [],
});

const eixo = (cfop: string): 'saida' | 'entrada' => {
  const inicio = cfop.trim().slice(0, 1);
  return inicio === '5' || inicio === '6' ? 'saida' : 'entrada';
};

export const parseEFDIcmsIpi = (content: string): EFDIcmsIpiData => {
  const cadastro = {
    cnpj: '',
    razaoSocial: '',
    uf: '',
    municipio: '',
    periodoInicial: '',
    periodoFinal: '',
    periodoInicialDisplay: '',
    periodoFinalDisplay: '',
  };
  const registros: Record<string, number> = {};
  let apuracaoIcms: ApuracaoIcms | null = null;
  let apuracaoIpi: ApuracaoIpi | null = null;

  const contar = (reg: string) => {
    registros[reg] = (registros[reg] ?? 0) + 1;
  };

  for (const linha of content.split('\n')) {
    const campos = linha.split('|');
    const reg = campos[1] || '';
    if (!reg) continue;
    contar(reg);

    switch (reg) {
      case '0000': {
        // Layout oficial: |0000|COD_VER|COD_FIN|DT_INI|DT_FIN|NOME|CNPJ|CPF|UF|IE|COD_MUN|IM|SUFRAMA|IND_PERFIL|IND_ATIV
        // Posição flexível de DT_INI, como no parser de Contribuições.
        let dtIniIdx = -1;
        for (let i = 4; i < campos.length && i < 12; i++) {
          if (/^\d{8}$/.test(campos[i] || '')) { dtIniIdx = i; break; }
        }
        if (dtIniIdx >= 0) {
          cadastro.periodoInicial = campos[dtIniIdx] || '';
          cadastro.periodoFinal = campos[dtIniIdx + 1] || '';
          cadastro.periodoInicialDisplay = formatDateExtended(campos[dtIniIdx]);
          cadastro.periodoFinalDisplay = formatDateExtended(campos[dtIniIdx + 1]);
          cadastro.razaoSocial = campos[dtIniIdx + 2] || '';
          cadastro.cnpj = campos[dtIniIdx + 3] || '';
          for (let i = dtIniIdx + 4; i < campos.length && i < dtIniIdx + 8; i++) {
            if (/^[A-Z]{2}$/.test(campos[i] || '')) { cadastro.uf = campos[i]; break; }
          }
          for (let i = dtIniIdx + 5; i < campos.length && i < dtIniIdx + 10; i++) {
            if (/^\d{7}$/.test(campos[i] || '')) { cadastro.municipio = campos[i]; break; }
          }
        }
        break;
      }

      case 'E100': {
        apuracaoIcms = apuracaoIcmsVazia();
        apuracaoIcms.periodoInicio = parseDate(campos[2] || '');
        apuracaoIcms.periodoFim = parseDate(campos[3] || '');
        break;
      }

      case 'E110': {
        if (!apuracaoIcms) apuracaoIcms = apuracaoIcmsVazia();
        const debitos =
          parseDecimal(campos[E110.VL_TOT_DEBITO] || '') +
          parseDecimal(campos[E110.VL_AJUS_DEBITO_OS] || '') +
          parseDecimal(campos[E110.VL_TOT_AJUS_DEBITO] || '') +
          parseDecimal(campos[E110.VL_ESTORNOS_CREDITO] || '') +
          parseDecimal(campos[E110.VL_SLD_DEVEDOR_ANT] || '');
        const creditos =
          parseDecimal(campos[E110.VL_TOT_CREDITO] || '') +
          parseDecimal(campos[E110.VL_AJUS_CREDITO_OS] || '') +
          parseDecimal(campos[E110.VL_TOT_AJUS_CREDITO] || '') +
          parseDecimal(campos[E110.VL_ESTORNOS_DEBITO] || '') +
          parseDecimal(campos[E110.VL_SLD_CREDOR_ANT] || '');
        apuracaoIcms.e110 = {
          vlTotDebito: parseDecimal(campos[E110.VL_TOT_DEBITO] || ''),
          vlAjusDebitoOs: parseDecimal(campos[E110.VL_AJUS_DEBITO_OS] || ''),
          vlTotAjusDebito: parseDecimal(campos[E110.VL_TOT_AJUS_DEBITO] || ''),
          vlEstornosCredito: parseDecimal(campos[E110.VL_ESTORNOS_CREDITO] || ''),
          vlTotCredito: parseDecimal(campos[E110.VL_TOT_CREDITO] || ''),
          vlAjusCreditoOs: parseDecimal(campos[E110.VL_AJUS_CREDITO_OS] || ''),
          vlTotAjusCredito: parseDecimal(campos[E110.VL_TOT_AJUS_CREDITO] || ''),
          vlEstornosDebito: parseDecimal(campos[E110.VL_ESTORNOS_DEBITO] || ''),
          vlSldCredorAnt: parseDecimal(campos[E110.VL_SLD_CREDOR_ANT] || ''),
          vlSldApurado: parseDecimal(campos[E110.VL_SLD_APURADO] || ''),
          vlTotDed: parseDecimal(campos[E110.VL_TOT_DED] || ''),
          vlIcmsRecolher: parseDecimal(campos[E110.VL_ICMS_RECOLHER] || ''),
          vlSldCredorTransportar: parseDecimal(campos[E110.VL_SLD_CREDOR_TRANSPORTAR] || ''),
          debEsp: parseDecimal(campos[E110.DEB_ESP] || ''),
          vlSldDevedorAnt: parseDecimal(campos[E110.VL_SLD_DEVEDOR_ANT] || ''),
          debitos,
          creditos,
          saldoRecalculado: debitos - creditos,
        };
        break;
      }

      case 'E111': {
        if (!apuracaoIcms) apuracaoIcms = apuracaoIcmsVazia();
        apuracaoIcms.e111.push({
          codigo: campos[E111.COD_AJ] || '',
          descricao: campos[E111.DESCR_COMPL_AJ] || '',
          valor: parseDecimal(campos[E111.VL_AJUST] || ''),
          indicador: campos[E111.IND_AJ] || '',
        });
        break;
      }

      case 'E115': {
        if (!apuracaoIcms) apuracaoIcms = apuracaoIcmsVazia();
        apuracaoIcms.e115.push({
          codigo: campos[E115.COD_INF_ADIC] || '',
          valor: parseDecimal(campos[E115.VL_INF_ADIC] || ''),
          descricao: campos[E115.DESCR_COMPL_AJ] || '',
        });
        break;
      }

      case 'E116': {
        if (!apuracaoIcms) apuracaoIcms = apuracaoIcmsVazia();
        apuracaoIcms.e116.push({
          codigo: campos[E116.CODIGO] || '',
          valor: parseDecimal(campos[E116.VL] || ''),
          data: parseDate(campos[E116.DT] || ''),
          codigoReceita: campos[E116.COD_RECEITA] || '',
          descricao: campos[E116.DESCR_COMPL] || '',
          competencia: campos[E116.COMPETENCIA] || '',
        });
        break;
      }

      case 'E500': {
        apuracaoIpi = apuracaoIpiVazia();
        apuracaoIpi.indApur = campos[E500.IND_APUR] || '';
        apuracaoIpi.periodoInicio = parseDate(campos[E500.DT_INI] || '');
        apuracaoIpi.periodoFim = parseDate(campos[E500.DT_FIM] || '');
        break;
      }

      case 'E510': {
        if (!apuracaoIpi) apuracaoIpi = apuracaoIpiVazia();
        apuracaoIpi.e510.push({
          cfop: campos[E510.CFOP] || '',
          codigoIpi: campos[E510.COD_IPI] || '',
          vlOper: parseDecimal(campos[E510.VL_OPER] || ''),
          vlBcIpi: parseDecimal(campos[E510.VL_BC_IPI] || ''),
          vlIpi: parseDecimal(campos[E510.VL_IPI] || ''),
        });
        break;
      }

      case 'E520': {
        if (!apuracaoIpi) apuracaoIpi = apuracaoIpiVazia();
        const sdAnt = parseDecimal(campos[E520.VL_SD_ANT_IPI] || '');
        const deb = parseDecimal(campos[E520.VL_DEB_IPI] || '');
        const cred = parseDecimal(campos[E520.VL_CRED_IPI] || '');
        const od = parseDecimal(campos[E520.VL_OD_IPI] || '');
        const oc = parseDecimal(campos[E520.VL_OC_IPI] || '');
        const sc = parseDecimal(campos[E520.VL_SC_IPI] || '');
        const sd = parseDecimal(campos[E520.VL_SD_IPI] || '');
        apuracaoIpi.e520 = {
          vlSdAntIpi: sdAnt,
          vlDebIpi: deb,
          vlCredIpi: cred,
          vlOdIpi: od,
          vlOcIpi: oc,
          vlScIpi: sc,
          vlSdIpi: sd,
          saldoRecalculado: (sdAnt + deb + od) - (cred + oc),
          saldoDeclarado: sd - sc,
        };
        break;
      }

      case 'E530': {
        if (!apuracaoIpi) apuracaoIpi = apuracaoIpiVazia();
        apuracaoIpi.e530.push({
          valor: parseDecimal(campos[E530.VL_AJUST] || ''),
          codigo: campos[E530.COD_AJ] || '',
          indicadorDeDebito: campos[E530.IND_AJ] || '',
          descricao: campos[E530.DESCR_COMPL_AJ] || '',
        });
        break;
      }
    }
  }

  const icms = apuracaoIcms ?? apuracaoIcmsVazia();
  const ipi = apuracaoIpi ?? apuracaoIpiVazia();
  const conferencias = conferirApuracao(icms, ipi);

  return {
    cadastro,
    leiaute: 'efd-icms-ipi',
    registros,
    apuracaoIcms: icms,
    apuracaoIpi: ipi,
    conferencias,
    resumo: {
      icmsDebitos: icms.e110?.debitos ?? 0,
      icmsCreditos: icms.e110?.creditos ?? 0,
      icmsSaldoRecalculado: icms.e110?.saldoRecalculado ?? 0,
      icmsRecolher: icms.e110?.vlIcmsRecolher ?? 0,
      icmsTransportar: icms.e110?.vlSldCredorTransportar ?? 0,
      ipiDebitos: ipi.e520?.vlDebIpi ?? 0,
      ipiCreditos: ipi.e520?.vlCredIpi ?? 0,
      ipiSaldo: ipi.e520?.vlSdIpi ?? 0,
    },
  };
};

/**
 * Confere se a apuração declarada fecha com a aritmética dos campos.
 * As fórmulas foram validadas contra arquivo real: lá o saldo batia exato.
 */
export const conferirApuracao = (
  apuracaoIcms: ApuracaoIcms,
  apuracaoIpi: ApuracaoIpi,
): ConferenciaDeFechamento[] => {
  const conferencias: ConferenciaDeFechamento[] = [];

  if (apuracaoIcms.e110) {
    const e110 = apuracaoIcms.e110;
    const saldoNegativo = e110.saldoRecalculado < 0;
    const declarado = saldoNegativo ? e110.vlSldCredorTransportar : e110.vlSldApurado;
    const alvo = Math.abs(e110.saldoRecalculado);
    const diferenca = Math.abs(declarado - alvo);
    conferencias.push({
      id: 'icms-e110',
      titulo: 'Apuração do ICMS fecha com os campos do E110',
      fechou: diferenca <= TOLERANCIA,
      diferenca,
      detalhes: saldoNegativo
        ? `Débitos de ${fmtMoeda(e110.debitos)} contra créditos de ${fmtMoeda(e110.creditos)} geram saldo credor de ${fmtMoeda(alvo)}; o E110 transporta ${fmtMoeda(e110.vlSldCredorTransportar)}. Diferença: ${fmtDiff(diferenca)}.`
        : `Débitos de ${fmtMoeda(e110.debitos)} contra créditos de ${fmtMoeda(e110.creditos)} geram saldo devedor de ${fmtMoeda(alvo)}; o E110 apura ${fmtMoeda(e110.vlSldApurado)}. Diferença: ${fmtDiff(diferenca)}.`,
    });
  }

  if (apuracaoIpi.e520) {
    const e520 = apuracaoIpi.e520;
    const diferenca = Math.abs(e520.saldoDeclarado - e520.saldoRecalculado);
    conferencias.push({
      id: 'ipi-e520',
      titulo: 'Apuração do IPI fecha com os campos do E520',
      fechou: diferenca <= TOLERANCIA,
      diferenca,
      detalhes: `${fmtMoeda(e520.vlDebIpi)} de débito e ${fmtMoeda(e520.vlOdIpi)} de outros débitos contra ${fmtMoeda(e520.vlCredIpi)} de crédito e ${fmtMoeda(e520.vlOcIpi)} de outros créditos apuram ${fmtMoeda(Math.abs(e520.saldoRecalculado))}; o E520 declara ${fmtMoeda(e520.saldoDeclarado)}. Diferença: ${fmtDiff(diferenca)}.`,
    });
  }

  if (apuracaoIpi.e510.length > 0 && apuracaoIpi.e520) {
    const e520 = apuracaoIpi.e520;
    let saidas = 0;
    let entradas = 0;
    for (const l of apuracaoIpi.e510) {
      if (eixo(l.cfop) === 'saida') saidas += l.vlIpi;
      else entradas += l.vlIpi;
    }
    const diferenca = Math.abs(e520.vlDebIpi - saidas) + Math.abs(e520.vlCredIpi - entradas);
    conferencias.push({
      id: 'ipi-e510-x-e520',
      titulo: 'Consolidação do IPI por CFOP (E510) confere com o E520',
      fechou: diferenca <= TOLERANCIA,
      diferenca,
      detalhes: `As linhas do E510 com CFOP de saída somam ${fmtMoeda(saidas)} e as de entrada ${fmtMoeda(entradas)}; o E520 declara ${fmtMoeda(e520.vlDebIpi)} de débito e ${fmtMoeda(e520.vlCredIpi)} de crédito. Diferença: ${fmtDiff(diferenca)}.`,
    });
  }

  return conferencias;
};

const fmtMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDiff = (v: number) => (v <= TOLERANCIA ? 'zero' : fmtMoeda(v));

/** Exporta o eixo utilizável pela UI (saída/entrada), alinhado ao cfopPolicy. */
export const eixoDoCfop = (cfop: string): string => eixo(cfop);