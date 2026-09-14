import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface HeatmapCell {
  x: string; // label do eixo X (ex: mês)
  y: string; // label do eixo Y (ex: categoria)
  value: number;
  label?: string;
}

interface HeatmapChartProps {
  data: HeatmapCell[];
  title: string;
  description?: string;
  valueFormatter?: (value: number) => string;
  colorScale?: {
    min: string;
    mid: string;
    max: string;
  };
}

export function HeatmapChart({
  data,
  title,
  description,
  valueFormatter = (v) => v.toLocaleString('pt-BR'),
  colorScale = {
    min: 'hsl(var(--success))',
    mid: 'hsl(var(--warning))',
    max: 'hsl(var(--destructive))'
  }
}: HeatmapChartProps) {
  // Extrair labels únicos dos eixos
  const xLabels = Array.from(new Set(data.map(d => d.x)));
  const yLabels = Array.from(new Set(data.map(d => d.y)));
  
  // Encontrar valores min/max para normalização
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  // Calcular médias e tendências
  const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
  const trend = values[values.length - 1] > values[0] ? 'up' : 'down';

  // Função para interpolar cor baseada no valor
  const getColor = (value: number) => {
    const normalized = (value - minValue) / (maxValue - minValue);
    
    if (normalized < 0.33) {
      return colorScale.min;
    } else if (normalized < 0.66) {
      return colorScale.mid;
    } else {
      return colorScale.max;
    }
  };

  // Função para obter opacidade baseada no valor
  const getOpacity = (value: number) => {
    const normalized = (value - minValue) / (maxValue - minValue);
    return 0.3 + (normalized * 0.7); // 30% a 100%
  };

  // Obter valor de uma célula específica
  const getCellValue = (x: string, y: string) => {
    const cell = data.find(d => d.x === x && d.y === y);
    return cell?.value || 0;
  };

  const getCellLabel = (x: string, y: string) => {
    const cell = data.find(d => d.x === x && d.y === y);
    return cell?.label;
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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-destructive" />
            )}
            <span className="text-sm font-semibold">
              Média: {valueFormatter(avgValue)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto scrollbar-thin">
          <div className="inline-block min-w-full">
            {/* Cabeçalho X */}
            <div className="flex">
              <div className="w-32 shrink-0" /> {/* Espaço para labels Y */}
              {xLabels.map((xLabel, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-[80px] text-center p-2 text-sm font-semibold text-muted-foreground"
                >
                  {xLabel}
                </div>
              ))}
            </div>

            {/* Grid */}
            {yLabels.map((yLabel, yIndex) => (
              <div key={yIndex} className="flex animate-fade-in" style={{ animationDelay: `${yIndex * 50}ms` }}>
                {/* Label Y */}
                <div className="w-32 shrink-0 flex items-center p-2 text-sm font-semibold text-foreground">
                  {yLabel}
                </div>

                {/* Células */}
                {xLabels.map((xLabel, xIndex) => {
                  const value = getCellValue(xLabel, yLabel);
                  const label = getCellLabel(xLabel, yLabel);
                  const color = getColor(value);
                  const opacity = getOpacity(value);

                  return (
                    <div
                      key={xIndex}
                      className="flex-1 min-w-[80px] p-2 group relative"
                    >
                      <div
                        className="w-full h-16 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl cursor-pointer border border-border/30"
                        style={{
                          backgroundColor: color,
                          opacity: opacity
                        }}
                      >
                        <span className="text-sm font-bold text-white drop-shadow-lg">
                          {label || valueFormatter(value)}
                        </span>
                      </div>
                      
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 animate-scale-in">
                        <div className="bg-card border border-border rounded-lg shadow-2xl p-3 whitespace-nowrap">
                          <p className="font-bold text-sm">{xLabel} - {yLabel}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Valor: <span className="font-semibold text-primary">{valueFormatter(value)}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <span className="text-sm text-muted-foreground">Intensidade:</span>
          <div className="flex items-center gap-2">
            <div className="flex h-4 w-32 rounded-full overflow-hidden shadow-inner">
              <div className="flex-1" style={{ backgroundColor: colorScale.min }} />
              <div className="flex-1" style={{ backgroundColor: colorScale.mid }} />
              <div className="flex-1" style={{ backgroundColor: colorScale.max }} />
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Baixo</span>
              <span>Alto</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
