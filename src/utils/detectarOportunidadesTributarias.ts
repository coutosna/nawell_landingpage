/**
 * Módulo de Detecção de Oportunidades Tributárias
 * Identifica créditos não aproveitados, pagamentos indevidos e inconsistências fiscais
 */

import { EFDData, apuraDebitoPisCofins } from './efdParser';
import { buscarAliquotaNCM } from './ncmTable';

export interface OportunidadeTributaria {
  id: string;
  tipo:
    | 'CREDITO_NAO_APROVEITADO'
    | 'PAGAMENTO_A_MAIOR'
    | 'INCONSISTENCIA_CST'
    | 'INCONSISTENCIA_CFOP'
    | 'MONOFASICO_INCORRETO'
    | 'SALDO_CREDOR_ICMS'
    | 'SALDO_CREDOR_IPI'
    | 'FECHAMENTO_DIVERGENTE';
  severidade: 'alta' | 'media' | 'baixa';
  titulo: string;
  descricao: string;
  ncm?: string;
  cfop?: string;
  cst?: string;
  documento?: string;
  produto?: string;
  valorBase: number;
  aliquotaDevida?: number;
  aliquotaAplicada?: number;
  valorCalculado: number;
  diferenca: number;
  status: 'Oportunidade' | 'Reaver' | 'Inconsistência' | 'Auditoria';
  impactoFinanceiro: number;
  acaoSugerida: string;
  detalhamentoTecnico?: string;
}

/**
 * 1. Detecta créditos não aproveitados de PIS/COFINS
 * Lógica: Cruzar itens de entrada (CFOP 1xxx, 2xxx, 3xxx) com CST de crédito (50-66)
 * e comparar o crédito esperado (tabela NCM ou alíquotas do regime) com o efetivamente escriturado.
 * Reporta tanto crédito não escriturado (valor zero) quanto escriturado a menor (diferença).
 */
export const detectarCreditosNaoAproveitados = (data: EFDData): OportunidadeTributaria[] => {
  const oportunidades: OportunidadeTributaria[] = [];
  let idCounter = 1;

  // Filtra vendas que são na verdade entradas (compras com nota de entrada)
  const entradas = data.vendas.filter(venda => {
    const cfopFirstDigit = venda.cfop.charAt(0);
    return ['1', '2', '3'].includes(cfopFirstDigit);
  });

  // Analisa cada entrada
  entradas.forEach(entrada => {
    // Verifica se o CST permite crédito (50-66)
    const cstPIS = parseInt(entrada.pisCst) || 0;
    const cstCOFINS = parseInt(entrada.cofinsCst) || 0;

    const permiteCredito = (
      (cstPIS >= 50 && cstPIS <= 66) ||
      (cstCOFINS >= 50 && cstCOFINS <= 66)
    );

    if (permiteCredito) {
      // Alíquota de crédito: tabela NCM (se houver), senão alíquota informada no C170,
      // senão regime do arquivo; se não houver 0110, assume não-cumulativo padrão (1,65%/7,6%)
      const aliqNCM = buscarAliquotaNCM(entrada.ncm, entrada.data);
      const pisAliquotaEsperada = aliqNCM
        ? aliqNCM.aliquotaPIS
        : (entrada.pisAliquota || data.regime.pisAliquota || 1.65);
      const cofinsAliquotaEsperada = aliqNCM
        ? aliqNCM.aliquotaCOFINS
        : (entrada.cofinsAliquota || data.regime.cofinsAliquota || 7.6);

      const basePIS = entrada.pisBase || entrada.valor || 0;
      const baseCOFINS = entrada.cofinsBase || entrada.valor || 0;

      const pisEsperado = (basePIS * pisAliquotaEsperada) / 100;
      const cofinsEsperado = (baseCOFINS * cofinsAliquotaEsperada) / 100;

      const pisFaltante = Math.max(0, pisEsperado - entrada.pisValor);
      const cofinsFaltante = Math.max(0, cofinsEsperado - entrada.cofinsValor);
      const diferenca = pisFaltante + cofinsFaltante;

      if (diferenca < 1) return; // Só reporta se valor significativo

      const nadaEscriturado = entrada.pisValor + entrada.cofinsValor === 0;

      oportunidades.push({
        id: `CRED-${idCounter++}`,
        tipo: 'CREDITO_NAO_APROVEITADO',
        severidade: diferenca > 1000 ? 'alta' : diferenca > 100 ? 'media' : 'baixa',
        titulo: nadaEscriturado ? 'Crédito potencial não escriturado' : 'Crédito escriturado a menor',
        descricao: 'Crédito de PIS/COFINS não integralmente aproveitado em operação de entrada',
        ncm: entrada.ncm,
        cfop: entrada.cfop,
        cst: `PIS: ${entrada.pisCst} / COFINS: ${entrada.cofinsCst}`,
        documento: entrada.documento,
        produto: entrada.produto,
        valorBase: entrada.valor,
        aliquotaDevida: pisAliquotaEsperada + cofinsAliquotaEsperada,
        aliquotaAplicada: (entrada.pisValor > 0 || entrada.cofinsValor > 0)
          ? ((entrada.pisAliquota || pisAliquotaEsperada) + (entrada.cofinsAliquota || cofinsAliquotaEsperada))
          : (pisAliquotaEsperada + cofinsAliquotaEsperada),
        valorCalculado: pisEsperado + cofinsEsperado,
        diferenca,
        status: 'Oportunidade',
        impactoFinanceiro: diferenca,
        acaoSugerida: `Verificar se o crédito pode ser integralmente escriturado. CST ${entrada.pisCst}/${entrada.cofinsCst} permite apropriação ao regime não-cumulativo. Potencial de R$ ${diferenca.toFixed(2)}`,
        detalhamentoTecnico:
          `Entrada com CFOP ${entrada.cfop} e CST que permite crédito. Base de cálculo: R$ ${basePIS.toFixed(2)}. ` +
          `Crédito esperado (PIS ${pisAliquotaEsperada}% + COFINS ${cofinsAliquotaEsperada}%): R$ ${(pisEsperado + cofinsEsperado).toFixed(2)}. ` +
          `Escriturado: R$ ${(entrada.pisValor + entrada.cofinsValor).toFixed(2)}. ${nadaEscriturado ? 'Nenhum valor apropriado no período.' : `Diferença a recuperar de R$ ${diferenca.toFixed(2)}.`}`
      });
    }
  });

  return oportunidades;
};

/**
 * 2. Detecta pagamentos indevidos ou a maior
 * Lógica: Comparar alíquota aplicada com alíquota devida (tabela NCM)
 */
export const detectarPagamentosAMaior = (data: EFDData): OportunidadeTributaria[] => {
  const oportunidades: OportunidadeTributaria[] = [];
  let idCounter = 1;

  data.vendas.forEach(venda => {
    // Só faz sentido comparar pagamento a maior em saídas com incidência de débito
    if (!apuraDebitoPisCofins(venda)) return;

    // Busca alíquota correta na tabela NCM
    const aliquotaNCM = buscarAliquotaNCM(venda.ncm, venda.data);
    
    if (aliquotaNCM) {
      // Compara PIS
      if (venda.pisAliquota > aliquotaNCM.aliquotaPIS) {
        const diferencaAliquota = venda.pisAliquota - aliquotaNCM.aliquotaPIS;
        const valorPagoAMais = (venda.pisBase * diferencaAliquota) / 100;

        if (valorPagoAMais > 1) {
          oportunidades.push({
            id: `PAG-${idCounter++}`,
            tipo: 'PAGAMENTO_A_MAIOR',
            severidade: valorPagoAMais > 500 ? 'alta' : valorPagoAMais > 100 ? 'media' : 'baixa',
            titulo: 'PIS pago a maior',
            descricao: `Alíquota de PIS aplicada superior à devida para NCM ${venda.ncm}`,
            ncm: venda.ncm,
            cfop: venda.cfop,
            cst: venda.pisCst,
            documento: venda.documento,
            produto: venda.produto,
            valorBase: venda.pisBase,
            aliquotaDevida: aliquotaNCM.aliquotaPIS,
            aliquotaAplicada: venda.pisAliquota,
            valorCalculado: valorPagoAMais,
            diferenca: valorPagoAMais,
            status: 'Reaver',
            impactoFinanceiro: valorPagoAMais,
            acaoSugerida: `Ajustar alíquota de PIS para ${aliquotaNCM.aliquotaPIS}% conforme ${aliquotaNCM.obs}. Possível recuperação via PER/DCOMP de R$ ${valorPagoAMais.toFixed(2)}`,
            detalhamentoTecnico: `${aliquotaNCM.descricao}. Alíquota correta: ${aliquotaNCM.aliquotaPIS}%. Aplicada: ${venda.pisAliquota}%. Diferença: ${diferencaAliquota.toFixed(2)}%.`
          });
        }
      }

      // Compara COFINS
      if (venda.cofinsAliquota > aliquotaNCM.aliquotaCOFINS) {
        const diferencaAliquota = venda.cofinsAliquota - aliquotaNCM.aliquotaCOFINS;
        const valorPagoAMais = (venda.cofinsBase * diferencaAliquota) / 100;

        if (valorPagoAMais > 1) {
          oportunidades.push({
            id: `PAG-${idCounter++}`,
            tipo: 'PAGAMENTO_A_MAIOR',
            severidade: valorPagoAMais > 500 ? 'alta' : valorPagoAMais > 100 ? 'media' : 'baixa',
            titulo: 'COFINS pago a maior',
            descricao: `Alíquota de COFINS aplicada superior à devida para NCM ${venda.ncm}`,
            ncm: venda.ncm,
            cfop: venda.cfop,
            cst: venda.cofinsCst,
            documento: venda.documento,
            produto: venda.produto,
            valorBase: venda.cofinsBase,
            aliquotaDevida: aliquotaNCM.aliquotaCOFINS,
            aliquotaAplicada: venda.cofinsAliquota,
            valorCalculado: valorPagoAMais,
            diferenca: valorPagoAMais,
            status: 'Reaver',
            impactoFinanceiro: valorPagoAMais,
            acaoSugerida: `Ajustar alíquota de COFINS para ${aliquotaNCM.aliquotaCOFINS}% conforme ${aliquotaNCM.obs}. Possível recuperação via PER/DCOMP de R$ ${valorPagoAMais.toFixed(2)}`,
            detalhamentoTecnico: `${aliquotaNCM.descricao}. Alíquota correta: ${aliquotaNCM.aliquotaCOFINS}%. Aplicada: ${venda.cofinsAliquota}%. Diferença: ${diferencaAliquota.toFixed(2)}%.`
          });
        }
      }
    }
  });

  return oportunidades;
};

/**
 * 3. Detecta erros de classificação CST
 * Verifica compatibilidade entre CST e regime tributário
 */
export const detectarInconsistenciasCST = (data: EFDData): OportunidadeTributaria[] => {
  const oportunidades: OportunidadeTributaria[] = [];
  let idCounter = 1;

  const regimeCodigo = parseInt(data.regime.codigo);
  const isNaoCumulativo = regimeCodigo === 1;
  const isCumulativo = regimeCodigo === 2;

  data.vendas.forEach(venda => {
    const cstPIS = parseInt(venda.pisCst);
    const cstCOFINS = parseInt(venda.cofinsCst);

    // Regra: Regime cumulativo não deveria usar CST 50-56 (créditos de não-cumulativo)
    if (isCumulativo && ((cstPIS >= 50 && cstPIS <= 56) || (cstCOFINS >= 50 && cstCOFINS <= 56))) {
      oportunidades.push({
        id: `CST-${idCounter++}`,
        tipo: 'INCONSISTENCIA_CST',
        severidade: 'media',
        titulo: 'CST incompatível com regime tributário',
        descricao: `Regime cumulativo utilizando CST de crédito (não-cumulativo)`,
        ncm: venda.ncm,
        cfop: venda.cfop,
        cst: `PIS: ${venda.pisCst} / COFINS: ${venda.cofinsCst}`,
        documento: venda.documento,
        produto: venda.produto,
        valorBase: venda.valor,
        valorCalculado: 0,
        diferenca: 0,
        status: 'Inconsistência',
        impactoFinanceiro: 0,
        acaoSugerida: `Revisar CST utilizado. Regime cumulativo (código ${regimeCodigo}) não permite apropriação de créditos. Utilizar CST adequado ao regime.`,
        detalhamentoTecnico: `CST ${venda.pisCst}/${venda.cofinsCst} indica apropriação de crédito, mas empresa está em regime ${data.regime.descricao}. Risco de autuação por incorreção cadastral.`
      });
    }

    // Regra: Regime não-cumulativo não deveria usar CST 01-02 (tributação cumulativa)
    if (isNaoCumulativo && ((cstPIS === 1 || cstPIS === 2) || (cstCOFINS === 1 || cstCOFINS === 2))) {
      oportunidades.push({
        id: `CST-${idCounter++}`,
        tipo: 'INCONSISTENCIA_CST',
        severidade: 'alta',
        titulo: 'CST incompatível com regime tributário',
        descricao: `Regime não-cumulativo utilizando CST de tributação cumulativa`,
        ncm: venda.ncm,
        cfop: venda.cfop,
        cst: `PIS: ${venda.pisCst} / COFINS: ${venda.cofinsCst}`,
        documento: venda.documento,
        produto: venda.produto,
        valorBase: venda.valor,
        valorCalculado: venda.pisValor + venda.cofinsValor,
        diferenca: 0,
        status: 'Inconsistência',
        impactoFinanceiro: 0,
        acaoSugerida: `Corrigir CST. Regime não-cumulativo deve usar CST 01 apenas para operações tributadas à alíquota básica (1,65%/7,6%). Verificar se não há pagamento a menor.`,
        detalhamentoTecnico: `Empresa em regime ${data.regime.descricao} utilizando CST típico de regime cumulativo. Pode indicar erro sistêmico ou operação especial não mapeada.`
      });
    }
  });

  return oportunidades;
};

/**
 * 4. Detecta inconsistências entre CFOP e tipo de operação
 * Verifica se CFOP de entrada/saída está coerente
 */
export const detectarInconsistenciasCFOP = (data: EFDData): OportunidadeTributaria[] => {
  const oportunidades: OportunidadeTributaria[] = [];
  let idCounter = 1;

  data.vendas.forEach(venda => {
    const cfopFirstDigit = venda.cfop.charAt(0);
    const isEntrada = ['1', '2', '3'].includes(cfopFirstDigit);
    const isSaida = ['5', '6', '7'].includes(cfopFirstDigit);

    // Detecta operações monofásicas tributadas incorretamente
    const aliquotaNCM = buscarAliquotaNCM(venda.ncm);
    if (aliquotaNCM && aliquotaNCM.obs.toLowerCase().includes('monofás')) {
      // Operações monofásicas não deveriam ter tributação em todas as etapas
      if (venda.pisValor > 0 || venda.cofinsValor > 0) {
        const cstPIS = parseInt(venda.pisCst);
        const cstCOFINS = parseInt(venda.cofinsCst);
        
        // CST 04 ou 06 indicam monofásico correto
        const cstCorreto = (cstPIS === 4 || cstPIS === 6) && (cstCOFINS === 4 || cstCOFINS === 6);
        
        if (!cstCorreto && isSaida) {
          oportunidades.push({
            id: `MONO-${idCounter++}`,
            tipo: 'MONOFASICO_INCORRETO',
            severidade: 'alta',
            titulo: 'Tributação monofásica incorreta',
            descricao: `NCM ${venda.ncm} é monofásico mas está sendo tributado na revenda`,
            ncm: venda.ncm,
            cfop: venda.cfop,
            cst: `PIS: ${venda.pisCst} / COFINS: ${venda.cofinsCst}`,
            documento: venda.documento,
            produto: venda.produto,
            valorBase: venda.valor,
            aliquotaDevida: 0,
            aliquotaAplicada: venda.pisAliquota + venda.cofinsAliquota,
            valorCalculado: venda.pisValor + venda.cofinsValor,
            diferenca: venda.pisValor + venda.cofinsValor,
            status: 'Reaver',
            impactoFinanceiro: venda.pisValor + venda.cofinsValor,
            acaoSugerida: `Utilizar CST 04 (Monofásico) ou 06 (Alíquota Zero) para NCM ${venda.ncm}. Produto sujeito à tributação concentrada. Possível recuperação de R$ ${(venda.pisValor + venda.cofinsValor).toFixed(2)}`,
            detalhamentoTecnico: `${aliquotaNCM.descricao}. ${aliquotaNCM.obs}. Tributação deve ocorrer apenas na etapa do fabricante/importador.`
          });
        }
      }
    }

    // Detecta CFOP incoerente (ex: 1102 com valor de saída alto)
    if (isEntrada && venda.pisValor > 100) {
      // Se é entrada mas tem muito PIS/COFINS, pode ser inconsistência
      const cstPIS = parseInt(venda.pisCst);
      if (cstPIS >= 1 && cstPIS <= 9) { // CST de débito em operação de entrada
        oportunidades.push({
          id: `CFOP-${idCounter++}`,
          tipo: 'INCONSISTENCIA_CFOP',
          severidade: 'media',
          titulo: 'CFOP de entrada com débito de PIS/COFINS',
          descricao: `Operação com CFOP de entrada mas gerando débito tributário significativo`,
          ncm: venda.ncm,
          cfop: venda.cfop,
          cst: `PIS: ${venda.pisCst} / COFINS: ${venda.cofinsCst}`,
          documento: venda.documento,
          produto: venda.produto,
          valorBase: venda.valor,
          valorCalculado: venda.pisValor + venda.cofinsValor,
          diferenca: 0,
          status: 'Auditoria',
          impactoFinanceiro: 0,
          acaoSugerida: `Revisar natureza da operação. CFOP ${venda.cfop} indica entrada, mas há débito de PIS/COFINS. Verificar se CFOP ou CST estão corretos.`,
          detalhamentoTecnico: `CFOP iniciado em ${cfopFirstDigit} normalmente indica entrada (crédito), mas CST ${venda.pisCst} gera débito. Possível erro de classificação.`
        });
      }
    }
  });

  return oportunidades;
};

/**
 * Oportunidades para EFD ICMS/IPI (SPED Fiscal), lidas da apuração do bloco E:
 * saldo credor de ICMS/IPI passível de aproveitamento/ressarcimento e
 * conferências de fechamento divergentes (E110/E520), que sinalizam risco de
 * débito não recolhido ou escrituração incorreta.
 */
export const detectarOportunidadesIcmsIpi = (data: EFDData): OportunidadeTributaria[] => {
  const oportunidades: OportunidadeTributaria[] = [];
  const icmsIpi = data.icmsIpi;
  if (!icmsIpi) return oportunidades;

  const TOLERANCIA = 0.02;

  // Saldo credor de ICMS a transportar / a aproveitar
  const e110 = icmsIpi.apuracaoIcms.e110;
  if (e110 && e110.saldoRecalculado < -TOLERANCIA) {
    const valor = Math.abs(e110.saldoRecalculado);
    oportunidades.push({
      id: 'ICMS-SC',
      tipo: 'SALDO_CREDOR_ICMS',
      severidade: valor > 100000 ? 'alta' : valor > 10000 ? 'media' : 'baixa',
      titulo: 'Saldo credor de ICMS a aproveitar',
      descricao: 'Apuração do período encerra com saldo credor de ICMS passível de aproveitamento em períodos seguintes, de compensação ou de ressarcimento',
      valorBase: valor,
      valorCalculado: valor,
      diferenca: 0,
      status: 'Oportunidade',
      impactoFinanceiro: valor,
      acaoSugerida: 'Verificar a possibilidade de aproveitamento do saldo credor (períodos seguintes, compensação com débitos ou ressarcimento/transferência de crédito, conforme a legislação estadual).',
      detalhamentoTecnico:
        `O E110 declara saldo credor a transportar de ${fmt(valor)}. Confirmar a compatibilidade com o sistema estadual (ex.: FECP, CIAP) e com o Livro de Apuração do ICMS.`,
    });
  }

  // Saldo credor de IPI a aproveitar (DEIPI/ressarcimento)
  const e520 = icmsIpi.apuracaoIpi.e520;
  if (e520 && e520.saldoRecalculado < -TOLERANCIA) {
    const valor = Math.abs(e520.saldoRecalculado);
    oportunidades.push({
      id: 'IPI-SC',
      tipo: 'SALDO_CREDOR_IPI',
      severidade: valor > 100000 ? 'alta' : valor > 10000 ? 'media' : 'baixa',
      titulo: 'Saldo credor de IPI a aproveitar',
      descricao: 'Apuração do IPI encerra com saldo credor passível de ressarcimento ou de manutenção em conta gráfica',
      valorBase: valor,
      valorCalculado: valor,
      diferenca: 0,
      status: 'Oportunidade',
      impactoFinanceiro: valor,
      acaoSugerida: 'Avaliar ressarcimento de saldo credor de IPI (períodos de não-cumulatividade), manutenção do saldo para compensação ou pedido de restituição conforme os artigos 74/26 da Lei 9.430/96.',
      detalhamentoTecnico:
        `O E520 aponta saldo credor de ${fmt(valor)} na apuração do período. Validar a escrituração do E510 (saídas/entradas) e a contabilização dos créditos (E510 e E530).`,
    });
  }

  // Conferências de fechamento que não fecharam — risco de débito não recolhido
  icmsIpi.conferencias.forEach(conf => {
    if (conf.fechou) return;
    const diferenca = conf.diferenca;
    oportunidades.push({
      id: `FECH-${conf.id}`,
      tipo: 'FECHAMENTO_DIVERGENTE',
      severidade: diferenca > 10000 ? 'alta' : diferenca > 1000 ? 'media' : 'baixa',
      titulo: 'Apuração não fecha com os campos do bloco E',
      descricao: conf.titulo,
      valorBase: diferenca,
      valorCalculado: diferenca,
      diferenca,
      status: 'Inconsistência',
      impactoFinanceiro: diferenca,
      acaoSugerida:
        `Revisar a escrituração do bloco E (${conf.detalhes}). A diferença indica possível débito não recolhido, crédito não escriturado ou erro de preenchimento.`,
      detalhamentoTecnico: conf.detalhes,
    });
  });

  // Obrigações a recolher declaradas no E116 sem apuração correspondente no E110
  if (e110 && icmsIpi.apuracaoIcms.e116.length > 0 && e110.vlIcmsRecolher <= TOLERANCIA) {
    const totalObrigacoes = icmsIpi.apuracaoIcms.e116.reduce((sum, o) => sum + o.valor, 0);
    if (totalObrigacoes > TOLERANCIA) {
      oportunidades.push({
        id: 'ICMS-E116',
        tipo: 'FECHAMENTO_DIVERGENTE',
        severidade: 'media',
        titulo: 'Obrigações a recolher sem ICMS apurado (E116×E110)',
        descricao: 'Há obrigações a recolher informadas no E116, mas o E110 não apura ICMS a recolher no mesmo período',
        valorBase: totalObrigacoes,
        valorCalculado: totalObrigacoes,
        diferenca: totalObrigacoes,
        status: 'Inconsistência',
        impactoFinanceiro: totalObrigacoes,
        acaoSugerida: 'Conferir o cruzamento entre as obrigações do E116 (códigos de receita) e o valor apurado no E110 — pode indicar débito não lançado na apuração.',
      });
    }
  }

  return oportunidades.sort((a, b) => b.impactoFinanceiro - a.impactoFinanceiro);
};

const fmt = (v: number): string =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Função principal: consolida todas as detecções.
 * EFD ICMS/IPI usa a apuração do bloco E; EFD-Contribuições mantém a análise
 * de PIS/COFINS (créditos, CST, CFOP e monofásico).
 */
export const detectarTodasOportunidades = (data: EFDData): OportunidadeTributaria[] => {
  const oportunidades: OportunidadeTributaria[] = [];

  // Executa todas as detecções
  if (data.leiaute === 'efd-icms-ipi') {
    oportunidades.push(...detectarOportunidadesIcmsIpi(data));
  } else {
    oportunidades.push(...detectarCreditosNaoAproveitados(data));
    oportunidades.push(...detectarPagamentosAMaior(data));
    oportunidades.push(...detectarInconsistenciasCST(data));
    oportunidades.push(...detectarInconsistenciasCFOP(data));
  }

  // Ordena por impacto financeiro (maior primeiro)
  return oportunidades.sort((a, b) => b.impactoFinanceiro - a.impactoFinanceiro);
};

/**
 * Calcula resumo das oportunidades
 */
export interface ResumoOportunidades {
  totalOportunidades: number;
  totalImpactoFinanceiro: number;
  porTipo: Record<string, number>;
  porSeveridade: Record<string, number>;
  porStatus: Record<string, number>;
  top10NCMs: Array<{ ncm: string; impacto: number; quantidade: number }>;
}

export const calcularResumoOportunidades = (oportunidades: OportunidadeTributaria[]): ResumoOportunidades => {
  const resumo: ResumoOportunidades = {
    totalOportunidades: oportunidades.length,
    totalImpactoFinanceiro: 0,
    porTipo: {},
    porSeveridade: {},
    porStatus: {},
    top10NCMs: []
  };

  // Agrupa por tipo, severidade e status
  oportunidades.forEach(op => {
    resumo.totalImpactoFinanceiro += op.impactoFinanceiro;
    
    resumo.porTipo[op.tipo] = (resumo.porTipo[op.tipo] || 0) + 1;
    resumo.porSeveridade[op.severidade] = (resumo.porSeveridade[op.severidade] || 0) + 1;
    resumo.porStatus[op.status] = (resumo.porStatus[op.status] || 0) + 1;
  });

  // Agrupa por NCM e calcula top 10
  const ncmMap = new Map<string, { impacto: number; quantidade: number }>();
  oportunidades.forEach(op => {
    if (op.ncm) {
      const atual = ncmMap.get(op.ncm) || { impacto: 0, quantidade: 0 };
      atual.impacto += op.impactoFinanceiro;
      atual.quantidade += 1;
      ncmMap.set(op.ncm, atual);
    }
  });

  resumo.top10NCMs = Array.from(ncmMap.entries())
    .map(([ncm, data]) => ({ ncm, ...data }))
    .sort((a, b) => b.impacto - a.impacto)
    .slice(0, 10);

  return resumo;
};
