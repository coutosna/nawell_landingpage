import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, AlertTriangle, Calculator, FileText, DollarSign, TrendingUp, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { RiscoFiscalItem, ResumoRiscoFiscal } from '@/utils/fiscalCalculations';

interface FiscalReportProps {
  riscoFiscal: ResumoRiscoFiscal;
  empresaNome: string;
  cnpj: string;
  periodo: string;
}

export const FiscalReport = React.memo(({ riscoFiscal, empresaNome, cnpj, periodo }: FiscalReportProps) => {
  const [calculandoSelic, setCalculandoSelic] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const downloadReport = (format: 'json' | 'csv') => {
    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        content = JSON.stringify(
          {
            empresa: { nome: empresaNome, cnpj, periodo },
            resumo: {
              totalPrincipal: riscoFiscal.totalPrincipal,
              totalMulta: riscoFiscal.totalMulta,
              totalJurosEstimado: riscoFiscal.totalJurosEstimado,
              totalGeral: riscoFiscal.totalGeral,
            },
            itens: riscoFiscal.itens,
          },
          null,
          2
        );
        filename = `relatorio-fiscal-${cnpj}-${Date.now()}.json`;
        mimeType = 'application/json';
      } else {
        const headers = [
          'Produto', 'NCM', 'Documento', 'Data Operação',
          'Base Cálculo', 'PIS Informado', 'PIS Devido',
          'PIS Alíq. Informada', 'PIS Alíq. Devida', 'PIS Diferença',
          'COFINS Informado', 'COFINS Devido',
          'COFINS Alíq. Informada', 'COFINS Alíq. Devida', 'COFINS Diferença',
          'Total a Complementar', 'Multa (20%)', 'Juros SELIC', 'Total Final', 'Fonte'
        ];

        const rows = riscoFiscal.itens.map((item) => [
          item.produto, item.ncm, item.documento, item.dataOperacao,
          item.baseCalculo.toFixed(2), item.pisInformado.toFixed(2), item.pisDevido.toFixed(2),
          item.pisAliquotaInformada.toFixed(2), item.pisAliquotaDevida.toFixed(2), item.pisDiferenca.toFixed(2),
          item.cofinsInformado.toFixed(2), item.cofinsDevido.toFixed(2),
          item.cofinsAliquotaInformada.toFixed(2), item.cofinsAliquotaDevida.toFixed(2), item.cofinsDiferenca.toFixed(2),
          item.principalDiferenca.toFixed(2), item.multa.toFixed(2),
          item.jurosEstimado.toFixed(2), item.totalComMultaJuros.toFixed(2), item.fonte
        ]);

        content = [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
        filename = `relatorio-fiscal-${cnpj}-${Date.now()}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
      }

      const blob = new Blob(['\ufeff' + content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Relatório exportado como ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Erro ao exportar relatório');
      console.error(error);
    }
  };

  if (riscoFiscal.itens.length === 0) {
    return (
      <Card className="hover-float border-2">
        <CardContent className="p-12">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-success/20 to-success/20 flex items-center justify-center">
              <Calculator className="h-10 w-10 text-success" />
            </div>
            <h3 className="text-xl font-bold mb-2">Tudo certo!</h3>
            <p className="text-muted-foreground">Nenhuma divergência fiscal identificada no período analisado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header com informações da empresa */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-destructive/10 via-warning/10 to-background border-2 border-destructive/20 p-8">
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-destructive/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-0 -right-4 w-72 h-72 bg-warning/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-destructive to-warning flex items-center justify-center shadow-2xl shadow-destructive/30">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-extrabold bg-gradient-to-r from-destructive via-warning to-destructive bg-clip-text text-transparent tracking-tight mb-2">
                  Relatório de Risco Fiscal
                </h1>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {empresaNome}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-mono font-medium">CNPJ: {cnpj}</span>
                    <span className="text-border">•</span>
                    <span className="font-medium">Período: {periodo}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="default" onClick={() => downloadReport('json')} className="hover:bg-primary/10 hover:border-primary/50 transition-all">
                <Download className="mr-2 h-4 w-4" />
                JSON
              </Button>
              <Button variant="outline" size="default" onClick={() => downloadReport('csv')} className="hover:bg-primary/10 hover:border-primary/50 transition-all">
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Resumo Executivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-lift group relative overflow-hidden border-2 border-destructive/20">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 via-transparent to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total a Complementar</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-destructive/20 to-warning/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Calculator className="h-5 w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl lg:text-3xl font-bold text-destructive break-words">
              {formatCurrency(riscoFiscal.totalPrincipal)}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Valor principal devido</p>
          </CardContent>
        </Card>

        <Card className="hover-lift group relative overflow-hidden border-2 border-warning/20">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/10 via-transparent to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Multa (20%)</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning/20 to-warning/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl lg:text-3xl font-bold text-warning break-words">
              {formatCurrency(riscoFiscal.totalMulta)}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Multa de mora</p>
          </CardContent>
        </Card>

        <Card className="hover-lift group relative overflow-hidden border-2 border-warning/20">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/10 via-transparent to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Juros SELIC</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning/20 to-warning/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Receipt className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl lg:text-3xl font-bold text-warning break-words">
              {formatCurrency(riscoFiscal.totalJurosEstimado)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">Estimado</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift group relative overflow-hidden border-2 border-primary/30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wider">Total Final</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl lg:text-3xl font-bold text-primary break-words">
              {formatCurrency(riscoFiscal.totalGeral)}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Principal + Multa + Juros</p>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento por Produto */}
      <Card className="hover-float border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-destructive to-warning flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Detalhamento por Produto</CardTitle>
                <p className="text-base text-muted-foreground mt-2">
                  {riscoFiscal.itens.length} produto(s) com divergência fiscal identificada
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Produto</TableHead>
                <TableHead className="font-bold text-center">NCM</TableHead>
                <TableHead className="font-bold">Documento</TableHead>
                <TableHead className="text-right font-bold">Base Cálculo</TableHead>
                <TableHead className="text-right font-bold">PIS Info/Devido</TableHead>
                <TableHead className="text-right font-bold">PIS Dif.</TableHead>
                <TableHead className="text-right font-bold">COFINS Info/Devido</TableHead>
                <TableHead className="text-right font-bold">COFINS Dif.</TableHead>
                <TableHead className="text-right font-bold">Total</TableHead>
                <TableHead className="text-right font-bold">Multa</TableHead>
                <TableHead className="text-right font-bold">Juros</TableHead>
                <TableHead className="text-right font-bold">Total Final</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riscoFiscal.itens.map((item, index) => (
                <TableRow key={index} className="group">
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <div className="font-semibold text-sm">{item.produto}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Receipt className="h-3 w-3" />
                        {item.dataOperacao}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-mono font-bold bg-primary/5 border-primary/30">
                      {item.ncm}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground max-w-[120px] truncate">
                    {item.documento}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(item.baseCalculo)}</TableCell>
                  <TableCell className="text-right">
                    <div className="text-xs space-y-1">
                      <div className="text-muted-foreground">
                        {formatCurrency(item.pisInformado)} <span className="text-[10px]">({formatPercentage(item.pisAliquotaInformada)})</span>
                      </div>
                      <div className="font-semibold text-foreground">
                        {formatCurrency(item.pisDevido)} <span className="text-[10px]">({formatPercentage(item.pisAliquotaDevida)})</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-destructive">
                    {formatCurrency(item.pisDiferenca)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-xs space-y-1">
                      <div className="text-muted-foreground">
                        {formatCurrency(item.cofinsInformado)} <span className="text-[10px]">({formatPercentage(item.cofinsAliquotaInformada)})</span>
                      </div>
                      <div className="font-semibold text-foreground">
                        {formatCurrency(item.cofinsDevido)} <span className="text-[10px]">({formatPercentage(item.cofinsAliquotaDevida)})</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-destructive">
                    {formatCurrency(item.cofinsDiferenca)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="px-2 py-1 rounded-lg bg-destructive/10 font-bold text-destructive">
                      {formatCurrency(item.principalDiferenca)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-warning">
                    {formatCurrency(item.multa)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-warning">
                    {formatCurrency(item.jurosEstimado)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="px-2 py-1 rounded-lg bg-primary/10 font-bold text-primary">
                      {formatCurrency(item.totalComMultaJuros)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Notas explicativas */}
          <div className="mt-8 p-6 rounded-xl bg-muted/50 border-2 border-border/50 backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-lg">Notas Legais e Informações Importantes</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm mb-1">Multa de mora</p>
                    <p className="text-xs text-muted-foreground">0,33% ao dia, limitada a 20% do principal (Lei 9.430/96, art. 61)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <div className="w-2 h-2 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm mb-1">Juros SELIC</p>
                    <p className="text-xs text-muted-foreground">Acumulados do mês seguinte ao vencimento até o mês anterior ao pagamento + 1% no mês do pagamento</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm mb-1">Vencimento PIS/COFINS</p>
                    <p className="text-xs text-muted-foreground">25º dia do mês seguinte ao período de apuração</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm mb-1">Cálculo de juros</p>
                    <p className="text-xs text-muted-foreground">Valores apresentados são estimados. Para cálculo exato, utilize a integração com API do BCB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
