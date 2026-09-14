import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { ECFAnaliseCompleta, validarECF, Alerta } from "@/utils/ecfCalculations";

interface ECFAlertsProps {
  analise: ECFAnaliseCompleta;
}

export function ECFAlerts({ analise }: ECFAlertsProps) {
  const alertas = validarECF(analise);

  const alertasPorSeveridade = {
    alta: alertas.filter((a) => a.severidade === "alta"),
    media: alertas.filter((a) => a.severidade === "media"),
    baixa: alertas.filter((a) => a.severidade === "baixa"),
  };

  const getIcon = (severidade: string) => {
    switch (severidade) {
      case "alta":
        return AlertTriangle;
      case "media":
        return AlertCircle;
      default:
        return Info;
    }
  };

  const getSeverityColor = (severidade: string) => {
    switch (severidade) {
      case "alta":
        return "border-destructive/30 bg-destructive/5";
      case "media":
        return "border-warning/30 bg-warning/5";
      default:
        return "border-ecf-primary/30 bg-ecf-primary/5";
    }
  };

  const getSeverityLabel = (severidade: string) => {
    switch (severidade) {
      case "alta":
        return { text: "Alta", color: "bg-destructive/10 text-destructive border-destructive/30" };
      case "media":
        return { text: "Média", color: "bg-warning/10 text-warning border-warning/30" };
      default:
        return { text: "Baixa", color: "bg-ecf-primary/10 text-ecf-primary border-ecf-primary/30" };
    }
  };

  const renderAlertCard = (alerta: Alerta, index: number) => {
    const Icon = getIcon(alerta.severidade);
    const label = getSeverityLabel(alerta.severidade);
    const colorClass = getSeverityColor(alerta.severidade);

    return (
      <Card
        key={index}
        className={`p-6 transition-all duration-300 border ${colorClass}`}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl border ${label.color}`}>
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={`${label.color} border`}>
                    {label.text}
                  </Badge>
                  <code className="text-xs px-2 py-1 rounded bg-muted/50 text-muted-foreground">
                    {alerta.codigo}
                  </code>
                </div>
                <p className="text-base font-semibold text-foreground">{alerta.mensagem}</p>
              </div>
            </div>

            {alerta.impacto && (
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Impacto:</span> {alerta.impacto}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 border border-border/70 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-ecf-primary/10 border border-ecf-primary/20">
              <AlertTriangle className="w-6 h-6 text-ecf-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-ecf-secondary">Alertas e Riscos Fiscais</h3>
              <p className="text-sm text-muted-foreground">
                {alertas.length} {alertas.length === 1 ? "alerta identificado" : "alertas identificados"}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {alertasPorSeveridade.alta.length > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                {alertasPorSeveridade.alta.length} Alta
              </Badge>
            )}
            {alertasPorSeveridade.media.length > 0 && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                {alertasPorSeveridade.media.length} Média
              </Badge>
            )}
            {alertasPorSeveridade.baixa.length > 0 && (
              <Badge variant="outline" className="bg-ecf-primary/10 text-ecf-primary border-ecf-primary/30">
                {alertasPorSeveridade.baixa.length} Baixa
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Success State */}
      {alertas.length === 0 && (
        <Card className="p-12 text-center border border-success/30 bg-success/5">
          <div className="inline-flex p-4 rounded-2xl bg-success/10 border border-success/20 mb-4">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
          <h3 className="text-xl font-bold text-ecf-secondary mb-2">Nenhum Alerta Identificado</h3>
          <p className="text-muted-foreground">
            A análise não identificou problemas significativos na escrituração contábil fiscal.
          </p>
        </Card>
      )}

      {/* Alertas de Alta Severidade */}
      {alertasPorSeveridade.alta.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h4 className="text-lg font-semibold text-ecf-secondary">
              Alertas de Alta Prioridade ({alertasPorSeveridade.alta.length})
            </h4>
          </div>
          {alertasPorSeveridade.alta.map((alerta, idx) => renderAlertCard(alerta, idx))}
        </div>
      )}

      {/* Alertas de Média Severidade */}
      {alertasPorSeveridade.media.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            <h4 className="text-lg font-semibold text-ecf-secondary">
              Alertas de Média Prioridade ({alertasPorSeveridade.media.length})
            </h4>
          </div>
          {alertasPorSeveridade.media.map((alerta, idx) => renderAlertCard(alerta, idx))}
        </div>
      )}

      {/* Alertas de Baixa Severidade */}
      {alertasPorSeveridade.baixa.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-ecf-primary" />
            <h4 className="text-lg font-semibold text-ecf-secondary">
              Alertas Informativos ({alertasPorSeveridade.baixa.length})
            </h4>
          </div>
          {alertasPorSeveridade.baixa.map((alerta, idx) => renderAlertCard(alerta, idx))}
        </div>
      )}
    </div>
  );
}
