import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TreemapNode {
  name: string;
  value: number;
  children?: TreemapNode[];
  color?: string;
  percentage?: number;
}

interface TreemapChartProps {
  data: TreemapNode[];
  title: string;
  description?: string;
  valueFormatter?: (value: number) => string;
  colors?: string[];
}

export function TreemapChart({
  data,
  title,
  description,
  valueFormatter = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  colors = [
    'hsl(var(--efd-primary))',
    'hsl(var(--ecf-primary))',
    'hsl(var(--esocial-primary))',
    'hsl(var(--reforma-primary))',
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))'
  ]
}: TreemapChartProps) {
  const [currentLevel, setCurrentLevel] = useState<TreemapNode[]>(data);
  const [history, setHistory] = useState<TreemapNode[][]>([]);
  const [hoveredNode, setHoveredNode] = useState<TreemapNode | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Calcular total para percentagens
  const total = currentLevel.reduce((sum, node) => sum + node.value, 0);

  // Calcular percentagens
  const nodesWithPercentage = currentLevel.map(node => ({
    ...node,
    percentage: (node.value / total) * 100
  }));

  const handleNodeClick = (node: TreemapNode) => {
    if (node.children && node.children.length > 0) {
      setHistory([...history, currentLevel]);
      setCurrentLevel(node.children);
    }
  };

  const handleBack = () => {
    if (history.length > 0) {
      const newHistory = [...history];
      const previousLevel = newHistory.pop()!;
      setHistory(newHistory);
      setCurrentLevel(previousLevel);
    }
  };

  // Layout simples: calcular tamanhos baseados em percentagem
  const getSize = (percentage: number, isExpanded: boolean) => {
    const baseHeight = isExpanded ? 500 : 350;
    const minHeight = 80;
    const height = Math.max(minHeight, (percentage / 100) * baseHeight);
    return { height: `${height}px` };
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
              onClick={() => setExpanded(!expanded)}
              className="gap-2 hover-scale"
            >
              {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        {history.length > 0 && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <span>Nível {history.length + 1}</span>
            <span className="text-xs">•</span>
            <span>{currentLevel.length} categorias</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {nodesWithPercentage
            .sort((a, b) => b.value - a.value)
            .map((node, index) => (
              <div
                key={index}
                className="relative group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                style={getSize(node.percentage!, expanded)}
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <div
                  className="w-full h-full rounded-xl p-4 flex flex-col justify-between shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-white/20 relative overflow-hidden"
                  style={{
                    backgroundColor: node.color || colors[index % colors.length],
                    opacity: hoveredNode === null || hoveredNode === node ? 1 : 0.7
                  }}
                >
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20" />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="text-white font-bold text-lg mb-1 drop-shadow-lg">
                      {node.name}
                    </h3>
                    <p className="text-white/90 text-sm font-medium">
                      {node.percentage!.toFixed(1)}% do total
                    </p>
                  </div>

                  <div className="relative z-10">
                    <p className="text-white font-bold text-2xl drop-shadow-lg">
                      {valueFormatter(node.value)}
                    </p>
                    {node.children && node.children.length > 0 && (
                      <p className="text-white/80 text-xs mt-1 flex items-center gap-1">
                        <span>▶</span> {node.children.length} subcategorias
                      </p>
                    )}
                  </div>

                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
                </div>

                {/* Tooltip */}
                {hoveredNode === node && (
                  <div className="absolute top-2 right-2 z-20 animate-scale-in">
                    <div className="bg-card border border-border rounded-lg shadow-2xl p-3 min-w-[200px]">
                      <p className="font-bold text-sm mb-1">{node.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Valor: <span className="font-semibold text-primary">{valueFormatter(node.value)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Participação: <span className="font-semibold">{node.percentage!.toFixed(2)}%</span>
                      </p>
                      {node.children && node.children.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                          👆 Clique para explorar
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
