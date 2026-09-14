import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  Download, TrendingUp, Lightbulb, Target, ShieldCheck, Sparkles,
  ArrowRight, FileText, CalendarClock, Building2, FileBarChart, ListChecks,
  FileStack
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { EFDData } from '@/utils/efdParser';
import {
  detectarTodasOportunidades,
  OportunidadeTributaria,
} from '@/utils/detectarOportunidadesTributarias';
import { gerarRelatoriosTextuais, RelatorioTextual } from '@/utils/gerarRelatorioTextual';
import { toast } from 'sonner';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';

interface GainsReportProps {
  efdData: EFDData;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2
  }).format(value);
};

const CHART_COLORS = ['#0B1220', '#1E2A45', '#3882F6', '#5A5B91', '#7FA7F0'];

const TIPO_LABELS: Record<string, string> = {
  'CREDITO_NAO_APROVEITADO': 'Créditos Não Aproveitados',
  'PAGAMENTO_A_MAIOR': 'Pagamentos a Maior',
  'INCONSISTENCIA_CST': 'Inconsistências de CST',
  'INCONSISTENCIA_CFOP': 'Inconsistências de CFOP',
  'MONOFASICO_INCORRETO': 'Tributação Monofásica Incorreta',
  'SALDO_CREDOR_ICMS': 'Saldos Credores de ICMS',
  'SALDO_CREDOR_IPI': 'Saldos Credores de IPI',
  'FECHAMENTO_DIVERGENTE': 'Fechamentos Divergentes'
};

const getSeveridadeBadge = (severidade: string) => {
  switch (severidade) {
    case 'alta': return <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">Alta Prioridade</Badge>;
    case 'media': return <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">Prioridade Média</Badge>;
    case 'baixa': return <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">Prioridade Baixa</Badge>;
    default: return null;
  }
};

export const GainsReport: React.FC<GainsReportProps> = React.memo(({ efdData }) => {
  const oportunidades = useMemo(() => detectarTodasOportunidades(efdData), [efdData]);
  const relatorios = useMemo(() => gerarRelatoriosTextuais(oportunidades), [oportunidades]);

  // Evidência documental: arquivos que originam o relatório
  const arquivosFonte = efdData.fontes?.arquivos ?? [];
  const qtdArquivos = arquivosFonte.length || efdData.fontes?.quantidade || 1;
  const documentosLabel = `${qtdArquivos} arquivo${qtdArquivos > 1 ? 's' : ''} EFD`;

  const ganhoPotencial = useMemo(() =>
    oportunidades.reduce((sum, op) => sum + op.impactoFinanceiro, 0),
    [oportunidades]
  );

  const ganhoPorTipo = useMemo(() => {
    const mapa: Record<string, number> = {};
    oportunidades.forEach(op => {
      mapa[op.tipo] = (mapa[op.tipo] || 0) + op.impactoFinanceiro;
    });
    return Object.entries(mapa)
      .map(([tipo, valor]) => ({ tipo: TIPO_LABELS[tipo] || tipo, valor, quantidade: oportunidades.filter(o => o.tipo === tipo).length }))
      .sort((a, b) => b.valor - a.valor);
  }, [oportunidades]);

  const altaPrioridade = useMemo(() =>
    oportunidades.filter(op => op.severidade === 'alta').length,
    [oportunidades]
  );

  const ncmEnvolvidos = useMemo(() => {
    const set = new Set<string>();
    oportunidades.forEach(op => { if (op.ncm) set.add(op.ncm); });
    return set.size;
  }, [oportunidades]);

  const topOportunidades = useMemo(() =>
    [...oportunidades].sort((a, b) => b.impactoFinanceiro - a.impactoFinanceiro).slice(0, 5),
    [oportunidades]
  );

  const oportunidadesOrdenadas = useMemo(() =>
    [...oportunidades].sort((a, b) => b.impactoFinanceiro - a.impactoFinanceiro),
    [oportunidades]
  );

  const relatoriosPorId = useMemo(() => {
    const mapa = new Map<string, RelatorioTextual>();
    relatorios.forEach(rel => { if (rel.oportunidade.id) mapa.set(rel.oportunidade.id, rel); });
    return mapa;
  }, [relatorios]);

  const obterRelatorio = (op: OportunidadeTributaria) => relatoriosPorId.get(op.id);

  const recomendacoes = useMemo(() => {
    const seen = new Set<string>();
    const recs: string[] = [];
    relatorios.forEach(rel => {
      rel.recomendacoes.forEach(r => {
        if (!seen.has(r)) { seen.add(r); recs.push(r); }
      });
    });
    return recs;
  }, [relatorios]);

  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const handleExportHTML = () => {
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relatório de Ganhos Fiscais - ${efdData.cadastro.razaoSocial}</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Manrope', sans-serif; background: #F7F8FA; color: #0B1220; line-height: 1.6; padding: 40px 24px; }
  .container { max-width: 1100px; margin: 0 auto; }
  .header { background: #0B1220; color: #F7F8FA; padding: 48px 40px; border-radius: 16px; margin-bottom: 32px; }
  .header h1 { font-size: 2em; font-weight: 800; color: #fff; margin-bottom: 8px; }
  .header .slogan { color: #3882F6; font-weight: 600; margin-bottom: 20px; }
  .meta { display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.9em; color: #B8C4E8; }
  .meta span { background: rgba(255,255,255,0.08); padding: 8px 14px; border-radius: 8px; }
  .section { background: #fff; border: 1px solid #E3E7F0; border-radius: 12px; padding: 28px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(11,18,32,0.06); }
  .section h2 { font-size: 1.3em; font-weight: 700; color: #0B1220; margin-bottom: 16px; border-bottom: 2px solid #3882F6; padding-bottom: 8px; }
  .resumo { background: #0B1220; color: #F7F8FA; border: none; }
  .resumo h2 { border-color: #3882F6; color: #fff; }
  .resumo p { color: #B8C4E8; margin-bottom: 8px; }
  .resumo strong { color: #fff; }
  .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .kpi { background: #fff; border: 1px solid #E3E7F0; border-radius: 12px; padding: 20px; }
  .kpi .label { font-size: 0.8em; color: #5A5B91; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
  .kpi .value { font-size: 1.7em; font-weight: 800; margin-top: 6px; }
  .kpi .value.gain { color: #16A34A; }
  .kpi .value.navy { color: #0B1220; }
  .kpi .value.blue { color: #3882F6; }
  table { width: 100%; border-collapse: collapse; font-size: 0.92em; }
  th { text-align: left; padding: 10px 12px; color: #5A5B91; font-weight: 600; border-bottom: 2px solid #E3E7F0; }
  td { padding: 10px 12px; border-bottom: 1px solid #EFF1F6; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 0.75em; font-weight: 700; }
  .badge-alta { background: #FEE2E2; color: #B91C1C; }
  .badge-media { background: #FEF3C7; color: #B45309; }
  .badge-baixa { background: #DBEAFE; color: #1D4ED8; }
  .gain-text { color: #16A34A; font-weight: 700; }
  ul { padding-left: 22px; }
  li { margin: 6px 0; color: #0B1220; }
  .footer { text-align: center; color: #5A5B91; font-size: 0.85em; margin-top: 32px; padding-top: 20px; border-top: 2px solid #E3E7F0; }
  .footer strong { color: #0B1220; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Relatório de Ganhos Fiscais</h1>
    <div class="slogan">Transformamos Complexidade em Clareza.</div>
    <div class="meta">
      <span><strong>Empresa:</strong> ${efdData.cadastro.razaoSocial}</span>
      <span><strong>CNPJ:</strong> ${efdData.cadastro.cnpj}</span>
      <span><strong>Período:</strong> ${efdData.cadastro.periodoInicialDisplay} a ${efdData.cadastro.periodoFinalDisplay}</span>
      <span><strong>Regime:</strong> ${efdData.regime.descricao}</span>
      <span><strong>Documentos analisados:</strong> ${documentosLabel}</span>
      <span><strong>Emissão:</strong> ${dataGeracao}</span>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi"><div class="label">Ganho Potencial Total</div><div class="value gain">${formatCurrency(ganhoPotencial)}</div></div>
    <div class="kpi"><div class="label">Oportunidades Identificadas</div><div class="value navy">${oportunidades.length}</div></div>
    <div class="kpi"><div class="label">Alta Prioridade</div><div class="value blue">${altaPrioridade}</div></div>
    <div class="kpi"><div class="label">NCMs Envolvidos</div><div class="value navy">${ncmEnvolvidos}</div></div>
  </div>

  <div class="section">
    <h2>Documentos Base da Análise</h2>
    <p style="color:#5A5B91; margin-bottom:12px;">Os dados deste relatório foram extraídos de <strong>${documentosLabel}</strong> da escrituração EFD-Contribuições, abrangendo o período de ${efdData.cadastro.periodoInicialDisplay} a ${efdData.cadastro.periodoFinalDisplay}:</p>
    <ul>
      ${(arquivosFonte.length > 0 ? arquivosFonte : ['arquivo EFD Contribuições']).map(a => `<li><code style="background:#F7F8FA; border:1px solid #E3E7F0; border-radius:6px; padding:2px 8px; font-size:0.9em;">${a}</code></li>`).join('')}
    </ul>
  </div>

  <div class="section resumo">
    <h2>Resumo Executivo</h2>
    <p>A análise da escrituração fiscal digital (EFD-Contribuições) da empresa identificou <strong>${oportunidades.length} oportunidades de recuperação e otimização tributária</strong>, com potencial de ganho total estimado de <strong>${formatCurrency(ganhoPotencial)}</strong> no período analisado.</p>
    <p>Os valores representam <strong>créditos de PIS/COFINS não aproveitados</strong>, <strong>pagamentos efetuados a maior</strong> e <strong>tributação indevida em operações monofásicas</strong>. A materialização desses ganhos depende de análise documental complementar, validação contábil e, quando aplicável, protocolização de pedidos de restituição/compensação (PER/DCOMP) dentro do prazo decadencial de cinco anos.</p>
  </div>

  <div class="section">
    <h2>Ganho Potencial por Categoria</h2>
    <table>
      <thead><tr><th>Categoria</th><th>Ocorrências</th><th style="text-align:right">Valor Potencial</th></tr></thead>
      <tbody>
        ${ganhoPorTipo.map(g => `<tr><td>${g.tipo}</td><td>${g.quantidade}</td><td class="gain-text" style="text-align:right">${formatCurrency(g.valor)}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Principais Oportunidades</h2>
    <table>
      <thead><tr><th>Oportunidade</th><th>Categoria</th><th>NCM</th><th>Prioridade</th><th style="text-align:right">Ganho Potencial</th></tr></thead>
      <tbody>
        ${topOportunidades.map(op => `<tr>
          <td><strong>${op.titulo}</strong></td>
          <td>${TIPO_LABELS[op.tipo] || op.tipo}</td>
          <td>${op.ncm || '—'}</td>
          <td><span class="badge badge-${op.severidade}">${op.severidade.toUpperCase()}</span></td>
          <td class="gain-text" style="text-align:right">${formatCurrency(op.impactoFinanceiro)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Detalhamento das Oportunidades</h2>
    <p style="color:#5A5B91; margin-bottom:16px;">${oportunidadesOrdenadas.length} casos identificados. Cada ganho detalha a operação, o fundamento técnico do aproveitamento e a ação recomendada.</p>
    ${oportunidadesOrdenadas.map(op => {
      const rel = obterRelatorio(op);
      return `<div style="border:1px solid #E3E7F0; border-left:4px solid #16A34A; border-radius:10px; padding:16px 18px; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <strong style="font-size:1em;">${op.titulo}</strong>
            <div style="font-size:0.85em; color:#5A5B91;">${op.produto || op.descricao}${op.ncm ? ' · NCM ' + op.ncm : ''}${op.cfop ? ' · CFOP ' + op.cfop : ''}${op.cst ? ' · ' + op.cst : ''}</div>
          </div>
          <div style="text-align:right;">
            <span class="badge badge-${op.severidade}">${op.severidade.toUpperCase()}</span>
            <div class="gain-text" style="margin-top:4px;">${formatCurrency(op.impactoFinanceiro)}</div>
          </div>
        </div>
        <div style="margin-top:12px; font-size:0.9em; color:#0B1220;">
          <p style="margin-bottom:6px;"><strong>Por que:</strong> ${op.descricao} ${op.detalhamentoTecnico || ''}</p>
          ${rel && rel.textoTecnico ? `<p style="white-space:pre-line; color:#5A5B91; margin-bottom:8px;">${rel.textoTecnico}</p>` : ''}
          <p style="margin-bottom:6px;"><strong>Ação recomendada:</strong> ${op.acaoSugerida}</p>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px,1fr)); gap:10px; margin-top:12px; font-size:0.85em;">
          <div style="background:#F7F8FA; border-radius:8px; padding:10px;">Base: <strong>${formatCurrency(op.valorBase)}</strong></div>
          ${op.aliquotaDevida !== undefined ? `<div style="background:#F7F8FA; border-radius:8px; padding:10px;">Alíq. devida: <strong>${op.aliquotaDevida.toFixed(2)}%</strong></div>` : ''}
          ${op.aliquotaAplicada !== undefined ? `<div style="background:#F7F8FA; border-radius:8px; padding:10px;">Alíq. aplicada: <strong>${op.aliquotaAplicada.toFixed(2)}%</strong></div>` : ''}
          <div style="background:#F7F8FA; border-radius:8px; padding:10px;">Ganho: <strong class="gain-text">${formatCurrency(op.impactoFinanceiro)}</strong></div>
        </div>
        ${rel && rel.fundamentacaoLegal.length > 0 ? `<div style="margin-top:10px; font-size:0.8em; color:#5A5B91;">
          <strong>Fundamentação legal:</strong> ${rel.fundamentacaoLegal.join('; ')}</div>` : ''}
      </div>`;
    }).join('')}
  </div>

  <div class="section">
    <h2>Plano de Ação Recomendado</h2>
    <ul>
      ${recomendacoes.slice(0, 8).map(r => `<li>${r}</li>`).join('')}
    </ul>
  </div>

  <div class="footer">
    <p><strong>NAWELL — Inteligência Tributária</strong></p>
    <p>Transformamos Complexidade em Clareza.</p>
    <p>Relatório gerado automaticamente para fins de análise e planejamento tributário. Valores são estimativas e não substituem análise jurídica ou contábil especializada.</p>
  </div>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_ganhos_${efdData.cadastro.cnpj}_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    toast.success('Relatório HTML exportado');
  };

  const handleExportMD = () => {
    let md = `# Relatório de Ganhos Fiscais\n\n`;
    md += `**Empresa:** ${efdData.cadastro.razaoSocial}  \n`;
    md += `**CNPJ:** ${efdData.cadastro.cnpj}  \n`;
    const documentosDetalhe = arquivosFonte.length > 0 ? ` — ${arquivosFonte.join(', ')}` : '';
    md += `**Período:** ${efdData.cadastro.periodoInicialDisplay} a ${efdData.cadastro.periodoFinalDisplay}  \n`;
    md += `**Regime:** ${efdData.regime.descricao}  \n`;
    md += `**Documentos analisados:** ${documentosLabel}${documentosDetalhe}  \n`;
    md += `**Emissão:** ${dataGeracao}  \n\n`;
    md += `---\n\n## Resumo Executivo\n\n`;
    md += `Foram identificadas **${oportunidades.length} oportunidades** com potencial de ganho total de **${formatCurrency(ganhoPotencial)}**.\n\n`;
    md += `## Ganho Potencial por Categoria\n\n`;
    ganhoPorTipo.forEach(g => {
      md += `- **${g.tipo}**: ${g.quantidade} ocorrência(s) — ${formatCurrency(g.valor)}\n`;
    });
    md += `\n## Principais Oportunidades\n\n`;
    topOportunidades.forEach((op, i) => {
      md += `${i + 1}. **${op.titulo}** (${TIPO_LABELS[op.tipo] || op.tipo}) — ${formatCurrency(op.impactoFinanceiro)}\n`;
      if (op.ncm) md += `   - NCM: ${op.ncm} | Prioridade: ${op.severidade.toUpperCase()}\n`;
    });

    md += `\n## Detalhamento das Oportunidades\n\n`;
    md += `Total de **${oportunidadesOrdenadas.length} casos** identificados.\n\n`;
    oportunidadesOrdenadas.forEach((op, i) => {
      const rel = obterRelatorio(op);
      md += `### ${i + 1}. ${op.titulo} — ${formatCurrency(op.impactoFinanceiro)}  \n`;
      md += `- **Categoria:** ${TIPO_LABELS[op.tipo] || op.tipo}  \n`;
      md += `- **Prioridade:** ${op.severidade.toUpperCase()}  \n`;
      if (op.produto) md += `- **Produto:** ${op.produto}  \n`;
      if (op.ncm) md += `- **NCM:** ${op.ncm}  \n`;
      if (op.cfop) md += `- **CFOP:** ${op.cfop}  \n`;
      if (op.cst) md += `- **CST:** ${op.cst}  \n`;
      if (op.documento) md += `- **Documento:** ${op.documento}  \n`;
      md += `- **Base de cálculo:** ${formatCurrency(op.valorBase)}  \n`;
      if (op.aliquotaDevida !== undefined) md += `- **Alíquota devida:** ${op.aliquotaDevida.toFixed(2)}%  \n`;
      if (op.aliquotaAplicada !== undefined) md += `- **Alíquota aplicada:** ${op.aliquotaAplicada.toFixed(2)}%  \n`;
      md += `- **Ganho potencial:** ${formatCurrency(op.impactoFinanceiro)}  \n`;
      md += `- **Por que:** ${op.descricao}${op.detalhamentoTecnico ? ' ' + op.detalhamentoTecnico : ''}  \n`;
      md += `- **Ação recomendada:** ${op.acaoSugerida}  \n`;
      if (rel && rel.fundamentacaoLegal.length > 0) {
        md += `- **Fundamentação legal:** ${rel.fundamentacaoLegal.join('; ')}  \n`;
      }
      md += `\n`;
    });
    md += `\n## Plano de Ação Recomendado\n\n`;
    recomendacoes.slice(0, 8).forEach(r => {
      md += `- ${r}\n`;
    });
    md += `\n---\n*Relatório gerado pelo NAWELL — Inteligência Tributária*\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_ganhos_${efdData.cadastro.cnpj}_${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    toast.success('Relatório Markdown exportado');
  };

  if (oportunidades.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="p-6 border border-border/70 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/10 border border-success/20">
              <ShieldCheck className="w-6 h-6 text-success" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-efd-secondary">Nenhuma oportunidade de ganho identificada</h2>
              <p className="text-sm text-muted-foreground">
                A análise não encontrou créditos não aproveitados, pagamentos a maior ou inconsistências recuperáveis no período.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-manrope">
      {/* Capa do relatório */}
      <div className="relative overflow-hidden rounded-2xl bg-sidebar border border-sidebar-border p-8 shadow-sm">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-sidebar-foreground/70 font-semibold mb-2">
                NAWELL · Inteligência Tributária
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                Relatório de Ganhos Fiscais
              </h1>
              <p className="text-sidebar-foreground/80 font-medium mt-1">
                Transformamos Complexidade em Clareza.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="bg-white/5 border-white/15 text-white hover:bg-white/10" onClick={handleExportHTML}>
                <Download className="mr-2 h-4 w-4" /> HTML
              </Button>
              <Button variant="outline" size="sm" className="bg-white/5 border-white/15 text-white hover:bg-white/10" onClick={handleExportMD}>
                <FileText className="mr-2 h-4 w-4" /> Markdown
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-sm text-sidebar-foreground/80">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="font-semibold text-white">{efdData.cadastro.razaoSocial}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-sidebar-foreground/70 font-mono">
              CNPJ: {efdData.cadastro.cnpj}
            </div>
            <div className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
              <CalendarClock className="w-4 h-4 text-primary" />
              {efdData.cadastro.periodoInicialDisplay} a {efdData.cadastro.periodoFinalDisplay}
            </div>
            <div className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
              <FileStack className="w-4 h-4 text-primary" />
              {documentosLabel}
              {arquivosFonte.length > 1 && (
                <span className="text-sidebar-foreground/50">({arquivosFonte.join(', ')})</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
              Regime: {efdData.regime.descricao}
            </div>
            <div className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
              Emissão: {dataGeracao}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-success/25 bg-success/5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Ganho Potencial Total</p>
            <div className="p-2 rounded-lg bg-success/10 border border-success/20">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
          </div>
          <p className="text-2xl font-bold text-success mt-2">{formatCurrency(ganhoPotencial)}</p>
          <p className="text-xs text-muted-foreground mt-1">Recuperação potencial no período</p>
        </Card>

        <Card className="p-5 border border-border/70 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Oportunidades</p>
            <div className="p-2 rounded-lg bg-efd-primary/10 border border-efd-primary/20">
              <Lightbulb className="w-5 h-5 text-efd-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-efd-secondary mt-2">{oportunidades.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Casos identificados</p>
        </Card>

        <Card className="p-5 border border-border/70 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Alta Prioridade</p>
            <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
              <Target className="w-5 h-5 text-destructive" />
            </div>
          </div>
          <p className="text-2xl font-bold text-efd-secondary mt-2">{altaPrioridade}</p>
          <p className="text-xs text-muted-foreground mt-1">Requerem ação imediata</p>
        </Card>

        <Card className="p-5 border border-border/70 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">NCMs Envolvidos</p>
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-efd-secondary mt-2">{ncmEnvolvidos}</p>
          <p className="text-xs text-muted-foreground mt-1">Produtos analisados</p>
        </Card>
      </div>

      {/* Evidência documental */}
      <Card className="p-6 border border-primary/25 bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <FileStack className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-efd-secondary">Documentos Analisados</h3>
            <p className="text-sm text-muted-foreground">
              Arquivos EFD-Contribuições que originam este relatório
            </p>
          </div>
          <Badge variant="outline" className="ml-auto border-primary/30 bg-primary/10 text-primary">
            {documentosLabel}
          </Badge>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {(arquivosFonte.length > 0 ? arquivosFonte : ['Arquivo EFD Contribuições']).map((nome, i) => (
            <li
              key={`${nome}-${i}`}
              className="flex items-center gap-2.5 p-3 rounded-lg bg-background/80 border border-border/60"
            >
              <FileText className="w-4 h-4 text-success shrink-0" />
              <span className="font-mono text-sm truncate">{nome}</span>
              <ShieldCheck className="w-4 h-4 text-muted-foreground/60 ml-auto shrink-0" />
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground mt-3">
          Consolidação referente ao período de {efdData.cadastro.periodoInicialDisplay || '—'} a{' '}
          {efdData.cadastro.periodoFinalDisplay || '—'} · {efdData.vendas.length} itens de venda
          analisados · {efdData.compras.length} itens de aquisição.
        </p>
      </Card>

      {/* Resumo Executivo */}
      <Card className="p-6 border border-border/70 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-efd-primary/10 border border-efd-primary/20">
            <FileBarChart className="w-6 h-6 text-efd-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-efd-secondary">Resumo Executivo</h3>
            <p className="text-sm text-muted-foreground">
              Visão consolidada para apresentação à diretoria
            </p>
          </div>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            A análise da escrituração fiscal digital (EFD-Contribuições) identificou{' '}
            <strong className="text-foreground">{oportunidades.length} oportunidades de recuperação e otimização tributária</strong>,
            com potencial de ganho total estimado de{' '}
            <strong className="text-success">{formatCurrency(ganhoPotencial)}</strong> no período analisado.
          </p>
          <p>
            Os valores representam <strong className="text-foreground">créditos de PIS/COFINS não aproveitados</strong>,{' '}
            <strong className="text-foreground">pagamentos efetuados a maior</strong> e{' '}
            <strong className="text-foreground">tributação indevida em operações monofásicas</strong>.
          </p>
          <p>
            A materialização desses ganhos depende de análise documental complementar, validação contábil e,
            quando aplicável, protocolização de pedidos de restituição/compensação (PER/DCOMP) dentro do
            prazo decadencial de cinco anos.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ganho por categoria */}
        <Card className="p-6 border border-border/70 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-efd-secondary">Ganho Potencial por Categoria</h3>
              <p className="text-sm text-muted-foreground">Distribuição do valor recuperável</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ganhoPorTipo} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E7F0" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} stroke="#5A5B91" fontSize={11} />
                <YAxis type="category" dataKey="tipo" width={150} stroke="#5A5B91" fontSize={11} tickFormatter={(v) => v.length > 24 ? v.slice(0, 23) + '…' : v} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Ganho Potencial']} cursor={{ fill: '#F1F3F9' }} />
                <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                  {ganhoPorTipo.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Separator className="my-4" />
          <div className="space-y-2">
            {ganhoPorTipo.map((g) => (
              <div key={g.tipo} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[ganhoPorTipo.indexOf(g) % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground">{g.tipo}</span>
                  <span className="text-xs text-muted-foreground/70">({g.quantidade}×)</span>
                </div>
                <span className="font-semibold text-success">{formatCurrency(g.valor)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Plano de ação */}
        <Card className="p-6 border border-border/70 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-success/10 border border-success/20">
              <ListChecks className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-efd-secondary">Plano de Ação Recomendado</h3>
              <p className="text-sm text-muted-foreground">Próximos passos para materializar os ganhos</p>
            </div>
          </div>
          <ol className="space-y-3">
            {recomendacoes.slice(0, 7).map((rec, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-muted-foreground leading-relaxed">{rec}</span>
              </li>
            ))}
          </ol>
          <Separator className="my-4" />
          <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
            <ArrowRight className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Prazo decadencial:</strong> pedidos de restituição/compensação
              devem ser protocolados em até 5 anos da ocorrência do fato gerador (Art. 168, I do CTN).
            </p>
          </div>
        </Card>
      </div>

      {/* Top oportunidades */}
      <Card className="p-6 border border-border/70 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-efd-primary/10 border border-efd-primary/20">
            <Target className="w-6 h-6 text-efd-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-efd-secondary">Principais Oportunidades de Ganho</h3>
            <p className="text-sm text-muted-foreground">Top {topOportunidades.length} casos com maior impacto financeiro</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Oportunidade</TableHead>
                <TableHead className="font-semibold">Categoria</TableHead>
                <TableHead className="font-semibold">NCM</TableHead>
                <TableHead className="font-semibold">Prioridade</TableHead>
                <TableHead className="font-semibold text-right">Ganho Potencial</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topOportunidades.map((op) => (
                <TableRow key={op.id}>
                  <TableCell>
                    <div className="font-semibold text-sm">{op.titulo}</div>
                    <div className="text-xs text-muted-foreground">
                      {op.produto || op.descricao}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">{TIPO_LABELS[op.tipo] || op.tipo}</Badge>
                  </TableCell>
                  <TableCell>
                    {op.ncm ? (
                      <span className="font-mono text-sm">{op.ncm}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{getSeveridadeBadge(op.severidade)}</TableCell>
                  <TableCell className="text-right font-bold text-success">
                    {formatCurrency(op.impactoFinanceiro)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Detalhamento completo das oportunidades */}
      <Card className="p-6 border border-border/70 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <ListChecks className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-efd-secondary">Detalhamento das Oportunidades</h3>
            <p className="text-sm text-muted-foreground">
              {oportunidadesOrdenadas.length} casos — expanda cada um para ver o motivo e a ação recomendada
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Cada ganho detalha a operação identificada, o fundamento técnico do aproveitamento e o valor potencial de recuperação.
        </p>
        <Accordion type="single" collapsible className="w-full">
          {oportunidadesOrdenadas.map((op, idx) => {
            const rel = obterRelatorio(op);
            return (
              <AccordionItem key={op.id} value={op.id} className="border-border/70">
                <AccordionTrigger className="hover:no-underline hover:bg-muted/40 px-3 rounded-lg">
                  <div className="flex items-center justify-between w-full gap-4 pr-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-efd-primary/10 border border-efd-primary/20 text-efd-primary text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-efd-secondary truncate">{op.titulo}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {op.produto || op.descricao}
                          {op.ncm ? ` · NCM ${op.ncm}` : ''}
                          {op.cfop ? ` · CFOP ${op.cfop}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="hidden sm:inline-flex text-xs text-muted-foreground font-medium">{TIPO_LABELS[op.tipo] || op.tipo}</span>
                      {getSeveridadeBadge(op.severidade)}
                      <span className="text-sm font-bold text-success">{formatCurrency(op.impactoFinanceiro)}</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Por que</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{op.descricao}</p>
                      {op.detalhamentoTecnico && (
                        <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">{op.detalhamentoTecnico}</p>
                      )}
                      {rel?.textoTecnico && (
                        <div className="mt-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                          {rel.textoTecnico}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                        <p className="text-xs text-muted-foreground font-medium">Base de Cálculo</p>
                        <p className="text-sm font-semibold text-efd-secondary mt-0.5">{formatCurrency(op.valorBase)}</p>
                      </div>
                      {op.aliquotaDevida !== undefined && (
                        <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                          <p className="text-xs text-muted-foreground font-medium">Alíquota Devida</p>
                          <p className="text-sm font-semibold text-efd-secondary mt-0.5">{op.aliquotaDevida.toFixed(2)}%</p>
                        </div>
                      )}
                      {op.aliquotaAplicada !== undefined && (
                        <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                          <p className="text-xs text-muted-foreground font-medium">Alíquota Aplicada</p>
                          <p className="text-sm font-semibold text-efd-secondary mt-0.5">{op.aliquotaAplicada.toFixed(2)}%</p>
                        </div>
                      )}
                      <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                        <p className="text-xs text-muted-foreground font-medium">Ganho Potencial</p>
                        <p className="text-sm font-bold text-success mt-0.5">{formatCurrency(op.impactoFinanceiro)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {op.cfop && <Badge variant="outline" className="font-mono text-xs">CFOP {op.cfop}</Badge>}
                      {op.cst && <Badge variant="outline" className="font-mono text-xs">{op.cst}</Badge>}
                      {op.ncm && <Badge variant="outline" className="font-mono text-xs">NCM {op.ncm}</Badge>}
                      {op.documento && <Badge variant="outline" className="font-mono text-xs">Doc. {op.documento}</Badge>}
                      {op.status && <Badge variant="outline" className="text-xs">{op.status}</Badge>}
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Ação recomendada</p>
                      <p className="text-sm text-foreground leading-relaxed">{op.acaoSugerida}</p>
                    </div>

                    {rel && rel.fundamentacaoLegal.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Fundamentação legal</p>
                        <ul className="space-y-1">
                          {rel.fundamentacaoLegal.map((f, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </Card>

      {/* Disclaimer */}
      <Card className="p-5 border border-border/70 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted/40 border border-border/60">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Nota:</strong> Os valores apresentados são estimativas
            calculadas a partir da escrituração EFD-Contribuições e das tabelas vigentes de alíquotas.
            A efetiva recuperação depende de validação documental e contábil, e quando aplicável, da
            aprovação da Receita Federal do Brasil. Este relatório não substitui análise jurídica ou
            contábil especializada.
          </p>
        </div>
      </Card>
    </div>
  );
});