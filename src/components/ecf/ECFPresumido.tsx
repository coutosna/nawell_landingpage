import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DadosPresumido } from "@/utils/ecfCalculations";
import { TrendingUp, DollarSign, BarChart3, Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ECFPresumidoProps {
  dados: DadosPresumido;
}

export function ECFPresumido({ dados }: ECFPresumidoProps) {
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatarPct = (valor: number) => {
    return `${(valor * 100).toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 border border-border/70 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-ecf-primary/10 border border-ecf-primary/20">
              <BarChart3 className="w-6 h-6 text-ecf-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-ecf-secondary">Lucro Presumido</h3>
              <p className="text-sm text-muted-foreground">
                Periodicidade: {dados.periodicidade === "trimestral" ? "Trimestral" : "Anual"}
              </p>
            </div>
          </div>

          <Badge variant="outline" className="bg-ecf-primary/10 text-ecf-primary border-ecf-primary/30 px-4 py-2">
            <Calendar className="w-4 h-4 mr-2" />
            {dados.receitasPorPeriodo.length} {dados.periodicidade === "trimestral" ? "Trimestres" : "Meses"}
          </Badge>
        </div>
      </Card>

      {/* Resumo Anual */}
      <Card className="p-6 border border-border/70 shadow-sm">
        <h3 className="text-lg font-bold text-ecf-secondary mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-ecf-primary/10 border border-ecf-primary/20">
            <TrendingUp className="w-4 h-4 text-ecf-primary" />
          </div>
          Totais Anuais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
            <p className="text-xs text-muted-foreground mb-1">Receita Bruta Total</p>
            <p className="text-xl font-bold text-foreground">
              {formatarValor(dados.totaisAnuais.receitaBrutaTotal)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
            <p className="text-xs text-muted-foreground mb-1">Base Presumida IRPJ</p>
            <p className="text-xl font-bold text-ecf-primary">
              {formatarValor(dados.totaisAnuais.basePresumidaIRPJ)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
            <p className="text-xs text-muted-foreground mb-1">Base Presumida CSLL</p>
            <p className="text-xl font-bold text-ecf-primary">
              {formatarValor(dados.totaisAnuais.basePresumidaCSLL)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
            <p className="text-xs text-muted-foreground mb-1">IRPJ Total</p>
            <p className="text-xl font-bold text-warning">
              {formatarValor(dados.totaisAnuais.irpjTotal)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
            <p className="text-xs text-muted-foreground mb-1">CSLL Total</p>
            <p className="text-xl font-bold text-success">
              {formatarValor(dados.totaisAnuais.csllTotal)}
            </p>
          </div>
        </div>
      </Card>

      {/* Por Período */}
      {dados.receitasPorPeriodo.map((periodo, idx) => (
        <Card key={idx} className="p-6 border border-border/70 shadow-sm transition-shadow duration-300 hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-ecf-secondary flex items-center gap-2">
              <Calendar className="w-5 h-5 text-ecf-primary" />
              Período {periodo.periodo}
            </h4>
            <Badge variant="outline" className="bg-ecf-primary/10 text-ecf-primary border-ecf-primary/30">
              {periodo.itens.length} {periodo.itens.length === 1 ? "Atividade" : "Atividades"}
            </Badge>
          </div>

          {/* Totais do Período */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 p-4 rounded-lg bg-muted/40 border border-border/60">
            <div>
              <p className="text-xs text-muted-foreground">Receita Bruta</p>
              <p className="text-sm font-bold text-foreground">
                {formatarValor(periodo.totaisPeriodo.receitaBrutaTotal)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Base IRPJ</p>
              <p className="text-sm font-bold text-ecf-primary">
                {formatarValor(periodo.totaisPeriodo.basePresumidaIRPJ)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">IRPJ</p>
              <p className="text-sm font-bold text-warning">
                {formatarValor(periodo.totaisPeriodo.irpjTotal)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CSLL</p>
              <p className="text-sm font-bold text-success">
                {formatarValor(periodo.totaisPeriodo.csllTotal)}
              </p>
            </div>
          </div>

          {/* Tabela de Atividades */}
          {periodo.itens.length > 0 && (
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Atividade</TableHead>
                    <TableHead>Natureza</TableHead>
                    <TableHead className="text-right">Receita Bruta</TableHead>
                    <TableHead className="text-right">% IRPJ</TableHead>
                    <TableHead className="text-right">Base IRPJ</TableHead>
                    <TableHead className="text-right">% CSLL</TableHead>
                    <TableHead className="text-right">Base CSLL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periodo.itens.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.atividade}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.natureza}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatarValor(item.receitaBruta)}
                      </TableCell>
                      <TableCell className="text-right text-ecf-primary">
                        {formatarPct(item.pctPresuncaoIRPJ)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-ecf-primary">
                        {formatarValor(item.basePresumidaIRPJ)}
                      </TableCell>
                      <TableCell className="text-right text-ecf-primary">
                        {formatarPct(item.pctPresuncaoCSLL)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-ecf-primary">
                        {formatarValor(item.basePresumidaCSLL)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      ))}

      {/* Card de Detalhamento IRPJ/CSLL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border border-border/70 shadow-sm">
          <h4 className="text-lg font-bold text-ecf-secondary mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-ecf-primary" />
            Composição IRPJ Anual
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-sm text-muted-foreground">Base Presumida</span>
              <span className="font-semibold text-foreground">
                {formatarValor(dados.totaisAnuais.basePresumidaIRPJ)}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-sm text-muted-foreground">IRPJ 15%</span>
              <span className="font-semibold text-foreground">
                {formatarValor(dados.totaisAnuais.basePresumidaIRPJ * 0.15)}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-sm text-muted-foreground">Adicional 10%</span>
              <span className="font-semibold text-foreground">
                {formatarValor(Math.max(0, (dados.totaisAnuais.basePresumidaIRPJ - 240000) * 0.10))}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-ecf-primary/10 border border-ecf-primary/30">
              <span className="text-sm font-bold text-foreground">Total IRPJ</span>
              <span className="font-bold text-ecf-primary">
                {formatarValor(dados.totaisAnuais.irpjTotal)}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border/70 shadow-sm">
          <h4 className="text-lg font-bold text-ecf-secondary mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-ecf-primary" />
            Composição CSLL Anual
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-sm text-muted-foreground">Base Presumida</span>
              <span className="font-semibold text-foreground">
                {formatarValor(dados.totaisAnuais.basePresumidaCSLL)}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-sm text-muted-foreground">Alíquota</span>
              <span className="font-semibold text-foreground">9%</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-ecf-primary/10 border border-ecf-primary/30 mt-4">
              <span className="text-sm font-bold text-foreground">Total CSLL</span>
              <span className="font-bold text-ecf-primary">
                {formatarValor(dados.totaisAnuais.csllTotal)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
