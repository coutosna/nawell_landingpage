import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, PiggyBank, Search, Landmark } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, trend, trendValue, variant = 'default' }) => {
  const variantStyles = {
    default: 'bg-card hover:shadow-md',
    success: 'bg-gradient-to-br from-success/5 to-success/10 border-success/20 hover:shadow-success/20',
    warning: 'bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20 hover:shadow-warning/20',
    danger: 'bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20 hover:shadow-destructive/20',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    danger: 'bg-destructive/15 text-destructive',
  };

  return (
    <Card className={`${variantStyles[variant]} border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-scale-in`}>
      <CardContent className="p-6 overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <h3 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-1 tracking-tight break-words">{value}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{subtitle}</p>}
            {trend && trendValue && (
              <div className={`flex items-center gap-1.5 mt-3 text-sm font-medium ${trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`p-3.5 rounded-xl ${iconStyles[variant]} flex-shrink-0`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface KPICardsProps {
  totalReceitas: number;
  totalCompras: number;
  pisDevido: number;
  pisInformado: number;
  pisDiferenca: number;
  cofinsDevido: number;
  cofinsInformado: number;
  cofinsDiferenca: number;
  totalAlertas: number;
  oportunidades: number;
  riscoFiscalPrincipal: number;
}

export const KPICards: React.FC<KPICardsProps> = ({
  totalReceitas,
  totalCompras,
  pisDevido,
  pisInformado,
  pisDiferenca,
  cofinsDevido,
  cofinsInformado,
  cofinsDiferenca,
  totalAlertas,
  oportunidades,
  riscoFiscalPrincipal,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatMillions = (value: number) => {
    const millions = value / 1000000;
    return `${millions.toFixed(2)} Mi`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
      <KPICard
        title="Receitas"
        value={formatCurrency(totalReceitas)}
        subtitle="Total de vendas no período"
        icon={<TrendingUp className="h-6 w-6" />}
        variant="default"
      />
      
      <KPICard
        title="Compras"
        value={formatCurrency(totalCompras)}
        subtitle="Total de aquisições"
        icon={<TrendingDown className="h-6 w-6" />}
        variant="default"
      />

      <KPICard
        title="PIS Devido"
        value={formatCurrency(pisDevido)}
        subtitle="Calculado com alíquota NCM (2,1%)"
        icon={<Landmark className="h-6 w-6" />}
        variant="default"
      />

      <KPICard
        title="PIS Informado"
        value={formatCurrency(pisInformado)}
        subtitle="Valor declarado no arquivo EFD"
        icon={<Landmark className="h-6 w-6" />}
        variant="default"
      />

      <KPICard
        title="PIS Diferença"
        value={formatCurrency(pisDiferenca)}
        subtitle="PIS Devido - PIS Informado"
        icon={<Search className="h-6 w-6" />}
        variant="warning"
      />

      <KPICard
        title="COFINS Devido"
        value={formatCurrency(cofinsDevido)}
        subtitle="Calculado com alíquota NCM (9,9%)"
        icon={<Landmark className="h-6 w-6" />}
        variant="default"
      />

      <KPICard
        title="COFINS Informado"
        value={formatCurrency(cofinsInformado)}
        subtitle="Valor declarado no arquivo EFD"
        icon={<Landmark className="h-6 w-6" />}
        variant="default"
      />

      <KPICard
        title="COFINS Diferença"
        value={formatCurrency(cofinsDiferenca)}
        subtitle="COFINS Devido - COFINS Informado"
        icon={<Search className="h-6 w-6" />}
        variant="warning"
      />

      <KPICard
        title="Risco Fiscal (Principal)"
        value={formatCurrency(riscoFiscalPrincipal)}
        subtitle="Total a complementar (sem multa e juros)"
        icon={<Search className="h-6 w-6" />}
        variant="danger"
      />

      <KPICard
        title="Itens para Revisão"
        value={totalAlertas.toString()}
        subtitle="Operações que requerem análise detalhada"
        icon={<Search className="h-6 w-6" />}
        variant="warning"
      />

      <KPICard
        title="Oportunidades de Crédito"
        value={formatCurrency(oportunidades * 0.15)}
        subtitle="Potencial de recuperação tributária estimado"
        icon={<PiggyBank className="h-6 w-6" />}
        variant="success"
      />
    </div>
  );
};
