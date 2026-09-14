import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ECFAnaliseCompleta } from "@/utils/ecfCalculations";

interface ECFDashboardProps {
  analise: ECFAnaliseCompleta;
}

export function ECFDashboard({ analise }: ECFDashboardProps) {
  const { documento, apuracao, totais, periodoApuracao, regimeTributario } = analise;

  // Se for Lucro Presumido, mostrar apenas info básica
  if (regimeTributario === "Lucro Presumido") {
    return (
      <Card className="p-6 border border-border/70 shadow-sm">
        <div className="text-center py-8">
          <div className="mx-auto mb-4 p-3 rounded-xl bg-ecf-primary/10 border border-ecf-primary/20 w-fit">
            <Building2 className="w-10 h-10 text-ecf-primary" />
          </div>
          <h3 className="text-2xl font-bold text-ecf-secondary mb-2">Regime: Lucro Presumido</h3>
          <p className="text-muted-foreground mb-4">
            Visualize os detalhes na aba "Resumo"
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-muted/40 border border-border/60">
              <p className="text-sm text-muted-foreground mb-1">Empresa</p>
              <p className="font-semibold text-foreground">{documento.nomeEmpresa || "N/A"}</p>
              <p className="text-xs text-muted-foreground mt-1">CNPJ: {documento.cnpj || "N/A"}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/40 border border-border/60">
              <p className="text-sm text-muted-foreground mb-1">Período</p>
              <p className="font-semibold text-foreground">
                {documento.dtInicio} até {documento.dtFim}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/40 border border-border/60">
              <p className="text-sm text-muted-foreground mb-1">Apuração</p>
              <p className="font-semibold text-foreground">
                {documento.formaApuracao === "A" ? "Anual" : "Trimestral"}
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const cards = [
    {
      titulo: "IRPJ Total",
      valor: apuracao.irpj,
      icone: DollarSign,
      iconeBg: "bg-primary/10 border-primary/20",
      iconeColor: "text-primary",
      valorColor: "text-foreground",
      subtitulo: `Base: R$ ${apuracao.baseIRPJ.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`,
    },
    {
      titulo: "CSLL Total",
      valor: apuracao.csll,
      icone: TrendingUp,
      iconeBg: "bg-ecf-primary/10 border-ecf-primary/20",
      iconeColor: "text-ecf-primary",
      valorColor: "text-foreground",
      subtitulo: `Base: R$ ${apuracao.baseCSLL.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`,
    },
    {
      titulo: "Adicional IRPJ",
      valor: apuracao.adicionalIRPJ,
      icone: TrendingUp,
      iconeBg: "bg-warning/10 border-warning/20",
      iconeColor: "text-warning",
      valorColor: "text-warning",
      subtitulo: "10% sobre excedente de R$ 240.000",
    },
    {
      titulo: "Total Tributos",
      valor: apuracao.totalTributos,
      icone: BarChart3,
      iconeBg: "bg-success/10 border-success/20",
      iconeColor: "text-success",
      valorColor: "text-ecf-secondary",
      subtitulo: "IRPJ + CSLL",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card className="p-6 border border-border/70 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-ecf-primary/10 border border-ecf-primary/20">
              <Building2 className="w-5 h-5 text-ecf-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Empresa</p>
              <p className="font-semibold text-foreground">{documento.nomeEmpresa || "N/A"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">CNPJ: {documento.cnpj || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-ecf-primary/10 border border-ecf-primary/20">
              <Calendar className="w-5 h-5 text-ecf-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Período</p>
              <p className="font-semibold text-foreground">
                {documento.dtInicio} até {documento.dtFim}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{periodoApuracao}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-ecf-primary/10 border border-ecf-primary/20">
              <BarChart3 className="w-5 h-5 text-ecf-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Regime</p>
              <p className="font-semibold text-foreground">
                {regimeTributario}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Apuração: {documento.formaApuracao === "A" ? "Anual" : "Trimestral"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Cards de Valores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icone;
          return (
            <Card
              key={idx}
              className="p-6 transition-all duration-300 border border-border/70 shadow-sm hover:shadow-md hover:border-ecf-primary/30"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl border ${card.iconeBg}`}>
                  <Icon className={`w-5 h-5 ${card.iconeColor}`} />
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">{card.titulo}</p>
                <p className={`text-2xl font-bold mb-2 ${card.valorColor}`}>
                  R$ {card.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">{card.subtitulo}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Grid com Detalhamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detalhamento IRPJ */}
        <Card className="p-6 border border-border/70 shadow-sm">
          <h3 className="text-lg font-bold text-ecf-secondary mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-ecf-primary/10 border border-ecf-primary/20">
              <TrendingUp className="w-4 h-4 text-ecf-primary" />
            </div>
            Composição IRPJ
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-sm text-muted-foreground">Adições (M300/93)</span>
              <span className="font-semibold text-foreground">
                R$ {totais.m300_93_adicoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-sm text-muted-foreground">Exclusões (M300/168)</span>
              <span className="font-semibold text-foreground">
                R$ {totais.m300_168_exclusoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-ecf-primary/5 border border-ecf-primary/20">
              <span className="text-sm font-semibold text-foreground">Base de Cálculo (M300/175)</span>
              <span className="font-bold text-ecf-primary">
                R$ {apuracao.baseIRPJ.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-ecf-primary/10 border border-ecf-primary/20">
              <span className="text-sm font-semibold text-foreground">Alíquota Efetiva</span>
              <span className="font-bold text-ecf-primary">
                {totais.m300_93_adicoes > 0
                  ? ((apuracao.irpj / totais.m300_93_adicoes) * 100).toFixed(2)
                  : "0.00"}%
              </span>
            </div>
          </div>
        </Card>

        {/* Detalhamento CSLL */}
        <Card className="p-6 border border-border/70 shadow-sm">
          <h3 className="text-lg font-bold text-ecf-secondary mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-ecf-primary/10 border border-ecf-primary/20">
              <TrendingDown className="w-4 h-4 text-ecf-primary" />
            </div>
            Composição CSLL
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-sm text-muted-foreground">Adições (M350/93)</span>
              <span className="font-semibold text-foreground">
                R$ {totais.m350_93_adicoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-sm text-muted-foreground">Exclusões (M350/168)</span>
              <span className="font-semibold text-foreground">
                R$ {totais.m350_168_exclusoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-ecf-primary/5 border border-ecf-primary/20">
              <span className="text-sm font-semibold text-foreground">Base de Cálculo (M350/175)</span>
              <span className="font-bold text-ecf-primary">
                R$ {apuracao.baseCSLL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-ecf-primary/10 border border-ecf-primary/20">
              <span className="text-sm font-semibold text-foreground">Alíquota Efetiva</span>
              <span className="font-bold text-ecf-primary">
                {totais.m350_93_adicoes > 0
                  ? ((apuracao.csll / totais.m350_93_adicoes) * 100).toFixed(2)
                  : "0.00"}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Card de Indicadores Fiscais */}
      <Card className="p-6 border border-border/70 shadow-sm">
        <h3 className="text-lg font-bold text-ecf-secondary mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-ecf-primary/10 border border-ecf-primary/20">
            <BarChart3 className="w-4 h-4 text-ecf-primary" />
          </div>
          Indicadores Fiscais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-muted/40 border border-border/60">
            <p className="text-xs text-muted-foreground mb-1">Carga Tributária Total</p>
            <p className="text-xl font-bold text-ecf-secondary">
              {totais.m300_93_adicoes > 0
                ? ((apuracao.totalTributos / totais.m300_93_adicoes) * 100).toFixed(2)
                : "0.00"}%
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/40 border border-border/60">
            <p className="text-xs text-muted-foreground mb-1">Relação Exclusões/Adições</p>
            <p className="text-xl font-bold text-ecf-secondary">
              {totais.m300_93_adicoes > 0
                ? ((totais.m300_168_exclusoes / totais.m300_93_adicoes) * 100).toFixed(2)
                : "0.00"}%
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/40 border border-border/60">
            <p className="text-xs text-muted-foreground mb-1">Lucro Líquido Presumido</p>
            <p className="text-xl font-bold text-ecf-secondary">
              R$ {(totais.m300_93_adicoes - totais.m300_168_exclusoes).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/40 border border-border/60">
            <p className="text-xs text-muted-foreground mb-1">Impacto Adicional IRPJ</p>
            <p className="text-xl font-bold text-warning">
              {apuracao.irpj > 0
                ? ((apuracao.adicionalIRPJ / apuracao.irpj) * 100).toFixed(2)
                : "0.00"}%
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
