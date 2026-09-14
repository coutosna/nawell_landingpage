import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResumoAno } from '@/utils/reformaTributariaCalculations';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingDown, BarChart3, PieChart } from 'lucide-react';

interface ReformaTributariaChartsProps {
  dados: ResumoAno[];
}

export function ReformaTributariaCharts({ dados }: ReformaTributariaChartsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Evolução da Alíquota Efetiva */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-reforma-primary" />
            Evolução da Alíquota Efetiva
          </CardTitle>
          <CardDescription>
            Carga tributária total sobre a base (2026-2033)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dados}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="ano" 
                className="text-xs"
              />
              <YAxis 
                className="text-xs"
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value: number) => formatPercent(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="aliquotaEfetiva" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={3}
                name="Alíquota Efetiva (%)"
                dot={{ fill: 'hsl(var(--chart-1))', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Composição da Carga Tributária */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-reforma-primary" />
            Composição Tributária por Ano
          </CardTitle>
          <CardDescription>
            Distribuição entre CBS, IBS, PIS/Cofins e ICMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dados}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="ano" className="text-xs" />
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
              <Bar dataKey="totalCbs" stackId="a" fill="hsl(var(--chart-1))" name="CBS" />
              <Bar dataKey="totalIbs" stackId="a" fill="hsl(var(--chart-2))" name="IBS" />
              <Bar dataKey="totalPisCofins" stackId="a" fill="hsl(var(--chart-3))" name="PIS/Cofins" />
              <Bar dataKey="totalIcms" stackId="a" fill="hsl(var(--chart-4))" name="ICMS" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Total de Tributos ao Longo do Tempo */}
      <Card className="border-2 md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-reforma-primary" />
            Evolução do Total de Tributos
          </CardTitle>
          <CardDescription>
            Visão consolidada da carga tributária (CBS + IBS + PIS/Cofins + ICMS)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={dados}>
              <defs>
                <linearGradient id="colorTributos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="ano" className="text-xs" />
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
              <Area 
                type="monotone" 
                dataKey="totalTributos" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTributos)" 
                name="Total de Tributos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
