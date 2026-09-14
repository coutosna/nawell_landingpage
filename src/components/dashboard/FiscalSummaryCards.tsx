import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, AlertCircle, Calculator } from 'lucide-react';
import { EFDData, montarResumoRiscos, GrupoResumo, ColunaResumo } from '@/utils/efdParser';

interface FiscalSummaryCardsProps {
  efdData: EFDData;
}

const ColunaCard = ({ col, destaque, destaqueCls }: { col: ColunaResumo; destaque: boolean; destaqueCls: string }) => (
  <div className={destaque
    ? `space-y-2 p-4 rounded-xl ${destaqueCls} shadow-lg hover:shadow-xl transition-all overflow-hidden`
    : 'space-y-2 p-4 rounded-xl bg-gradient-to-br from-muted/30 to-transparent hover:from-muted/50 transition-colors overflow-hidden'}
  >
    <p className={`text-sm font-${destaque ? 'bold' : 'semibold'} text-muted-foreground uppercase tracking-wider`}>
      {destaque ? `⚠️ ${col.titulo}` : col.titulo}
    </p>
    <p className="font-display text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground break-words">
      {formatCurrency(col.valor)}
    </p>
    <p className="text-xs text-muted-foreground font-medium">{col.sub}</p>
  </div>
);

const GrupoCard = ({
  grupo,
  cor,
  corClsHeader,
  colDestaqueCls,
}: {
  grupo: GrupoResumo;
  cor: string;
  corClsHeader: string;
  colDestaqueCls: string;
}) => (
  <Card className={`border-2 ${cor} hover:shadow-2xl transition-all duration-300 hover-lift`}>
    <CardHeader className="pb-3 border-b border-primary/10">
      <CardTitle className="text-xl font-bold flex items-center gap-2">
        <span className="text-3xl">{grupo.emoji}</span>
        <span className={`bg-gradient-to-r ${corClsHeader} bg-clip-text text-transparent`}>
          {grupo.subtitulo}
        </span>
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent hover:from-primary/10 transition-colors overflow-hidden">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{grupo.col1.titulo}</p>
          <p className="font-display text-2xl lg:text-3xl font-bold text-primary dark:text-primary break-words">
            {formatCurrency(grupo.col1.valor)}
          </p>
          <p className="text-xs text-muted-foreground font-medium">{grupo.col1.sub}</p>
        </div>
        <ColunaCard col={grupo.col2} destaque={false} destaqueCls="" />
        <ColunaCard col={grupo.col3} destaque={true} destaqueCls={colDestaqueCls} />
      </div>
    </CardContent>
  </Card>
);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);

export const FiscalSummaryCards: React.FC<FiscalSummaryCardsProps> = ({ efdData }) => {
  const resumo = montarResumoRiscos(efdData);

  return (
    <div className="space-y-6 mb-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-gradient-to-br from-destructive/10 to-warning/10">
          <Calculator className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="font-display text-3xl font-bold bg-gradient-to-r from-destructive to-warning bg-clip-text text-transparent">
          Resumo dos riscos identificados
        </h2>
      </div>

      {/* Receita */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent hover:shadow-xl hover:shadow-primary/20 hover:border-primary/50 transition-all duration-300 hover-lift">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-md">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            {resumo.receitaTitulo}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <p className="font-display text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent break-words">
            {formatCurrency(resumo.receita)}
          </p>
          <p className="text-sm text-muted-foreground mt-2 font-medium">{resumo.receitaSub}</p>
        </CardContent>
      </Card>

      {/* Grupo A */}
      <GrupoCard
        grupo={resumo.grupoA}
        cor="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent hover:shadow-primary/20 hover:border-primary/50"
        corClsHeader="from-primary to-primary"
        colDestaqueCls="bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30"
      />

      {/* Grupo B */}
      <GrupoCard
        grupo={resumo.grupoB}
        cor="border-success/30 bg-gradient-to-br from-success/10 via-success/5 to-transparent hover:shadow-success/20 hover:border-success/50"
        corClsHeader="from-success to-success"
        colDestaqueCls="bg-gradient-to-br from-success/20 to-success/10 border-2 border-success/30"
      />

      {/* Totais e Multa */}
      <Card className="border-2 border-warning/40 bg-gradient-to-br from-warning/15 via-warning/10 to-destructive/5 hover:shadow-2xl hover:shadow-warning/30 hover:border-warning/60 transition-all duration-300 hover-lift">
        <CardHeader className="pb-3 border-b border-warning/20">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-warning to-destructive shadow-lg">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-warning to-destructive bg-clip-text text-transparent">
              {resumo.totaisTitulo}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-warning/10 to-transparent hover:from-warning/15 transition-colors overflow-hidden">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Principal</p>
              <p className="font-display text-2xl lg:text-3xl font-bold text-warning dark:text-warning break-words">
                {formatCurrency(resumo.principal.valor)}
              </p>
              <p className="text-xs text-muted-foreground font-medium">{resumo.principal.sub}</p>
            </div>
            <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-warning/10 to-destructive/5 hover:from-warning/15 transition-colors overflow-hidden">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Multa 20%</p>
              <p className="font-display text-2xl lg:text-3xl font-bold text-warning dark:text-warning break-words">
                {formatCurrency(resumo.multa.valor)}
              </p>
              <p className="text-xs text-muted-foreground font-medium">{resumo.multa.sub}</p>
            </div>
            <div className="space-y-2 p-4 lg:p-5 rounded-xl bg-gradient-to-br from-warning/25 to-destructive/20 border-2 border-warning/50 shadow-xl hover:shadow-2xl hover:shadow-warning/30 transition-all overflow-hidden">
              <p className="text-sm font-bold text-warning dark:text-warning uppercase tracking-wider flex items-center gap-2">
                🔥 Total Geral
              </p>
              <p className="font-display text-2xl lg:text-3xl font-bold text-warning dark:text-warning break-words">
                {formatCurrency(resumo.total.valor)}
              </p>
              <p className="text-xs text-warning dark:text-warning font-semibold">{resumo.total.sub}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nota informativa */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 hover:shadow-lg transition-all">
        <CardContent className="pt-5 pb-5">
          <div className="flex gap-3 items-start">
            <div className="p-2 rounded-lg bg-primary/10">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
            </div>
            <div className="text-sm space-y-2">
              <p className="font-bold text-foreground text-base">💡 Informações sobre o cálculo</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                {resumo.notas.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};