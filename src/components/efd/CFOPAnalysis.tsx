import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Info, CheckCircle2, XCircle, TrendingDown, TrendingUp, Package } from 'lucide-react';
import { classifyCfop, infoCfop } from '@/utils/cfopPolicyMonolith';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { EFDData } from '@/utils/efdParser';

interface CFOPAnalysisProps {
  efdTxt: string;
  efdData?: EFDData;
}

export const CFOPAnalysis: React.FC<CFOPAnalysisProps> = ({ efdTxt, efdData }) => {
  const c170Records = efdTxt
    .split('\n')
    .filter(line => line.startsWith('|C170|'))
    .map(line => {
      const fields = line.split('|');
      return {
        cfop: fields[11] || 'Sem CFOP',
        valor: parseFloat(fields[7] || '0'),
      };
    });

  const vendasPorCFOP = c170Records.reduce((acc, item) => {
    const cfop = item.cfop;
    if (!acc[cfop]) {
      acc[cfop] = 0;
    }
    acc[cfop] += item.valor;
    return acc;
  }, {} as Record<string, number>);

  const totalVendas = Object.values(vendasPorCFOP).reduce((sum, val) => sum + val, 0);
  const cfopComPercentual = Object.entries(vendasPorCFOP)
    .map(([cfop, valor]) => ({
      cfop,
      valor,
      percentual: ((valor / totalVendas) * 100).toFixed(1),
    }))
    .sort((a, b) => b.valor - a.valor);

  const cfopsEntrada = cfopComPercentual.filter(item => {
    const info = infoCfop(item.cfop);
    return info?.eixo === 'entrada';
  });
  const cfopsSaida = cfopComPercentual.filter(item => {
    const info = infoCfop(item.cfop);
    return info?.eixo === 'saida';
  });
  
  const totalEntrada = cfopsEntrada.reduce((sum, item) => sum + item.valor, 0);
  const totalSaida = cfopsSaida.reduce((sum, item) => sum + item.valor, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };


  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-background border-2 p-8">
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-0 -right-4 w-72 h-72 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/30">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-extrabold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent tracking-tight">
                Análise de CFOPs
              </h1>
              <p className="text-sm text-muted-foreground font-medium mt-1">
                {cfopComPercentual.length} códigos fiscais • Total: {formatCurrency(totalVendas)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-lift group relative overflow-hidden border-2 border-destructive/20">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 via-transparent to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Entradas</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl lg:text-3xl font-bold text-destructive break-words">
              {formatCurrency(totalEntrada)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">{cfopsEntrada.length} CFOPs</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift group relative overflow-hidden border-2 border-success/20">
          <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-transparent to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Saídas</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success/20 to-success/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl lg:text-3xl font-bold text-success break-words">
              {formatCurrency(totalSaida)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">{cfopsSaida.length} CFOPs</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift group relative overflow-hidden border-2 border-primary/30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wider">Saldo Líquido</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
              <Package className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className={cn(
              "text-2xl lg:text-3xl font-bold break-words",
              (totalSaida - totalEntrada) >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(totalSaida - totalEntrada)}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Saídas - Entradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Operações por CFOP */}
      <Card className="hover-float border-2">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Operações por CFOP</CardTitle>
              <CardDescription className="text-base mt-2">
                Distribuição de valores por Código Fiscal de Operações e Prestações
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="saida" className="w-full">
            <TabsList className="bg-muted/50 p-1.5 h-auto rounded-xl backdrop-blur-sm border border-border/50 shadow-lg grid w-full grid-cols-2">
              <TabsTrigger 
                value="entrada" 
                className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-300 hover:scale-[1.02] py-3"
              >
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="font-semibold">Entrada</span>
                <Badge variant="secondary" className="ml-1">{cfopsEntrada.length}</Badge>
                <span className="hidden md:inline text-xs text-muted-foreground ml-2">• {formatCurrency(totalEntrada)}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="saida" 
                className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-300 hover:scale-[1.02] py-3"
              >
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="font-semibold">Saída</span>
                <Badge variant="secondary" className="ml-1">{cfopsSaida.length}</Badge>
                <span className="hidden md:inline text-xs text-muted-foreground ml-2">• {formatCurrency(totalSaida)}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="entrada" className="space-y-3 mt-6">
              <TooltipProvider>
                {cfopsEntrada.map((item, index) => {
                  const cfopInfo = infoCfop(item.cfop);
                  const classification = classifyCfop(item.cfop);
                  const isDevolucao = classification.eh_devolucao || false;
                  
                  return (
                    <div key={item.cfop} className="space-y-2 group p-4 rounded-xl hover:bg-muted/50 transition-all duration-300 border-2 border-transparent hover:border-primary/20">
                      <div className="flex items-start justify-between text-sm gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-destructive/10 to-destructive/10 flex items-center justify-center font-mono font-bold text-sm text-destructive flex-shrink-0 group-hover:scale-110 transition-transform">
                            {item.cfop}
                          </div>
                          
                          <Badge variant="default" className="shrink-0 bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20">
                            Entrada
                          </Badge>

                          {isDevolucao && (
                            <Badge variant="outline" className="shrink-0 text-warning border-warning/50">
                              Devolução
                            </Badge>
                          )}
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help shrink-0 hover:text-primary transition-colors hover:scale-110" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md bg-background/95 backdrop-blur-xl border-2" side="right">
                              <div className="space-y-3 p-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-mono font-bold text-xs">
                                    {item.cfop}
                                  </div>
                                  <p className="font-bold text-primary">CFOP {item.cfop}</p>
                                </div>
                                <p className="text-sm leading-relaxed">{cfopInfo?.descricao || 'Descrição não disponível'}</p>
                                <div className="border-t pt-3 mt-3 grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    {isDevolucao ? (
                                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                                    )}
                                    <span className="text-xs font-medium">Devolução</span>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    {classification.gera_receita ? (
                                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                                    )}
                                    <span className="text-xs font-medium">Gera Receita</span>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    {classification.eh_st ? (
                                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                                    )}
                                    <span className="text-xs font-medium">Subst. Tributária</span>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    <span className="text-xs font-medium">{classification.uf_scope || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>

                          <span className="text-sm text-muted-foreground truncate group-hover:text-foreground transition-colors font-medium">
                            {cfopInfo?.descricao || 'Descrição não disponível'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 shrink-0">
                          <Badge variant="outline" className="text-xs font-bold min-w-[60px] justify-center">
                            {item.percentual}%
                          </Badge>
                          <span className="font-bold min-w-[140px] text-right text-base text-destructive">
                            {formatCurrency(item.valor)}
                          </span>
                        </div>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full rounded-full transition-all duration-700 group-hover:opacity-90 bg-gradient-to-r from-destructive to-destructive"
                          style={{
                            width: `${item.percentual}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </TooltipProvider>
            </TabsContent>

            <TabsContent value="saida" className="space-y-3 mt-6">
              <TooltipProvider>
                {cfopsSaida.map((item, index) => {
                  const cfopInfo = infoCfop(item.cfop);
                  const classification = classifyCfop(item.cfop);
                  const isDevolucao = classification.eh_devolucao || false;
                  return (
                    <div key={item.cfop} className="space-y-2 group p-4 rounded-xl hover:bg-muted/50 transition-all duration-300 border-2 border-transparent hover:border-primary/20">
                      <div className="flex items-start justify-between text-sm gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success/10 to-success/10 flex items-center justify-center font-mono font-bold text-sm text-success flex-shrink-0 group-hover:scale-110 transition-transform">
                            {item.cfop}
                          </div>
                          
                          <Badge variant="secondary" className="shrink-0 bg-success/10 text-success border-success/30">
                            Saída
                          </Badge>

                          {isDevolucao && (
                            <Badge variant="outline" className="shrink-0 text-warning border-warning/50">
                              Devolução
                            </Badge>
                          )}
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help shrink-0 hover:text-primary transition-colors hover:scale-110" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md bg-background/95 backdrop-blur-xl border-2" side="right">
                              <div className="space-y-3 p-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-mono font-bold text-xs">
                                    {item.cfop}
                                  </div>
                                  <p className="font-bold text-primary">CFOP {item.cfop}</p>
                                </div>
                                <p className="text-sm leading-relaxed">{cfopInfo?.descricao || 'Descrição não disponível'}</p>
                                <div className="border-t pt-3 mt-3 grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    {isDevolucao ? (
                                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                                    )}
                                    <span className="text-xs font-medium">Devolução</span>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    {classification.gera_receita ? (
                                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                                    )}
                                    <span className="text-xs font-medium">Gera Receita</span>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    {classification.eh_st ? (
                                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                                    )}
                                    <span className="text-xs font-medium">Subst. Tributária</span>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    <span className="text-xs font-medium">{classification.uf_scope || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>

                          <span className="text-sm text-muted-foreground truncate group-hover:text-foreground transition-colors font-medium">
                            {cfopInfo?.descricao || 'Descrição não disponível'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 shrink-0">
                          <Badge variant="outline" className="text-xs font-bold min-w-[60px] justify-center">
                            {item.percentual}%
                          </Badge>
                          <span className="font-bold min-w-[140px] text-right text-base text-success">
                            {formatCurrency(item.valor)}
                          </span>
                        </div>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full rounded-full transition-all duration-700 group-hover:opacity-90 bg-gradient-to-r from-success to-success"
                          style={{
                            width: `${item.percentual}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </TooltipProvider>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
