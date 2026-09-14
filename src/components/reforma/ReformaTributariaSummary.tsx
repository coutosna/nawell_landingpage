import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResumoAno } from '@/utils/reformaTributariaCalculations';
import { TrendingDown, TrendingUp, DollarSign, Percent } from 'lucide-react';

interface ReformaTributariaSummaryProps {
  dados: ResumoAno[];
}

export function ReformaTributariaSummary({ dados }: ReformaTributariaSummaryProps) {
  if (dados.length === 0) return null;

  const ano2026 = dados.find(d => d.ano === 2026);
  const ano2033 = dados.find(d => d.ano === 2033);

  if (!ano2026 || !ano2033) return null;

  const reducaoAliquota = ano2026.aliquotaEfetiva - ano2033.aliquotaEfetiva;
  const reducaoPercentual = (reducaoAliquota / ano2026.aliquotaEfetiva) * 100;
  const economiaTotal = ano2026.totalTributos - ano2033.totalTributos;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  const cards = [
    {
      title: "Base Total de Cálculo",
      value: formatCurrency(ano2026.baseTotal),
      description: "Somatório de valor_mercadoria (saídas)",
      icon: DollarSign,
      color: "text-primary"
    },
    {
      title: "Alíquota Efetiva 2026",
      value: `${ano2026.aliquotaEfetiva.toFixed(4)}%`,
      description: "Regime atual + demonstrativo CBS/IBS",
      icon: Percent,
      color: "text-warning"
    },
    {
      title: "Alíquota Efetiva 2033",
      value: `${ano2033.aliquotaEfetiva.toFixed(4)}%`,
      description: "CBS/IBS completo (sem ICMS/PIS/Cofins)",
      icon: Percent,
      color: "text-success"
    },
    {
      title: "Redução da Carga",
      value: `${reducaoAliquota.toFixed(2)} p.p.`,
      description: `${reducaoPercentual >= 0 ? 'Redução' : 'Aumento'} de ${Math.abs(reducaoPercentual).toFixed(2)}%`,
      icon: reducaoAliquota >= 0 ? TrendingDown : TrendingUp,
      color: reducaoAliquota >= 0 ? "text-success" : "text-destructive"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {economiaTotal !== 0 && (
        <Card className={`border-2 ${economiaTotal > 0 ? 'bg-success/5 border-success/30' : 'bg-destructive/5 border-destructive/30'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {economiaTotal > 0 ? (
                <>
                  <TrendingDown className="w-5 h-5 text-success" />
                  Economia Projetada
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5 text-destructive" />
                  Aumento Projetado
                </>
              )}
            </CardTitle>
            <CardDescription>
              Comparação entre o regime de 2026 e 2033
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${economiaTotal > 0 ? 'text-success dark:text-success' : 'text-destructive dark:text-destructive'}`}>
              {formatCurrency(Math.abs(economiaTotal))}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {economiaTotal > 0 
                ? 'Redução de carga tributária na transição completa'
                : 'Aumento de carga tributária na transição completa'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
