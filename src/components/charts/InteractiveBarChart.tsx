import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataPoint {
  name: string;
  value: number;
  children?: DataPoint[];
  color?: string;
  [key: string]: any;
}

interface InteractiveBarChartProps {
  data: DataPoint[];
  title: string;
  description?: string;
  valueFormatter?: (value: number) => string;
  colors?: string[];
  allowDrillDown?: boolean;
}

export function InteractiveBarChart({
  data,
  title,
  description,
  valueFormatter = (v) => v.toLocaleString('pt-BR'),
  colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'],
  allowDrillDown = true
}: InteractiveBarChartProps) {
  const [currentData, setCurrentData] = useState<DataPoint[]>(data);
  const [history, setHistory] = useState<DataPoint[][]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const handleBarClick = (entry: DataPoint) => {
    if (allowDrillDown && entry.children && entry.children.length > 0) {
      setHistory([...history, currentData]);
      setCurrentData(entry.children);
    }
  };

  const handleBack = () => {
    if (history.length > 0) {
      const newHistory = [...history];
      const previousData = newHistory.pop()!;
      setHistory(newHistory);
      setCurrentData(previousData);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg shadow-2xl p-4 animate-scale-in">
          <p className="font-bold text-foreground mb-2">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Valor: <span className="font-semibold text-primary">{valueFormatter(data.value)}</span>
          </p>
          {data.children && data.children.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <ZoomIn className="w-3 h-3" />
              Clique para detalhar
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
          <div className="flex gap-2">
            {history.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="gap-2 hover-scale"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsZoomed(!isZoomed)}
              className="gap-2 hover-scale"
            >
              {isZoomed ? <ZoomOut className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        {history.length > 0 && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <span>Nível {history.length + 1}</span>
            <span className="text-xs">•</span>
            <span>{currentData.length} itens</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={isZoomed ? 600 : 400}>
          <BarChart
            data={currentData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fill: 'hsl(var(--foreground))' }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              tickFormatter={valueFormatter}
              tick={{ fill: 'hsl(var(--foreground))' }}
              stroke="hsl(var(--border))"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Bar
              dataKey="value"
              name="Valor"
              radius={[8, 8, 0, 0]}
              cursor={allowDrillDown ? 'pointer' : 'default'}
              onClick={handleBarClick}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              animationDuration={800}
              animationBegin={0}
            >
              {currentData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || colors[index % colors.length]}
                  opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.5}
                  className="transition-opacity duration-200"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
