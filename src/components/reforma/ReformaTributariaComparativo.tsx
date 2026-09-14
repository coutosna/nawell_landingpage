import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResumoAno } from '@/utils/reformaTributariaCalculations';
import { ArrowDown, ArrowUp, TrendingDown, TrendingUp } from 'lucide-react';

interface ReformaTributariaComparativoProps {
  dados: ResumoAno[];
}

export function ReformaTributariaComparativo({ dados }: ReformaTributariaComparativoProps) {
  const ano2026 = dados.find(d => d.ano === 2026);
  const ano2033 = dados.find(d => d.ano === 2033);

  if (!ano2026 || !ano2033) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const comparacoes = [
    {
      titulo: 'CBS',
      valor2026: ano2026.totalCbs,
      valor2033: ano2033.totalCbs,
      icon: TrendingUp,
      color: 'text-chart-1'
    },
    {
      titulo: 'IBS',
      valor2026: ano2026.totalIbs,
      valor2033: ano2033.totalIbs,
      icon: TrendingUp,
      color: 'text-chart-2'
    },
    {
      titulo: 'PIS/Cofins',
      valor2026: ano2026.totalPisCofins,
      valor2033: ano2033.totalPisCofins,
      icon: TrendingDown,
      color: 'text-chart-3'
    },
    {
      titulo: 'ICMS',
      valor2026: ano2026.totalIcms,
      valor2033: ano2033.totalIcms,
      icon: TrendingDown,
      color: 'text-chart-4'
    }
  ];

  const diferencaTotal = ano2033.totalTributos - ano2026.totalTributos;
  const diferencaPercentual = ((diferencaTotal / ano2026.totalTributos) * 100);
  const diferencaAliquota = ano2033.aliquotaEfetiva - ano2026.aliquotaEfetiva;

  return (
    <div className="space-y-6">
      {/* Card Principal de Comparação */}
      <Card className="border-2 bg-gradient-to-br from-reforma-primary/5 to-reforma-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            Comparativo: Regime Atual (2026) vs Reforma Completa (2033)
          </CardTitle>
          <CardDescription>
            Análise lado a lado do impacto da transição tributária
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Regime Atual - 2026 */}
            <Card className="border-2 border-warning/30 bg-gradient-to-br from-warning/10 to-warning/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-warning dark:text-warning">
                  Regime Atual (2026)
                </CardTitle>
                <CardDescription>PIS/Cofins + ICMS + CBS/IBS demonstrativo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total de Tributos</p>
                  <p className="text-3xl font-bold text-warning dark:text-warning">
                    {formatCurrency(ano2026.totalTributos)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Alíquota Efetiva</p>
                  <p className="text-2xl font-bold text-warning dark:text-warning">
                    {ano2026.aliquotaEfetiva.toFixed(2)}%
                  </p>
                </div>
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CBS:</span>
                    <span className="font-mono">{formatCurrency(ano2026.totalCbs)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IBS:</span>
                    <span className="font-mono">{formatCurrency(ano2026.totalIbs)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>PIS/Cofins:</span>
                    <span className="font-mono font-semibold">{formatCurrency(ano2026.totalPisCofins)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>ICMS:</span>
                    <span className="font-mono font-semibold">{formatCurrency(ano2026.totalIcms)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Diferença */}
            <Card className={`border-2 ${diferencaTotal < 0 ? 'border-success/30 bg-gradient-to-br from-success/10 to-success/5' : 'border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5'}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {diferencaTotal < 0 ? (
                    <>
                      <ArrowDown className="w-5 h-5 text-success" />
                      <span className="text-success dark:text-success">Redução</span>
                    </>
                  ) : (
                    <>
                      <ArrowUp className="w-5 h-5 text-destructive" />
                      <span className="text-destructive dark:text-destructive">Aumento</span>
                    </>
                  )}
                </CardTitle>
                <CardDescription>Impacto da transição completa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Diferença Absoluta</p>
                  <p className={`text-3xl font-bold ${diferencaTotal < 0 ? 'text-success dark:text-success' : 'text-destructive dark:text-destructive'}`}>
                    {diferencaTotal < 0 ? '-' : '+'}{formatCurrency(Math.abs(diferencaTotal))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Variação Percentual</p>
                  <p className={`text-2xl font-bold ${diferencaTotal < 0 ? 'text-success dark:text-success' : 'text-destructive dark:text-destructive'}`}>
                    {diferencaPercentual >= 0 ? '+' : ''}{diferencaPercentual.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Variação de Alíquota</p>
                  <p className={`text-xl font-bold ${diferencaAliquota < 0 ? 'text-success dark:text-success' : 'text-destructive dark:text-destructive'}`}>
                    {diferencaAliquota >= 0 ? '+' : ''}{diferencaAliquota.toFixed(2)} p.p.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Reforma Completa - 2033 */}
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-primary dark:text-primary">
                  Reforma Completa (2033)
                </CardTitle>
                <CardDescription>CBS + IBS (sem PIS/Cofins e ICMS)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total de Tributos</p>
                  <p className="text-3xl font-bold text-primary dark:text-primary">
                    {formatCurrency(ano2033.totalTributos)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Alíquota Efetiva</p>
                  <p className="text-2xl font-bold text-primary dark:text-primary">
                    {ano2033.aliquotaEfetiva.toFixed(2)}%
                  </p>
                </div>
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CBS:</span>
                    <span className="font-mono font-semibold">{formatCurrency(ano2033.totalCbs)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IBS:</span>
                    <span className="font-mono font-semibold">{formatCurrency(ano2033.totalIbs)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>PIS/Cofins:</span>
                    <span className="font-mono">{formatCurrency(ano2033.totalPisCofins)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>ICMS:</span>
                    <span className="font-mono">{formatCurrency(ano2033.totalIcms)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalhamento por Tributo */}
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {comparacoes.map((comp) => {
              const diferenca = comp.valor2033 - comp.valor2026;
              const variacaoPerc = comp.valor2026 > 0 ? ((diferenca / comp.valor2026) * 100) : 0;
              const Icon = comp.icon;
              
              return (
                <Card key={comp.titulo} className="border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${comp.color}`} />
                      {comp.titulo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">2026:</span>
                      <span className="font-mono">{formatCurrency(comp.valor2026)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">2033:</span>
                      <span className="font-mono">{formatCurrency(comp.valor2033)}</span>
                    </div>
                    <div className={`flex justify-between text-xs font-semibold pt-2 border-t ${diferenca < 0 ? 'text-success' : diferenca > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      <span>Variação:</span>
                      <span>{variacaoPerc >= 0 ? '+' : ''}{variacaoPerc.toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
