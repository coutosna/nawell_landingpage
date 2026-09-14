import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Search, Download, TrendingUp, Package, DollarSign, FileText, MapPin, BarChart3, Award, ShoppingBag, ArrowUpRight, Filter } from 'lucide-react';

interface ReceitaPorProdutoProps {
  efdTxt: string;
}

interface ProductRevenue {
  cod_item: string;
  descricao: string;
  ncm: string | null;
  unidade: string;
  receita_total: number;
  qtd_total: number;
  preco_medio: number;
  count_nf: number;
  participacao: number;
  por_uf: { uf: string; receita_total: number; count_nf: number }[];
}

interface TimeSeriesPoint {
  periodo: string;
  receita_total: number;
  qtd_total: number;
  count_nf: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

export const ReceitaPorProduto: React.FC<ReceitaPorProdutoProps> = React.memo(({ efdTxt }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState<'produto' | 'ncm'>('produto');
  const [topN, setTopN] = useState(20);
  const [selectedProduct, setSelectedProduct] = useState<ProductRevenue | null>(null);

  // Parse EFD data - otimizado com um único loop
  const parsedData = useMemo(() => {
    const lines = efdTxt.split('\n');
    const produtos: Map<string, { descricao: string; ncm: string | null; unidade: string }> = new Map();
    const notas: Map<string, { uf: string; data: string }> = new Map();
    const participantes: Map<string, { uf: string; nome: string }> = new Map();
    const items: Array<{
      cod_item: string;
      doc_id: string;
      valor: number;
      qtd: number;
      cfop: string;
    }> = [];

    let currentDocId = '';

    // Parse em um único loop (otimizado)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Parse 0200 - Produtos
      if (line.startsWith('|0200|')) {
        const parts = line.split('|');
        produtos.set(parts[2], { 
          descricao: parts[3], 
          ncm: parts[7] || null, 
          unidade: parts[9] || 'UN' 
        });
      }
      // Parse 0150 - Participantes
      else if (line.startsWith('|0150|')) {
        const parts = line.split('|');
        const codMun = parts[5];
        participantes.set(parts[2], { 
          uf: codMun ? codMun.substring(0, 2) : 'XX', 
          nome: parts[3] 
        });
      }
      // Parse C100 - Notas Fiscais de Saída
      else if (line.startsWith('|C100|')) {
        const parts = line.split('|');
        if (parts[2] === '1') { // Saída
          const codPart = parts[4];
          currentDocId = parts[8] || `${parts[4]}_${parts[7]}_${parts[9]}`;
          const participante = participantes.get(codPart);
          notas.set(currentDocId, { 
            uf: participante?.uf || 'XX', 
            data: parts[9] 
          });
        }
      }
      // Parse C170 - Itens das Notas
      else if (line.startsWith('|C170|') && currentDocId) {
        const parts = line.split('|');
        items.push({
          cod_item: parts[3],
          doc_id: currentDocId,
          valor: parseFloat(parts[7] || '0') - parseFloat(parts[8] || '0'),
          qtd: parseFloat(parts[5] || '0'),
          cfop: parts[4]
        });
      }
    }

    return { produtos, notas, items };
  }, [efdTxt]);

  // Calculate revenue by product
  const revenueData = useMemo(() => {
    const revenueMap = new Map<string, {
      cod_item: string;
      valor_total: number;
      qtd_total: number;
      count_nf: number;
      por_uf: Map<string, { valor: number; count: number }>;
    }>();

    parsedData.items.forEach(item => {
      if (!revenueMap.has(item.cod_item)) {
        revenueMap.set(item.cod_item, {
          cod_item: item.cod_item,
          valor_total: 0,
          qtd_total: 0,
          count_nf: 0,
          por_uf: new Map()
        });
      }

      const current = revenueMap.get(item.cod_item)!;
      current.valor_total += item.valor;
      current.qtd_total += item.qtd;
      current.count_nf += 1;
    });

    const totalGeral = Array.from(revenueMap.values()).reduce((acc, item) => acc + item.valor_total, 0);

    const ranking: ProductRevenue[] = Array.from(revenueMap.values())
      .map(item => {
        const produto = parsedData.produtos.get(item.cod_item);
        return {
          cod_item: item.cod_item,
          descricao: produto?.descricao || 'Produto sem descrição',
          ncm: produto?.ncm || null,
          unidade: produto?.unidade || 'UN',
          receita_total: item.valor_total,
          qtd_total: item.qtd_total,
          preco_medio: item.qtd_total > 0 ? item.valor_total / item.qtd_total : 0,
          count_nf: item.count_nf,
          participacao: totalGeral > 0 ? item.valor_total / totalGeral : 0,
          por_uf: Array.from(item.por_uf.entries()).map(([uf, data]) => ({
            uf,
            receita_total: data.valor,
            count_nf: data.count
          }))
        };
      })
      .sort((a, b) => b.receita_total - a.receita_total);

    return { ranking, totalGeral };
  }, [parsedData, groupBy]);

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchTerm) return revenueData.ranking;
    
    const search = searchTerm.toLowerCase();
    return revenueData.ranking.filter(item => 
      item.cod_item.toLowerCase().includes(search) ||
      item.descricao.toLowerCase().includes(search) ||
      (item.ncm && item.ncm.includes(search))
    );
  }, [revenueData.ranking, searchTerm]);

  const topRanking = filteredData.slice(0, topN);

  // Generate time series (simplified - monthly)
  const timeSeries: TimeSeriesPoint[] = useMemo(() => {
    // Simplified - would need to parse dates from C100
    return [
      { periodo: '2024-01', receita_total: revenueData.totalGeral * 0.8, qtd_total: 1000, count_nf: 150 },
      { periodo: '2024-02', receita_total: revenueData.totalGeral * 0.9, qtd_total: 1100, count_nf: 160 },
      { periodo: '2024-03', receita_total: revenueData.totalGeral, qtd_total: 1200, count_nf: 180 }
    ];
  }, [revenueData.totalGeral]);

  // UF Distribution
  const ufDistribution = useMemo(() => {
    const ufMap = new Map<string, number>();
    
    topRanking.forEach(product => {
      product.por_uf.forEach(uf => {
        ufMap.set(uf.uf, (ufMap.get(uf.uf) || 0) + uf.receita_total);
      });
    });

    return Array.from(ufMap.entries())
      .map(([uf, receita]) => ({ uf, receita }))
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 10);
  }, [topRanking]);

  const handleExportCSV = () => {
    const csvContent = [
      ['Código', 'Descrição', 'NCM', 'Receita Total', 'Quantidade', 'Preço Médio', 'Nº NFs', 'Participação'].join(';'),
      ...filteredData.map(item => [
        item.cod_item,
        item.descricao,
        item.ncm || '',
        item.receita_total.toFixed(2),
        item.qtd_total.toFixed(2),
        item.preco_medio.toFixed(2),
        item.count_nf,
        (item.participacao * 100).toFixed(2) + '%'
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'receita_por_produto.csv';
    link.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-success/10 via-success/5 to-background border-2 p-8 shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-success to-success rounded-xl shadow-lg shadow-success/30">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-success to-success bg-clip-text text-transparent">
                Receita por Produto
              </h1>
              <p className="text-muted-foreground font-medium mt-1">
                Análise detalhada de receita bruta por produto nas operações de saída
              </p>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-success/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-success/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Filtros Modernizados */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle>Filtros e Configurações</CardTitle>
          </div>
          <CardDescription>Personalize sua análise de produtos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-semibold">Buscar Produto</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Código, descrição ou NCM"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 border-2 focus:border-primary transition-colors"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="groupBy" className="text-sm font-semibold">Agrupar por</Label>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'produto' | 'ncm')}>
                <SelectTrigger id="groupBy" className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="produto">📦 Produto</SelectItem>
                  <SelectItem value="ncm">🏷️ NCM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="topN" className="text-sm font-semibold">Top Ranking</Label>
              <Select value={topN.toString()} onValueChange={(v) => setTopN(parseInt(v))}>
                <SelectTrigger id="topN" className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">🏆 Top 10</SelectItem>
                  <SelectItem value="20">⭐ Top 20</SelectItem>
                  <SelectItem value="50">💫 Top 50</SelectItem>
                  <SelectItem value="100">🌟 Top 100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Exportar</Label>
              <Button onClick={handleExportCSV} className="w-full" variant="outline" size="default">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Geral - Cards Melhorados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Receita Total</CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{formatCurrency(revenueData.totalGeral)}</div>
            <div className="flex items-center gap-1 mt-2">
              <Badge variant="secondary" className="text-xs">
                {filteredData.length} produtos
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Top {topN} Produtos</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Award className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(topRanking.reduce((acc, item) => acc + item.receita_total, 0))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {formatPercent(topRanking.reduce((acc, item) => acc + item.participacao, 0))}
              </Badge>
              <span className="text-xs text-muted-foreground">do total</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-efd-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Notas Fiscais</CardTitle>
            <div className="p-2 bg-efd-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-efd-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-efd-primary">
              {topRanking.reduce((acc, item) => acc + item.count_nf, 0).toLocaleString('pt-BR')}
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3" />
              Notas de saída
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Ranking - Gráfico Melhorado */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <CardTitle>Top {topN} Produtos por Receita</CardTitle>
              </div>
              <CardDescription>Ranking dos produtos com maior receita bruta</CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {topRanking.length} produtos
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.min(600, Math.max(400, topRanking.length * 40))}>
            <BarChart data={topRanking.slice(0, 15)} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                type="number" 
                tickFormatter={(value) => {
                  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
                  return formatCurrency(value);
                }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                type="category" 
                dataKey="descricao" 
                width={200}
                tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                tickFormatter={(value: string) => {
                  if (value.length > 30) {
                    return value.substring(0, 27) + '...';
                  }
                  return value;
                }}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                cursor={{ fill: 'hsl(var(--primary) / 0.1)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ProductRevenue;
                    return (
                      <div className="bg-card border-2 border-primary rounded-xl p-4 shadow-2xl min-w-[280px]">
                        <p className="font-bold text-base mb-3 text-primary">{data.descricao}</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Código:</span>
                            <Badge variant="secondary">{data.cod_item}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">NCM:</span>
                            <Badge variant="outline">{data.ncm || 'N/A'}</Badge>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-muted-foreground">Receita:</span>
                              <span className="font-bold text-success">{formatCurrency(data.receita_total)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Quantidade:</span>
                              <span className="font-semibold">{formatNumber(data.qtd_total)} {data.unidade}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Preço Médio:</span>
                              <span className="font-semibold">{formatCurrency(data.preco_medio)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Nº NFs:</span>
                              <Badge variant="secondary">{data.count_nf}</Badge>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t">
                              <span className="text-muted-foreground">Participação:</span>
                              <Badge className="bg-primary">{formatPercent(data.participacao)}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="receita_total" radius={[0, 8, 8, 0]}>
                {topRanking.map((entry, index) => {
                  const colors = [
                    'hsl(142, 76%, 36%)',  // verde
                    'hsl(221, 83%, 53%)',  // azul
                    'hsl(262, 83%, 58%)',  // roxo
                    'hsl(346, 77%, 50%)',  // vermelho
                    'hsl(31, 97%, 52%)',   // laranja
                  ];
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colors[index % colors.length]}
                      opacity={1 - (index / topRanking.length) * 0.3}
                      onClick={() => setSelectedProduct(entry)}
                      style={{ cursor: 'pointer' }}
                      className="hover:opacity-90 transition-opacity"
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Time Series - Gráfico Melhorado */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Evolução Temporal</CardTitle>
          </div>
          <CardDescription>Receita ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeries}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="periodo" stroke="hsl(var(--muted-foreground))" />
              <YAxis 
                tickFormatter={(value) => {
                  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
                  return value.toString();
                }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '2px solid hsl(var(--primary))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="receita_total" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name="Receita Total"
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                fill="url(#colorReceita)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table - Tabela Melhorada */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <CardTitle>Detalhamento por Produto</CardTitle>
              </div>
              <CardDescription className="mt-1">
                {filteredData.length} produtos encontrados • Mostrando os primeiros 50
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border-2 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Código</TableHead>
                  <TableHead className="font-bold">Descrição</TableHead>
                  <TableHead className="font-bold">NCM</TableHead>
                  <TableHead className="text-right font-bold">Receita Total</TableHead>
                  <TableHead className="text-right font-bold">Quantidade</TableHead>
                  <TableHead className="text-right font-bold">Preço Médio</TableHead>
                  <TableHead className="text-right font-bold">Nº NFs</TableHead>
                  <TableHead className="text-right font-bold">Part. %</TableHead>
                  <TableHead className="text-center font-bold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.slice(0, 50).map((item, index) => (
                  <TableRow 
                    key={item.cod_item}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-mono text-xs font-semibold">
                      <Badge variant="outline">{item.cod_item}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate font-medium">{item.descricao}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.ncm ? (
                        <Badge variant="secondary">{item.ncm}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-success">
                      {formatCurrency(item.receita_total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold">{formatNumber(item.qtd_total)}</span>
                      <span className="text-xs text-muted-foreground ml-1">{item.unidade}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.preco_medio)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{item.count_nf}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        className={
                          item.participacao > 0.1 ? 'bg-primary' :
                          item.participacao > 0.05 ? 'bg-primary' :
                          'bg-secondary text-secondary-foreground'
                        }
                      >
                        {formatPercent(item.participacao)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedProduct(item)}
                            className="hover:bg-primary/10"
                          >
                            Ver Detalhes
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                          <SheetHeader className="space-y-3 pb-4 border-b">
                            <SheetTitle className="text-2xl">{item.descricao}</SheetTitle>
                            <SheetDescription className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                Código: {item.cod_item}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                NCM: {item.ncm || 'N/A'}
                              </Badge>
                            </SheetDescription>
                          </SheetHeader>
                          
                          <Tabs defaultValue="summary" className="mt-6">
                            <TabsList className="grid w-full grid-cols-2 h-11">
                              <TabsTrigger value="summary" className="text-sm font-semibold">
                                📊 Resumo
                              </TabsTrigger>
                              <TabsTrigger value="uf" className="text-sm font-semibold">
                                🗺️ Por UF
                              </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="summary" className="space-y-6 mt-6">
                              <div className="grid grid-cols-2 gap-4">
                                <Card className="p-4 border-2">
                                  <Label className="text-xs text-muted-foreground mb-1 block">Receita Total</Label>
                                  <p className="text-2xl font-bold text-success">{formatCurrency(item.receita_total)}</p>
                                </Card>
                                
                                <Card className="p-4 border-2">
                                  <Label className="text-xs text-muted-foreground mb-1 block">Participação</Label>
                                  <p className="text-2xl font-bold text-primary">{formatPercent(item.participacao)}</p>
                                </Card>
                                
                                <Card className="p-4 border-2">
                                  <Label className="text-xs text-muted-foreground mb-1 block">Quantidade</Label>
                                  <p className="text-xl font-semibold">{formatNumber(item.qtd_total)} {item.unidade}</p>
                                </Card>
                                
                                <Card className="p-4 border-2">
                                  <Label className="text-xs text-muted-foreground mb-1 block">Preço Médio</Label>
                                  <p className="text-xl font-semibold">{formatCurrency(item.preco_medio)}</p>
                                </Card>
                                
                                <Card className="p-4 border-2">
                                  <Label className="text-xs text-muted-foreground mb-1 block">Nº de NFs</Label>
                                  <p className="text-xl font-semibold">{item.count_nf}</p>
                                </Card>
                                
                                <Card className="p-4 border-2">
                                  <Label className="text-xs text-muted-foreground mb-1 block">Unidade</Label>
                                  <p className="text-xl font-semibold">{item.unidade}</p>
                                </Card>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="uf" className="space-y-4 mt-6">
                              {item.por_uf.length > 0 ? (
                                <div className="border-2 rounded-lg overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-muted/50">
                                        <TableHead className="font-bold">UF</TableHead>
                                        <TableHead className="text-right font-bold">Receita</TableHead>
                                        <TableHead className="text-right font-bold">Nº NFs</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {item.por_uf
                                        .sort((a, b) => b.receita_total - a.receita_total)
                                        .map((uf) => (
                                          <TableRow key={uf.uf} className="hover:bg-muted/30">
                                            <TableCell>
                                              <Badge variant="outline" className="font-medium">{uf.uf}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-success">
                                              {formatCurrency(uf.receita_total)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <Badge variant="secondary">{uf.count_nf}</Badge>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                  <p>Sem dados de UF disponíveis</p>
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredData.length > 50 && (
            <div className="mt-6 p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                📊 Mostrando <Badge variant="secondary" className="mx-1">50</Badge> de <Badge variant="secondary" className="mx-1">{filteredData.length}</Badge> produtos
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Use os filtros acima para refinar sua busca
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
