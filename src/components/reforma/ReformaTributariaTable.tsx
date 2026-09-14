import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResumoAno } from '@/utils/reformaTributariaCalculations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, Filter } from 'lucide-react';

interface ReformaTributariaTableProps {
  dados: ResumoAno[];
}

export function ReformaTributariaTable({ dados }: ReformaTributariaTableProps) {
  const [anoSelecionado, setAnoSelecionado] = useState<string>("todos");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(4)}%`;
  };

  const dadosFiltrados = anoSelecionado === "todos" 
    ? dados 
    : dados.filter(d => d.ano.toString() === anoSelecionado);

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-reforma-primary" />
              Detalhamento por Ano
            </CardTitle>
            <CardDescription>
              Resumo completo da transição tributária (2026-2033)
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filtrar ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os anos</SelectItem>
                {dados.map(d => (
                  <SelectItem key={d.ano} value={d.ano.toString()}>
                    {d.ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-bold">Ano</TableHead>
                <TableHead className="text-right font-bold">Base Total (R$)</TableHead>
                <TableHead className="text-right font-bold">CBS (R$)</TableHead>
                <TableHead className="text-right font-bold">IBS (R$)</TableHead>
                <TableHead className="text-right font-bold">PIS/Cofins (R$)</TableHead>
                <TableHead className="text-right font-bold">ICMS (R$)</TableHead>
                <TableHead className="text-right font-bold">Total Tributos (R$)</TableHead>
                <TableHead className="text-right font-bold">Alíquota Efetiva (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dadosFiltrados.map((ano) => (
                <TableRow key={ano.ano} className="hover:bg-muted/30">
                  <TableCell className="font-semibold">{ano.ano}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(ano.baseTotal)}</TableCell>
                  <TableCell className="text-right font-mono text-chart-1">{formatCurrency(ano.totalCbs)}</TableCell>
                  <TableCell className="text-right font-mono text-chart-2">{formatCurrency(ano.totalIbs)}</TableCell>
                  <TableCell className="text-right font-mono text-chart-3">{formatCurrency(ano.totalPisCofins)}</TableCell>
                  <TableCell className="text-right font-mono text-chart-4">{formatCurrency(ano.totalIcms)}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{formatCurrency(ano.totalTributos)}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-reforma-primary dark:text-reforma-primary">
                    {formatPercent(ano.aliquotaEfetiva)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
