import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, TrendingUp, TrendingDown, Package, Filter, FileBarChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface NCMReportProps {
  efdTxt: string;
}

interface NCMMovement {
  ncm: string;
  tipo: 'ENTRADA' | 'SAIDA';
  valor_total: number;
  quantidade_items: number;
  cfops: Set<string>;
  ufs: Set<string>;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

export const NCMReport: React.FC<NCMReportProps> = React.memo(({ efdTxt }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<'TODOS' | 'ENTRADA' | 'SAIDA'>('TODOS');
  const [cfopFilter, setCfopFilter] = useState('');
  const [ufFilter, setUfFilter] = useState('');

  console.log('🚀 NCMReport montado! Tamanho do efdTxt:', efdTxt?.length || 0);

  // Parse EFD data
  const ncmData = useMemo(() => {
    console.log('🔄 NCMReport useMemo executando...');
    
    if (!efdTxt || efdTxt.trim() === '') {
      console.error('❌ efdTxt está vazio ou undefined!');
      return [];
    }
    
    const lines = efdTxt.split('\n');
    console.log('🔍 NCM Report - Total linhas:', lines.length);
    
    // Debug: mostrar primeiras linhas
    console.log('📄 Primeiras 5 linhas:', lines.slice(0, 5));
    
    // 1. Parse 0200 - Cadastro de Itens (mapear COD_ITEM -> NCM)
    const mapCodItemNCM = new Map<string, string>();
    
    lines.forEach(line => {
      if (line.startsWith('|0200|')) {
        const parts = line.split('|');
        const codItem = parts[2]?.trim();  // Campo 2 = COD_ITEM
        let ncm = parts[8]?.trim() || '';  // Campo 8 = COD_NCM
        
        // Debug primeira linha 0200
        if (mapCodItemNCM.size === 0) {
          console.log('🔍 Primeira linha 0200:', line);
          console.log('📦 Parts:', parts.slice(0, 12));
          console.log('🏷️ COD_ITEM:', codItem, '| NCM:', ncm);
        }
        
        // Normalizar NCM para 8 dígitos (zero-left se necessário)
        if (ncm && ncm.length > 0 && ncm.length < 8) {
          ncm = ncm.padStart(8, '0');
        }
        
        if (codItem) {
          mapCodItemNCM.set(codItem, ncm || 'NCM_NAO_INFORMADO');
        }
      }
    });
    
    console.log('✅ NCM Report - Produtos mapeados:', mapCodItemNCM.size);
    if (mapCodItemNCM.size > 0) {
      const firstEntry = Array.from(mapCodItemNCM.entries())[0];
      console.log('📝 Exemplo de mapeamento:', firstEntry);
    }

    // 2. Estrutura para agregação: chave (NCM, TIPO) -> { valor_total, qtd_itens, cfops, ufs }
    const agg = new Map<string, {
      ncm: string;
      tipo: 'ENTRADA' | 'SAIDA';
      valor_total: number;
      quantidade_items: number;
      cfops: Set<string>;
      ufs: Set<string>;
    }>();

    // 3. Parse C100 + C170 - Correlacionar notas com itens
    let currentC100: { indOper: string; uf: string; dtDoc: string } | null = null;
    let c170Count = 0;
    let processedCount = 0;
    
    lines.forEach(line => {
      // Captura contexto da nota (C100)
      if (line.startsWith('|C100|')) {
        const parts = line.split('|');
        const indOper = parts[1]?.trim(); // Campo 1: 0 = entrada, 1 = saída
        const dtDoc = parts[9]?.trim() || '';
        
        // Extrair UF do participante seria ideal, mas por simplicidade usar 'BR'
        // Para melhor precisão, seria necessário cruzar com 0150
        const uf = 'BR';
        
        currentC100 = { indOper, uf, dtDoc };
      }
      
      // Processa itens da nota (C170)
      if (line.startsWith('|C170|') && currentC100) {
        c170Count++;
        const parts = line.split('|');
        const codItem = parts[3]?.trim();  // Campo 3 = COD_ITEM
        const cfop = parts[11]?.trim();    // Campo 11 = CFOP
        const vlItemStr = parts[7]?.trim() || '0'; // Campo 7 = VL_ITEM
        
        // Debug primeira linha C170
        if (c170Count === 1) {
          console.log('🔍 Primeira linha C170:', line.substring(0, 100));
          console.log('📦 Parts relevantes:', {
            codItem: parts[3],
            cfop: parts[11],
            vlItem: parts[7],
          });
        }
        
        if (!codItem || !cfop) {
          if (c170Count <= 3) console.log('⚠️ C170 sem codItem ou CFOP:', { codItem, cfop });
          return;
        }
        
        // Converter valor
        const vlItem = parseFloat(vlItemStr.replace(',', '.')) || 0;
        if (vlItem === 0) {
          if (processedCount === 0) console.log('⚠️ VL_ITEM zerado:', vlItemStr);
          return;
        }
        
        // Obter NCM via COD_ITEM
        const ncm = mapCodItemNCM.get(codItem) || 'NCM_NAO_INFORMADO';
        
        if (processedCount === 0) {
          console.log('🔍 Primeiro processamento:', {
            codItem,
            ncmMapeado: ncm,
            cfop,
            vlItem,
            mapSize: mapCodItemNCM.size
          });
        }
        
        // Determinar tipo pelo primeiro dígito do CFOP
        const firstDigit = cfop.charAt(0);
        let tipo: 'ENTRADA' | 'SAIDA';
        
        if (['1', '2', '3'].includes(firstDigit)) {
          tipo = 'ENTRADA';
        } else if (['5', '6', '7'].includes(firstDigit)) {
          tipo = 'SAIDA';
        } else {
          // Ignora CFOPs que não se encaixam nas regras
          if (processedCount === 0) console.log('⚠️ CFOP inválido:', cfop);
          return;
        }
        
        // Validação opcional com IND_OPER
        // Se houver conflito, priorizar CFOP (já implementado acima)
        
        // Criar chave única (NCM, TIPO)
        const key = `${ncm}_${tipo}`;
        
        // Agregar valores
        if (!agg.has(key)) {
          agg.set(key, {
            ncm,
            tipo,
            valor_total: 0,
            quantidade_items: 0,
            cfops: new Set(),
            ufs: new Set()
          });
        }
        
        const entry = agg.get(key)!;
        entry.valor_total += vlItem;
        entry.quantidade_items += 1;
        entry.cfops.add(cfop);
        entry.ufs.add(currentC100.uf);
        processedCount++;
      }
    });

    console.log('📊 NCM Report - C170 encontrados:', c170Count);
    console.log('✅ NCM Report - Itens processados:', processedCount);
    console.log('📦 NCM Report - Grupos agregados:', agg.size);

    // 4. Converter Map para Array e ordenar por valor_total (maior primeiro)
    const result = Array.from(agg.values())
      .sort((a, b) => b.valor_total - a.valor_total);
    
    console.log('🎯 NCM Report - Resultado final:', result.length, 'registros');
    if (result.length > 0) {
      console.log('📝 Primeiro resultado:', result[0]);
    }
    
    return result;
  }, [efdTxt]);

  // Filter data
  const filteredData = useMemo(() => {
    return ncmData.filter(item => {
      const matchSearch = 
        searchTerm === '' ||
        item.ncm.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchTipo = 
        tipoFilter === 'TODOS' || 
        item.tipo === tipoFilter;
      
      const matchCFOP = 
        cfopFilter === '' ||
        Array.from(item.cfops).some(cfop => cfop.includes(cfopFilter));
      
      const matchUF = 
        ufFilter === '' ||
        Array.from(item.ufs).some(uf => uf.includes(ufFilter));

      return matchSearch && matchTipo && matchCFOP && matchUF;
    });
  }, [ncmData, searchTerm, tipoFilter, cfopFilter, ufFilter]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalEntradas = filteredData
      .filter(item => item.tipo === 'ENTRADA')
      .reduce((sum, item) => sum + item.valor_total, 0);
    
    const totalSaidas = filteredData
      .filter(item => item.tipo === 'SAIDA')
      .reduce((sum, item) => sum + item.valor_total, 0);

    return { totalEntradas, totalSaidas, saldo: totalSaidas - totalEntradas };
  }, [filteredData]);

  // Prepare chart data (top 10 NCMs)
  const chartData = useMemo(() => {
    const top10 = filteredData.slice(0, 10);
    return top10.map(item => ({
      ncm: item.ncm.length > 10 ? item.ncm.substring(0, 10) + '...' : item.ncm,
      valor: item.valor_total,
      tipo: item.tipo
    }));
  }, [filteredData]);

  const handleExportCSV = () => {
    const csvContent = [
      ['NCM', 'Tipo', 'Valor Total', 'Qtd. Itens', 'CFOPs', 'UFs'].join(';'),
      ...filteredData.map(item => [
        item.ncm,
        item.tipo,
        item.valor_total.toFixed(2),
        item.quantidade_items,
        Array.from(item.cfops).join(', '),
        Array.from(item.ufs).join(', ')
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_ncm_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 p-8 shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-primary to-primary rounded-xl shadow-lg shadow-primary/30">
              <FileBarChart className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                Movimentações por NCM
              </h1>
              <p className="text-muted-foreground font-medium mt-1">
                Análise consolidada de entradas e saídas por classificação fiscal
              </p>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Filtros */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle>Filtros</CardTitle>
          </div>
          <CardDescription>Refine sua análise com filtros personalizados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-semibold">Buscar NCM</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Digite o NCM..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo" className="text-sm font-semibold">Tipo de Operação</Label>
              <Select value={tipoFilter} onValueChange={(v: any) => setTipoFilter(v)}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">📊 Todos</SelectItem>
                  <SelectItem value="ENTRADA">📥 Entradas</SelectItem>
                  <SelectItem value="SAIDA">📤 Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cfop" className="text-sm font-semibold">CFOP</Label>
              <Input
                id="cfop"
                placeholder="Ex: 5102"
                value={cfopFilter}
                onChange={(e) => setCfopFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uf" className="text-sm font-semibold">UF</Label>
              <Input
                id="uf"
                placeholder="Ex: SP"
                value={ufFilter}
                onChange={(e) => setUfFilter(e.target.value.toUpperCase())}
                maxLength={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Entradas</CardTitle>
            <div className="p-2 bg-destructive/10 rounded-lg">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{formatCurrency(totals.totalEntradas)}</div>
            <div className="flex items-center gap-1 mt-2">
              <Badge variant="secondary" className="text-xs">
                {filteredData.filter(i => i.tipo === 'ENTRADA').length} NCMs
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Saídas</CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{formatCurrency(totals.totalSaidas)}</div>
            <div className="flex items-center gap-1 mt-2">
              <Badge variant="secondary" className="text-xs">
                {filteredData.filter(i => i.tipo === 'SAIDA').length} NCMs
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Saldo (Saídas - Entradas)</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totals.saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(totals.saldo)}
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              {totals.saldo >= 0 ? '✅ Resultado positivo' : '⚠️ Resultado negativo'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Top 10 */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Top 10 NCMs por Valor</CardTitle>
          <CardDescription>Principais classificações por volume financeiro</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="ncm" 
                angle={-45}
                textAnchor="end"
                height={100}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                tickFormatter={(value) => {
                  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
                  return `R$ ${value}`;
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
              <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.tipo === 'ENTRADA' ? '#5A5B91' : '#0B1220'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela de Dados */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detalhamento Completo</CardTitle>
              <CardDescription className="mt-1">
                {filteredData.length} registros encontrados
              </CardDescription>
            </div>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border-2 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">NCM</TableHead>
                  <TableHead className="font-bold">Tipo</TableHead>
                  <TableHead className="text-right font-bold">Valor Total</TableHead>
                  <TableHead className="text-right font-bold">Qtd. Itens</TableHead>
                  <TableHead className="font-bold">CFOPs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.slice(0, 100).map((item, index) => (
                  <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <Badge variant={item.ncm === 'NCM_NAO_INFORMADO' ? 'destructive' : 'outline'}>
                        {item.ncm}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={item.tipo === 'ENTRADA' ? 'bg-destructive' : 'bg-success'}
                      >
                        {item.tipo === 'ENTRADA' ? '📥 ENTRADA' : '📤 SAÍDA'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {formatCurrency(item.valor_total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{formatNumber(item.quantidade_items)}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {Array.from(item.cfops).slice(0, 3).join(', ')}
                      {item.cfops.size > 3 && ` +${item.cfops.size - 3}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredData.length > 100 && (
            <div className="mt-6 p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                📊 Mostrando <Badge variant="secondary" className="mx-1">100</Badge> de <Badge variant="secondary" className="mx-1">{filteredData.length}</Badge> registros
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Use os filtros para refinar sua busca ou exporte o CSV completo
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
