import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, Search, Filter, ChevronLeft, ChevronRight, LayoutGrid, List, TrendingUp, FileText, DollarSign } from 'lucide-react';
import { AlertaFiscal, EFDData } from '@/utils/efdParser';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AlertsPanelProps {
  alertas: AlertaFiscal[];
  efdData?: EFDData;
}

const formatCurrencyCard = (value?: number) => {
  if (!value && value !== 0) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Para EFD ICMS/IPI: em vez do cruzamento de receitas (Bloco M), mostra a
 * síntese da apuração do bloco E (conferências de fechamento E110/E520).
 */
const CardApuracaoIcmsIpi: React.FC<{ efdData: EFDData }> = ({ efdData }) => {
  const icmsIpi = efdData.icmsIpi;
  const conferencias = icmsIpi?.conferencias ?? [];
  const conferidas = conferencias.filter(c => c.fechou).length;
  const divergentes = conferencias.length - conferidas;

  return (
    <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <span className="font-bold">Apuração ICMS/IPI (Bloco E)</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Conferência de fechamento: E110 (ICMS) e E510/E520 (IPI). Tolerância de R$ 0,02.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="p-4 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent rounded-lg border-l-4 border-primary">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-foreground mb-2">
                {conferencias.length === 0
                  ? 'Sem registros de apuração'
                  : `${conferidas} de ${conferencias.length} conferências fecham · ${divergentes} divergente${divergentes === 1 ? '' : 's'}`}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <Badge variant="outline" className="bg-primary/10 border-primary/30 w-fit">
                  ICMS a recolher: {formatCurrencyCard(icmsIpi?.resumo.icmsRecolher)}
                </Badge>
                <Badge variant="outline" className="bg-success/10 border-success/30 w-fit">
                  IPI saldo declarado: {formatCurrencyCard(icmsIpi?.resumo.ipiSaldo)}
                </Badge>
                <Badge variant="outline" className="bg-warning/10 border-warning/30 w-fit">
                  E116 obrigações: {icmsIpi?.apuracaoIcms.e116.length ?? 0}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Conferências de Fechamento
          </h4>
          {conferencias.length === 0 ? (
            <div className="p-4 bg-warning/10 border-l-4 border-warning rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-bold text-warning mb-1">Bloco E ausente ou incompleto</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Não foram encontrados registros de apuração (E100/E110) ou do IPI (E500/E520) no período.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {conferencias.map(conf => {
                const fechou = conf.fechou;
                return (
                  <div
                    key={conf.id}
                    className={`p-4 rounded-lg border ${
                      fechou
                        ? 'bg-success/10 border-success/30'
                        : 'bg-destructive/10 border-destructive/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {fechou ? (
                          <Info className="h-4 w-4 text-success shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                        )}
                        <span className="text-sm font-bold text-foreground truncate">{conf.titulo}</span>
                      </div>
                      <Badge variant="outline" className={`${fechou ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'} shrink-0`}>
                        {fechou ? 'FECHA' : 'NÃO FECHA'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {conf.detalhes}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded bg-card/60 font-bold ${fechou ? 'text-success' : 'text-destructive'}`}>
                        Diferença: {formatCurrencyCard(conf.diferenca)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alertas, efdData }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSeveridade, setFiltroSeveridade] = useState<string>('todos');
  const [filtroGrupo, setFiltroGrupo] = useState<string>('todos');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [visualizacao, setVisualizacao] = useState<'lista' | 'compacta'>('compacta');
  const itensPorPagina = visualizacao === 'compacta' ? 50 : 20;

  const getSeverityIcon = (severidade: string) => {
    switch (severidade) {
      case 'alta':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'media':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const getSeverityBadge = (severidade: string) => {
    const variants: Record<string, { variant: "default" | "destructive" | "outline" | "secondary" | "warning" | "success"; className: string }> = {
      alta: { variant: 'destructive', className: 'shadow-sm shadow-destructive/20 border-destructive/30' },
      media: { variant: 'warning', className: 'shadow-sm shadow-warning/20 border-warning/30' },
      baixa: { variant: 'secondary', className: 'shadow-sm' },
    };
    const config = variants[severidade] || { variant: 'default' as const, className: '' };
    return <Badge variant={config.variant} className={config.className}>{severidade.toUpperCase()}</Badge>;
  };

  const getGroupBadge = (grupo: string) => {
    const colors: Record<string, string> = {
      G1: 'bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground border-destructive font-bold shadow-md shadow-destructive/20',
      G2: 'bg-gradient-to-r from-warning to-warning/80 text-warning-foreground border-warning font-bold shadow-md shadow-warning/20',
      G3: 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-primary font-bold shadow-md shadow-primary/20',
      G4: 'bg-gradient-to-r from-success to-success/80 text-success-foreground border-success font-bold shadow-md shadow-success/20',
    };
    return (
      <Badge variant="outline" className={colors[grupo]}>
        {grupo}
      </Badge>
    );
  };

  const getGroupDescription = (grupo: string) => {
    const descriptions: Record<string, string> = {
      G1: 'Divergências PIS/COFINS',
      G2: 'Incompatibilidade de Regime',
      G3: 'Reconciliação M×Docs',
      G4: 'Classificação/NCM',
    };
    return descriptions[grupo] || grupo;
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const alertasFiltrados = useMemo(() => {
    return alertas.filter(alerta => {
      const matchSearch = 
        alerta.mensagem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alerta.detalhes.produto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alerta.detalhes.ncm?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchSeveridade = filtroSeveridade === 'todos' || alerta.severidade === filtroSeveridade;
      const matchGrupo = filtroGrupo === 'todos' || alerta.grupo === filtroGrupo;
      
      return matchSearch && matchSeveridade && matchGrupo;
    });
  }, [alertas, searchTerm, filtroSeveridade, filtroGrupo]);

  // Estatísticas dos alertas
  const estatisticas = useMemo(() => {
    const porSeveridade = alertasFiltrados.reduce((acc, a) => {
      acc[a.severidade] = (acc[a.severidade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const porGrupo = alertasFiltrados.reduce((acc, a) => {
      acc[a.grupo] = (acc[a.grupo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const impactoTotal = alertasFiltrados.reduce((sum, a) => sum + (a.detalhes.impacto || 0), 0);

    return { porSeveridade, porGrupo, impactoTotal };
  }, [alertasFiltrados]);

  // Paginação
  const totalPaginas = Math.ceil(alertasFiltrados.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;
  const alertasPaginados = alertasFiltrados.slice(indiceInicio, indiceFim);

  // Reset página ao filtrar
  React.useEffect(() => {
    setPaginaAtual(1);
  }, [searchTerm, filtroSeveridade, filtroGrupo]);

  return (
    <Card className="overflow-hidden shadow-xl hover:shadow-2xl transition-all">
      <CardHeader className="bg-gradient-to-r from-destructive/10 via-warning/5 to-transparent border-b-2 border-destructive/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-lg bg-gradient-to-br from-destructive to-warning shadow-md">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-destructive to-warning bg-clip-text text-transparent font-bold">
                Painel de Alertas Fiscais
              </span>
            </CardTitle>
            <CardDescription className="mt-2 font-medium">
              {alertasFiltrados.length} de {alertas.length} alertas identificados
            </CardDescription>
          </div>
          <Tabs value={visualizacao} onValueChange={(v) => setVisualizacao(v as 'lista' | 'compacta')}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="compacta" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Compacta
              </TabsTrigger>
              <TabsTrigger value="lista" className="gap-2">
                <List className="h-4 w-4" />
                Detalhada
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Resumo de Cruzamento de Receitas (apenas EFD-Contribuições) */}
        {efdData && efdData.leiaute !== 'efd-icms-ipi' && (
          <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg mb-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <span className="font-bold">Cruzamento de Receitas</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Reconciliação entre receita documental (Blocos A, C, D, F) e receita apurada (M210/M610)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Resumo Executivo */}
              <div className="p-4 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent rounded-lg border-l-4 border-primary">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-foreground mb-1">Receita Total Identificada</h4>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary mb-2 break-words">
                      {formatCurrency(efdData.receitaDocumental.total)}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Valor extraído dos documentos fiscais (registros A, C, D e F) após aplicação das regras de CFOP e filtros de receita tributável.
                    </p>
                  </div>
                </div>
              </div>

              {/* Receita Documental por Bloco */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Detalhamento por Origem
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 hover:shadow-lg hover:shadow-primary/10 transition-all overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div className="text-xs font-bold text-primary dark:text-primary">Bloco A</div>
                    </div>
                    <div className="text-sm sm:text-base lg:text-lg font-bold text-primary dark:text-primary mb-1 break-words">
                      {formatCurrency(efdData.receitaDocumental.blocoA)}
                    </div>
                    <div className="text-xs text-muted-foreground">Serviços Prestados</div>
                    <div className="text-xs text-primary dark:text-primary mt-1">
                      {efdData.receitaDocumental.total > 0 
                        ? `${((efdData.receitaDocumental.blocoA / efdData.receitaDocumental.total) * 100).toFixed(1)}%`
                        : '0%'}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-success/10 to-success/5 rounded-lg border border-success/20 hover:shadow-lg hover:shadow-success/10 transition-all overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-success"></div>
                      <div className="text-xs font-bold text-success dark:text-success">Bloco C</div>
                    </div>
                    <div className="text-sm sm:text-base lg:text-lg font-bold text-success dark:text-success mb-1 break-words">
                      {formatCurrency(efdData.receitaDocumental.blocoC)}
                    </div>
                    <div className="text-xs text-muted-foreground">Vendas Mercadorias</div>
                    <div className="text-xs text-success dark:text-success mt-1">
                      {efdData.receitaDocumental.total > 0 
                        ? `${((efdData.receitaDocumental.blocoC / efdData.receitaDocumental.total) * 100).toFixed(1)}%`
                        : '0%'}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-efd-primary/10 to-efd-primary/5 rounded-lg border border-efd-primary/20 hover:shadow-lg hover:shadow-efd-primary/10 transition-all overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-efd-primary"></div>
                      <div className="text-xs font-bold text-efd-primary dark:text-efd-primary">Bloco D</div>
                    </div>
                    <div className="text-sm sm:text-base lg:text-lg font-bold text-efd-primary dark:text-efd-primary mb-1 break-words">
                      {formatCurrency(efdData.receitaDocumental.blocoD)}
                    </div>
                    <div className="text-xs text-muted-foreground">Comunicação/Transporte</div>
                    <div className="text-xs text-efd-primary dark:text-efd-primary mt-1">
                      {efdData.receitaDocumental.total > 0 
                        ? `${((efdData.receitaDocumental.blocoD / efdData.receitaDocumental.total) * 100).toFixed(1)}%`
                        : '0%'}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-warning/10 to-warning/5 rounded-lg border border-warning/20 hover:shadow-lg hover:shadow-warning/10 transition-all overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-warning"></div>
                      <div className="text-xs font-bold text-warning dark:text-warning">Bloco F</div>
                    </div>
                    <div className="text-sm sm:text-base lg:text-lg font-bold text-warning dark:text-warning mb-1 break-words">
                      {formatCurrency(efdData.receitaDocumental.blocoF)}
                    </div>
                    <div className="text-xs text-muted-foreground">Demais Receitas</div>
                    <div className="text-xs text-warning dark:text-warning mt-1">
                      {efdData.receitaDocumental.total > 0 
                        ? `${((efdData.receitaDocumental.blocoF / efdData.receitaDocumental.total) * 100).toFixed(1)}%`
                        : '0%'}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg border-2 border-primary/30 shadow-md col-span-2 lg:col-span-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div className="text-xs font-bold text-primary uppercase">Total Geral</div>
                    </div>
                    <div className="text-base sm:text-lg lg:text-xl font-bold text-primary mb-1 break-words">
                      {formatCurrency(efdData.receitaDocumental.total)}
                    </div>
                    <div className="text-xs text-muted-foreground">Documentos Fiscais</div>
                    <div className="text-xs text-primary mt-1 font-semibold">100%</div>
                  </div>
                </div>
              </div>

              {/* Receita Apurada M210/M610 */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Receita Declarada (Bloco M)
                </h4>
                {efdData.receitaApurada.pisM210 === 0 && efdData.receitaApurada.cofinsM610 === 0 ? (
                  <div className="p-4 bg-warning/10 border-l-4 border-warning rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-sm font-bold text-warning mb-1">⚠️ Bloco M Ausente ou Incompleto</h5>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                          Os registros <strong>M210 (PIS)</strong> e <strong>M610 (COFINS)</strong> não foram encontrados ou estão zerados. 
                          Estes registros são essenciais para declarar a receita bruta base de cálculo das contribuições.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 text-xs">
                          <Badge variant="outline" className="bg-warning/10 border-warning/30 w-fit">
                            Receitas identificadas: {formatCurrency(efdData.receitaDocumental.total)}
                          </Badge>
                          <Badge variant="outline" className="bg-destructive/10 border-destructive/30 w-fit">
                            M210/M610: Não declarado
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 bg-gradient-to-br from-accent/15 to-accent/5 rounded-lg border border-accent/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                        <div className="text-xs font-bold text-accent uppercase">M210 (PIS)</div>
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-accent">{formatCurrency(efdData.receitaApurada.pisM210)}</div>
                      <div className="text-xs text-muted-foreground mt-1">Receita Base PIS</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-accent/15 to-accent/5 rounded-lg border border-accent/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                        <div className="text-xs font-bold text-accent uppercase">M610 (COFINS)</div>
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-accent">{formatCurrency(efdData.receitaApurada.cofinsM610)}</div>
                      <div className="text-xs text-muted-foreground mt-1">Receita Base COFINS</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-accent/20 to-accent/5 rounded-lg border-2 border-accent/40 shadow-md">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                        <div className="text-xs font-bold text-accent uppercase">Média</div>
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-accent">{formatCurrency(efdData.receitaApurada.total)}</div>
                      <div className="text-xs text-muted-foreground mt-1">Média PIS/COFINS</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Diferença de Reconciliação */}
              {(efdData.receitaApurada.pisM210 > 0 || efdData.receitaApurada.cofinsM610 > 0) && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Análise de Divergência
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(() => {
                      const difPIS = efdData.receitaDocumental.total - efdData.receitaApurada.pisM210;
                      const difCOFINS = efdData.receitaDocumental.total - efdData.receitaApurada.cofinsM610;
                      const difMedia = efdData.receitaDocumental.total - efdData.receitaApurada.total;
                      const percPIS = efdData.receitaApurada.pisM210 > 0 ? ((Math.abs(difPIS) / efdData.receitaApurada.pisM210) * 100).toFixed(2) : '0.00';
                      const percCOFINS = efdData.receitaApurada.cofinsM610 > 0 ? ((Math.abs(difCOFINS) / efdData.receitaApurada.cofinsM610) * 100).toFixed(2) : '0.00';
                      const percMedia = efdData.receitaApurada.total > 0 ? ((Math.abs(difMedia) / efdData.receitaApurada.total) * 100).toFixed(2) : '0.00';
                      
                      const isAlertPIS = Math.abs(difPIS) > 1000;
                      const isAlertCOFINS = Math.abs(difCOFINS) > 1000;
                      const isAlertMedia = Math.abs(difMedia) > 1000;
                      
                      return (
                        <>
                          <div className={`p-4 rounded-lg border ${isAlertPIS ? 'bg-destructive/10 border-destructive/30' : 'bg-success/10 border-success/30'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              {isAlertPIS ? <AlertCircle className="h-4 w-4 text-destructive" /> : <Info className="h-4 w-4 text-success" />}
                              <div className="text-xs font-bold text-muted-foreground">Docs × M210</div>
                            </div>
                            <div className={`text-base sm:text-lg font-bold ${isAlertPIS ? 'text-destructive' : 'text-success'} mb-1`}>
                              {difPIS > 0 ? '+' : ''}{formatCurrency(difPIS)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Variação: {percPIS}%
                            </div>
                          </div>
                          <div className={`p-4 rounded-lg border ${isAlertCOFINS ? 'bg-destructive/10 border-destructive/30' : 'bg-success/10 border-success/30'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              {isAlertCOFINS ? <AlertCircle className="h-4 w-4 text-destructive" /> : <Info className="h-4 w-4 text-success" />}
                              <div className="text-xs font-bold text-muted-foreground">Docs × M610</div>
                            </div>
                            <div className={`text-base sm:text-lg font-bold ${isAlertCOFINS ? 'text-destructive' : 'text-success'} mb-1`}>
                              {difCOFINS > 0 ? '+' : ''}{formatCurrency(difCOFINS)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Variação: {percCOFINS}%
                            </div>
                          </div>
                          <div className={`p-4 rounded-lg border ${isAlertMedia ? 'bg-destructive/10 border-destructive/30' : 'bg-success/10 border-success/30'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              {isAlertMedia ? <AlertCircle className="h-4 w-4 text-destructive" /> : <Info className="h-4 w-4 text-success" />}
                              <div className="text-xs font-bold text-muted-foreground">Diferença Média</div>
                            </div>
                            <div className={`text-base sm:text-lg font-bold ${isAlertMedia ? 'text-destructive' : 'text-success'} mb-1`}>
                              {difMedia > 0 ? '+' : ''}{formatCurrency(difMedia)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Variação: {percMedia}%
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong>Interpretação:</strong> Valores positivos indicam que a receita documental é maior que a declarada no Bloco M. 
                      Divergências acima de R$ 1.000,00 requerem análise detalhada para identificar possíveis inconsistências ou subdeclaração.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resumo da Apuração ICMS/IPI (bloco E) */}
        {efdData && efdData.leiaute === 'efd-icms-ipi' && <CardApuracaoIcmsIpi efdData={efdData} />}

        {/* Resumo Estatístico */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-5 bg-gradient-to-br from-destructive/15 to-destructive/5 rounded-xl border-2 border-destructive/30 shadow-md hover:shadow-xl hover:shadow-destructive/10 transition-all hover-lift">
            <div className="text-xs font-bold text-destructive/70 mb-2 uppercase tracking-wider flex items-center gap-2">
              🔴 Alta
            </div>
            <div className="text-3xl font-bold text-destructive">{estatisticas.porSeveridade.alta || 0}</div>
          </div>
          <div className="p-5 bg-gradient-to-br from-warning/15 to-warning/5 rounded-xl border-2 border-warning/30 shadow-md hover:shadow-xl hover:shadow-warning/10 transition-all hover-lift">
            <div className="text-xs font-bold text-warning/70 mb-2 uppercase tracking-wider flex items-center gap-2">
              🟡 Média
            </div>
            <div className="text-3xl font-bold text-warning">{estatisticas.porSeveridade.media || 0}</div>
          </div>
          <div className="p-5 bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl border-2 border-primary/30 shadow-md hover:shadow-xl hover:shadow-primary/10 transition-all hover-lift">
            <div className="text-xs font-bold text-primary/70 mb-2 uppercase tracking-wider flex items-center gap-2">
              🔵 Baixa
            </div>
            <div className="text-3xl font-bold text-primary">{estatisticas.porSeveridade.baixa || 0}</div>
          </div>
          <div className="p-5 bg-gradient-to-br from-accent/15 to-accent/5 rounded-xl border-2 border-accent/30 shadow-md hover:shadow-xl hover:shadow-accent/10 transition-all hover-lift">
            <div className="text-xs font-bold text-accent/70 mb-2 uppercase tracking-wider flex items-center gap-2">
              💰 Impacto
            </div>
            <div className="text-xl font-bold text-accent">{formatCurrency(estatisticas.impactoTotal)}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por produto, NCM ou mensagem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filtroSeveridade} onValueChange={setFiltroSeveridade}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="G1">G1 - Divergências</SelectItem>
              <SelectItem value="G2">G2 - Regime</SelectItem>
              <SelectItem value="G3">G3 - Reconciliação</SelectItem>
              <SelectItem value="G4">G4 - Classificação</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de alertas paginados */}
        {visualizacao === 'compacta' ? (
          <div className="space-y-3">
            {alertasPaginados.map((alerta) => (
              <div
                key={alerta.id}
                className="group border-2 rounded-xl p-4 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer bg-gradient-to-r from-card to-card/95 hover:scale-[1.01]"
                onClick={() => setExpandedId(expandedId === alerta.id ? null : alerta.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
                    {getSeverityIcon(alerta.severidade)}
                  </div>
                  <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                    {getGroupBadge(alerta.grupo)}
                    {getSeverityBadge(alerta.severidade)}
                    <span className="text-sm font-semibold truncate">{alerta.mensagem}</span>
                  </div>
                  {alerta.detalhes.impacto && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 shrink-0">
                      <TrendingUp className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-bold text-destructive">{formatCurrency(alerta.detalhes.impacto)}</span>
                    </div>
                  )}
                  <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedId === alerta.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {expandedId === alerta.id && (
                  <div className="mt-4 pt-4 border-t-2 border-primary/10 space-y-4 animate-fade-in bg-gradient-to-br from-muted/30 to-transparent rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {alerta.detalhes.produto && (
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produto</span>
                          <p className="font-bold truncate text-foreground" title={alerta.detalhes.produto}>{alerta.detalhes.produto}</p>
                        </div>
                      )}
                      {alerta.detalhes.ncm && (
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">NCM</span>
                          <p className="font-bold text-foreground">{alerta.detalhes.ncm}</p>
                        </div>
                      )}
                      {alerta.detalhes.documento && (
                        <div>
                          <span className="text-xs text-muted-foreground">Documento</span>
                          <p className="font-medium">{alerta.detalhes.documento}</p>
                        </div>
                      )}
                      {alerta.detalhes.cfop && (
                        <div>
                          <span className="text-xs text-muted-foreground">CFOP</span>
                          <p className="font-medium">{alerta.detalhes.cfop}</p>
                        </div>
                      )}
                    </div>

                    {alerta.detalhes.baseCalculo && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/50 rounded-lg">
                        <div>
                          <span className="text-xs text-muted-foreground">Base de Cálculo</span>
                          <p className="text-sm font-medium">{formatCurrency(alerta.detalhes.baseCalculo)}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Aplicada</span>
                          <p className="text-sm font-medium">{alerta.detalhes.aliquotaAplicada}%</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Esperada</span>
                          <p className="text-sm font-medium text-primary">{alerta.detalhes.aliquotaEsperada}%</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Impacto</span>
                          <p className="text-sm font-bold text-destructive">{formatCurrency(alerta.detalhes.impacto)}</p>
                        </div>
                      </div>
                    )}

                    {alerta.detalhes.acaoSugerida && (
                      <div className="p-3 bg-primary/5 border-l-2 border-primary rounded">
                        <span className="text-xs font-medium text-primary">Ação Sugerida</span>
                        <p className="text-sm mt-1">{alerta.detalhes.acaoSugerida}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {alertasPaginados.map((alerta) => (
              <div
                key={alerta.id}
                className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-card"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getSeverityIcon(alerta.severidade)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getGroupBadge(alerta.grupo)}
                          {getSeverityBadge(alerta.severidade)}
                          <span className="text-xs text-muted-foreground">
                            {getGroupDescription(alerta.grupo)}
                          </span>
                        </div>
                        <h4 className="font-semibold text-foreground text-lg">{alerta.mensagem}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{alerta.tipo}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(expandedId === alerta.id ? null : alerta.id)}
                      >
                        {expandedId === alerta.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {expandedId === alerta.id && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4">
                          {alerta.detalhes.produto && (
                            <div>
                              <span className="text-xs text-muted-foreground">Produto</span>
                              <p className="text-sm font-medium">{alerta.detalhes.produto}</p>
                            </div>
                          )}
                          {alerta.detalhes.ncm && (
                            <div>
                              <span className="text-xs text-muted-foreground">NCM</span>
                              <p className="text-sm font-medium">{alerta.detalhes.ncm}</p>
                            </div>
                          )}
                          {alerta.detalhes.documento && (
                            <div>
                              <span className="text-xs text-muted-foreground">Documento</span>
                              <p className="text-sm font-medium">{alerta.detalhes.documento}</p>
                            </div>
                          )}
                          {alerta.detalhes.cfop && (
                            <div>
                              <span className="text-xs text-muted-foreground">CFOP</span>
                              <p className="text-sm font-medium">{alerta.detalhes.cfop}</p>
                            </div>
                          )}
                        </div>

                        {alerta.detalhes.baseCalculo && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t">
                            <div>
                              <span className="text-xs text-muted-foreground">Base de Cálculo</span>
                              <p className="text-sm font-medium">{formatCurrency(alerta.detalhes.baseCalculo)}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Alíquota Aplicada</span>
                              <p className="text-sm font-medium">{alerta.detalhes.aliquotaAplicada}%</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Alíquota Esperada</span>
                              <p className="text-sm font-medium text-primary">{alerta.detalhes.aliquotaEsperada}%</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Impacto</span>
                              <p className="text-sm font-bold text-destructive">{formatCurrency(alerta.detalhes.impacto)}</p>
                            </div>
                          </div>
                        )}

                        {alerta.detalhes.acaoSugerida && (
                          <div className="pt-3 border-t">
                            <span className="text-xs text-muted-foreground">Ação Sugerida</span>
                            <p className="text-sm mt-1 text-foreground">{alerta.detalhes.acaoSugerida}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {alertasFiltrados.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum alerta encontrado com os filtros aplicados</p>
          </div>
        )}

        {/* Paginação */}
        {alertasFiltrados.length > itensPorPagina && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {indiceInicio + 1} a {Math.min(indiceFim, alertasFiltrados.length)} de {alertasFiltrados.length} alertas
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                disabled={paginaAtual === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium">
                Página {paginaAtual} de {totalPaginas}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                disabled={paginaAtual === totalPaginas}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
