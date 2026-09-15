import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, FileText, Upload, AlertTriangle, Lightbulb, PieChart, List } from 'lucide-react';
import { NaWellLogo } from '@/components/ecf/NaWellBrand';
import { usePageSummary } from '@/contexts/AccessibilityContext';
import { ECFUpload } from '@/components/ecf/ECFUpload';
import { ECFDashboard } from '@/components/ecf/ECFDashboard';
import { ECFAlerts } from '@/components/ecf/ECFAlerts';
import { ECFOpportunities } from '@/components/ecf/ECFOpportunities';
import { ECFGraficos } from '@/components/ecf/ECFGraficos';
import { ECFPresumido } from '@/components/ecf/ECFPresumido';
import { ECFTopAdicoes } from '@/components/ecf/ECFTopAdicoes';
import { ECFAnaliseCompleta } from '@/utils/ecfCalculations';

export default function ECFModule() {
  const [analise, setAnalise] = useState<ECFAnaliseCompleta | null>(null);
  const [activeTab, setActiveTab] = useState("upload");

  const handleAnaliseCompleta = (novaAnalise: ECFAnaliseCompleta) => {
    setAnalise(novaAnalise);
    // Redireciona automaticamente para o resumo com animação suave
    setTimeout(() => {
      setActiveTab("overview");
    }, 800);
  };

  usePageSummary(
    activeTab !== 'upload' && activeTab !== 'overview'
      ? ''
      : analise
      ? `Análise Contábil Fiscal ECF x ECD. Regime tributário: ${analise.regimeTributario}. Navegue pelas abas Resumo, Gráficos, Análise Detalhada, Alertas e Oportunidades para os detalhes.`
      : 'Módulo ECF x ECD. Envie a Escrituração Contábil Fiscal da empresa na aba Upload para começar a análise.',
  );

  const tabs = [
    { value: "upload", label: "Upload", icon: Upload, disabled: false },
    { value: "overview", label: "Resumo", icon: BarChart, disabled: !analise },
    { value: "graficos", label: "Gráficos", icon: PieChart, disabled: !analise },
    { value: "detalhada", label: "Análise Detalhada", icon: List, disabled: !analise || analise.regimeTributario === "Lucro Presumido" },
    { value: "risks", label: "Alertas", icon: AlertTriangle, disabled: !analise },
    { value: "opportunities", label: "Oportunidades", icon: Lightbulb, disabled: !analise },
  ];

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in font-manrope">
        {/* Header */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <NaWellLogo />
            {analise && (
              <Badge
                variant="outline"
                className={`px-3 py-1 text-sm font-semibold self-start sm:self-auto transition-all duration-300 animate-scale-in ${
                  analise.regimeTributario === "Lucro Presumido"
                    ? "bg-ecf-primary/10 text-ecf-primary border-ecf-primary/30"
                    : "bg-ecf-secondary/10 text-ecf-secondary border-ecf-secondary/20"
                }`}
              >
                {analise.regimeTributario}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-sidebar shadow-sm flex items-center justify-center ring-1 ring-border">
                <FileText className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-4xl sm:text-5xl font-manrope font-extrabold text-foreground tracking-tight">
                  ECF x ECD
                </h1>
              </div>
              <p className="text-base text-muted-foreground font-medium mt-1.5">
                Análise Contábil Fiscal — da complexidade dos dados à clareza da decisão
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto p-1 gap-1 bg-muted/40 border border-border/60">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  disabled={tab.disabled}
                  className="gap-2 transition-all duration-200 data-[state=active]:bg-ecf-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="animate-fade-in">
            <ECFUpload onAnaliseCompleta={handleAnaliseCompleta} />
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="animate-fade-in">
            {analise ? (
              <div className="animate-scale-in">
                {analise.regimeTributario === "Lucro Presumido" && analise.presumido ? (
                  <ECFPresumido dados={analise.presumido} />
                ) : (
                  <ECFDashboard analise={analise} />
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Faça o upload de um arquivo ECF para visualizar o resumo
              </div>
            )}
          </TabsContent>

          {/* Gráficos Tab */}
          <TabsContent value="graficos" className="animate-fade-in">
            {analise ? (
              <div className="animate-scale-in">
                <ECFGraficos analise={analise} />
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Faça o upload de um arquivo ECF para visualizar os gráficos
              </div>
            )}
          </TabsContent>

          {/* Análise Detalhada Tab */}
          <TabsContent value="detalhada" className="animate-fade-in">
            {analise && analise.regimeTributario !== "Lucro Presumido" ? (
              <div className="animate-scale-in">
                <ECFTopAdicoes documento={analise.documento} />
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Análise detalhada disponível apenas para Lucro Real
              </div>
            )}
          </TabsContent>

          {/* Risks Tab */}
          <TabsContent value="risks" className="animate-fade-in">
            {analise ? (
              <div className="animate-scale-in">
                <ECFAlerts analise={analise} />
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Faça o upload de um arquivo ECF para visualizar os alertas
              </div>
            )}
          </TabsContent>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities" className="animate-fade-in">
            {analise ? (
              <div className="animate-scale-in">
                <ECFOpportunities analise={analise} />
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Faça o upload de um arquivo ECF para visualizar as oportunidades
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
