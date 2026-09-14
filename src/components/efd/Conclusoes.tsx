import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Download, FileText, Scale, BookOpen, 
  Target, Shield, AlertCircle, CheckCircle, Lightbulb 
} from 'lucide-react';
import { EFDData } from '@/utils/efdParser';
import { detectarTodasOportunidades } from '@/utils/detectarOportunidadesTributarias';
import { 
  gerarRelatoriosTextuais, 
  gerarResumoExecutivo, 
  RelatorioTextual 
} from '@/utils/gerarRelatorioTextual';

interface ConclusoesProps {
  efdData: EFDData;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const getSeveridadeIcon = (severidade: string) => {
  switch (severidade) {
    case 'alta': return <AlertCircle className="h-5 w-5 text-destructive" />;
    case 'media': return <AlertCircle className="h-5 w-5 text-warning" />;
    case 'baixa': return <CheckCircle className="h-5 w-5 text-primary" />;
    default: return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
  }
};

const getTipoLabel = (tipo: string) => {
  const labels: Record<string, string> = {
    'CREDITO_NAO_APROVEITADO': 'Crédito Não Aproveitado',
    'PAGAMENTO_A_MAIOR': 'Pagamento a Maior',
    'INCONSISTENCIA_CST': 'Inconsistência CST',
    'INCONSISTENCIA_CFOP': 'Inconsistência CFOP',
    'MONOFASICO_INCORRETO': 'Monofásico Incorreto',
    'SALDO_CREDOR_ICMS': 'Saldo Credor ICMS',
    'SALDO_CREDOR_IPI': 'Saldo Credor IPI',
    'FECHAMENTO_DIVERGENTE': 'Fechamento Divergente'
  };
  return labels[tipo] || tipo;
};

export const Conclusoes: React.FC<ConclusoesProps> = React.memo(({ efdData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
  const [severidadeFilter, setSeveridadeFilter] = useState<string>('TODOS');

  // Gera relatórios textuais
  const relatorios = useMemo(() => {
    const oportunidades = detectarTodasOportunidades(efdData);
    return gerarRelatoriosTextuais(oportunidades);
  }, [efdData]);

  const resumoExecutivo = useMemo(() => {
    return gerarResumoExecutivo(relatorios);
  }, [relatorios]);

  // Filtra relatórios
  const filteredRelatorios = useMemo(() => {
    return relatorios.filter(rel => {
      const matchSearch = 
        searchTerm === '' ||
        rel.oportunidade.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rel.oportunidade.ncm?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rel.oportunidade.produto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rel.textoTecnico.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchTipo = tipoFilter === 'TODOS' || rel.oportunidade.tipo === tipoFilter;
      const matchSeveridade = severidadeFilter === 'TODOS' || rel.oportunidade.severidade === severidadeFilter;

      return matchSearch && matchTipo && matchSeveridade;
    });
  }, [relatorios, searchTerm, tipoFilter, severidadeFilter]);

  const handleExportPDF = () => {
    // Gera conteúdo markdown completo
    let content = resumoExecutivo + '\n\n---\n\n';
    
    filteredRelatorios.forEach((rel, index) => {
      content += `\n## ${index + 1}. ${rel.oportunidade.titulo}\n\n`;
      content += `**Tipo:** ${getTipoLabel(rel.oportunidade.tipo)}  \n`;
      content += `**Severidade:** ${rel.oportunidade.severidade.toUpperCase()}  \n`;
      content += `**Impacto Financeiro:** ${formatCurrency(rel.oportunidade.impactoFinanceiro)}  \n\n`;
      
      if (rel.oportunidade.ncm) content += `**NCM:** ${rel.oportunidade.ncm}  \n`;
      if (rel.oportunidade.cfop) content += `**CFOP:** ${rel.oportunidade.cfop}  \n`;
      if (rel.oportunidade.cst) content += `**CST:** ${rel.oportunidade.cst}  \n`;
      if (rel.oportunidade.produto) content += `**Produto:** ${rel.oportunidade.produto}  \n\n`;
      
      content += `### Análise Técnico-Jurídica\n\n${rel.textoTecnico}\n\n`;
      
      content += `### Fundamentação Legal\n\n`;
      rel.fundamentacaoLegal.forEach(fund => {
        content += `- ${fund}\n`;
      });
      
      content += `\n### Recomendações\n\n`;
      rel.recomendacoes.forEach(rec => {
        content += `- ${rec}\n`;
      });
      
      content += `\n### Ação Sugerida\n\n${rel.oportunidade.acaoSugerida}\n\n`;
      content += `---\n\n`;
    });

    // Download como arquivo de texto (markdown)
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `conclusoes_tecnicas_${new Date().toISOString().split('T')[0]}.md`;
    link.click();
  };

  const handleExportHTML = () => {
    let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conclusões Técnico-Jurídicas - Análise Fiscal EFD</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.8;
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #F3F6F5;
      color: #1B2A28;
    }
    .header {
      background: linear-gradient(135deg, #0D2B28 0%, #14403B 100%);
      color: white;
      padding: 40px;
      border-radius: 12px;
      margin-bottom: 40px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    h1 { margin: 0 0 10px 0; font-size: 2.5em; }
    h2 { color: #0D2B28; margin-top: 40px; border-bottom: 3px solid #14403B; padding-bottom: 10px; }
    h3 { color: #14403B; margin-top: 30px; }
    .card {
      background: white;
      padding: 30px;
      margin: 20px 0;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 600;
      margin-right: 10px;
    }
    .badge-alta { background: #D7E2E0; color: #0D2B28; }
    .badge-media { background: #DDE8EE; color: #31726B; }
    .badge-baixa { background: #EDF2F1; color: #14403B; }
    .metadata {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      margin: 20px 0;
      padding: 20px;
      background: #EDF2F1;
      border-radius: 8px;
    }
    .metadata-item {
      display: flex;
      flex-direction: column;
    }
    .metadata-label {
      font-size: 0.85em;
      color: #6B7C79;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .metadata-value {
      font-size: 1em;
      color: #1B2A28;
      font-weight: 500;
    }
    .text-section {
      background: #F3F6F5;
      padding: 25px;
      border-left: 4px solid #14403B;
      margin: 20px 0;
      border-radius: 4px;
    }
    ul {
      margin: 15px 0;
      padding-left: 25px;
    }
    li {
      margin: 10px 0;
    }
    .resumo {
      background: linear-gradient(135deg, #0D2B2815 0%, #14403B15 100%);
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 40px;
    }
    .footer {
      text-align: center;
      margin-top: 60px;
      padding-top: 30px;
      border-top: 2px solid #D7E2E0;
      color: #6B7C79;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 Conclusões Técnico-Jurídicas</h1>
    <p>Análise Fiscal Automatizada - EFD-Contribuições</p>
    <p><strong>Data de Geração:</strong> ${new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</p>
  </div>

  <div class="card resumo">
    <h2>Resumo Executivo</h2>
    ${resumoExecutivo.split('\n').map(line => {
      if (line.startsWith('# ')) return `<h2>${line.substring(2)}</h2>`;
      if (line.startsWith('## ')) return `<h3>${line.substring(3)}</h3>`;
      if (line.startsWith('- ')) return `<li>${line.substring(2)}</li>`;
      if (line.includes('**')) return `<p>${line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;
      return line ? `<p>${line}</p>` : '';
    }).join('')}
  </div>
`;

    filteredRelatorios.forEach((rel, index) => {
      html += `
  <div class="card">
    <h2>${index + 1}. ${rel.oportunidade.titulo}</h2>
    
    <div>
      <span class="badge badge-${rel.oportunidade.severidade}">${rel.oportunidade.severidade.toUpperCase()}</span>
      <span class="badge" style="background: #DDE8EE; color: #14403B;">${getTipoLabel(rel.oportunidade.tipo)}</span>
    </div>

    <div class="metadata">
      <div class="metadata-item">
        <span class="metadata-label">Impacto Financeiro</span>
        <span class="metadata-value">${formatCurrency(rel.oportunidade.impactoFinanceiro)}</span>
      </div>
      ${rel.oportunidade.ncm ? `
      <div class="metadata-item">
        <span class="metadata-label">NCM</span>
        <span class="metadata-value">${rel.oportunidade.ncm}</span>
      </div>` : ''}
      ${rel.oportunidade.cfop ? `
      <div class="metadata-item">
        <span class="metadata-label">CFOP</span>
        <span class="metadata-value">${rel.oportunidade.cfop}</span>
      </div>` : ''}
      ${rel.oportunidade.cst ? `
      <div class="metadata-item">
        <span class="metadata-label">CST</span>
        <span class="metadata-value">${rel.oportunidade.cst}</span>
      </div>` : ''}
      ${rel.oportunidade.produto ? `
      <div class="metadata-item">
        <span class="metadata-label">Produto</span>
        <span class="metadata-value">${rel.oportunidade.produto}</span>
      </div>` : ''}
    </div>

    <h3>⚖️ Análise Técnico-Jurídica</h3>
    <div class="text-section">
      ${rel.textoTecnico.split('\n\n').map(para => `<p>${para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`).join('')}
    </div>

    <h3>📚 Fundamentação Legal</h3>
    <ul>
      ${rel.fundamentacaoLegal.map(fund => `<li>${fund}</li>`).join('')}
    </ul>

    <h3>💡 Recomendações</h3>
    <ul>
      ${rel.recomendacoes.map(rec => `<li>${rec}</li>`).join('')}
    </ul>

    <h3>✅ Ação Sugerida</h3>
    <div class="text-section">
      <p><strong>${rel.oportunidade.acaoSugerida}</strong></p>
    </div>
  </div>
`;
    });

    html += `
  <div class="footer">
    <p><strong>Sistema de Análise Fiscal EFD</strong></p>
    <p>Relatório gerado automaticamente para fins de análise técnica tributária</p>
    <p>Este documento não substitui análise jurídica especializada</p>
  </div>
</body>
</html>
`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `conclusoes_tecnicas_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-efd-primary/5 to-background border-2 p-8 shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-primary to-efd-primary rounded-xl shadow-lg shadow-primary/30">
              <Scale className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-primary to-efd-primary bg-clip-text text-transparent">
                Conclusões Técnico-Jurídicas
              </h1>
              <p className="text-muted-foreground font-medium mt-1">
                Relatórios detalhados com fundamentação legal e recomendações práticas
              </p>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-efd-primary/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total de Relatórios</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{relatorios.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Análises técnicas completas</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Impacto Total</CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <Target className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {formatCurrency(relatorios.reduce((sum, r) => sum + r.oportunidade.impactoFinanceiro, 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Valor potencial identificado</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Alta Prioridade</CardTitle>
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Shield className="h-5 w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {relatorios.filter(r => r.oportunidade.severidade === 'alta').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requerem ação imediata</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Exportação */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <CardTitle>Filtros e Exportação</CardTitle>
          </div>
          <CardDescription>Refine sua busca e exporte relatórios completos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="NCM, produto, texto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="CREDITO_NAO_APROVEITADO">Crédito Não Aproveitado</SelectItem>
                  <SelectItem value="PAGAMENTO_A_MAIOR">Pagamento a Maior</SelectItem>
                  <SelectItem value="INCONSISTENCIA_CST">Inconsistência CST</SelectItem>
                  <SelectItem value="INCONSISTENCIA_CFOP">Inconsistência CFOP</SelectItem>
                  <SelectItem value="MONOFASICO_INCORRETO">Monofásico Incorreto</SelectItem>
                  <SelectItem value="SALDO_CREDOR_ICMS">Saldo Credor ICMS</SelectItem>
                  <SelectItem value="SALDO_CREDOR_IPI">Saldo Credor IPI</SelectItem>
                  <SelectItem value="FECHAMENTO_DIVERGENTE">Fechamento Divergente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="severidade">Severidade</Label>
              <Select value={severidadeFilter} onValueChange={setSeveridadeFilter}>
                <SelectTrigger id="severidade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todas</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Exportar</Label>
              <div className="flex gap-2">
                <Button onClick={handleExportHTML} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  HTML
                </Button>
                <Button onClick={handleExportPDF} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  MD
                </Button>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Mostrando {filteredRelatorios.length} de {relatorios.length} relatórios
          </div>
        </CardContent>
      </Card>

      {/* Relatórios em Accordion */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Relatórios Detalhados</CardTitle>
          </div>
          <CardDescription>Análise técnico-jurídica de cada oportunidade identificada</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRelatorios.length > 0 ? (
            <Accordion type="single" collapsible className="w-full space-y-4">
              {filteredRelatorios.map((rel, index) => (
                <AccordionItem 
                  key={rel.id} 
                  value={rel.id}
                  className="border-2 rounded-lg px-4 data-[state=open]:shadow-lg transition-shadow"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-start gap-4 text-left w-full pr-4">
                      <div className="flex-shrink-0 mt-1">
                        {getSeveridadeIcon(rel.oportunidade.severidade)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-bold text-lg">{index + 1}. {rel.oportunidade.titulo}</span>
                          <Badge variant="outline" className="font-semibold">{getTipoLabel(rel.oportunidade.tipo)}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-semibold text-success">{formatCurrency(rel.oportunidade.impactoFinanceiro)}</span>
                          {rel.oportunidade.ncm && <span className="ml-2">• NCM: <span className="font-mono">{rel.oportunidade.ncm}</span></span>}
                          {rel.oportunidade.cfop && <span className="ml-2">• CFOP: <span className="font-mono">{rel.oportunidade.cfop}</span></span>}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6 pt-2 pb-4">
                      {/* Análise Técnica */}
                      <div className="bg-gradient-to-br from-primary/50 to-transparent dark:from-primary/20 p-6 rounded-xl border">
                        <div className="flex items-center gap-2 mb-4">
                          <Scale className="h-5 w-5 text-primary" />
                          <h4 className="font-bold text-lg">Análise Técnico-Jurídica</h4>
                        </div>
                        <div className="space-y-3 text-sm leading-relaxed">
                          {rel.textoTecnico.split('\n\n').map((para, i) => (
                            <p key={i} className={para.includes('**') ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                              {para.replace(/\*\*/g, '')}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Fundamentação Legal */}
                      <div className="bg-gradient-to-br from-efd-primary/50 to-transparent dark:from-efd-primary/20 p-6 rounded-xl border">
                        <div className="flex items-center gap-2 mb-4">
                          <BookOpen className="h-5 w-5 text-efd-primary" />
                          <h4 className="font-bold text-lg">Fundamentação Legal</h4>
                        </div>
                        <ul className="space-y-3 ml-1">
                          {rel.fundamentacaoLegal.map((fund, i) => (
                            <li key={i} className="text-sm flex gap-3">
                              <span className="text-efd-primary font-bold">•</span>
                              <span className="flex-1">{fund}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recomendações */}
                      <div className="bg-gradient-to-br from-warning/50 to-transparent dark:from-warning/20 p-6 rounded-xl border">
                        <div className="flex items-center gap-2 mb-4">
                          <Lightbulb className="h-5 w-5 text-warning dark:text-warning" />
                          <h4 className="font-bold text-lg">Recomendações</h4>
                        </div>
                        <ul className="space-y-3 ml-1">
                          {rel.recomendacoes.map((rec, i) => (
                            <li key={i} className="text-sm flex gap-3">
                              <span className="text-warning dark:text-warning font-bold">•</span>
                              <span className="flex-1">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Ação Sugerida */}
                      <div className="bg-gradient-to-r from-primary/10 to-efd-primary/10 p-6 rounded-xl border-2 border-primary/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="h-5 w-5 text-primary" />
                          <h4 className="font-bold text-lg">Ação Sugerida</h4>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{rel.oportunidade.acaoSugerida}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">Nenhum relatório encontrado</p>
              <p className="text-sm text-muted-foreground">
                Ajuste os filtros para ver mais resultados
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
