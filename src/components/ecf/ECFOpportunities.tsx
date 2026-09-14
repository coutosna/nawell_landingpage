import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, DollarSign, Sparkles } from "lucide-react";
import { ECFAnaliseCompleta } from "@/utils/ecfCalculations";

interface ECFOpportunitiesProps {
  analise: ECFAnaliseCompleta;
}

export function ECFOpportunities({ analise }: ECFOpportunitiesProps) {
  const oportunidades = gerarOportunidades(analise);
  const economiaTotal = oportunidades.reduce((acc, op) => acc + op.economiaEstimada, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 border border-border/70 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-ecf-primary/10 border border-ecf-primary/20">
              <Lightbulb className="w-6 h-6 text-ecf-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-ecf-secondary">Oportunidades de Otimização Fiscal</h3>
              <p className="text-sm text-muted-foreground">
                {oportunidades.length} {oportunidades.length === 1 ? "oportunidade identificada" : "oportunidades identificadas"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 border border-success/20">
            <DollarSign className="w-5 h-5 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">Economia Potencial</p>
              <p className="text-lg font-bold text-success">
                {economiaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Oportunidades */}
      <div className="grid gap-6">
        {oportunidades.map((op, idx) => {
          const prioridadeConfig = getPrioridadeConfig(op.prioridade);

          return (
            <Card
              key={idx}
              className={`relative overflow-hidden p-6 transition-all duration-300 border ${prioridadeConfig.cardBorder}`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-3 rounded-xl border ${prioridadeConfig.iconBg}`}>
                      {prioridadeConfig.icon}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={`${prioridadeConfig.badgeColor} border`}>
                          {prioridadeConfig.label}
                        </Badge>
                      </div>
                      <h4 className="text-lg font-bold text-ecf-secondary mb-2">{op.titulo}</h4>
                      <p className="text-sm text-muted-foreground">{op.descricao}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Economia Estimada</p>
                    <p className="text-2xl font-bold text-success">
                      {op.economiaEstimada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>

                {op.acoes && op.acoes.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted/40 border border-border/60">
                    <p className="text-sm font-semibold text-foreground mb-2">Ações Recomendadas:</p>
                    <ul className="space-y-1">
                      {op.acoes.map((acao, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-ecf-primary mt-0.5">•</span>
                          <span>{acao}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary Card */}
      <Card className="p-6 border border-success/30 bg-success/5">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-xl bg-success/10 border border-success/20">
            <Sparkles className="w-8 h-8 text-success" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-ecf-secondary mb-1">Total de Economia Potencial</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Implementando todas as oportunidades identificadas
            </p>
            <p className="text-3xl font-bold text-success">
              {economiaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Tipos
interface Oportunidade {
  titulo: string;
  descricao: string;
  prioridade: "alta" | "media" | "baixa";
  economiaEstimada: number;
  acoes?: string[];
}

// Funções auxiliares
function gerarOportunidades(analise: ECFAnaliseCompleta): Oportunidade[] {
  const oportunidades: Oportunidade[] = [];
  const { apuracao, totais, regimeTributario, presumido } = analise;

  // Oportunidades Lucro Presumido
  if (regimeTributario === "Lucro Presumido" && presumido) {
    // Oportunidade 1: Comparar com Lucro Real
    const receitaTotal = presumido.totaisAnuais.receitaBrutaTotal;
    const margem = presumido.totaisAnuais.basePresumidaIRPJ / receitaTotal;
    
    if (margem < 0.15 && receitaTotal > 10000000) {
      oportunidades.push({
        titulo: "Avaliar Mudança para Lucro Real",
        descricao: "Sua margem de lucro está abaixo da base presumida. Lucro Real pode resultar em menor tributação.",
        prioridade: "alta",
        economiaEstimada: presumido.totaisAnuais.irpjTotal * 0.2,
        acoes: [
          "Simular apuração pelo Lucro Real",
          "Considerar custos de conformidade adicionais",
          "Consultar contador para análise detalhada"
        ]
      });
    }

    // Oportunidade 2: Otimização de percentuais
    for (const periodo of presumido.receitasPorPeriodo) {
      for (const item of periodo.itens) {
        if (item.pctPresuncaoIRPJ === 0.32) {
          oportunidades.push({
            titulo: "Revisar Classificação de Atividades",
            descricao: "Percentual de 32% aplicado. Verificar se atividades podem ter percentuais menores (8%, 16%).",
            prioridade: "media",
            economiaEstimada: item.receitaBruta * 0.24 * 0.15,
            acoes: [
              "Verificar CNAE principal e secundário",
              "Revisar natureza das receitas",
              "Segregar receitas por tipo de atividade"
            ]
          });
          break;
        }
      }
    }

    // Oportunidade 3: Distribuição de lucros como JCP
    if (presumido.totaisAnuais.basePresumidaIRPJ > 500000) {
      oportunidades.push({
        titulo: "Distribuição de Juros sobre Capital Próprio (JCP)",
        descricao: "Patrimônio líquido relevante permite distribuição de JCP dedutível.",
        prioridade: "alta",
        economiaEstimada: presumido.totaisAnuais.basePresumidaIRPJ * 0.05 * 0.34,
        acoes: [
          "Calcular JCP máximo dedutível (TJLP)",
          "Avaliar impacto no IR retido dos sócios",
          "Planejar distribuição trimestral"
        ]
      });
    }

    return oportunidades;
  }

  // Oportunidades Lucro Real (código original)
  if (totais.m300_93_adicoes > 1000000) {
    oportunidades.push({
      titulo: "Revisão de Adições ao Lucro Líquido",
      descricao: "Identificado alto volume de adições. Revisar se todas são necessárias e se há possibilidade de redução através de planejamento tributário.",
      prioridade: "alta",
      economiaEstimada: totais.m300_93_adicoes * 0.05,
      acoes: [
        "Revisar despesas não dedutíveis",
        "Avaliar possibilidade de reestruturação",
        "Consultar legislação sobre incentivos fiscais"
      ]
    });
  }

  // Oportunidade 2: Baixo aproveitamento de exclusões
  const proporcaoExclusoes = totais.m300_168_exclusoes / totais.m300_93_adicoes;
  if (proporcaoExclusoes < 0.5) {
    oportunidades.push({
      titulo: "Oportunidade em Exclusões da Base de Cálculo",
      descricao: "O volume de exclusões está abaixo da média. Pode haver oportunidades não aproveitadas de redução da base de cálculo.",
      prioridade: "media",
      economiaEstimada: totais.m300_93_adicoes * 0.03,
      acoes: [
        "Verificar incentivos fiscais disponíveis",
        "Revisar despesas com inovação tecnológica",
        "Avaliar possibilidade de PAT e outros benefícios"
      ]
    });
  }

  // Oportunidade 3: Adicional IRPJ elevado
  if (apuracao.adicionalIRPJ > 100000) {
    oportunidades.push({
      titulo: "Otimização do Adicional de IRPJ",
      descricao: "Adicional de IRPJ significativo. Avaliar estratégias de distribuição de lucros ou reestruturação societária.",
      prioridade: "alta",
      economiaEstimada: apuracao.adicionalIRPJ * 0.1,
      acoes: [
        "Avaliar distribuição de lucros como JCP",
        "Considerar reestruturação societária",
        "Analisar possibilidade de holding"
      ]
    });
  }

  // Oportunidade 4: Comparação IRPJ x CSLL
  const proporcaoCSLL = apuracao.csll / apuracao.irpj;
  if (proporcaoCSLL > 0.7) {
    oportunidades.push({
      titulo: "Revisão da Base de CSLL",
      descricao: "A proporção entre CSLL e IRPJ está elevada. Pode haver oportunidades específicas de redução da base de CSLL.",
      prioridade: "media",
      economiaEstimada: apuracao.csll * 0.04,
      acoes: [
        "Revisar adições específicas de CSLL",
        "Verificar diferenças entre bases",
        "Consultar especialista em planejamento tributário"
      ]
    });
  }

  // Oportunidade 5: Incentivos fiscais
  oportunidades.push({
    titulo: "Avaliação de Incentivos Fiscais",
    descricao: "Verificar elegibilidade para incentivos fiscais federais, estaduais e municipais não aproveitados.",
    prioridade: "baixa",
    economiaEstimada: apuracao.totalTributos * 0.02,
    acoes: [
      "Pesquisar incentivos disponíveis no setor",
      "Verificar Lei do Bem e outros benefícios",
      "Avaliar programas de inovação"
    ]
  });

  return oportunidades;
}

function getPrioridadeConfig(prioridade: "alta" | "media" | "baixa") {
  switch (prioridade) {
    case "alta":
      return {
        label: "Alta Prioridade",
        badgeColor: "bg-destructive/10 text-destructive border-destructive/30",
        cardBorder: "border-destructive/20 bg-destructive/[0.02]",
        iconBg: "bg-destructive/10 border-destructive/20",
        icon: <TrendingUp className="w-5 h-5 text-destructive" />
      };
    case "media":
      return {
        label: "Média Prioridade",
        badgeColor: "bg-warning/10 text-warning border-warning/30",
        cardBorder: "border-warning/20 bg-warning/[0.02]",
        iconBg: "bg-warning/10 border-warning/20",
        icon: <Lightbulb className="w-5 h-5 text-warning" />
      };
    default:
      return {
        label: "Baixa Prioridade",
        badgeColor: "bg-ecf-primary/10 text-ecf-primary border-ecf-primary/30",
        cardBorder: "border-ecf-primary/20 bg-ecf-primary/[0.02]",
        iconBg: "bg-ecf-primary/10 border-ecf-primary/20",
        icon: <Sparkles className="w-5 h-5 text-ecf-primary" />
      };
  }
}
