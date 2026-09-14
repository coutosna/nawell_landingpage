/**
 * Utilitários do Relatório Completo de Análise Fiscal (EFD-Contribuições)
 * - Consolidação por ano e por mês de apuração
 * - Geração do documento HTML completo (usado para exportação PDF/HTML)
 */

import { EFDData, apuraDebitoPisCofins } from './efdParser';
import { buscarAliquotaNCM } from './ncmTable';
import { OportunidadeTributaria } from './detectarOportunidadesTributarias';
import { gerarRelatoriosTextuais } from './gerarRelatorioTextual';

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const TIPO_LABELS: Record<string, string> = {
  'CREDITO_NAO_APROVEITADO': 'Créditos Não Aproveitados',
  'PAGAMENTO_A_MAIOR': 'Pagamentos a Maior',
  'INCONSISTENCIA_CST': 'Inconsistências de CST',
  'INCONSISTENCIA_CFOP': 'Inconsistências de CFOP',
  'MONOFASICO_INCORRETO': 'Tributação Monofásica Incorreta',
  'SALDO_CREDOR_ICMS': 'Saldos Credores de ICMS',
  'SALDO_CREDOR_IPI': 'Saldos Credores de IPI',
  'FECHAMENTO_DIVERGENTE': 'Fechamentos Divergentes'
};

export const formatMoeda = (v: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2
  }).format(v || 0);

export const formatMilhar = (v: number): string =>
  new Intl.NumberFormat('pt-BR').format(v || 0);

export interface LinhaPeriodo {
  chave: string;
  ano: number;
  mes?: number;
  label: string;
  receita: number;
  qtdVendas: number;
  qtdDocumentos: number;
  pisInformado: number;
  pisDevido: number;
  pisDiferenca: number;
  cofinsInformado: number;
  cofinsDevido: number;
  cofinsDiferenca: number;
  multa: number;
  juros: number;
  totalComplementar: number;
}

const apurarVenda = (
  efdData: EFDData,
  venda: EFDData['vendas'][number]
): { pisInf: number; cofinsInf: number; pisDevido: number; cofinsDevido: number; pisDif: number; cofinsDif: number; fonte: string } => {
  const pisInf = Math.round(venda.pisValor * 100) / 100;
  const cofinsInf = Math.round(venda.cofinsValor * 100) / 100;

  const aliquotaNCM = buscarAliquotaNCM(venda.ncm, venda.data);

  let aliqPIS = efdData.regime.pisAliquota;
  let aliqCOFINS = efdData.regime.cofinsAliquota;
  let fonte = efdData.regime.descricao;

  if (aliquotaNCM) {
    aliqPIS = aliquotaNCM.aliquotaPIS;
    aliqCOFINS = aliquotaNCM.aliquotaCOFINS;
    fonte = `${aliquotaNCM.obs} - ${aliquotaNCM.descricao}`;
  } else if (venda.pisAliquota > 0 || venda.cofinsAliquota > 0) {
    if (venda.pisAliquota > 0) aliqPIS = venda.pisAliquota;
    if (venda.cofinsAliquota > 0) aliqCOFINS = venda.cofinsAliquota;
    fonte = 'Registro C170';
  }

  const pisDevido = Math.round((venda.valor * aliqPIS) / 100 * 100) / 100;
  const cofinsDevido = Math.round((venda.valor * aliqCOFINS) / 100 * 100) / 100;
  const pisDif = Math.round(Math.max(0, pisDevido - pisInf) * 100) / 100;
  const cofinsDif = Math.round(Math.max(0, cofinsDevido - cofinsInf) * 100) / 100;

  return { pisInf, cofinsInf, pisDevido, cofinsDevido, pisDif, cofinsDif, fonte };
};

/** Extrai {ano, mes} de uma data no formato DD/MM/YYYY */
const extrairAnoMes = (data: string): { ano: number; mes: number } | null => {
  if (!data || data.length < 10) return null;
  const partes = data.split('/');
  if (partes.length !== 3) return null;
  const ano = parseInt(partes[2], 10);
  const mes = parseInt(partes[1], 10);
  if (isNaN(ano) || isNaN(mes) || mes < 1 || mes > 12) return null;
  return { ano, mes };
};

const criarLinha = (ano: number, mes?: number): LinhaPeriodo => ({
  chave: mes !== undefined ? `${ano}-${String(mes).padStart(2, '0')}` : `${ano}`,
  ano,
  mes,
  label: mes !== undefined ? `${MESES[mes - 1]}/${ano}` : `Ano ${ano}`,
  receita: 0,
  qtdVendas: 0,
  qtdDocumentos: 0,
  pisInformado: 0,
  pisDevido: 0,
  pisDiferenca: 0,
  cofinsInformado: 0,
  cofinsDevido: 0,
  cofinsDiferenca: 0,
  multa: 0,
  juros: 0,
  totalComplementar: 0,
});

/**
 * Consolida os dados de venda/apuração por mês de apuração.
 * Inclui multa/juros/risco fiscal a partir do detalhamento de divergências.
 * Para EFD ICMS/IPI, a apuração é a do bloco E (um período por arquivo).
 */
export const calcularPeriodosPorMes = (efdData: EFDData): LinhaPeriodo[] => {
  if (efdData.leiaute === 'efd-icms-ipi') {
    return apurarPeriodosIcmsIpi(efdData);
  }

  const mapa = new Map<string, LinhaPeriodo>();
  const documentosUnicos = new Set<string>();

  const obter = (ano: number, mes: number): LinhaPeriodo => {
    const chave = `${ano}-${String(mes).padStart(2, '0')}`;
    let linha = mapa.get(chave);
    if (!linha) {
      linha = criarLinha(ano, mes);
      mapa.set(chave, linha);
    }
    return linha;
  };

  efdData.vendas.forEach(venda => {
    const meta = extrairAnoMes(venda.data);
    if (!meta) return;
    if (!apuraDebitoPisCofins(venda)) return;
    const linha = obter(meta.ano, meta.mes);
    const apurado = apurarVenda(efdData, venda);

    linha.receita += venda.valor;
    linha.qtdVendas += 1;
    linha.pisInformado += apurado.pisInf;
    linha.pisDevido += apurado.pisDevido;
    linha.pisDiferenca += apurado.pisDif;
    linha.cofinsInformado += apurado.cofinsInf;
    linha.cofinsDevido += apurado.cofinsDevido;
    linha.cofinsDiferenca += apurado.cofinsDif;
    if (venda.documento) documentosUnicos.add(`${meta.ano}-${meta.mes}:${venda.documento}`);
  });

  // Aplica risco fiscal (multa / juros / total a complementar) por mês
  efdData.riscoFiscal.itens.forEach(item => {
    const meta = extrairAnoMes(item.dataOperacao);
    if (!meta) return;
    const linha = obter(meta.ano, meta.mes);
    linha.multa += item.multa || 0;
    linha.juros += item.jurosEstimado || 0;
    linha.totalComplementar += item.totalComMultaJuros || 0;
  });

  const linhas = Array.from(mapa.values()).sort((a, b) => a.chave.localeCompare(b.chave));
  linhas.forEach(l => {
    l.qtdDocumentos = documentosUnicos.size;
    l.receita = Math.round(l.receita * 100) / 100;
    l.pisInformado = Math.round(l.pisInformado * 100) / 100;
    l.pisDevido = Math.round(l.pisDevido * 100) / 100;
    l.pisDiferenca = Math.round(l.pisDiferenca * 100) / 100;
    l.cofinsInformado = Math.round(l.cofinsInformado * 100) / 100;
    l.cofinsDevido = Math.round(l.cofinsDevido * 100) / 100;
    l.cofinsDiferenca = Math.round(l.cofinsDiferenca * 100) / 100;
    l.multa = Math.round(l.multa * 100) / 100;
    l.juros = Math.round(l.juros * 100) / 100;
    l.totalComplementar = Math.round(l.totalComplementar * 100) / 100;
  });

  return linhas;
};

/**
 * Apuração de EFD ICMS/IPI: uma linha por período do arquivo, com os campos do
 * bloco E. Pis/cofins da LinhaPeriodo são reaproveitados como canal genérico:
 * ICMS (E110) e IPI (E520) — os rótulos trocam conforme o leiaute.
 */
const apurarPeriodosIcmsIpi = (efdData: EFDData): LinhaPeriodo[] => {
  const meta = extrairAnoMes(efdData.cadastro.periodoInicial || '');
  const e110 = efdData.icmsIpi?.apuracaoIcms.e110;
  const e520 = efdData.icmsIpi?.apuracaoIpi.e520;

  const linha = criarLinha(meta ? meta.ano : 0, meta ? meta.mes : undefined);
  linha.receita = efdData.resumo.totalVendas || 0;
  linha.qtdVendas = efdData.vendas.length;
  linha.qtdDocumentos = efdData.vendas.length;

  const icmsDevido = Math.max(0, e110?.saldoRecalculado ?? 0);
  const icmsInformado = e110?.vlIcmsRecolher ?? 0;
  const ipiDevido = Math.max(0, e520?.saldoRecalculado ?? 0);
  const ipiInformado = Math.abs(e520?.saldoDeclarado ?? 0);

  linha.pisInformado = icmsInformado; // ICMS a Recolher (E110)
  linha.pisDevido = icmsDevido;       // ICMS Apurado
  linha.pisDiferenca = Math.max(0, Math.round((icmsDevido - icmsInformado) * 100) / 100);
  linha.cofinsInformado = ipiInformado; // IPI Saldo Declarado (E520)
  linha.cofinsDevido = ipiDevido;       // IPI Apurado
  linha.cofinsDiferenca = Math.max(0, Math.round((ipiDevido - ipiInformado) * 100) / 100);

  const divTotal = (efdData.icmsIpi?.conferencias ?? [])
    .filter(c => !c.fechou)
    .reduce((s, c) => s + c.diferenca, 0);
  linha.multa = Math.round(divTotal * 0.2 * 100) / 100;
  linha.juros = 0;
  linha.totalComplementar = Math.round((divTotal + linha.multa) * 100) / 100;

  linha.receita = Math.round(linha.receita * 100) / 100;
  linha.qtdVendas = Math.round(linha.qtdVendas);
  linha.pisInformado = Math.round(linha.pisInformado * 100) / 100;
  linha.pisDevido = Math.round(linha.pisDevido * 100) / 100;
  linha.pisDiferenca = Math.round(linha.pisDiferenca * 100) / 100;
  linha.cofinsInformado = Math.round(linha.cofinsInformado * 100) / 100;
  linha.cofinsDevido = Math.round(linha.cofinsDevido * 100) / 100;
  linha.cofinsDiferenca = Math.round(linha.cofinsDiferenca * 100) / 100;
  linha.multa = Math.round(linha.multa * 100) / 100;
  linha.juros = Math.round(linha.juros * 100) / 100;
  linha.totalComplementar = Math.round(linha.totalComplementar * 100) / 100;

  return [linha];
};

/**
 * Consolida os dados por ano (agrega os meses).
 */
export const calcularPeriodosPorAno = (efdData: EFDData): LinhaPeriodo[] => {
  const mensal = calcularPeriodosPorMes(efdData);
  const mapa = new Map<number, LinhaPeriodo>();

  mensal.forEach(m => {
    let linha = mapa.get(m.ano);
    if (!linha) {
      linha = criarLinha(m.ano);
      mapa.set(m.ano, linha);
    }
    linha.receita += m.receita;
    linha.qtdVendas += m.qtdVendas;
    linha.pisInformado += m.pisInformado;
    linha.pisDevido += m.pisDevido;
    linha.pisDiferenca += m.pisDiferenca;
    linha.cofinsInformado += m.cofinsInformado;
    linha.cofinsDevido += m.cofinsDevido;
    linha.cofinsDiferenca += m.cofinsDiferenca;
    linha.multa += m.multa;
    linha.juros += m.juros;
    linha.totalComplementar += m.totalComplementar;
  });

  return Array.from(mapa.values())
    .sort((a, b) => a.ano - b.ano)
    .map(l => {
      l.receita = Math.round(l.receita * 100) / 100;
      l.pisInformado = Math.round(l.pisInformado * 100) / 100;
      l.pisDevido = Math.round(l.pisDevido * 100) / 100;
      l.pisDiferenca = Math.round(l.pisDiferenca * 100) / 100;
      l.cofinsInformado = Math.round(l.cofinsInformado * 100) / 100;
      l.cofinsDevido = Math.round(l.cofinsDevido * 100) / 100;
      l.cofinsDiferenca = Math.round(l.cofinsDiferenca * 100) / 100;
      l.multa = Math.round(l.multa * 100) / 100;
      l.juros = Math.round(l.juros * 100) / 100;
      l.totalComplementar = Math.round(l.totalComplementar * 100) / 100;
      return l;
    });
};

const esc = (valor: unknown): string =>
  String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

interface ReceitaProduto {
  produto: string;
  ncm: string;
  qtd: number;
  valor: number;
}

const calcularReceitaPorProduto = (efdData: EFDData, limite = 15): ReceitaProduto[] => {
  const mapa = new Map<string, ReceitaProduto>();
  efdData.vendas.forEach(v => {
    const chave = v.produto || v.documento || '—';
    const item = mapa.get(chave) || { produto: v.produto || '—', ncm: v.ncm || '—', qtd: 0, valor: 0 };
    item.qtd += 1;
    item.valor += v.valor;
    mapa.set(chave, item);
  });
  return Array.from(mapa.values())
    .map(p => ({ ...p, valor: Math.round(p.valor * 100) / 100 }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, limite);
};

/**
 * Gera o documento HTML completo do relatório.
 * Utilizado tanto pela exportação HTML quanto pela geração de PDF (html2canvas).
 */
export const gerarHTMLRelatorioCompleto = (
  efdData: EFDData,
  alertas: Array<{ grupo?: string; tipo?: string; severidade?: string; mensagem?: string }>,
  mensal: LinhaPeriodo[],
  anual: LinhaPeriodo[],
  oportunidades: OportunidadeTributaria[]
): string => {
  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const arquivosFonte = efdData.fontes?.arquivos ?? [];
  const qtdArquivos = arquivosFonte.length || efdData.fontes?.quantidade || 1;
  const documentosLabel = `${qtdArquivos} arquivo${qtdArquivos > 1 ? 's' : ''} EFD`;

  const modoIcms = efdData.leiaute === 'efd-icms-ipi';
  const obrigacaoNome = modoIcms
    ? 'EFD ICMS/IPI (SPED Fiscal)'
    : 'EFD-Contribuições (PIS/COFINS)';
  const regimeMeta = efdData.regime?.descricao || (modoIcms ? 'Non-cumulative (bloco E)' : '—');
  const conferenciasIcms = modoIcms
    ? (efdData.icmsIpi?.conferencias ?? []).filter(c => !c.fechou)
    : [];

  const ganhoPotencial = oportunidades.reduce((s, op) => s + op.impactoFinanceiro, 0);
  const altaPrioridade = oportunidades.filter(op => op.severidade === 'alta').length;
  const oportunidadeSemImpacto = oportunidades.filter(op => op.impactoFinanceiro <= 0);

  const totalVendas = efdData.resumo.totalVendas || 0;
  const totalCompras = efdData.resumo.totalCompras || 0;
  const somaDivergenciasIcms = conferenciasIcms.reduce((s, c) => s + c.diferenca, 0);
  const divergenciaTotal = modoIcms ? somaDivergenciasIcms : (efdData.riscoFiscal.totalPrincipal || 0);
  const multaTotal = modoIcms ? Math.round(somaDivergenciasIcms * 0.2 * 100) / 100 : (efdData.riscoFiscal.totalMulta || 0);
  const jurosTotal = efdData.riscoFiscal.totalJurosEstimado || 0;
  const totalGeralRisco = modoIcms ? somaDivergenciasIcms + multaTotal : (efdData.riscoFiscal.totalGeral || 0);

  const apurPorSaidaComIncidencia = efdData.vendas.filter(apuraDebitoPisCofins).length;
  const apurObs = efdData.vendas.length !== apurPorSaidaComIncidencia
    ? ` (${efdData.vendas.length} linhas totais — ${efdData.vendas.length - apurPorSaidaComIncidencia} de entrada/sem incidência excluídas da apuração de débito e da receita)`
    : '';

  const obsApur = modoIcms
    ? `Apuradas as conferências de fechamento do bloco E: ${efdData.icmsIpi?.conferencias.length ?? 0} de E110 (ICMS) e E510/E520 (IPI), sendo ${conferenciasIcms.length} divergente(s).`
    : `Apuradas ${apurPorSaidaComIncidencia} operação(ões) de venda com incidência de PIS/COFINS.${apurObs}`;

  const ganhoPorTipo = Object.entries(
    oportunidades.reduce((mapa, op) => {
      mapa[op.tipo] = (mapa[op.tipo] || 0) + 1;
      return mapa;
    }, {} as Record<string, number>)
  );

  const topOportunidades = [...oportunidades].sort((a, b) => b.impactoFinanceiro - a.impactoFinanceiro).slice(0, 5);

  const relatorios = gerarRelatoriosTextuais(oportunidades);
  const relatoriosPorId = new Map<string, ReturnType<typeof gerarRelatoriosTextuais>[number]>();
  relatorios.forEach(rel => { if (rel.oportunidade.id) relatoriosPorId.set(rel.oportunidade.id, rel); });

  const recomendacoes: string[] = [];
  const seenRec = new Set<string>();
  relatorios.forEach(rel => {
    rel.recomendacoes.forEach(r => { if (!seenRec.has(r)) { seenRec.add(r); recomendacoes.push(r); } });
  });

  const receitaPorProduto = calcularReceitaPorProduto(efdData);

  const tr = (cells: string) => `<tr>${cells}</tr>`;
  const th = (content: string, right = false) =>
    `<th${right ? ' style="text-align:right"' : ''}>${content}</th>`;
  const td = (content: string, right = false, nowrap = false) =>
    `<td${right ? ' style="text-align:right"' : ''}${nowrap ? ' class="nowrap"' : ''}>${content}</td>`;

  const rowMes = (l: LinhaPeriodo) => tr(
    td(`<strong>${esc(l.label)}</strong>`) +
    td(formatMilhar(l.qtdVendas), true) +
    td(formatMoeda(l.receita), true) +
    td(formatMoeda(l.pisInformado), true) +
    td(formatMoeda(l.pisDevido), true) +
    td(formatMoeda(l.pisDiferenca), true) +
    td(formatMoeda(l.cofinsInformado), true) +
    td(formatMoeda(l.cofinsDevido), true) +
    td(formatMoeda(l.cofinsDiferenca), true) +
    td(formatMoeda(l.multa), true) +
    td(formatMoeda(l.juros), true) +
    td(formatMoeda(l.totalComplementar), true)
  );

  const rowAno = (l: LinhaPeriodo) => tr(
    td(`<strong>${l.ano}</strong>`) +
    td(formatMilhar(l.qtdVendas), true) +
    td(formatMoeda(l.receita), true) +
    td(formatMoeda(l.pisDevido), true) +
    td(formatMoeda(l.pisDiferenca), true) +
    td(formatMoeda(l.cofinsDevido), true) +
    td(formatMoeda(l.cofinsDiferenca), true) +
    td(formatMoeda(l.multa), true) +
    td(formatMoeda(l.juros), true) +
    td(formatMoeda(l.totalComplementar), true)
  );

  const rowsMes = mensal.length > 0
    ? mensal.map(rowMes).join('')
    : `<tr><td colspan="12" style="text-align:center; color:#5A5B91;">Sem operações com data de apuração identificada nos arquivos.</td></tr>`;

  const rowsAno = anual.length > 0
    ? anual.map(rowAno).join('')
    : `<tr><td colspan="10" style="text-align:center; color:#5A5B91;">Sem dados por período.</td></tr>`;

  const headerMes = tr(
    th('Período de Apuração') + th('Vendas', true) + th('Receita', true) +
    (modoIcms
      ? th('ICMS a Recolher (E110)', true) + th('ICMS Apurado', true) + th('ICMS Dif.', true) +
        th('IPI Saldo Declarado (E520)', true) + th('IPI Apurado', true) + th('IPI Dif.', true)
      : th('PIS Informado', true) + th('PIS Devido', true) + th('PIS Dif.', true) +
        th('COFINS Informado', true) + th('COFINS Devido', true) + th('COFINS Dif.', true)) +
    th('Multa', true) + th('Juros SELIC', true) + th('Total a Complementar (est.)', true)
  );

  const headerAno = tr(
    th('Ano') + th('Vendas', true) + th('Receita', true) +
    (modoIcms
      ? th('ICMS Apurado', true) + th('ICMS Dif.', true) +
        th('IPI Apurado', true) + th('IPI Dif.', true)
      : th('PIS Devido', true) + th('PIS Dif.', true) +
        th('COFINS Devido', true) + th('COFINS Dif.', true)) +
    th('Multa', true) + th('Juros SELIC', true) + th('Total a Complementar (est.)', true)
  );

  // Divergências de itens (detalhe completo, com limite de segurança)
  const LIMITE_DIVERGENCIAS = 500;
  const divergenciasRows = efdData.riscoFiscal.itens.length > 0
    ? efdData.riscoFiscal.itens.slice(0, LIMITE_DIVERGENCIAS).map(item => tr(
        td(esc(item.produto)) +
        td(item.ncm) +
        td(item.documento) +
        td(item.dataOperacao) +
        td(formatMoeda(item.baseCalculo), true) +
        td(formatMoeda(item.principalDiferenca), true, true) +
        td(formatMoeda(item.multa), true, true) +
        td(formatMoeda(item.jurosEstimado), true, true) +
        td(formatMoeda(item.totalComMultaJuros), true, true)
      )).join('')
    : `<tr><td colspan="9" style="text-align:center; color:#5A5B91;">Nenhuma divergência identificada no período.</td></tr>`;

  const headerDivergencias = tr(
    th('Produto') + th('NCM') + th('Documento') + th('Data Operação') +
    th('Base de Cálculo', true) + th('Total PIS/COFINS', true) + th('Multa (20%)', true) + th('Juros SELIC', true) + th('Total Final', true)
  );

  const conferencias = efdData.icmsIpi?.conferencias ?? [];
  const divergenciasIcmsRows = modoIcms
    ? (conferencias.length > 0
        ? conferencias
            .filter(c => !c.fechou)
            .map(c => tr(
                td(`<strong>${esc(c.titulo)}</strong>`) +
                td(`<span class="badge badge-alta">NÃO FECHA</span>`) +
                td(formatMoeda(c.diferenca), true, true) +
                td(`<span style="font-size:0.85em; color:#5A5B91;">${esc(c.detalhes)}</span>`)
              )).join('')
        : `<tr><td colspan="4" style="text-align:center; color:#5A5B91;">Sem apuração no bloco E — não é possível conferir o fechamento.</td></tr>`)
    : '';
  const headerDivergenciasIcms = tr(
    th('Conferência') + th('Status') + th('Diferença', true) + th('Detalhes')
  );

  // Oportunidades consolidadas
  const oportunidadesRows = oportunidades.length > 0
    ? oportunidades.map(op => tr(
        td(`<strong>${esc(op.titulo)}</strong><div style="font-size:0.85em; color:#5A5B91;">${esc(op.produto || op.descricao)}${op.ncm ? ' · NCM ' + esc(op.ncm) : ''}${op.cfop ? ' · CFOP ' + esc(op.cfop) : ''}</div>`) +
        td(esc(TIPO_LABELS[op.tipo] || op.tipo)) +
        td(`<span class="badge badge-${op.severidade}">${op.severidade.toUpperCase()}</span>`) +
        td(formatMoeda(op.impactoFinanceiro), true, true)
      )).join('')
    : `<tr><td colspan="4" style="text-align:center; color:#5A5B91;">Nenhuma oportunidade de recuperação identificada.</td></tr>`;

  const headerOportunidades = tr(
    th('Oportunidade') + th('Categoria') + th('Prioridade') + th('Impacto Potencial (est.)', true)
  );

  // Detalhamento completo de cada oportunidade
  const detalheOportunidades = oportunidades.length > 0
    ? oportunidades.map((op, idx) => {
        const rel = relatoriosPorId.get(op.id);
        const classe = op.impactoFinanceiro > 0 ? '' : ' gray';
        return `<div class="op-card${classe}">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div>
              <strong style="font-size:1em;">${idx + 1}. ${esc(op.titulo)}</strong>
              <div style="font-size:0.85em; color:#5A5B91;">${esc(op.produto || op.descricao)}${op.ncm ? ' · NCM ' + esc(op.ncm) : ''}${op.cfop ? ' · CFOP ' + esc(op.cfop) : ''}${op.documento ? ' · Doc. ' + esc(op.documento) : ''}</div>
            </div>
            <div style="text-align:right;">
              <span class="badge badge-${op.severidade}">${op.severidade.toUpperCase()}</span>
              <div style="font-size:0.8em; color:#5A5B91; margin-top:2px;">${esc(TIPO_LABELS[op.tipo] || op.tipo)}</div>
              <div class="gain-text" style="margin-top:4px;">${formatMoeda(op.impactoFinanceiro)}</div>
            </div>
          </div>
          <div style="margin-top:12px; font-size:0.9em; color:#0B1220;">
            <p style="margin-bottom:6px;"><strong>Por que:</strong> ${esc(op.descricao)}${op.detalhamentoTecnico ? ' ' + esc(op.detalhamentoTecnico) : ''}</p>
            ${rel && rel.textoTecnico ? `<p style="white-space:pre-line; color:#5A5B91; margin:0 0 8px;">${esc(rel.textoTecnico)}</p>` : ''}
            <p style="margin-bottom:6px;"><strong>Ação recomendada:</strong> ${esc(op.acaoSugerida)}</p>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px,1fr)); gap:10px; margin-top:12px; font-size:0.85em;">
            <div style="background:#F7F8FA; border-radius:8px; padding:10px;"><strong>Base:</strong> ${formatMoeda(op.valorBase)}</div>
            ${op.aliquotaDevida !== undefined ? `<div style="background:#F7F8FA; border-radius:8px; padding:10px;"><strong>Alíq. devida:</strong> ${op.aliquotaDevida.toFixed(2)}%</div>` : ''}
            ${op.aliquotaAplicada !== undefined ? `<div style="background:#F7F8FA; border-radius:8px; padding:10px;"><strong>Alíq. aplicada:</strong> ${op.aliquotaAplicada.toFixed(2)}%</div>` : ''}
            <div style="background:#F7F8FA; border-radius:8px; padding:10px;"><strong>Ganho:</strong> <span class="gain-text">${formatMoeda(op.impactoFinanceiro)}</span></div>
          </div>
          ${rel && rel.fundamentacaoLegal.length > 0 ? `<div style="margin-top:10px; font-size:0.8em; color:#5A5B91;">
            <strong>Fundamentação legal:</strong> ${rel.fundamentacaoLegal.map(esc).join('; ')}</div>` : ''}
        </div>`;
      }).join('')
    : `<p class="subtitulo">Nenhuma oportunidade de recuperação identificada no período analisado.</p>`;

  const apuracaoPIS = efdData.apuracaoPIS;
  const apuracaoCOFINS = efdData.apuracaoCOFINS;
  const receitaDoc = efdData.receitaDocumental;
  const receitaAp = efdData.receitaApurada;

  // Receita vem do M210/M610, chaveada por código da contribuição (tabela 4.3.5);
  // crédito vem do M100/M500, chaveado por código de tipo de crédito (tabela 4.3.6).
  const linhaApuracao = (tributo: string, tipo: string, codigo: string, valor: number) =>
    `<tr><td>${tributo}</td><td>${tipo}</td><td>${esc(codigo)}</td><td class="nowrap" style="text-align:right">${formatMoeda(valor)}</td></tr>`;

  const apuracaoEntradas = [
    ...Object.entries(apuracaoPIS.receitas).map(([cod, v]) => linhaApuracao('PIS', 'Receita bruta', cod, v)),
    ...Object.entries(apuracaoCOFINS.receitas).map(([cod, v]) => linhaApuracao('COFINS', 'Receita bruta', cod, v)),
    ...Object.entries(apuracaoPIS.creditos).map(([cod, v]) => linhaApuracao('PIS', 'Crédito', cod, v)),
    ...Object.entries(apuracaoCOFINS.creditos).map(([cod, v]) => linhaApuracao('COFINS', 'Crédito', cod, v)),
  ];
  const apuracaoRows = apuracaoEntradas.length > 0
    ? apuracaoEntradas.join('')
    : `<tr><td colspan="4" style="text-align:center; color:#5A5B91;">Bloco M ausente no arquivo — sem apuração para conferir.</td></tr>`;

  // Ordem e valores dos registros E do bloco E (ICMS/IPI)
  const linhaApuracaoIcms = (tributo: string, reg: string, descricao: string, valor: number) =>
    `<tr><td>${tributo}</td><td>${descricao}</td><td class="nowrap" style="text-align:right">${formatMoeda(valor)}</td><td style="color:#5A5B91; font-size:0.8em;">${esc(reg)}</td></tr>`;

  const e110 = efdData.icmsIpi?.apuracaoIcms.e110;
  const e520 = efdData.icmsIpi?.apuracaoIpi.e520;
  const icmsRows = modoIcms ? [
    linhaApuracaoIcms('ICMS', 'E100/E110', 'Débitos (total + estornos de crédito e outros débitos)', e110?.debitos ?? 0),
    linhaApuracaoIcms('ICMS', 'E110', 'Créditos (total + estornos de débito e outros créditos)', e110?.creditos ?? 0),
    linhaApuracaoIcms('ICMS', 'E110', 'ICMS a recolher (declarado)', e110?.vlIcmsRecolher ?? 0),
    linhaApuracaoIcms('ICMS', 'E110', 'Saldo credor a transportar (declarado)', e110?.vlSldCredorTransportar ?? 0),
    linhaApuracaoIcms('IPI', 'E500', 'Débitos (saídas)', e520?.vlDebIpi ?? 0),
    linhaApuracaoIcms('IPI', 'E500', 'Créditos (entradas)', e520?.vlCredIpi ?? 0),
    linhaApuracaoIcms('IPI', 'E520', 'Saldo declarado (VL_SD_IPI − VL_SC_IPI)', e520?.saldoDeclarado ?? 0),
    linhaApuracaoIcms('IPI', 'E520', 'Saldo apurado (cálculo)', e520?.saldoRecalculado ?? 0),
  ].join('') : '';

  const produtosRows = receitaPorProduto.length > 0
    ? receitaPorProduto.map(p => tr(
        td(esc(p.produto)) +
        td(p.ncm) +
        td(formatMilhar(p.qtd), true) +
        td(formatMoeda(p.valor), true) +
        td(totalVendas > 0 ? ((p.valor / totalVendas) * 100).toFixed(2) + '%' : '0,00%', true)
      )).join('')
    : `<tr><td colspan="5" style="text-align:center; color:#5A5B91;">Sem produtos identificados.</td></tr>`;

  const recomendacoesRows = recomendacoes.length > 0
    ? recomendacoes.slice(0, 8).map(r => `<li>${esc(r)}</li>`).join('')
    : `<li style="color:#5A5B91;">Nenhuma recomendação adicional identificada.</li>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relatório Completo de Análise Fiscal - ${esc(efdData.cadastro.razaoSocial)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Manrope', 'Segoe UI', Arial, sans-serif; background: #F7F8FA; color: #0B1220; line-height: 1.55; padding: 32px 20px; }
  .container { max-width: 1100px; margin: 0 auto; }
  .header { background: #0B1220; color: #F7F8FA; padding: 46px 40px; border-radius: 16px; margin-bottom: 26px; }
  .header h1 { font-size: 1.9em; font-weight: 800; color: #fff; margin-bottom: 6px; }
  .header .slogan { color: #3882F6; font-weight: 600; margin-bottom: 22px; }
  .meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.85em; color: #B8C4E8; }
  .meta span { background: rgba(255,255,255,0.08); padding: 8px 14px; border-radius: 8px; }
  .meta strong { color: #fff; }
  .section { background: #fff; border: 1px solid #E3E7F0; border-radius: 12px; padding: 26px; margin-bottom: 22px; box-shadow: 0 1px 3px rgba(11,18,32,0.06); }
  .section h2 { font-size: 1.25em; font-weight: 700; color: #0B1220; margin-bottom: 14px; border-bottom: 2px solid #3882F6; padding-bottom: 8px; }
  .section .subtitulo { color: #5A5B91; font-size: 0.9em; margin-bottom: 16px; }
  .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; margin-bottom: 24px; }
  .kpi { background: #fff; border: 1px solid #E3E7F0; border-radius: 12px; padding: 18px; }
  .kpi .label { font-size: 0.75em; color: #5A5B91; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
  .kpi .value { font-size: 1.55em; font-weight: 800; margin-top: 6px; }
  .kpi .value.gain { color: #16A34A; }
  .kpi .value.navy { color: #0B1220; }
  .kpi .value.blue { color: #3882F6; }
  .kpi .value.red { color: #B91C1C; }
  table { width: 100%; border-collapse: collapse; font-size: 0.84em; }
  th { text-align: left; padding: 9px 10px; color: #5A5B91; font-weight: 600; border-bottom: 2px solid #E3E7F0; }
  td { padding: 8px 10px; border-bottom: 1px solid #EFF1F6; vertical-align: top; }
  .nowrap { white-space: nowrap; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 0.72em; font-weight: 700; }
  .badge-alta { background: #FEE2E2; color: #B91C1C; }
  .badge-media { background: #FEF3C7; color: #B45309; }
  .badge-baixa { background: #DBEAFE; color: #1D4ED8; }
  .gain-text { color: #16A34A; font-weight: 700; }
  ul { padding-left: 22px; }
  li { margin: 5px 0; }
  .file-list { list-style: none; padding-left: 0; }
  .file-list li { display: flex; align-items: center; gap: 8px; background: #F7F8FA; border: 1px solid #E3E7F0; border-radius: 8px; padding: 8px 12px; margin-bottom: 6px; }
  .file-list code { font-size: 0.85em; }
  .footer { text-align: center; color: #5A5B91; font-size: 0.82em; margin-top: 26px; padding-top: 18px; border-top: 2px solid #E3E7F0; }
  .footer strong { color: #0B1220; }
  .note { background: #F7F8FA; border: 1px solid #E3E7F0; border-radius: 10px; padding: 14px 16px; font-size: 0.86em; color: #5A5B91; }
  .disclaimer-box { background: #FFF7ED; border: 1px solid #FDBA74; border-left: 4px solid #EA580C; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; font-size: 0.85em; color: #7C2D12; }
  .op-card { border: 1px solid #E3E7F0; border-left: 4px solid #16A34A; border-radius: 10px; padding: 16px 18px; margin-bottom: 14px; }
  .op-card.gray { border-left-color: #94A3B8; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Relatório Completo de Análise Fiscal</h1>
    <div class="slogan">NAWELL · Inteligência Tributária — Transformamos Complexidade em Clareza.</div>
    <div class="meta">
      <span><strong>Empresa:</strong> ${esc(efdData.cadastro.razaoSocial)}</span>
      <span><strong>CNPJ:</strong> ${esc(efdData.cadastro.cnpj)}</span>
      <span><strong>UF:</strong> ${esc(efdData.cadastro.uf)}</span>
      <span><strong>Período:</strong> ${esc(efdData.cadastro.periodoInicialDisplay || '—')} a ${esc(efdData.cadastro.periodoFinalDisplay || '—')}</span>
      <span><strong>Regime:</strong> ${esc(regimeMeta)}</span>
      <span><strong>Documentos:</strong> ${documentosLabel}</span>
      <span><strong>Emissão:</strong> ${esc(dataGeracao)}</span>
    </div>
  </div>

  <div class="disclaimer-box">
    <strong>⚠ Valores ESTIMADOS:</strong> Todos os montantes deste relatório (divergências, multa, juros e impacto potencial de oportunidades) são <strong>estimativas calculadas por regras simplificadas</strong>. Não representam débito constituído, lançamento ou decisão da Receita Federal, nem crédito definitivo. Nenhum pagamento, compensação ou pedido de restituição (PER/DCOMP) deve ser feito antes de validação completa por contador e advogado tributarista.
  </div>

  <div class="kpis">
    <div class="kpi"><div class="label">Receita Total (Vendas)</div><div class="value navy">${formatMoeda(totalVendas)}</div></div>
    <div class="kpi"><div class="label">Total de Aquisições</div><div class="value navy">${formatMoeda(totalCompras)}</div></div>
    <div class="kpi"><div class="label">Total Estimado a Complementar</div><div class="value red">${formatMoeda(divergenciaTotal)}</div></div>
    <div class="kpi"><div class="label">Multa + Juros (est.)</div><div class="value red">${formatMoeda(multaTotal + jurosTotal)}</div></div>
    <div class="kpi"><div class="label">Ganho Potencial (est.)</div><div class="value gain">${formatMoeda(ganhoPotencial)}</div></div>
    <div class="kpi"><div class="label">Oportunidades</div><div class="value blue">${oportunidades.length}</div></div>
  </div>

  <div class="section">
    <h2>1. Documentos Analisados</h2>
    <p class="subtitulo">Dados extraídos de ${documentosLabel} da escrituração ${obrigacaoNome}, cobrindo o período de ${esc(efdData.cadastro.periodoInicialDisplay || '—')} a ${esc(efdData.cadastro.periodoFinalDisplay || '—')}.</p>
    <ul class="file-list">
      ${(arquivosFonte.length > 0 ? arquivosFonte : ['arquivo EFD']).map(a => `<li>📄 <code>${esc(a)}</code></li>`).join('')}
    </ul>
  </div>

  <div class="section">
    <h2>2. Apuração Consolidada do Período</h2>
    <p class="subtitulo">${modoIcms
      ? 'Apuração dos impostos declarada no bloco E (E100/E110 do ICMS e E500/E520 do IPI), com as conferências de fechamento calculadas. A receita documental (blocos A, C, D e F) é apresentada nas seções 3 e 4. '
      : 'Reconciliação (estimada) entre receita documental (Blocos A, C, D e F) e receita apurada nos registros M210/M610. '}${obsApur}</p>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px,1fr)); gap:12px; margin-bottom:16px;">
      ${modoIcms ? `
      <div class="note"><strong>ICMS a recolher (E110):</strong> ${formatMoeda(efdData.icmsIpi?.resumo.icmsRecolher ?? 0)}</div>
      <div class="note"><strong>IPI saldo declarado (E520):</strong> ${formatMoeda(efdData.icmsIpi?.resumo.ipiSaldo ?? 0)}</div>
      <div class="note"><strong>Conferências de fechamento:</strong> ${conferenciasIcms.length} divergente(s)</div>
      <div class="note"><strong>Obrigações a recolher (E116):</strong> ${efdData.icmsIpi?.apuracaoIcms.e116.length ?? 0} registro(s)</div>
      ${efdData.icmsIpi?.conferencias.map(c => `<div class="note"><strong>${esc(c.titulo)}:</strong> ${c.fechou ? 'fecha' : 'NÃO fecha'}</div>`).join('') || ''}` : `
      <div class="note"><strong>Bloco A:</strong> ${formatMoeda(receitaDoc.blocoA)}</div>
      <div class="note"><strong>Bloco C:</strong> ${formatMoeda(receitaDoc.blocoC)}</div>
      <div class="note"><strong>Bloco D:</strong> ${formatMoeda(receitaDoc.blocoD)}</div>
      <div class="note"><strong>Bloco F:</strong> ${formatMoeda(receitaDoc.blocoF)}</div>
      <div class="note"><strong>Receita Documental:</strong> ${formatMoeda(receitaDoc.total)}</div>
      <div class="note"><strong>Apuração M210 (PIS):</strong> ${formatMoeda(receitaAp.pisM210)}</div>
      <div class="note"><strong>Apuração M610 (COFINS):</strong> ${formatMoeda(receitaAp.cofinsM610)}</div>`}
    </div>
    ${modoIcms ? `
    <table>
      <thead><tr><th>Tributo</th><th>Descrição</th><th style="text-align:right">Valor</th><th>Registro</th></tr></thead>
      <tbody>${icmsRows || `<tr><td colspan="4" style="text-align:center; color:#5A5B91;">Bloco E ausente no arquivo — sem apuração para conferir.</td></tr>`}</tbody>
    </table>` : `
    <table>
      <thead><tr><th>Tributo</th><th>Tipo</th><th>Código</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>${apuracaoRows}</tbody>
    </table>`}
  </div>

  <div class="section">
    <h2>3. Detalhamento por Ano</h2>
    <p class="subtitulo">Consolidação anual de receitas, tributos informados/devidos, divergências e encargos.</p>
    <table>
      <thead>${headerAno}</thead>
      <tbody>${rowsAno}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>4. Detalhamento por Mês de Apuração</h2>
    <p class="subtitulo">Todos os períodos de apuração identificados nos ${documentosLabel} consolidados, ordenados cronologicamente.</p>
    <table>
      <thead>${headerMes}</thead>
      <tbody>${rowsMes}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>5. Receita por Produto</h2>
    <p class="subtitulo">Produtos com maior participação na receita do período (Top ${receitaPorProduto.length}).</p>
    <table>
      <thead>${tr(th('Produto') + th('NCM') + th('Quantidade', true) + th('Valor', true) + th('% Receita', true))}</thead>
      <tbody>${produtosRows}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>6. Divergências Estimadas ${modoIcms ? 'de Fechamento (Bloco E)' : 'de PIS/COFINS'}</h2>
    ${modoIcms ? `
    <p class="subtitulo"><strong>Estimativa:</strong> ${conferenciasIcms.length} conferência(s) de fechamento do bloco E sem confirmação (diferença acima de R$ 0,02 no campo recalculado × declarado). Diferença total estimada: ${formatMoeda(conferenciasIcms.reduce((s, c) => s + c.diferenca, 0))}. Cada caso pode representar débito não recolhido, crédito não escriturado ou erro de preenchimento — valores sujeitos a validação contra GIA/ECF e livros fiscais.</p>
    <table>
      <thead>${headerDivergenciasIcms}</thead>
      <tbody>${divergenciasIcmsRows}</tbody>
    </table>
    ${conferencias.filter(c => c.fechou).length > 0 ? `<p class="subtitulo" style="margin-top:10px">${conferencias.filter(c => c.fechou).length} conferência(s) confirmada(s): ${conferencias.filter(c => c.fechou).map(c => esc(c.titulo)).join(' · ')}.</p>` : ''}` : `
    <p class="subtitulo"><strong>Estimativa:</strong> ${efdData.riscoFiscal.itens.length} item(ns) de saída com incidência cujo tributo informado ficou abaixo do devido calculado. Principal estimado: ${formatMoeda(divergenciaTotal)} · Multa (est.): ${formatMoeda(multaTotal)} · Juros (est.): ${formatMoeda(jurosTotal)} · <strong>Total estimado: ${formatMoeda(totalGeralRisco)}</strong>. Valores sujeitos a validação — não caracterizam débito constituído.</p>
    <table>
      <thead>${headerDivergencias}</thead>
      <tbody>${divergenciasRows}</tbody>
    </table>
    ${efdData.riscoFiscal.itens.length > LIMITE_DIVERGENCIAS ? `<p class="subtitulo" style="margin-top:10px">Exibidas ${LIMITE_DIVERGENCIAS} de ${efdData.riscoFiscal.itens.length} divergências. A lista completa está disponível na aplicação.</p>` : ''}`}
  </div>

  <div class="section">
    <h2>7. Oportunidades de Recuperação Tributária</h2>
    <p class="subtitulo"><strong>Estimativa:</strong> ${oportunidades.length} oportunidades com impacto potencial total de <strong class="gain-text">${formatMoeda(ganhoPotencial)}</strong> no período (${altaPrioridade} de alta prioridade). Ganho potencial ≠ crédito garantido: depende de validação jurídica, decadência, documentos e PER/DCOMP.</p>
    ${ganhoPorTipo.length > 0 ? `<p class="subtitulo">Por categoria: ${ganhoPorTipo.map(([tipo, qtd]) => esc(TIPO_LABELS[tipo] || tipo) + ' (' + qtd + 'x)').join(' · ')}</p>` : ''}
    <table>
      <thead>${headerOportunidades}</thead>
      <tbody>${oportunidadesRows}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>8. Principais Oportunidades</h2>
    <table>
      <thead><tr><th>Oportunidade</th><th>NCM</th><th>Prioridade</th><th style="text-align:right">Impacto Potencial (est.)</th></tr></thead>
      <tbody>
        ${topOportunidades.length > 0 ? topOportunidades.map(op => `<tr>
          <td><strong>${esc(op.titulo)}</strong><div style="font-size:0.85em; color:#5A5B91;">${esc(op.descricao)}</div></td>
          <td>${esc(op.ncm || '—')}</td>
          <td><span class="badge badge-${op.severidade}">${op.severidade.toUpperCase()}</span></td>
          <td class="gain-text nowrap" style="text-align:right">${formatMoeda(op.impactoFinanceiro)}</td>
        </tr>`).join('') : `<tr><td colspan="4" style="text-align:center; color:#5A5B91;">Nenhuma oportunidade identificada.</td></tr>`}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>9. Detalhamento das Oportunidades</h2>
    <p class="subtitulo">Cada caso com o fundamento técnico, valores envolvidos e a ação recomendada.</p>
    ${detalheOportunidades}
    ${oportunidadeSemImpacto.length > 0 ? `<p class="subtitulo">${oportunidadeSemImpacto.length} oportunidade(s) sem impacto financeiro mensurável foram mantidas para controle.</p>` : ''}
  </div>

  <div class="section">
    <h2>10. Plano de Ação Recomendado</h2>
    <ul>
      ${recomendacoesRows}
    </ul>
    <p style="margin-top:12px; font-size:0.85em; color:#5A5B91;">
      Prazo decadencial: pedidos de restituição/compensação devem ser protocolados em até 5 anos da ocorrência do fato gerador (Art. 168, I do CTN).
    </p>
  </div>

  ${alertas.length > 0 ? `
  <div class="section">
    <h2>11. Alertas Identificados</h2>
    <table>
      <thead><tr><th>Tipo</th><th>Grupo</th><th>Severidade</th><th>Mensagem</th></tr></thead>
      <tbody>
        ${alertas.slice(0, 150).map(a => `<tr>
          <td>${esc(a.tipo)}</td>
          <td>${esc(a.grupo || '')}</td>
          <td><span class="badge badge-${a.severidade}">${(a.severidade || '').toUpperCase()}</span></td>
          <td>${esc(a.mensagem)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <div class="footer">
    <p><strong>NAWELL — Inteligência Tributária</strong></p>
    <p>Transformamos Complexidade em Clareza.</p>
    <p>Este relatório é uma ferramenta de apoio à decisão e NÃO constitui opinião legal, contábil ou tributária. Todos os valores são estimativas geradas por regras automatizadas e simplificadas a partir da escrituração ${obrigacaoNome} (${documentosLabel}); podem conter erros (inclusive por base de cálculo, CST, NCM/CFOP ou alíquota incorretos no arquivo-fonte) e não refletem lançamentos, autuações, prazos de decadência/prescrição ou compensações já efetuadas. Use com validação de um contador habilitado e advogado tributarista antes de qualquer pagamento, retificação ou pedido de restituição/compensação.</p>
  </div>
</div>
</body>
</html>`;
};