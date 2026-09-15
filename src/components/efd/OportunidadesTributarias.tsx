import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Download, TrendingUp, AlertTriangle, CheckCircle2,
  DollarSign, FileBarChart, Filter, Lightbulb, Target, ShieldAlert
} from 'lucide-react';
import { A11yChartTable } from '@/components/a11y/A11yChartTable';
import { A11yListenButton } from '@/components/a11y/A11yListenButton';
import { usePageSummary } from '@/contexts/AccessibilityContext';
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { EFDData } from '@/utils/efdParser';
import { 
  detectarTodasOportunidades, 
  calcularResumoOportunidades,
  OportunidadeTributaria,
  ResumoOportunidades 
} from '@/utils/detectarOportunidadesTributarias';

interface OportunidadesTributariasProps {
  efdData: EFDData;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const getSeveridadeColor = (severidade: string) => {
  switch (severidade) {
    case 'alta': return 'bg-destructive/10 text-destructive border-destructive/25';
    case 'media': return 'bg-warning/10 text-warning border-warning/25';
    case 'baixa': return 'bg-primary/10 text-primary border-primary/25';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Oportunidade': return 'bg-success/10 text-success border-success/25';
    case 'Reaver': return 'bg-efd-primary/10 text-efd-primary border-efd-primary/25';
    case 'Inconsistência': return 'bg-warning/10 text-warning border-warning/25';
    case 'Auditoria': return 'bg-destructive/10 text-destructive border-destructive/25';
    default: return 'bg-muted text-muted-foreground border-border';
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

const CHART_COLORS = [
  'hsl(var(--efd-primary))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-2))',
  'hsl(var(--efd-glow))',
];

export const OportunidadesTributarias: React.FC<OportunidadesTributariasProps> = React.memo(({ efdData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
  const [severidadeFilter, setSeveridadeFilter] = useState<string>('TODOS');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');

  // Detecta todas as oportunidades
  const oportunidades = useMemo(() => {
    return detectarTodasOportunidades(efdData);
  }, [efdData]);

  // Calcula resumo
  const resumo = useMemo(() => {
    return calcularResumoOportunidades(oportunidades);
  }, [oportunidades]);

  // Texto falado pelo botão "Ouvir" — acessibilidade / deficiência visual
  const resumoOral = useMemo(() => {
    const porSeveridade = [
      `alta: ${resumo.porSeveridade['alta'] || 0}`,
      `média: ${resumo.porSeveridade['media'] || 0}`,
      `baixa: ${resumo.porSeveridade['baixa'] || 0}`,
    ].join(', ');
    const topNcm = resumo.top10NCMs.length > 0
      ? ` E os NCMs com maior impacto são ${resumo.top10NCMs
          .slice(0, 3)
          .map((n, i) => `${i + 1}º, ${n.ncm}, ${formatCurrency(n.impacto)}`)
          .join('; ')}.`
      : '';
    return `Oportunidades Tributárias. Foram identificadas automaticamente ${resumo.totalOportunidades} oportunidades, com potencial de recuperação de ${formatCurrency(resumo.totalImpactoFinanceiro)}. Por severidade, ${porSeveridade}, e ${resumo.porStatus['Reaver'] || 0} itens para reaver via PERD/DCOMP.${topNcm}`;
  }, [resumo]);

  usePageSummary(resumoOral);

  // Filtra oportunidades
  const filteredOportunidades = useMemo(() => {
    return oportunidades.filter(op => {
      const matchSearch = 
        searchTerm === '' ||
        op.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.ncm?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.produto?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchTipo = tipoFilter === 'TODOS' || op.tipo === tipoFilter;
      const matchSeveridade = severidadeFilter === 'TODOS' || op.severidade === severidadeFilter;
      const matchStatus = statusFilter === 'TODOS' || op.status === statusFilter;

      return matchSearch && matchTipo && matchSeveridade && matchStatus;
    });
  }, [oportunidades, searchTerm, tipoFilter, severidadeFilter, statusFilter]);

  // Prepara dados para gráficos
  const chartDataPorTipo = useMemo(() => {
    return Object.entries(resumo.porTipo).map(([tipo, quantidade]) => ({
      tipo: getTipoLabel(tipo),
      quantidade
    }));
  }, [resumo]);

  const chartDataPorSeveridade = useMemo(() => {
    return Object.entries(resumo.porSeveridade).map(([severidade, quantidade]) => ({
      name: severidade.charAt(0).toUpperCase() + severidade.slice(1),
      value: quantidade
    }));
  }, [resumo]);

  const handleExportCSV = () => {
    const csvContent = [
      ['Tipo', 'Título', 'NCM', 'CFOP', 'CST', 'Produto', 'Valor Base', 'Alíq. Devida', 'Alíq. Aplicada', 'Diferença', 'Impacto Financeiro', 'Status', 'Severidade', 'Ação Sugerida'].join(';'),
      ...filteredOportunidades.map(op => [
        getTipoLabel(op.tipo),
        op.titulo,
        op.ncm || '',
        op.cfop || '',
        op.cst || '',
        op.produto || '',
        op.valorBase.toFixed(2),
        op.aliquotaDevida?.toFixed(2) || '',
        op.aliquotaAplicada?.toFixed(2) || '',
        op.diferenca.toFixed(2),
        op.impactoFinanceiro.toFixed(2),
        op.status,
        op.severidade,
        op.acaoSugerida
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `oportunidades_tributarias_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-efd-primary/10 via-destructive/5 to-background border-2 p-8 shadow-xl">
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-gradient-to-br from-efd-primary to-destructive rounded-xl shadow-lg shadow-efd-primary/30">
                <Lightbulb className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-efd-primary to-destructive bg-clip-text text-transparent">
                  Oportunidades Tributárias
                </h1>
                <p className="text-muted-foreground font-medium mt-1">
                  Análise automática de créditos não aproveitados, pagamentos indevidos e inconsistências fiscais
                </p>
              </div>
            </div>
            <A11yListenButton text={resumoOral} label="Ouvir resumo" />
          </div>
        </div>
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-efd-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-destructive/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Cards de Resumo Executivo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-efd-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Oportunidades</CardTitle>
            <div className="p-2 bg-efd-primary/10 rounded-lg">
              <Target className="h-5 w-5 text-efd-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-efd-primary">{resumo.totalOportunidades}</div>
            <p className="text-xs text-muted-foreground mt-1">Identificadas automaticamente</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Impacto Financeiro</CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{formatCurrency(resumo.totalImpactoFinanceiro)}</div>
            <p className="text-xs text-muted-foreground mt-1">Potencial de recuperação</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Alta Severidade</CardTitle>
            <div className="p-2 bg-destructive/10 rounded-lg">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{resumo.porSeveridade['alta'] || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Ação imediata recomendada</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Para Reaver</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{resumo.porStatus['Reaver'] || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Via PER/DCOMP</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Distribuição por Tipo</CardTitle>
            <CardDescription>Classificação das oportunidades identificadas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartDataPorTipo}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="tipo" angle={-45} textAnchor="end" height={100} stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '2px solid hsl(var(--primary))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="quantidade" radius={[8, 8, 0, 0]}>
                  {chartDataPorTipo.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
</BarChart>
            </ResponsiveContainer>
            <A11yChartTable
              caption="Oportunidades por tipo de classificação"
              headers={['Tipo', 'Quantidade']}
              rows={chartDataPorTipo.map((item) => [item.tipo, item.quantidade])}
            />
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Severidade das Oportunidades</CardTitle>
            <CardDescription>Nível de prioridade das ações</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartDataPorSeveridade}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {chartDataPorSeveridade.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name === 'Alta' ? 'hsl(var(--destructive))' :
                        entry.name === 'Media' ? 'hsl(var(--warning))' : 'hsl(var(--primary))'
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '2px solid hsl(var(--primary))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <A11yChartTable
              caption="Oportunidades por severidade"
              headers={['Severidade', 'Quantidade']}
              rows={chartDataPorSeveridade.map((item) => [item.name, item.value])}
            />
          </CardContent>
        </Card>
      </div>

      {/* Top 10 NCMs com Maior Impacto */}
      {resumo.top10NCMs.length > 0 && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Top 10 NCMs com Maior Impacto Financeiro</CardTitle>
            <CardDescription>Classificações que concentram oportunidades de maior valor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resumo.top10NCMs.map((item, index) => (
                <div key={item.ncm} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-semibold">{item.ncm}</span>
                      <span className="font-bold text-success">{formatCurrency(item.impacto)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-efd-primary to-efd-glow h-2 rounded-full transition-all"
                        style={{ width: `${(item.impacto / resumo.top10NCMs[0].impacto) * 100}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant="secondary">{item.quantidade} {item.quantidade === 1 ? 'oportunidade' : 'oportunidades'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle>Filtros</CardTitle>
          </div>
          <CardDescription>Refine sua análise de oportunidades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-semibold">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="NCM, produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo" className="text-sm font-semibold">Tipo</Label>
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
              <Label htmlFor="severidade" className="text-sm font-semibold">Severidade</Label>
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
              <Label htmlFor="status" className="text-sm font-semibold">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="Oportunidade">Oportunidade</SelectItem>
                  <SelectItem value="Reaver">Reaver</SelectItem>
                  <SelectItem value="Inconsistência">Inconsistência</SelectItem>
                  <SelectItem value="Auditoria">Auditoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Oportunidades */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Oportunidades Identificadas</CardTitle>
              <CardDescription>
                Mostrando {filteredOportunidades.length} de {oportunidades.length} oportunidades
              </CardDescription>
            </div>
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Tipo</TableHead>
                  <TableHead className="font-bold">Título</TableHead>
                  <TableHead className="font-bold">NCM</TableHead>
                  <TableHead className="font-bold">CFOP</TableHead>
                  <TableHead className="font-bold">Produto</TableHead>
                  <TableHead className="font-bold text-right">Valor Base</TableHead>
                  <TableHead className="font-bold text-right">Impacto</TableHead>
                  <TableHead className="font-bold text-center">Status</TableHead>
                  <TableHead className="font-bold text-center">Severidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOportunidades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-success" />
                        <p>Nenhuma oportunidade encontrada com os filtros aplicados</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOportunidades.map((op) => (
                    <TableRow key={op.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getTipoLabel(op.tipo)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div>
                          <p className="font-semibold text-sm">{op.titulo}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{op.descricao}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{op.ncm || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">{op.cfop || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm">{op.produto || '-'}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(op.valorBase)}</TableCell>
                      <TableCell className="text-right font-bold text-success">{formatCurrency(op.impactoFinanceiro)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={getStatusColor(op.status)}>
                          {op.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={getSeveridadeColor(op.severidade)}>
                          {op.severidade}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detalhamento das Ações Sugeridas */}
      {filteredOportunidades.length > 0 && (
        <Card className="border-2 border-warning/40 bg-gradient-to-br from-warning/10 to-transparent">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <CardTitle className="text-warning dark:text-warning">Ações Recomendadas</CardTitle>
            </div>
            <CardDescription>Próximos passos para aproveitamento das oportunidades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredOportunidades.slice(0, 5).map((op, index) => (
                <div key={op.id} className="p-4 bg-background rounded-lg border-2 border-warning/30">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-warning text-warning-foreground font-bold text-xs flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-2">
<div className="flex items-center justify-between">
                        <h4 className="font-semibold">{op.titulo}</h4>
                        <Badge variant="outline" className={getStatusColor(op.status)}>{op.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{op.acaoSugerida}</p>
                      {op.detalhamentoTecnico && (
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer font-semibold hover:text-foreground">
                            Detalhamento técnico
                          </summary>
                          <p className="mt-2 pl-4 border-l-2 border-warning/40">{op.detalhamentoTecnico}</p>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
