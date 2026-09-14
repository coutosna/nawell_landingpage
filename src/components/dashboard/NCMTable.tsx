import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Package, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { EFDData } from '@/utils/efdParser';
import { cn } from '@/lib/utils';

interface NCMTableProps {
  data: EFDData;
}

export const NCMTable: React.FC<NCMTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const vendasPorNCM = data.vendas.reduce((acc, venda) => {
    const ncm = venda.ncm || 'Sem NCM';
    if (!acc[ncm]) {
      acc[ncm] = {
        ncm,
        produto: venda.produto,
        quantidade: 0,
        valor: 0,
        pis: 0,
        cofins: 0,
      };
    }
    acc[ncm].quantidade += venda.quantidade;
    acc[ncm].valor += venda.valor;
    acc[ncm].pis += venda.pisValor;
    acc[ncm].cofins += venda.cofinsValor;
    return acc;
  }, {} as Record<string, any>);

  const ncmList = Object.values(vendasPorNCM)
    .filter(item => 
      item.ncm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.produto.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.valor - a.valor);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalValue = ncmList.reduce((sum, item) => sum + item.valor, 0);
  const totalTributos = ncmList.reduce((sum, item) => sum + item.pis + item.cofins, 0);
  const totalQtd = ncmList.reduce((sum, item) => sum + item.quantidade, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Vendido</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">{ncmList.length} NCMs distintos</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-efd-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Tributos</CardTitle>
            <div className="p-2 bg-efd-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-efd-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-efd-primary">{formatCurrency(totalTributos)}</div>
            <p className="text-xs text-muted-foreground mt-1">PIS + COFINS</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Quantidade Total</CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <Package className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totalQtd.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Unidades vendidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Main NCM Table */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-gradient-to-br from-primary to-primary rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Resumo por NCM</CardTitle>
              <CardDescription className="mt-1">
                Análise de vendas por classificação fiscal
              </CardDescription>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por NCM ou produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border-2 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>NCM</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-right">PIS</TableHead>
                  <TableHead className="text-right">COFINS</TableHead>
                  <TableHead className="text-right">Total Tributos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ncmList.slice(0, 20).map((item, index) => {
                  const percentual = totalValue > 0 ? ((item.valor / totalValue) * 100).toFixed(1) : '0';
                  return (
                    <TableRow 
                      key={index}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="text-center">
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center mx-auto font-bold text-xs",
                          index < 3 ? "bg-gradient-to-br from-warning to-warning text-white shadow-md" : "bg-muted text-muted-foreground"
                        )}>
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        <Badge variant="outline" className="font-semibold">{item.ncm}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.produto}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.quantidade.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-semibold">{formatCurrency(item.valor)}</div>
                        <div className="text-xs text-muted-foreground">{percentual}% do total</div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(item.pis)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(item.cofins)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold text-primary">{formatCurrency(item.pis + item.cofins)}</div>
                        <div className="text-xs text-muted-foreground">
                          {((item.pis + item.cofins) / item.valor * 100).toFixed(2)}%
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {ncmList.length > 20 && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Exibindo os 20 principais de <strong className="text-foreground">{ncmList.length}</strong> NCMs encontrados</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
