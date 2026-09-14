import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResumoAno } from '@/utils/reformaTributariaCalculations';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { DollarSign, TrendingDown, TrendingUp, Calendar } from 'lucide-react';

interface ReformaTributariaCashflowProps {
  dados: ResumoAno[];
}

export function ReformaTributariaCashflow({ dados }: ReformaTributariaCashflowProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Calcular impacto acumulado no cashflow
  const ano2026 = dados.find(d => d.ano === 2026);
  if (!ano2026) return null;

  const dadosComImpacto = dados.map(ano => {
    const diferencaAnual = ano.totalTributos - ano2026.totalTributos;
    return {
      ano: ano.ano,
      cargaAtual: ano2026.totalTributos,
      cargaReforma: ano.totalTributos,
      impactoAnual: diferencaAnual,
      // Simplificado: considerando base anual constante
      economiaAcumulada: diferencaAnual
    };
  });

  // Calcular economia/custo acumulado real
  let acumulado = 0;
  const dadosAcumulados = dadosComImpacto.map(d => {
    acumulado += d.impactoAnual;
    return {
      ...d,
      economiaAcumulada: acumulado
    };
  });

  const impactoTotal = acumulado;
  const mediaAnual = impactoTotal / dados.length;

  // Encontrar ponto de equilíbrio (se houver)
  let pontoEquilibrio = null;
  for (let i = 1; i < dadosAcumulados.length; i++) {
    const anterior = dadosAcumulados[i - 1];
    const atual = dadosAcumulados[i];
    if ((anterior.economiaAcumulada < 0 && atual.economiaAcumulada >= 0) ||
        (anterior.economiaAcumulada > 0 && atual.economiaAcumulada <= 0)) {
      pontoEquilibrio = atual.ano;
      break;
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-reforma-primary" />
            Análise de Impacto no Fluxo de Caixa
          </CardTitle>
          <CardDescription>
            Projeção de economia/custo adicional ao longo da transição
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Cards de Resumo */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card className={`border-2 ${impactoTotal < 0 ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {impactoTotal < 0 ? (
                    <TrendingDown className="w-4 h-4 text-success" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-destructive" />
                  )}
                  Impacto Total (2026-2033)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${impactoTotal < 0 ? 'text-success' : 'text-destructive'}`}>
                  {impactoTotal < 0 ? '' : '+'}{formatCurrency(impactoTotal)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {impactoTotal < 0 ? 'Economia acumulada' : 'Custo adicional acumulado'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-reforma-primary" />
                  Média Anual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${mediaAnual < 0 ? 'text-success' : 'text-destructive'}`}>
                  {mediaAnual < 0 ? '' : '+'}{formatCurrency(mediaAnual)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Impacto médio por ano
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-reforma-primary" />
                  Ponto de Equilíbrio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-reforma-primary">
                  {pontoEquilibrio ? pontoEquilibrio : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pontoEquilibrio ? 'Ano de neutralização' : 'Sem ponto de equilíbrio'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Evolução */}
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={dadosAcumulados}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="ano" 
                className="text-xs"
              />
              <YAxis 
                className="text-xs"
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="economiaAcumulada" 
                stroke={impactoTotal < 0 ? 'hsl(var(--chart-5))' : 'hsl(var(--chart-1))'} 
                strokeWidth={3}
                name="Impacto Acumulado"
                dot={{ fill: impactoTotal < 0 ? 'hsl(var(--chart-5))' : 'hsl(var(--chart-1))', r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="impactoAnual" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Impacto Anual"
                dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Tabela Detalhada */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Ano</th>
                  <th className="text-right py-2">Carga Atual</th>
                  <th className="text-right py-2">Carga Reforma</th>
                  <th className="text-right py-2">Impacto Anual</th>
                  <th className="text-right py-2">Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {dadosAcumulados.map((d) => (
                  <tr key={d.ano} className="border-b hover:bg-muted/30">
                    <td className="py-2 font-semibold">{d.ano}</td>
                    <td className="text-right font-mono">{formatCurrency(d.cargaAtual)}</td>
                    <td className="text-right font-mono">{formatCurrency(d.cargaReforma)}</td>
                    <td className={`text-right font-mono font-semibold ${d.impactoAnual < 0 ? 'text-success' : d.impactoAnual > 0 ? 'text-destructive' : ''}`}>
                      {d.impactoAnual < 0 ? '' : '+'}{formatCurrency(d.impactoAnual)}
                    </td>
                    <td className={`text-right font-mono font-bold ${d.economiaAcumulada < 0 ? 'text-success' : d.economiaAcumulada > 0 ? 'text-destructive' : ''}`}>
                      {d.economiaAcumulada < 0 ? '' : '+'}{formatCurrency(d.economiaAcumulada)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
