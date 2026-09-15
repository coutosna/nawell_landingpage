import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { A11yChartTable } from '@/components/a11y/A11yChartTable';
import { TrendingUp } from 'lucide-react';

interface PieDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface AnimatedPieChartProps {
  data: PieDataPoint[];
  title: string;
  description?: string;
  valueFormatter?: (value: number) => string;
  colors?: string[];
  showPercentage?: boolean;
}

const renderActiveShape = (props: any, valueFormatter: (v: number) => string) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

  return (
    <g>
      <text x={cx} y={cy - 20} dy={8} textAnchor="middle" fill="hsl(var(--foreground))" className="font-bold text-lg">
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} dy={8} textAnchor="middle" fill="hsl(var(--primary))" className="font-bold text-2xl">
        {valueFormatter(payload.value)}
      </text>
      <text x={cx} y={cy + 35} dy={8} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-sm">
        {`${(percent * 100).toFixed(2)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="drop-shadow-2xl"
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 16}
        fill={fill}
        opacity={0.3}
      />
    </g>
  );
};

export function AnimatedPieChart({
  data,
  title,
  description,
  valueFormatter = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))'
  ],
  showPercentage = true
}: AnimatedPieChartProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length]
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(2);
      
      return (
        <div className="bg-card border border-border rounded-lg shadow-2xl p-4 animate-scale-in">
          <p className="font-bold text-foreground mb-2">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Valor: <span className="font-semibold text-primary">{valueFormatter(data.value)}</span>
          </p>
          {showPercentage && (
            <p className="text-sm text-muted-foreground">
              Percentual: <span className="font-semibold">{percentage}%</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card border-border/50 shadow-xl hover-lift">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="mt-2">{description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              Total: {valueFormatter(total)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={(props) => renderActiveShape(props, valueFormatter)}
              data={dataWithColors}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {dataWithColors.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value, entry: any) => (
                <span className="text-sm">
                  {value} - {showPercentage && `${((entry.payload.value / total) * 100).toFixed(1)}%`}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Lista de itens com animação */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {dataWithColors.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(2);
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-300 cursor-pointer hover-scale"
                onMouseEnter={() => setActiveIndex(index)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className="w-4 h-4 rounded-full shrink-0 shadow-lg"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{percentage}%</p>
                </div>
                <p className="text-sm font-bold text-primary shrink-0">
                  {valueFormatter(item.value)}
                </p>
              </div>
            );
          })}
        </div>

        <A11yChartTable
          caption={`${title} — dados por item. Total: ${valueFormatter(total)}`}
          headers={['Item', 'Valor', 'Participação']}
          rows={dataWithColors.map((item) => {
            const percent = (item.value / total) * 100;
            return [item.name, valueFormatter(item.value), `${percent.toFixed(1)}%`];
          })}
        />
      </CardContent>
    </Card>
  );
}
