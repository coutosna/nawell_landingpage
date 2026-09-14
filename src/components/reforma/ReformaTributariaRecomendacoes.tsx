import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResumoAno } from '@/utils/reformaTributariaCalculations';
import { Lightbulb, AlertTriangle, TrendingUp, Calendar, DollarSign, Shield } from 'lucide-react';

interface ReformaTributariaRecomendacoesProps {
  dados: ResumoAno[];
}

export function ReformaTributariaRecomendacoes({ dados }: ReformaTributariaRecomendacoesProps) {
  const ano2026 = dados.find(d => d.ano === 2026);
  const ano2027 = dados.find(d => d.ano === 2027);
  const ano2033 = dados.find(d => d.ano === 2033);

  if (!ano2026 || !ano2027 || !ano2033) return null;

  const diferencaTotal = ano2033.totalTributos - ano2026.totalTributos;
  const reducaoAliquota = ano2026.aliquotaEfetiva - ano2033.aliquotaEfetiva;

  // Gerar recomendações baseadas nos dados
  const recomendacoes = [];

  // Recomendação sobre 2027 (extinção PIS/Cofins)
  if (ano2026.totalPisCofins > 0) {
    recomendacoes.push({
      tipo: 'alerta',
      icone: AlertTriangle,
      titulo: 'Atenção: 2027 - Extinção PIS/Cofins',
      descricao: `Em 2027, PIS/Cofins será extinto (atual: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(ano2026.totalPisCofins)}). Prepare-se para ajuste de fluxo de caixa e revisão de precificação.`,
      prioridade: 'alta'
    });
  }

  // Recomendação sobre impacto geral
  if (diferencaTotal < 0) {
    recomendacoes.push({
      tipo: 'oportunidade',
      icone: TrendingUp,
      titulo: 'Oportunidade: Redução da Carga Tributária',
      descricao: `A reforma resultará em economia de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(Math.abs(diferencaTotal))} até 2033. Considere reinvestir essa economia em crescimento ou competitividade.`,
      prioridade: 'alta'
    });
  } else {
    recomendacoes.push({
      tipo: 'alerta',
      icone: AlertTriangle,
      titulo: 'Atenção: Aumento da Carga Tributária',
      descricao: `A reforma resultará em custo adicional de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(diferencaTotal)} até 2033. Planeje ajustes de precificação e eficiência operacional.`,
      prioridade: 'alta'
    });
  }

  // Recomendação sobre 2029 (início redução ICMS)
  recomendacoes.push({
    tipo: 'planejamento',
    icone: Calendar,
    titulo: 'Planejamento: 2029 - Redução Gradual do ICMS',
    descricao: 'A partir de 2029, ICMS começa a ser reduzido gradualmente enquanto IBS aumenta. Monitore o impacto estadual e revise a cadeia de suprimentos.',
    prioridade: 'media'
  });

  // Recomendação sobre créditos tributários
  recomendacoes.push({
    tipo: 'estrategia',
    icone: DollarSign,
    titulo: 'Estratégia: Gestão de Créditos Tributários',
    descricao: 'CBS e IBS permitirão crédito mais amplo que o regime atual. Revise sua cadeia de suprimentos para maximizar aproveitamento de créditos.',
    prioridade: 'media'
  });

  // Recomendação sobre compliance
  recomendacoes.push({
    tipo: 'conformidade',
    icone: Shield,
    titulo: 'Conformidade: Adequação de Sistemas',
    descricao: 'Garanta que seus sistemas fiscais e contábeis estejam preparados para calcular CBS e IBS corretamente. Considere investir em automação.',
    prioridade: 'media'
  });

  // Recomendação sobre precificação
  if (Math.abs(reducaoAliquota) > 1) {
    recomendacoes.push({
      tipo: 'estrategia',
      icone: Lightbulb,
      titulo: 'Estratégia: Revisão de Precificação',
      descricao: `Com variação de ${Math.abs(reducaoAliquota).toFixed(2)} p.p. na alíquota efetiva, revise sua estratégia de precificação para manter competitividade e margem.`,
      prioridade: 'alta'
    });
  }

  const prioridadeOrdem = { 'alta': 1, 'media': 2, 'baixa': 3 };
  const recomendacoesOrdenadas = recomendacoes.sort((a, b) => 
    prioridadeOrdem[a.prioridade as keyof typeof prioridadeOrdem] - prioridadeOrdem[b.prioridade as keyof typeof prioridadeOrdem]
  );

  const getCardStyle = (tipo: string, prioridade: string) => {
    if (prioridade === 'alta' && tipo === 'alerta') {
      return 'border-2 border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5';
    }
    if (prioridade === 'alta' && tipo === 'oportunidade') {
      return 'border-2 border-success/30 bg-gradient-to-br from-success/10 to-success/5';
    }
    return 'border-2 hover:shadow-lg transition-shadow';
  };

  const getIconColor = (tipo: string) => {
    switch (tipo) {
      case 'alerta': return 'text-destructive';
      case 'oportunidade': return 'text-success';
      case 'planejamento': return 'text-primary';
      case 'estrategia': return 'text-reforma-primary';
      case 'conformidade': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-reforma-primary" />
          Recomendações Estratégicas
        </CardTitle>
        <CardDescription>
          Insights automáticos baseados na análise da reforma tributária
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recomendacoesOrdenadas.map((rec, index) => {
            const Icon = rec.icone;
            return (
              <Alert key={index} className={getCardStyle(rec.tipo, rec.prioridade)}>
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-background flex items-center justify-center ${rec.prioridade === 'alta' ? 'ring-2 ring-reforma-primary' : ''}`}>
                    <Icon className={`w-5 h-5 ${getIconColor(rec.tipo)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-sm">{rec.titulo}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase whitespace-nowrap ${
                        rec.prioridade === 'alta' 
                          ? 'bg-destructive/20 text-destructive' 
                          : 'bg-primary/20 text-primary'
                      }`}>
                        {rec.prioridade}
                      </span>
                    </div>
                    <AlertDescription className="text-sm">
                      {rec.descricao}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>💡 Dica:</strong> Estas recomendações são geradas automaticamente com base nos dados da sua EFD. 
            Consulte seu contador ou consultor tributário para um planejamento detalhado.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
