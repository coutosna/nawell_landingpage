import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Calendar, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  Download,
  CheckCircle,
  XCircle,
  Info,
  Target,
  BarChart3,
  Shield,
  AlertCircle
} from 'lucide-react';

interface ProcessingResult {
  arquivo: string;
  cadastro: {
    cnpj: string;
    uf: string;
    periodo_ini?: string;
    periodo_fim?: string;
  };
  regime: {
    codigo_0110: number;
    descricao: string;
    pis_padrao: string;
    cofins_padrao: string;
  };
  alertas: Array<{
    grupo?: string;
    tipo: string;
    severidade?: string;
    mensagem: string;
    detalhes: any;
  }>;
  totais_documentos: {
    por_cfop_saida: Record<string, string>;
    total_saida: string;
  };
  m400: Record<string, string>;
  m800: Record<string, string>;
  resumo_executivo?: {
    total_alertas: number;
    por_grupo: Record<string, number>;
    por_severidade: Record<string, number>;
    itens_analisados: number;
    ncm_mapeados: number;
  };
}

interface ResultsDashboardProps {
  results: ProcessingResult;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ results }) => {
  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const formatPercentage = (value: string) => {
    if (value.includes('%')) return value;
    const num = parseFloat(value) * 100;
    return `${num.toFixed(2)}%`;
  };

  const getSeverityVariant = (severidade?: string) => {
    switch (severidade?.toLowerCase()) {
      case 'alta':
        return 'destructive';
      case 'media':
        return 'warning';
      case 'baixa':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getSeverityIcon = (severidade?: string) => {
    switch (severidade?.toLowerCase()) {
      case 'alta':
        return <XCircle className="h-4 w-4" />;
      case 'media':
        return <AlertTriangle className="h-4 w-4" />;
      case 'baixa':
        return <Info className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getGrupoIcon = (grupo?: string) => {
    switch (grupo) {
      case 'G1':
        return <Target className="h-4 w-4" />;
      case 'G2':
        return <Shield className="h-4 w-4" />;
      case 'G3':
        return <BarChart3 className="h-4 w-4" />;
      case 'G4':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getGrupoDescription = (grupo?: string) => {
    switch (grupo) {
      case 'G1':
        return 'Divergências PIS/COFINS';
      case 'G2':
        return 'Incompatibilidade de Regime';
      case 'G3':
        return 'Reconciliação M×Documentos';
      case 'G4':
        return 'Classificação/NCM';
      default:
        return 'Outros';
    }
  };

  const downloadReport = (format: 'json' | 'csv') => {
    const filename = `efd_analysis_${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV format
      const csvContent = [
        ['Grupo', 'Tipo', 'Severidade', 'Mensagem', 'Detalhes'],
        ...results.alertas.map(alerta => [
          alerta.grupo || '',
          alerta.tipo,
          alerta.severidade || '',
          alerta.mensagem,
          JSON.stringify(alerta.detalhes)
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Calcular estatísticas
  const resumo = results.resumo_executivo;
  const totalReceita = parseFloat(results.totais_documentos.total_saida);
  const totalM400 = Object.values(results.m400).reduce((sum, val) => sum + parseFloat(val), 0);
  const totalM800 = Object.values(results.m800).reduce((sum, val) => sum + parseFloat(val), 0);

  return (
    <div className="space-y-6">
      {/* Header com informações da empresa */}
      <Card>
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg sm:text-xl truncate">Análise EFD Contribuições</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{results.arquivo}</span>
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => downloadReport('json')}>
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadReport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">CNPJ:</span>
              <p className="font-medium">{results.cadastro.cnpj}</p>
            </div>
            <div>
              <span className="text-muted-foreground">UF:</span>
              <p className="font-medium">{results.cadastro.uf}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Período:</span>
              <p className="font-medium">
                {results.cadastro.periodo_ini && results.cadastro.periodo_fim
                  ? `${results.cadastro.periodo_ini} a ${results.cadastro.periodo_fim}`
                  : 'Não informado'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Regime:</span>
              <p className="font-medium">{results.regime.descricao}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Executivo */}
      {resumo && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Total de Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{resumo.total_alertas}</div>
              <p className="text-xs text-muted-foreground">
                {resumo.itens_analisados} itens analisados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Receita Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalReceita)}</div>
              <p className="text-xs text-muted-foreground">Documentos fiscais</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Apuração M400
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalM400)}</div>
              <p className="text-xs text-muted-foreground">PIS</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Apuração M800
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalM800)}</div>
              <p className="text-xs text-muted-foreground">COFINS</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertas por Grupo e Severidade */}
      {resumo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alertas por Grupo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(resumo.por_grupo).map(([grupo, count]) => (
                <div key={grupo} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getGrupoIcon(grupo)}
                    <span className="font-medium">{grupo}</span>
                    <span className="text-sm text-muted-foreground">
                      {getGrupoDescription(grupo)}
                    </span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alertas por Severidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(resumo.por_severidade).map(([severidade, count]) => (
                <div key={severidade} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(severidade)}
                    <span className="font-medium capitalize">{severidade}</span>
                  </div>
                  <Badge variant={getSeverityVariant(severidade)}>{count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alertas Identificados</CardTitle>
          <CardDescription>
            {results.alertas.length === 0 
              ? 'Nenhum alerta foi identificado na análise.'
              : `${results.alertas.length} alerta(s) encontrado(s) na análise.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.alertas.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="text-lg font-medium">Análise Concluída</p>
              <p className="text-muted-foreground">Nenhuma inconsistência foi encontrada.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.alertas.map((alerta, index) => (
                <Alert key={index} className="border-l-4" style={{ 
                  borderLeftColor: alerta.severidade === 'alta' ? 'rgb(239 68 68)' : 
                                  alerta.severidade === 'media' ? 'rgb(245 158 11)' : 
                                  'rgb(107 114 128)' 
                }}>
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(alerta.severidade)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <AlertTitle className="text-base font-medium">
                          {alerta.tipo}
                        </AlertTitle>
                        <div className="flex items-center gap-2">
                          {alerta.grupo && (
                            <Badge variant="outline" className="text-xs">
                              {alerta.grupo}
                            </Badge>
                          )}
                          {alerta.severidade && (
                            <Badge variant={getSeverityVariant(alerta.severidade)} className="text-xs">
                              {alerta.severidade}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <AlertDescription className="text-sm">
                        {alerta.mensagem}
                      </AlertDescription>
                      {alerta.detalhes && Object.keys(alerta.detalhes).length > 0 && (
                        <div className="mt-3 p-3 bg-muted/30 rounded-md">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Detalhes:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {Object.entries(alerta.detalhes).map(([key, value], detailIndex) => (
                              <div key={detailIndex}>
                                <span className="font-medium">{key}:</span>{' '}
                                <span className="text-muted-foreground">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhes por Abas */}
      <Tabs defaultValue="totais" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="totais" className="text-xs sm:text-sm py-2.5 min-h-[44px]">Totais por CFOP</TabsTrigger>
          <TabsTrigger value="m400" className="text-xs sm:text-sm py-2.5 min-h-[44px]">M400 (PIS)</TabsTrigger>
          <TabsTrigger value="m800" className="text-xs sm:text-sm py-2.5 min-h-[44px]">M800 (COFINS)</TabsTrigger>
        </TabsList>

        <TabsContent value="totais">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Receitas por CFOP de Saída</CardTitle>
              <CardDescription>
                Valores totais por Código Fiscal de Operações e Prestações
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(results.totais_documentos.por_cfop_saida).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma operação de saída encontrada.
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(results.totais_documentos.por_cfop_saida)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([cfop, valor]) => (
                      <div key={cfop} className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                        <div>
                          <span className="font-medium">CFOP {cfop}</span>
                        </div>
                        <span className="font-bold">{formatCurrency(valor)}</span>
                      </div>
                    ))}
                  <Separator />
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-md">
                    <span className="font-bold">Total Geral</span>
                    <span className="font-bold text-lg">{formatCurrency(results.totais_documentos.total_saida)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="m400">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Apuração M400 - PIS</CardTitle>
              <CardDescription>
                Receitas por Código de Situação Tributária (CST) - PIS
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(results.m400).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum registro M400 encontrado.
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(results.m400)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([cst, valor]) => (
                      <div key={cst} className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                        <div>
                          <span className="font-medium">CST {cst}</span>
                        </div>
                        <span className="font-bold">{formatCurrency(valor)}</span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="m800">  
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Apuração M800 - COFINS</CardTitle>
              <CardDescription>
                Receitas por Código de Situação Tributária (CST) - COFINS
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(results.m800).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum registro M800 encontrado.
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(results.m800)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([cst, valor]) => (
                      <div key={cst} className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                        <div>
                          <span className="font-medium">CST {cst}</span>
                        </div>
                        <span className="font-bold">{formatCurrency(valor)}</span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};