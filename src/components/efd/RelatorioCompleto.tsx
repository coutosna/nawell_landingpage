import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Download, Printer, FileText, AlertTriangle, TrendingUp, ArrowRight, CalendarClock,
  Building2, FileBarChart, FileStack, Target, Sparkles, Info, Landmark
} from 'lucide-react';
import { toast } from 'sonner';
import { EFDData } from '@/utils/efdParser';
import { detectarTodasOportunidades } from '@/utils/detectarOportunidadesTributarias';
import { gerarRelatoriosTextuais } from '@/utils/gerarRelatorioTextual';
import {
  calcularPeriodosPorMes, calcularPeriodosPorAno, formatMoeda, formatMilhar, TIPO_LABELS,
  gerarHTMLRelatorioCompleto, LinhaPeriodo
} from '@/utils/relatorioCompleto';

interface RelatorioCompletoProps {
  efdData: EFDData;
  alertas?: Array<{ grupo?: string; tipo?: string; severidade?: string; mensagem?: string }>;
}

const getSeveridadeBadge = (severidade: string) => {
  switch (severidade) {
    case 'alta': return <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">Alta Prioridade</Badge>;
    case 'media': return <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">Prioridade Média</Badge>;
    case 'baixa': return <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">Prioridade Baixa</Badge>;
    default: return null;
  }
};

const CABECALHOS_MES = ['Período', 'Vendas', 'Receita', 'PIS Informado', 'PIS Devido', 'PIS Dif.', 'COFINS Informado', 'COFINS Devido', 'COFINS Dif.', 'Multa', 'Juros SELIC', 'Total a Complementar'];
const CABECALHOS_ANO = ['Ano', 'Vendas', 'Receita', 'PIS Devido', 'PIS Dif.', 'COFINS Devido', 'COFINS Dif.', 'Multa', 'Juros SELIC', 'Total a Complementar'];
const CABECALHOS_MES_ICMS = ['Período', 'Vendas', 'Receita', 'ICMS a Recolher (E110)', 'ICMS Apurado', 'ICMS Dif.', 'IPI Saldo Declarado (E520)', 'IPI Apurado', 'IPI Dif.', 'Multa', 'Juros SELIC', 'Total a Complementar'];
const CABECALHOS_ANO_ICMS = ['Ano', 'Vendas', 'Receita', 'ICMS Apurado', 'ICMS Dif.', 'IPI Apurado', 'IPI Dif.', 'Multa', 'Juros SELIC', 'Total a Complementar'];

export const RelatorioCompleto: React.FC<RelatorioCompletoProps> = React.memo(({ efdData, alertas }) => {
  const [exportando, setExportando] = useState<'pdf' | 'html' | 'md' | null>(null);

  const oportunidades = useMemo(() => detectarTodasOportunidades(efdData), [efdData]);
  const relatorios = useMemo(() => gerarRelatoriosTextuais(oportunidades), [oportunidades]);
  const mensal = useMemo(() => calcularPeriodosPorMes(efdData), [efdData]);
  const anual = useMemo(() => calcularPeriodosPorAno(efdData), [efdData]);

  const arquivosFonte = efdData.fontes?.arquivos ?? [];
  const qtdArquivos = arquivosFonte.length || efdData.fontes?.quantidade || 1;
  const documentosLabel = `${qtdArquivos} arquivo${qtdArquivos > 1 ? 's' : ''} EFD`;

  const modoIcms = efdData.leiaute === 'efd-icms-ipi';
  const obrigacaoNome = modoIcms ? 'EFD ICMS/IPI (SPED Fiscal)' : 'EFD-Contribuições (PIS/COFINS)';
  const regimeMeta = efdData.regime?.descricao || (modoIcms ? 'Apuração ICMS/IPI — bloco E' : '—');
  const cabecalhosMes = modoIcms ? CABECALHOS_MES_ICMS : CABECALHOS_MES;
  const cabecalhosAno = modoIcms ? CABECALHOS_ANO_ICMS : CABECALHOS_ANO;

  const conferenciasIcms = efdData.icmsIpi?.conferencias ?? [];
  const conferenciasDivergentes = conferenciasIcms.filter(c => !c.fechou);
  const somaDivergenciasIcms = conferenciasDivergentes.reduce((s, c) => s + c.diferenca, 0);

  const ganhoPotencial = useMemo(() =>
    oportunidades.reduce((sum, op) => sum + op.impactoFinanceiro, 0), [oportunidades]);

  const totalVendas = efdData.resumo.totalVendas || 0;
  const totalCompras = efdData.resumo.totalCompras || 0;
  const divergenciaTotal = modoIcms ? somaDivergenciasIcms : (efdData.riscoFiscal.totalPrincipal || 0);
  const multaTotal = modoIcms ? Math.round(somaDivergenciasIcms * 0.2 * 100) / 100 : (efdData.riscoFiscal.totalMulta || 0);
  const jurosTotal = efdData.riscoFiscal.totalJurosEstimado || 0;
  const totalGeralRisco = modoIcms ? somaDivergenciasIcms + multaTotal : (efdData.riscoFiscal.totalGeral || 0);

  const altaPrioridade = useMemo(() =>
    oportunidades.filter(op => op.severidade === 'alta').length, [oportunidades]);

  const oportunidadesOrdenadas = useMemo(() =>
    [...oportunidades].sort((a, b) => b.impactoFinanceiro - a.impactoFinanceiro), [oportunidades]);

  const topOportunidades = useMemo(() => oportunidadesOrdenadas.slice(0, 5), [oportunidadesOrdenadas]);

  const relatoriosPorId = useMemo(() => {
    const mapa = new Map<string, ReturnType<typeof gerarRelatoriosTextuais>[number]>();
    relatorios.forEach(rel => { if (rel.oportunidade.id) mapa.set(rel.oportunidade.id, rel); });
    return mapa;
  }, [relatorios]);
  const obterRelatorio = (id: string) => relatoriosPorId.get(id);

  const recomendacoes = useMemo(() => {
    const seen = new Set<string>();
    const recs: string[] = [];
    relatorios.forEach(rel => {
      rel.recomendacoes.forEach(r => { if (!seen.has(r)) { seen.add(r); recs.push(r); } });
    });
    return recs.slice(0, 8);
  }, [relatorios]);

  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const gerarHTML = () => gerarHTMLRelatorioCompleto(efdData, alertas ?? [], mensal, anual, oportunidades);

  const PAGE_WIDTH = 794;
  const PAGE_HEIGHT = 1123;

  const handleExportPDF = async () => {
    try {
      setExportando('pdf');
      const html = gerarHTML();

      const [{ jsPDF }, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);
      const html2canvas = html2canvasModule.default;

      const iframe = document.createElement('iframe');
      iframe.style.cssText = `position:fixed;left:-99999px;top:0;width:${PAGE_WIDTH}px;height:600px;border:0;`;
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Não foi possível criar o documento do PDF');
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      await new Promise(resolve => setTimeout(resolve, 350));

      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        width: PAGE_WIDTH,
        windowWidth: PAGE_WIDTH,
        backgroundColor: '#F7F8FA',
        useCORS: true,
        logging: false,
      });

      document.body.removeChild(iframe);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4', compress: true });
      const imgW = PAGE_WIDTH * 2;
      const pageImgH = PAGE_HEIGHT * 2;
      const totalH = canvas.height;
      let page = 0;

      for (let y = 0; y < totalH; y += pageImgH) {
        const h = Math.min(pageImgH, totalH - y);
        const slice = document.createElement('canvas');
        slice.width = imgW;
        slice.height = h;
        const ctx = slice.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#F7F8FA';
          ctx.fillRect(0, 0, imgW, h);
          ctx.drawImage(canvas, 0, y, imgW, h, 0, 0, imgW, h);
        }
        const imgData = slice.toDataURL('image/jpeg', 0.92);
        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH, h / 2, undefined, 'FAST');
        page += 1;
      }

      pdf.save(`relatorio-completo_${efdData.cadastro.cnpj}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success(`PDF gerado com ${page} página(s) e todos os detalhes`);
    } catch (error) {
      toast.error('Erro ao gerar PDF');
      console.error(error);
    } finally {
      setExportando(null);
    }
  };

  const handleExportHTML = () => {
    try {
      setExportando('html');
      const html = gerarHTML();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio-completo_${efdData.cadastro.cnpj}_${new Date().toISOString().split('T')[0]}.html`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('Relatório HTML exportado');
    } catch (error) {
      toast.error('Erro ao exportar HTML');
      console.error(error);
    } finally {
      setExportando(null);
    }
  };

  const handleExportMD = () => {
    try {
      setExportando('md');
      let md = `# Relatório Completo de Análise Fiscal\n\n`;
      md += `**NAWELL — Inteligência Tributária**  \n`;
      md += `**Empresa:** ${efdData.cadastro.razaoSocial}  \n`;
      md += `**CNPJ:** ${efdData.cadastro.cnpj}  \n`;
      md += `**Período:** ${efdData.cadastro.periodoInicialDisplay || '—'} a ${efdData.cadastro.periodoFinalDisplay || '—'}  \n`;
      md += `**Regime:** ${regimeMeta}  \n`;
      md += `**Documentos analisados:** ${documentosLabel}${arquivosFonte.length ? ` (${arquivosFonte.join(', ')})` : ''}  \n`;
      md += `**Emissão:** ${dataGeracao}  \n\n`;
      md += `---\n\n`;
      md += `## 1. Resumo Executivo\n\n`;
      md += `- Obrigação: ${obrigacaoNome}\n`;
      md += `- Receita Total (Vendas): ${formatMoeda(totalVendas)}\n`;
      md += `- Total de Aquisições: ${formatMoeda(totalCompras)}\n`;
      md += `- Total a Complementar: ${formatMoeda(divergenciaTotal)}\n`;
      md += `- Ganho Potencial: ${formatMoeda(ganhoPotencial)}\n`;
      md += `- Oportunidades Identificadas: ${oportunidades.length}\n\n`;
      md += `## 2. Documentos Analisados\n\n`;
      (arquivosFonte.length > 0 ? arquivosFonte : ['Arquivo EFD']).forEach(a => { md += `- ${a}\n`; });
      md += `\n## 3. Detalhamento por Ano\n\n`;
      md += modoIcms
        ? `| Ano | Vendas | Receita | ICMS Apurado | ICMS Dif. | IPI Apurado | IPI Dif. | Multa | Juros | Total a Compl. |\n|---|---|---|---|---|---|---|---|---|---|---|\n`
        : `| Ano | Vendas | Receita | PIS Devido | PIS Dif. | COFINS Devido | COFINS Dif. | Multa | Juros | Total a Compl. |\n|---|---|---|---|---|---|---|---|---|---|---|\n`;
      anual.forEach(l => {
        md += `| ${l.ano} | ${l.qtdVendas} | ${formatMoeda(l.receita)} | ${formatMoeda(l.pisDevido)} | ${formatMoeda(l.pisDiferenca)} | ${formatMoeda(l.cofinsDevido)} | ${formatMoeda(l.cofinsDiferenca)} | ${formatMoeda(l.multa)} | ${formatMoeda(l.juros)} | ${formatMoeda(l.totalComplementar)} |\n`;
      });
      md += `\n## 4. Detalhamento por Mês de Apuração\n\n`;
      md += modoIcms
        ? `| Período | Vendas | Receita | ICMS a Recolher (E110) | ICMS Apurado | ICMS Dif. | IPI Saldo Declarado (E520) | IPI Apurado | IPI Dif. | Multa | Juros | Total a Compl. |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`
        : `| Período | Vendas | Receita | PIS Informado | PIS Devido | PIS Dif. | COFINS Informado | COFINS Devido | COFINS Dif. | Multa | Juros | Total a Compl. |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
      mensal.forEach(l => {
        md += `| ${l.label} | ${l.qtdVendas} | ${formatMoeda(l.receita)} | ${formatMoeda(l.pisInformado)} | ${formatMoeda(l.pisDevido)} | ${formatMoeda(l.pisDiferenca)} | ${formatMoeda(l.cofinsInformado)} | ${formatMoeda(l.cofinsDevido)} | ${formatMoeda(l.cofinsDiferenca)} | ${formatMoeda(l.multa)} | ${formatMoeda(l.juros)} | ${formatMoeda(l.totalComplementar)} |\n`;
      });
      md += `\n## 5. ${modoIcms ? 'Divergências de Fechamento (Bloco E)' : 'Divergências de PIS/COFINS'}\n\n`;
      if (modoIcms) {
        if (conferenciasIcms.length === 0) {
          md += `Sem apuração no bloco E no período.\n`;
        } else {
          md += `Total de ${conferenciasDivergentes.length} conferência(s) sem fechamento. Principal estimado de ${formatMoeda(divergenciaTotal)} e multa de ${formatMoeda(multaTotal)}.\n`;
          md += `| Conferência | Status | Diferença | Detalhes |\n|---|---|---|---|\n`;
          conferenciasIcms.forEach(c => {
            md += `| ${c.titulo} | ${c.fechou ? 'FECHA' : 'NÃO FECHA'} | ${formatMoeda(c.diferenca)} | ${c.detalhes} |\n`;
          });
        }
      } else if (efdData.riscoFiscal.itens.length === 0) {
        md += `Nenhuma divergência identificada no período.\n`;
      } else {
        md += `Total de ${efdData.riscoFiscal.itens.length} item(ns), com principal de ${formatMoeda(divergenciaTotal)}, multa de ${formatMoeda(multaTotal)} e juros estimados de ${formatMoeda(jurosTotal)}.\n`;
        md += `| Produto | NCM | Documento | Data | Base | Dif. PIS/COFINS | Multa | Juros | Total Final |\n`;
        md += `|---|---|---|---|---|---|---|---|---|\n`;
        efdData.riscoFiscal.itens.slice(0, 200).forEach(item => {
          md += `| ${item.produto} | ${item.ncm} | ${item.documento} | ${item.dataOperacao} | ${formatMoeda(item.baseCalculo)} | ${formatMoeda(item.principalDiferenca)} | ${formatMoeda(item.multa)} | ${formatMoeda(item.jurosEstimado)} | ${formatMoeda(item.totalComMultaJuros)} |\n`;
        });
      }
      md += `\n## 6. Oportunidades de Recuperação Tributária\n\n`;
      if (oportunidades.length === 0) {
        md += `Nenhuma oportunidade identificada no período.\n`;
      } else {
        oportunidadesOrdenadas.slice(0, 100).forEach((op, i) => {
          md += `${i + 1}. **${op.titulo}** (${TIPO_LABELS[op.tipo] || op.tipo}) — ${formatMoeda(op.impactoFinanceiro)}\n`;
          if (op.ncm) md += `   - NCM: ${op.ncm} · CFOP: ${op.cfop || '—'} · Prioridade: ${op.severidade.toUpperCase()}\n`;
          md += `   - ${op.acaoSugerida}\n`;
        });
      }
      md += `\n---\n*Relatório gerado pelo NAWELL — Inteligência Tributária*\n`;

      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio-completo_${efdData.cadastro.cnpj}_${new Date().toISOString().split('T')[0]}.md`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('Relatório Markdown exportado');
    } catch (error) {
      toast.error('Erro ao exportar Markdown');
      console.error(error);
    } finally {
      setExportando(null);
    }
  };

  const renderLinhaMes = (l: LinhaPeriodo) => (
    <TableRow key={l.chave}>
      <TableCell className="font-semibold whitespace-nowrap">{l.label}</TableCell>
      <TableCell className="text-right">{formatMilhar(l.qtdVendas)}</TableCell>
      <TableCell className="text-right font-medium">{formatMoeda(l.receita)}</TableCell>
      <TableCell className="text-right">{formatMoeda(l.pisInformado)}</TableCell>
      <TableCell className="text-right">{formatMoeda(l.pisDevido)}</TableCell>
      <TableCell className="text-right font-semibold text-destructive">{formatMoeda(l.pisDiferenca)}</TableCell>
      <TableCell className="text-right">{formatMoeda(l.cofinsInformado)}</TableCell>
      <TableCell className="text-right">{formatMoeda(l.cofinsDevido)}</TableCell>
      <TableCell className="text-right font-semibold text-destructive">{formatMoeda(l.cofinsDiferenca)}</TableCell>
      <TableCell className="text-right text-warning">{formatMoeda(l.multa)}</TableCell>
      <TableCell className="text-right text-warning">{formatMoeda(l.juros)}</TableCell>
      <TableCell className="text-right font-bold text-primary">{formatMoeda(l.totalComplementar)}</TableCell>
    </TableRow>
  );

  const renderLinhaAno = (l: LinhaPeriodo) => (
    <TableRow key={l.chave}>
      <TableCell className="font-semibold">{l.ano}</TableCell>
      <TableCell className="text-right">{formatMilhar(l.qtdVendas)}</TableCell>
      <TableCell className="text-right font-medium">{formatMoeda(l.receita)}</TableCell>
      <TableCell className="text-right">{formatMoeda(l.pisDevido)}</TableCell>
      <TableCell className="text-right font-semibold text-destructive">{formatMoeda(l.pisDiferenca)}</TableCell>
      <TableCell className="text-right">{formatMoeda(l.cofinsDevido)}</TableCell>
      <TableCell className="text-right font-semibold text-destructive">{formatMoeda(l.cofinsDiferenca)}</TableCell>
      <TableCell className="text-right text-warning">{formatMoeda(l.multa)}</TableCell>
      <TableCell className="text-right text-warning">{formatMoeda(l.juros)}</TableCell>
      <TableCell className="text-right font-bold text-primary">{formatMoeda(l.totalComplementar)}</TableCell>
    </TableRow>
  );

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
                Relatório Completo de Análise Fiscal
              </h1>
              <p className="text-sidebar-foreground/80 font-medium mt-1">
                {obrigacaoNome} · Consolidado de todos os arquivos analisados
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleExportPDF} disabled={exportando !== null}>
                <Printer className="mr-2 h-4 w-4" /> {exportando === 'pdf' ? 'Gerando…' : 'PDF'}
              </Button>
              <Button variant="outline" size="sm" className="bg-white/5 border-white/15 text-white hover:bg-white/10" onClick={handleExportHTML} disabled={exportando !== null}>
                <Download className="mr-2 h-4 w-4" /> {exportando === 'html' ? 'Gerando…' : 'HTML'}
              </Button>
              <Button variant="outline" size="sm" className="bg-white/5 border-white/15 text-white hover:bg-white/10" onClick={handleExportMD} disabled={exportando !== null}>
                <FileText className="mr-2 h-4 w-4" /> {exportando === 'md' ? 'Gerando…' : 'Markdown'}
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
              {efdData.cadastro.periodoInicialDisplay || '—'} a {efdData.cadastro.periodoFinalDisplay || '—'}
            </div>
            <div className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
              <FileStack className="w-4 h-4 text-primary" />
              {documentosLabel}
            </div>
            <div className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
              <Landmark className="w-4 h-4 text-primary" />
              {regimeMeta}
            </div>
            <div className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
              Emissão: {dataGeracao}
            </div>
          </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span><strong>Valores estimados.</strong> Divergências, multa, juros e ganho potencial são projeções automáticas de regras simplificadas — não são débito constituído nem crédito garantido. Valide com contador/advogado antes de qualquer pagamento ou PER/DCOMP.</span>
        </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="p-4 border border-border/70 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Receita Total</p>
          <p className="text-xl font-bold text-efd-secondary mt-1.5">{formatMoeda(totalVendas)}</p>
          <p className="text-xs text-muted-foreground mt-1">Vendas no período</p>
        </Card>
        <Card className="p-4 border border-border/70 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Aquisições</p>
          <p className="text-xl font-bold text-efd-secondary mt-1.5">{formatMoeda(totalCompras)}</p>
          <p className="text-xs text-muted-foreground mt-1">Compras no período</p>
        </Card>
        <Card className="p-4 border border-destructive/25 bg-destructive/5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total Estimado a Complementar</p>
          <p className="text-xl font-bold text-destructive mt-1.5">{formatMoeda(divergenciaTotal)}</p>
          <p className="text-xs text-muted-foreground mt-1">Principal + multa + juros: {formatMoeda(totalGeralRisco)}</p>
        </Card>
        <Card className="p-4 border border-success/25 bg-success/5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Ganho Potencial (est.)</p>
          <p className="text-xl font-bold text-success mt-1.5">{formatMoeda(ganhoPotencial)}</p>
          <p className="text-xs text-muted-foreground mt-1">Recuperação estimada</p>
        </Card>
        <Card className="p-4 border border-border/70 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Oportunidades</p>
          <p className="text-xl font-bold text-efd-secondary mt-1.5">{oportunidades.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Casos identificados</p>
        </Card>
        <Card className="p-4 border border-border/70 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Alertas</p>
          <p className="text-xl font-bold text-efd-secondary mt-1.5">{alertas?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Inconsistências levantadas</p>
        </Card>
      </div>

      {/* Documentos analisados */}
      <Card className="p-6 border border-primary/25 bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <FileStack className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-efd-secondary">Documentos Analisados</h3>
            <p className="text-sm text-muted-foreground">Todos os arquivos que originam este relatório</p>
          </div>
          <Badge variant="outline" className="ml-auto border-primary/30 bg-primary/10 text-primary">{documentosLabel}</Badge>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {(arquivosFonte.length > 0 ? arquivosFonte : ['Arquivo EFD Contribuições']).map((nome, i) => (
            <li key={`${nome}-${i}`} className="flex items-center gap-2.5 p-3 rounded-lg bg-background/80 border border-border/60">
              <FileText className="w-4 h-4 text-success shrink-0" />
              <span className="font-mono text-sm truncate">{nome}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
          {modoIcms ? (
            <>
              <div className="p-2 rounded-lg bg-background/60 border border-border/50">
                <p className="text-xs text-muted-foreground">ICMS a Recolher (E110)</p>
                <p className="text-sm font-bold text-efd-secondary">{formatMoeda(efdData.icmsIpi?.resumo.icmsRecolher ?? 0)}</p>
              </div>
              <div className="p-2 rounded-lg bg-background/60 border border-border/50">
                <p className="text-xs text-muted-foreground">IPI Saldo (E520)</p>
                <p className="text-sm font-bold text-efd-secondary">{formatMoeda(efdData.icmsIpi?.resumo.ipiSaldo ?? 0)}</p>
              </div>
              <div className="p-2 rounded-lg bg-background/60 border border-border/50">
                <p className="text-xs text-muted-foreground">Bloco C (Vendas)</p>
                <p className="text-sm font-bold text-efd-secondary">{formatMoeda(efdData.receitaDocumental.blocoC)}</p>
              </div>
              <div className="p-2 rounded-lg bg-background/60 border border-border/50">
                <p className="text-xs text-muted-foreground">Compras (C110/C170)</p>
                <p className="text-sm font-bold text-efd-secondary">{formatMoeda(totalCompras)}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground">Conferências OK</p>
                <p className="text-sm font-bold text-primary">{conferenciasIcms.filter(c => c.fechou).length}/{conferenciasIcms.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground">Obrigações E116</p>
                <p className="text-sm font-bold text-primary">{efdData.icmsIpi?.apuracaoIcms.e116.length ?? 0}</p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 rounded-lg bg-background/60 border border-border/50">
                <p className="text-xs text-muted-foreground">Bloco A</p>
                <p className="text-sm font-bold text-efd-secondary">{formatMoeda(efdData.receitaDocumental.blocoA)}</p>
              </div>
              <div className="p-2 rounded-lg bg-background/60 border border-border/50">
                <p className="text-xs text-muted-foreground">Bloco C</p>
                <p className="text-sm font-bold text-efd-secondary">{formatMoeda(efdData.receitaDocumental.blocoC)}</p>
              </div>
              <div className="p-2 rounded-lg bg-background/60 border border-border/50">
                <p className="text-xs text-muted-foreground">Bloco D</p>
                <p className="text-sm font-bold text-efd-secondary">{formatMoeda(efdData.receitaDocumental.blocoD)}</p>
              </div>
              <div className="p-2 rounded-lg bg-background/60 border border-border/50">
                <p className="text-xs text-muted-foreground">Bloco F</p>
                <p className="text-sm font-bold text-efd-secondary">{formatMoeda(efdData.receitaDocumental.blocoF)}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground">M210 (PIS)</p>
                <p className="text-sm font-bold text-primary">{formatMoeda(efdData.receitaApurada.pisM210)}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground">M610 (COFINS)</p>
                <p className="text-sm font-bold text-primary">{formatMoeda(efdData.receitaApurada.cofinsM610)}</p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Resumo executivo */}
      <Card className="p-6 border border-border/70 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-efd-primary/10 border border-efd-primary/20">
            <FileBarChart className="w-6 h-6 text-efd-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-efd-secondary">Resumo Executivo</h3>
            <p className="text-sm text-muted-foreground">Visão consolidada para apresentação à diretoria</p>
          </div>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            O presente relatório consolida a análise da escrituração fiscal digital ({obrigacaoNome}) de{' '}
            <strong className="text-foreground">{qtdArquivos} arquivo{qtdArquivos > 1 ? 's' : ''}</strong>,
            cobrindo o período de <strong className="text-foreground">{efdData.cadastro.periodoInicialDisplay || '—'}</strong> a{' '}
            <strong className="text-foreground">{efdData.cadastro.periodoFinalDisplay || '—'}</strong>.
          </p>
          {modoIcms ? (
            <p>
              A apuração do bloco E resultou em{' '}
              <strong className="text-foreground">{conferenciasIcms.length} conferência(s) de fechamento</strong>, sendo{' '}
              <strong className={conferenciasDivergentes.length > 0 ? 'text-destructive' : 'text-success'}>{conferenciasDivergentes.length} divergente(s)</strong>,
              com ICMS a recolher de <strong className="text-foreground">{formatMoeda(efdData.icmsIpi?.resumo.icmsRecolher ?? 0)}</strong> e
              IPI saldo de <strong className="text-foreground">{formatMoeda(efdData.icmsIpi?.resumo.ipiSaldo ?? 0)}</strong>,
              sobre as vendas totais de <strong className="text-success">{formatMoeda(totalVendas)}</strong>.
            </p>
          ) : (
            <p>
              Foram analisados <strong className="text-foreground">{formatMilhar(efdData.vendas.length)} itens de venda</strong> e{' '}
              <strong className="text-foreground">{formatMilhar(efdData.compras.length)} itens de aquisição</strong>,
              com receita total de <strong className="text-success">{formatMoeda(totalVendas)}</strong> e total a complementar de{' '}
              <strong className="text-destructive">{formatMoeda(divergenciaTotal)}</strong>.
            </p>
          )}
          <p>
            A análise identificou{' '}
            <strong className="text-foreground">
              {modoIcms ? conferenciasDivergentes.length : efdData.riscoFiscal.itens.length} divergência(s)
            </strong>{' '}
            (fechamento do bloco E) e{' '}
            <strong className="text-foreground">{oportunidades.length} oportunidade(s) de recuperação tributária</strong>,
            com ganho potencial estimado de <strong className="text-success">{formatMoeda(ganhoPotencial)}</strong>.
          </p>
        </div>
      </Card>

      {/* Detalhamento por Ano */}
      <Card className="p-6 border border-border/70 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-efd-secondary">Detalhamento por Ano</h3>
            <p className="text-sm text-muted-foreground">Consolidação anual de receitas, tributos e encargos</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {cabecalhosAno.map((h, i) => (
                  <TableHead key={h} className={i > 0 ? "text-right font-bold" : "font-bold"}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {anual.length > 0 ? anual.map(renderLinhaAno) : (
                <TableRow><TableCell colSpan={cabecalhosAno.length} className="text-center text-muted-foreground py-8">Sem dados por ano identificados nos arquivos analisados.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Detalhamento por Mês */}
      <Card className="p-6 border border-border/70 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-success/10 border border-success/20">
            <CalendarClock className="w-6 h-6 text-success" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-efd-secondary">Detalhamento por Mês de Apuração</h3>
            <p className="text-sm text-muted-foreground">Períodos de apuração consolidados cronologicamente</p>
          </div>
          <Badge variant="outline" className="ml-auto border-success/30 bg-success/10 text-success">{mensal.length} período{mensal.length !== 1 ? 's' : ''}</Badge>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow>
                {cabecalhosMes.map((h, i) => (
                  <TableHead key={h} className={i > 0 ? "text-right font-bold" : "font-bold"}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {mensal.length > 0 ? mensal.map(renderLinhaMes) : (
                <TableRow><TableCell colSpan={cabecalhosMes.length} className="text-center text-muted-foreground py-8">Sem dados mensais identificados nos arquivos analisados.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {modoIcms ? (
            <>ICMS = apuração do E110 (saldo apurado × declarado no arquivo) · IPI = apuração do E520 (saldo apurado × declarado) ·
              Divergências a complementar estimadas pelas conferências de fechamento (tolerância R$ 0,02). Multa (20%) e juros SELIC estimados sobre os valores (Lei 9.430/96, art. 61).</>
          ) : (
            <>PIS/COFINS "Informado" = valores escriturados · "Devido" = valor apurado com base na tabela NCM/regime · Dif. = diferença a complementar.
              Multa (20%) e juros SELIC são estimados sobre as divergências (Lei 9.430/96, art. 61).</>
          )}
        </p>
      </Card>

      {/* Divergências */}
      <Card className="p-6 border border-destructive/25 bg-gradient-to-br from-destructive/5 to-transparent shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-efd-secondary">Divergências {modoIcms ? 'de Fechamento (Bloco E)' : 'de PIS/COFINS'}</h3>
            <p className="text-sm text-muted-foreground">
              {modoIcms
                ? `${conferenciasDivergentes.length} conferência(s) sem fechamento (recalculado × declarado acima de R$ 0,02)`
                : `${efdData.riscoFiscal.itens.length} item(ns) com diferença entre informado e devido`}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-background/70 border border-border/50">
            <p className="text-xs text-muted-foreground font-medium">Principal</p>
            <p className="text-base font-bold text-destructive mt-0.5">{formatMoeda(divergenciaTotal)}</p>
          </div>
          <div className="p-3 rounded-lg bg-background/70 border border-border/50">
            <p className="text-xs text-muted-foreground font-medium">Multa (20%)</p>
            <p className="text-base font-bold text-warning mt-0.5">{formatMoeda(multaTotal)}</p>
          </div>
          <div className="p-3 rounded-lg bg-background/70 border border-border/50">
            <p className="text-xs text-muted-foreground font-medium">Juros SELIC</p>
            <p className="text-base font-bold text-warning mt-0.5">{formatMoeda(jurosTotal)}</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground font-medium">Total Final</p>
            <p className="text-base font-bold text-primary mt-0.5">{formatMoeda(totalGeralRisco)}</p>
          </div>
        </div>
        {modoIcms ? (
          <div className="mt-4 overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Conferência</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Diferença</TableHead>
                  <TableHead className="font-bold">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conferenciasIcms.length > 0 ? conferenciasIcms.map((c, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-sm">{c.titulo}</TableCell>
                    <TableCell><Badge variant="outline" className={`font-mono font-bold ${c.fechou ? 'bg-success/10 text-success border-success/30' : 'bg-destructive/10 text-destructive border-destructive/30'}`}>{c.fechou ? 'FECHA' : 'NÃO FECHA'}</Badge></TableCell>
                    <TableCell className={`text-right font-bold ${c.fechou ? 'text-success' : 'text-destructive'}`}>{formatMoeda(c.diferenca)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[380px]">{c.detalhes}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sem apuração no bloco E — não é possível conferir o fechamento.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Produto</TableHead>
                  <TableHead className="font-bold text-center">NCM</TableHead>
                  <TableHead className="font-bold">Documento</TableHead>
                  <TableHead className="font-bold">Data Operação</TableHead>
                  <TableHead className="text-right font-bold">Base de Cálculo</TableHead>
                  <TableHead className="text-right font-bold">PIS/COFINS Dif.</TableHead>
                  <TableHead className="text-right font-bold">Multa</TableHead>
                  <TableHead className="text-right font-bold">Juros</TableHead>
                  <TableHead className="text-right font-bold">Total Final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {efdData.riscoFiscal.itens.length > 0 ? efdData.riscoFiscal.itens.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-sm">{item.produto}</TableCell>
                    <TableCell className="text-center"><Badge variant="outline" className="font-mono font-bold bg-primary/5 border-primary/30">{item.ncm}</Badge></TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground max-w-[120px] truncate">{item.documento}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{item.dataOperacao}</TableCell>
                    <TableCell className="text-right font-medium">{formatMoeda(item.baseCalculo)}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">{formatMoeda(item.principalDiferenca)}</TableCell>
                    <TableCell className="text-right text-warning">{formatMoeda(item.multa)}</TableCell>
                    <TableCell className="text-right text-warning">{formatMoeda(item.jurosEstimado)}</TableCell>
                    <TableCell className="text-right font-bold text-primary">{formatMoeda(item.totalComMultaJuros)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhuma divergência identificada no período analisado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Oportunidades */}
      <Card className="p-6 border border-border/70 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-efd-primary/10 border border-efd-primary/20">
            <Target className="w-6 h-6 text-efd-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-efd-secondary">Oportunidades de Recuperação Tributária</h3>
            <p className="text-sm text-muted-foreground">Créditos não aproveitados, pagamentos a maior e inconsistências</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="border-success/30 bg-success/10 text-success">Ganho: {formatMoeda(ganhoPotencial)}</Badge>
          </div>
        </div>

        {oportunidades.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-success/5 border border-success/20">
            <Sparkles className="w-5 h-5 text-success" />
            <p className="text-sm text-muted-foreground">
              Nenhuma oportunidade de ganho identificada no período analisado.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Oportunidade</TableHead>
                    <TableHead className="font-bold">Categoria</TableHead>
                    <TableHead className="font-bold">NCM</TableHead>
                    <TableHead className="font-bold">Prioridade</TableHead>
                    <TableHead className="text-right font-bold">Ganho Potencial</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topOportunidades.map(op => (
                    <TableRow key={op.id}>
                      <TableCell>
                        <div className="font-semibold text-sm">{op.titulo}</div>
                        <div className="text-xs text-muted-foreground">{op.produto || op.descricao}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="font-medium">{TIPO_LABELS[op.tipo] || op.tipo}</Badge></TableCell>
                      <TableCell><span className="font-mono text-sm">{op.ncm || '—'}</span></TableCell>
                      <TableCell>{getSeveridadeBadge(op.severidade)}</TableCell>
                      <TableCell className="text-right font-bold text-success">{formatMoeda(op.impactoFinanceiro)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {oportunidadesOrdenadas.map((op, idx) => {
                const rel = obterRelatorio(op.id);
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
                          <span className="text-sm font-bold text-success">{formatMoeda(op.impactoFinanceiro)}</span>
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
                            <div className="mt-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{rel.textoTecnico}</div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                            <p className="text-xs text-muted-foreground font-medium">Base de Cálculo</p>
                            <p className="text-sm font-semibold text-efd-secondary mt-0.5">{formatMoeda(op.valorBase)}</p>
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
                            <p className="text-sm font-bold text-success mt-0.5">{formatMoeda(op.impactoFinanceiro)}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {op.cfop && <Badge variant="outline" className="font-mono text-xs">CFOP {op.cfop}</Badge>}
                          {op.cst && <Badge variant="outline" className="font-mono text-xs">{op.cst}</Badge>}
                          {op.ncm && <Badge variant="outline" className="font-mono text-xs">NCM {op.ncm}</Badge>}
                          {op.documento && <Badge variant="outline" className="font-mono text-xs">Doc. {op.documento}</Badge>}
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
                                  <span className="text-primary mt-0.5">•</span><span>{f}</span>
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
          </>
        )}
      </Card>

      {/* Plano de ação */}
      {(recomendacoes.length > 0 || oportunidades.length > 0) && (
        <Card className="p-6 border border-border/70 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-success/10 border border-success/20">
              <Target className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-efd-secondary">Plano de Ação Recomendado</h3>
              <p className="text-sm text-muted-foreground">Próximos passos para materializar os ganhos</p>
            </div>
          </div>
          <ol className="space-y-3">
            {recomendacoes.map((rec, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <span className="text-sm text-muted-foreground leading-relaxed">{rec}</span>
              </li>
            ))}
          </ol>
          <Separator className="my-4" />
          <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
            <ArrowRight className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Prazo decadencial:</strong> pedidos de restituição/compensação devem ser protocolados em até 5 anos da ocorrência do fato gerador (Art. 168, I do CTN).
            </p>
          </div>
        </Card>
      )}

      {/* Disclaimer */}
      <Card className="p-5 border border-border/70 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted/40 border border-border/60">
            <Info className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Nota:</strong> Os valores apresentados são estimativas calculadas a partir da
            escrituração {obrigacaoNome} ({documentosLabel}) e das tabelas vigentes de alíquotas. A efetiva recuperação ou
            regularização depende de validação documental e contábil, e quando aplicável, da aprovação das autoridades
            tributárias (Receita Federal do Brasil e/ou Secretaria Estadual de Fazenda).
            Este relatório não substitui análise jurídica ou contábil especializada.
          </p>
        </div>
      </Card>
    </div>
  );
});