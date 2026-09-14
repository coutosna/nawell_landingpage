import { Card } from "@/components/ui/card";
import { ECFAnaliseCompleta } from "@/utils/ecfCalculations";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, PieChart as PieChartIcon } from "lucide-react";

interface ECFGraficosProps {
  analise: ECFAnaliseCompleta;
}

// Paleta NAWELL
const NAVY = "#0B1220";
const BLUE = "#3882F6";
const INDIGO = "#5A5B91";

export function ECFGraficos({ analise }: ECFGraficosProps) {
  const { apuracao, totais } = analise;

  const formatarValor = (valor: number) => {
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Dados para o gráfico de pizza
  const dadosPizza = [
    { name: "IRPJ", value: apuracao.irpj, color: BLUE },
    { name: "CSLL", value: apuracao.csll, color: NAVY },
    { name: "Adicional IRPJ", value: apuracao.adicionalIRPJ, color: INDIGO },
  ];

  // Dados para o gráfico de barras
  const dadosBarras = [
    {
      name: "IRPJ",
      "Adições": totais.m300_93_adicoes,
      "Exclusões": totais.m300_168_exclusoes,
      "Base": apuracao.baseIRPJ,
    },
    {
      name: "CSLL",
      "Adições": totais.m350_93_adicoes,
      "Exclusões": totais.m350_168_exclusoes,
      "Base": apuracao.baseCSLL,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Distribuição de Tributos - Pizza */}
      <Card className="p-6 border border-border/70 shadow-sm transition-shadow duration-300 hover:shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-ecf-primary/10 border border-ecf-primary/20">
            <PieChartIcon className="w-6 h-6 text-ecf-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-ecf-secondary">Distribuição de Tributos</h3>
            <p className="text-sm text-muted-foreground">Composição do total de IRPJ e CSLL</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={dadosPizza}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${((entry.value / apuracao.totalTributos) * 100).toFixed(1)}%`}
              outerRadius={120}
              fill={NAVY}
              dataKey="value"
            >
              {dadosPizza.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={formatarValor} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/60">
          {dadosPizza.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border border-border/60">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{item.name}</p>
                <p className="text-lg font-bold text-foreground">{formatarValor(item.value)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Composição das Bases - Barras */}
      <Card className="p-6 border border-border/70 shadow-sm transition-shadow duration-300 hover:shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-ecf-primary/10 border border-ecf-primary/20">
            <TrendingUp className="w-6 h-6 text-ecf-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-ecf-secondary">Composição das Bases de Cálculo</h3>
            <p className="text-sm text-muted-foreground">Adições, Exclusões e Bases de IRPJ e CSLL</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={dadosBarras} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `R$ ${(value / 1000000).toFixed(0)}M`} />
            <Tooltip
              formatter={formatarValor}
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
            />
            <Legend />
            <Bar dataKey="Adições" fill={INDIGO} radius={[8, 8, 0, 0]} />
            <Bar dataKey="Exclusões" fill={BLUE} radius={[8, 8, 0, 0]} />
            <Bar dataKey="Base" fill={NAVY} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/60">
          <div className="p-4 rounded-xl bg-ecf-primary/5 border border-ecf-primary/20">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BLUE }} />
              IRPJ
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Adições:</span>
                <span className="font-semibold text-foreground">{formatarValor(totais.m300_93_adicoes)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Exclusões:</span>
                <span className="font-semibold text-foreground">{formatarValor(totais.m300_168_exclusoes)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border/60">
                <span className="font-semibold text-foreground">Base:</span>
                <span className="font-bold text-ecf-primary">{formatarValor(apuracao.baseIRPJ)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-ecf-primary/5 border border-ecf-primary/20">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NAVY }} />
              CSLL
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Adições:</span>
                <span className="font-semibold text-foreground">{formatarValor(totais.m350_93_adicoes)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Exclusões:</span>
                <span className="font-semibold text-foreground">{formatarValor(totais.m350_168_exclusoes)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border/60">
                <span className="font-semibold text-foreground">Base:</span>
                <span className="font-bold text-ecf-primary">{formatarValor(apuracao.baseCSLL)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
