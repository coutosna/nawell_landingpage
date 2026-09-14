import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResumoAno, ALIQUOTAS_TRANSICAO } from '@/utils/reformaTributariaCalculations';
import { Calendar, TrendingDown, TrendingUp, Zap } from 'lucide-react';

interface ReformaTributariaTimelineProps {
  dados: ResumoAno[];
}

export function ReformaTributariaTimeline({ dados }: ReformaTributariaTimelineProps) {
  const eventos = [
    {
      ano: 2026,
      titulo: 'Início da Transição',
      descricao: 'PIS/Cofins mantido. CBS e IBS apenas demonstrativos.',
      destaque: 'Regime atual permanece',
      aliquotas: ALIQUOTAS_TRANSICAO[2026],
      icon: Calendar,
      color: 'border-warning/50 bg-warning/5'
    },
    {
      ano: 2027,
      titulo: 'Extinção PIS/Cofins',
      descricao: 'PIS/Cofins zerado. CBS e IBS entram em vigor efetivamente.',
      destaque: 'Marco crítico da reforma',
      aliquotas: ALIQUOTAS_TRANSICAO[2027],
      icon: Zap,
      color: 'border-destructive/50 bg-destructive/5'
    },
    {
      ano: 2028,
      titulo: 'Estabilização CBS/IBS',
      descricao: 'CBS e IBS em vigor. ICMS ainda aplicado integralmente.',
      destaque: 'Consolidação federal',
      aliquotas: ALIQUOTAS_TRANSICAO[2028],
      icon: Calendar,
      color: 'border-primary/50 bg-primary/5'
    },
    {
      ano: 2029,
      titulo: 'Início Redução ICMS',
      descricao: 'ICMS começa a ser reduzido gradualmente. IBS aumenta.',
      destaque: 'Transição estadual inicia',
      aliquotas: ALIQUOTAS_TRANSICAO[2029],
      icon: TrendingDown,
      color: 'border-warning/50 bg-warning/5'
    },
    {
      ano: 2030,
      titulo: 'Redução ICMS 80%',
      descricao: 'ICMS reduzido para 80%. IBS em 20% da alíquota cheia.',
      destaque: 'Transição acelerada',
      aliquotas: ALIQUOTAS_TRANSICAO[2030],
      icon: TrendingDown,
      color: 'border-warning/50 bg-warning/5'
    },
    {
      ano: 2031,
      titulo: 'Redução ICMS 60%',
      descricao: 'ICMS reduzido para 60%. IBS em 40% da alíquota cheia.',
      destaque: 'Meio da transição',
      aliquotas: ALIQUOTAS_TRANSICAO[2031],
      icon: TrendingDown,
      color: 'border-success/50 bg-success/5'
    },
    {
      ano: 2032,
      titulo: 'Redução ICMS 40%',
      descricao: 'ICMS reduzido para 40%. IBS em 60% da alíquota cheia.',
      destaque: 'Reta final',
      aliquotas: ALIQUOTAS_TRANSICAO[2032],
      icon: TrendingDown,
      color: 'border-success/50 bg-success/5'
    },
    {
      ano: 2033,
      titulo: 'Reforma Completa',
      descricao: 'ICMS extinto. Apenas CBS e IBS em vigor.',
      destaque: 'Novo regime consolidado',
      aliquotas: ALIQUOTAS_TRANSICAO[2033],
      icon: TrendingUp,
      color: 'border-success/50 bg-success/5'
    }
  ];

  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-reforma-primary" />
          Timeline da Transição Tributária
        </CardTitle>
        <CardDescription>
          Marcos importantes e mudanças graduais de 2026 a 2033
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Linha vertical conectando os eventos */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-reforma-primary via-reforma-primary to-reforma-primary hidden md:block" />

          <div className="space-y-6">
            {eventos.map((evento, index) => {
              const Icon = evento.icon;
              const dadosAno = dados.find(d => d.ano === evento.ano);
              
              return (
                <div key={evento.ano} className="relative">
                  <div className="md:flex gap-6">
                    {/* Ano e ícone */}
                    <div className="flex items-start gap-4 md:w-32 flex-shrink-0">
                      <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-reforma-primary to-reforma-primary flex items-center justify-center shadow-lg">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="md:hidden">
                        <p className="text-2xl font-bold text-reforma-primary">{evento.ano}</p>
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <Card className={`flex-1 border-2 ${evento.color}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-reforma-primary mb-1 hidden md:block">
                              {evento.ano}
                            </p>
                            <CardTitle className="text-lg">{evento.titulo}</CardTitle>
                            <CardDescription className="mt-1">
                              {evento.descricao}
                            </CardDescription>
                          </div>
                          <div className="px-3 py-1 rounded-full bg-reforma-primary/10 text-reforma-primary text-xs font-semibold whitespace-nowrap">
                            {evento.destaque}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">CBS</p>
                            <p className="text-lg font-bold text-chart-1">
                              {formatPercent(evento.aliquotas.cbs)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">IBS</p>
                            <p className="text-lg font-bold text-chart-2">
                              {formatPercent(evento.aliquotas.ibs)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">PIS/Cofins</p>
                            <p className={`text-lg font-bold ${evento.aliquotas.pis_cofins > 0 ? 'text-chart-3' : 'text-muted-foreground'}`}>
                              {formatPercent(evento.aliquotas.pis_cofins)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">ICMS</p>
                            <p className={`text-lg font-bold ${evento.aliquotas.icms > 0 ? 'text-chart-4' : 'text-muted-foreground'}`}>
                              {formatPercent(evento.aliquotas.icms)}
                            </p>
                          </div>
                        </div>

                        {dadosAno && (
                          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Carga Total</p>
                              <p className="text-sm font-semibold">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(dadosAno.totalTributos)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Alíquota Efetiva</p>
                              <p className="text-sm font-semibold">
                                {dadosAno.aliquotaEfetiva.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
