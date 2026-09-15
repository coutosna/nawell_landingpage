import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { A11yChartTable } from '@/components/a11y/A11yChartTable';
import { EFDData } from '@/utils/efdParser';
import { TrendingUp, FileText } from 'lucide-react';

interface AnalysisChartsProps {
  data: EFDData;
}

export const AnalysisCharts: React.FC<AnalysisChartsProps> = ({ data }) => {
  // Produtos com Maior Impacto Tributário
  const produtosComImpostos = data.vendas.reduce((acc, venda) => {
    const key = venda.ncm;
    if (!acc[key]) {
      acc[key] = {
        ncm: venda.ncm,
        produto: venda.produto,
        impostoTotal: 0,
        valorTotal: 0,
      };
    }
    acc[key].impostoTotal += venda.pisValor + venda.cofinsValor;
    acc[key].valorTotal += venda.valor;
    return acc;
  }, {} as Record<string, { ncm: string; produto: string; impostoTotal: number; valorTotal: number }>);

  const topImpostos = Object.values(produtosComImpostos)
    .sort((a, b) => b.impostoTotal - a.impostoTotal)
    .slice(0, 8)
    .map(item => ({
      produto: `${item.produto.substring(0, 25)}${item.produto.length > 25 ? '...' : ''}`,
      ncm: item.ncm,
      imposto: item.impostoTotal,
      aliquotaEfetiva: ((item.impostoTotal / item.valorTotal) * 100).toFixed(2),
    }));

  // Agrupa vendas por CFOP com percentuais
  const vendasPorCFOP = data.vendas.reduce((acc, venda) => {
    const cfop = venda.cfop || 'Sem CFOP';
    if (!acc[cfop]) {
      acc[cfop] = 0;
    }
    acc[cfop] += venda.valor;
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

  // Dados de impostos com detalhes
  const totalTributos = data.resumo.totalPIS + data.resumo.totalCOFINS;
  const dadosImpostos = [
    { 
      nome: 'PIS', 
      valor: data.resumo.totalPIS,
      percentual: ((data.resumo.totalPIS / totalTributos) * 100).toFixed(1) + '%'
    },
    { 
      nome: 'COFINS', 
      valor: data.resumo.totalCOFINS,
      percentual: ((data.resumo.totalCOFINS / totalTributos) * 100).toFixed(1) + '%'
    },
  ];

  

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fade-in-up">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Produtos com Maior Impacto Tributário
          </CardTitle>
          <CardDescription>
            Produtos que geram maior custo com PIS e COFINS no período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={topImpostos} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tickFormatter={formatCurrency} stroke="hsl(var(--muted-foreground))" />
              <YAxis 
                dataKey="produto" 
                type="category" 
                width={120} 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                labelFormatter={(label: any, payload: any) => {
                  if (payload && payload[0]) {
                    const item = payload[0].payload;
                    return `${item.produto}\nNCM: ${item.ncm}\nAlíquota Efetiva: ${item.aliquotaEfetiva}%`;
                  }
                  return label;
                }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="imposto" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <A11yChartTable
            caption="Produtos com maior impacto tributário em PIS e COFINS (8 maiores)"
            headers={['Produto', 'NCM', 'Imposto', 'Alíquota Efetiva']}
            rows={topImpostos.map((item) => [
              item.produto,
              item.ncm,
              formatCurrency(item.imposto),
              `${item.aliquotaEfetiva}%`,
            ])}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Operações por CFOP
          </CardTitle>
          <CardDescription>
            Distribuição de valores por Código Fiscal de Operações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cfopComPercentual.map((item, index) => (
              <div key={item.cfop} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">CFOP {item.cfop}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{item.percentual}%</span>
                    <span className="font-semibold min-w-[100px] text-right">
                      {formatCurrency(item.valor)}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentual}%`,
                      backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <A11yChartTable
            caption="Operações por CFOP — valores e distribuição"
            headers={['CFOP', 'Valor', 'Participação']}
            rows={cfopComPercentual.map((item) => [`CFOP ${item.cfop}`, formatCurrency(item.valor), `${item.percentual}%`])}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Composição Tributária</CardTitle>
          <CardDescription>PIS e COFINS apurados no período analisado</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={dadosImpostos} margin={{ top: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="nome" stroke="hsl(var(--muted-foreground))" />
              <YAxis tickFormatter={formatCurrency} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                formatter={(value: any, name: any, props: any) => [
                  formatCurrency(value),
                  `${props.payload.nome} (${props.payload.percentual} do total)`
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                <Cell fill="hsl(var(--chart-1))" />
                <Cell fill="hsl(var(--chart-2))" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-chart-1/10 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">PIS</p>
              <p className="text-lg font-bold">{formatCurrency(data.resumo.totalPIS)}</p>
            </div>
            <div className="text-center p-3 bg-chart-2/10 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">COFINS</p>
              <p className="text-lg font-bold">{formatCurrency(data.resumo.totalCOFINS)}</p>
            </div>
          </div>

          <A11yChartTable
            caption="Composição tributária — PIS e COFINS apurados no período"
            headers={['Imposto', 'Valor', 'Participação']}
            rows={dadosImpostos.map((item) => [item.nome, formatCurrency(item.valor), item.percentual])}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo Executivo</CardTitle>
          <CardDescription>Principais indicadores do período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Regime Tributário</span>
              <span className="text-sm font-bold">{data.regime.descricao}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Período</span>
              <span className="text-sm font-bold">
                {data.cadastro.periodoInicialDisplay} - {data.cadastro.periodoFinalDisplay}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Total de Produtos</span>
              <span className="text-sm font-bold">{data.produtos.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Documentos Fiscais</span>
              <span className="text-sm font-bold">{data.vendas.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg border border-success/20">
              <span className="text-sm font-medium">Receita Bruta</span>
              <span className="text-sm font-bold text-success">{formatCurrency(data.resumo.totalVendas)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
              <span className="text-sm font-medium">Tributos Totais</span>
              <span className="text-sm font-bold text-primary">
                {formatCurrency(data.resumo.totalPIS + data.resumo.totalCOFINS)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
