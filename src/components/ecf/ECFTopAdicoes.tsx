import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Award, Filter } from "lucide-react";
import { ECFDocumento } from "@/utils/ecfParser";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";

interface ECFTopAdicoesProps {
  documento: ECFDocumento;
}

export function ECFTopAdicoes({ documento }: ECFTopAdicoesProps) {
  const [topN, setTopN] = useState<number>(5);

  // Extrair e ordenar adições M300
  const adicoesM300 = documento.m300
    .filter(r => r.campos.TIPO_LANCAMENTO === "A" && r.campos.VALOR > 0 && r.campos.CODIGO !== "93")
    .map(r => ({
      codigo: r.campos.CODIGO || "",
      descricao: r.campos.DESCRICAO || "Sem descrição",
      valor: r.campos.VALOR || 0,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, topN);

  // Extrair e ordenar exclusões M300
  const exclusoesM300 = documento.m300
    .filter(r => r.campos.TIPO_LANCAMENTO === "E" && r.campos.VALOR > 0 && r.campos.CODIGO !== "168")
    .map(r => ({
      codigo: r.campos.CODIGO || "",
      descricao: r.campos.DESCRICAO || "Sem descrição",
      valor: r.campos.VALOR || 0,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, topN);

  // Extrair e ordenar adições M350
  const adicoesM350 = documento.m350
    .filter(r => r.campos.TIPO_LANCAMENTO === "A" && r.campos.VALOR > 0 && r.campos.CODIGO !== "93")
    .map(r => ({
      codigo: r.campos.CODIGO || "",
      descricao: r.campos.DESCRICAO || "Sem descrição",
      valor: r.campos.VALOR || 0,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, topN);

  // Extrair e ordenar exclusões M350
  const exclusoesM350 = documento.m350
    .filter(r => r.campos.TIPO_LANCAMENTO === "E" && r.campos.VALOR > 0 && r.campos.CODIGO !== "168")
    .map(r => ({
      codigo: r.campos.CODIGO || "",
      descricao: r.campos.DESCRICAO || "Sem descrição",
      valor: r.campos.VALOR || 0,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, topN);

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const totalAdicoes = documento.m300
    .filter(r => r.campos.TIPO_LANCAMENTO === "A" && r.campos.VALOR > 0 && r.campos.CODIGO !== "93")
    .reduce((acc, r) => acc + (r.campos.VALOR || 0), 0);
    
  const totalExclusoes = documento.m300
    .filter(r => r.campos.TIPO_LANCAMENTO === "E" && r.campos.VALOR > 0 && r.campos.CODIGO !== "168")
    .reduce((acc, r) => acc + (r.campos.VALOR || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header com Filtro */}
      <Card className="p-6 border border-border/70 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-ecf-primary/10 border border-ecf-primary/20">
              <Filter className="w-6 h-6 text-ecf-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-ecf-secondary">Análise Detalhada de Lançamentos</h3>
              <p className="text-sm text-muted-foreground">
                Principais adições e exclusões do Lucro Real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Exibir:</span>
            <Select value={topN.toString()} onValueChange={(value) => setTopN(Number(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
                <SelectItem value="15">Top 15</SelectItem>
                <SelectItem value="20">Top 20</SelectItem>
                <SelectItem value="25">Top 25</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Top N Adições IRPJ */}
      <Card className="p-6 border border-border/70 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-ecf-secondary flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-destructive" />
            Top {topN} Adições ao Lucro Real (IRPJ)
          </h3>
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
            <Award className="w-3 h-3 mr-1" />
            Total Geral: {formatarValor(totalAdicoes)}
          </Badge>
        </div>

        {adicoesM300.length > 0 ? (
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-20">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right w-24">% do Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adicoesM300.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/30">
                    <TableCell className="font-bold text-muted-foreground">{idx + 1}º</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.codigo}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.descricao}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">
                      {formatarValor(item.valor)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {totalAdicoes > 0 ? ((item.valor / totalAdicoes) * 100).toFixed(1) : "0.0"}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma adição detalhada encontrada
          </div>
        )}
      </Card>

      {/* Top N Exclusões IRPJ */}
      <Card className="p-6 border border-border/70 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-ecf-secondary flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-success" />
            Top {topN} Exclusões do Lucro Real (IRPJ)
          </h3>
          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
            <Award className="w-3 h-3 mr-1" />
            Total Geral: {formatarValor(totalExclusoes)}
          </Badge>
        </div>

        {exclusoesM300.length > 0 ? (
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-20">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right w-24">% do Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exclusoesM300.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/30">
                    <TableCell className="font-bold text-muted-foreground">{idx + 1}º</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.codigo}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.descricao}</TableCell>
                    <TableCell className="text-right font-bold text-success">
                      {formatarValor(item.valor)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {totalExclusoes > 0 ? ((item.valor / totalExclusoes) * 100).toFixed(1) : "0.0"}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma exclusão detalhada encontrada
          </div>
        )}
      </Card>

      {/* Grid CSLL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top N Adições CSLL */}
        <Card className="p-6 border border-border/70 shadow-sm">
          <h4 className="text-lg font-bold text-ecf-secondary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-destructive" />
            Top {topN} Adições CSLL
          </h4>
          {adicoesM350.length > 0 ? (
            <div className="space-y-2">
              {adicoesM350.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between p-3 rounded-lg bg-muted/40 border border-border/60 hover:bg-muted/60 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-muted-foreground">{idx + 1}º</span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {item.codigo}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground">{item.descricao}</p>
                  </div>
                  <span className="text-sm font-bold text-destructive ml-2">
                    {formatarValor(item.valor)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma adição encontrada
            </div>
          )}
        </Card>

        {/* Top N Exclusões CSLL */}
        <Card className="p-6 border border-border/70 shadow-sm">
          <h4 className="text-lg font-bold text-ecf-secondary mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-success" />
            Top {topN} Exclusões CSLL
          </h4>
          {exclusoesM350.length > 0 ? (
            <div className="space-y-2">
              {exclusoesM350.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between p-3 rounded-lg bg-muted/40 border border-border/60 hover:bg-muted/60 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-muted-foreground">{idx + 1}º</span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {item.codigo}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground">{item.descricao}</p>
                  </div>
                  <span className="text-sm font-bold text-success ml-2">
                    {formatarValor(item.valor)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma exclusão encontrada
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
