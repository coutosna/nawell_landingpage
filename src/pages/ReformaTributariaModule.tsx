import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Scale } from 'lucide-react';
import { NaWellLogo } from '@/components/ecf/NaWellBrand';
import { usePageSummary } from '@/contexts/AccessibilityContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, ShieldCheck } from 'lucide-react';
import { ReformaTributariaUpload } from '@/components/reforma/ReformaTributariaUpload';
import { ValidacaoNotasFiscais } from '@/components/reforma/ValidacaoNotasFiscais';
import { ReformaTributariaSummary } from '@/components/reforma/ReformaTributariaSummary';
import { ReformaTributariaCharts } from '@/components/reforma/ReformaTributariaCharts';
import { ReformaTributariaTable } from '@/components/reforma/ReformaTributariaTable';
import { ReformaTributariaComparativo } from '@/components/reforma/ReformaTributariaComparativo';
import { ReformaTributariaTimeline } from '@/components/reforma/ReformaTributariaTimeline';
import { ReformaTributariaRecomendacoes } from '@/components/reforma/ReformaTributariaRecomendacoes';
import { ReformaTributariaCashflow } from '@/components/reforma/ReformaTributariaCashflow';
import { parsearEfdParaReformaConsumo } from '@/utils/reformaTributariaParser';
import { simularTransicaoReformaConsumo, ResumoAno } from '@/utils/reformaTributariaCalculations';
import { toast } from 'sonner';

export default function ReformaTributariaModule() {
  const [activeTab, setActiveTab] = useState("upload");
  const [resultados, setResultados] = useState<ResumoAno[] | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState<string>("");
  const [processando, setProcessando] = useState(false);

  const inicio = resultados?.[0];
  const atual = resultados?.[resultados.length - 1];
  usePageSummary(
    inicio && atual
      ? `Simulação da Reforma Tributária. Carga tributária em ${atual.ano}: ${atual.aliquotaEfetiva.toFixed(1)} por cento sobre base de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(atual.baseTotal)}. Transição de ${inicio.ano} a ${atual.ano}. Navegue pelas abas para comparativos, tabelas e recomendações.`
      : 'Módulo Reforma Tributária. Envie uma EFD de consumo na aba Upload para simular a transição para IBS e CBS.',
  );

  const handleFileUpload = async (conteudo: string, nome: string) => {
    setProcessando(true);
    setNomeArquivo(nome);
    
    try {
      toast.info('Processando EFD...', { description: 'Aguarde enquanto analisamos o arquivo' });

      await new Promise(resolve => setTimeout(resolve, 500));

      const { itens } = parsearEfdParaReformaConsumo(conteudo);
      
      if (itens.length === 0) {
        toast.error('Nenhum item encontrado', { 
          description: 'Não foram encontrados itens de saída válidos na EFD' 
        });
        setProcessando(false);
        return;
      }

      const resumo = simularTransicaoReformaConsumo(itens);
      
      setResultados(resumo);
      
      toast.success('Análise concluída!', { 
        description: `${itens.length} itens processados com sucesso` 
      });

      // Muda para a aba de detalhamento após processar
      setTimeout(() => {
        setActiveTab("detalhamento");
      }, 800);
    } catch (error) {
      console.error('Erro ao processar EFD:', error);
      toast.error('Erro ao processar arquivo', { 
        description: 'Verifique se o arquivo está no formato correto' 
      });
    } finally {
      setProcessando(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in font-manrope">
        <div className="space-y-6">
          <NaWellLogo />
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-sidebar shadow-sm flex items-center justify-center ring-1 ring-border">
              <Scale className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl sm:text-5xl font-manrope font-extrabold text-foreground tracking-tight">
                Reforma Tributária
              </h1>
              <p className="text-base text-muted-foreground font-medium mt-1.5">
                Simulação e análise de impacto CBS/IBS
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto p-1 gap-1 bg-muted/40 border border-border/60">
            <TabsTrigger value="upload" className="gap-2 transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="detalhamento" className="gap-2 transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm" disabled={!resultados}>
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Detalhamento</span>
            </TabsTrigger>
            <TabsTrigger value="validacao-nfe" className="gap-2 transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Validação NF-e</span>
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="animate-fade-in">
            <ReformaTributariaUpload onFileUpload={handleFileUpload} />
          </TabsContent>

          {/* Detalhamento Tab - Com sub-tabs organizadas */}
          <TabsContent value="detalhamento" className="animate-fade-in">
            {resultados && resultados.length > 0 ? (
              <div className="space-y-6 animate-scale-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      Análise Completa da Reforma Tributária
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Arquivo: {nomeArquivo} | Transição 2026-2033
                    </p>
                  </div>
                </div>

                {/* Sub-tabs para organizar o conteúdo */}
                <Tabs defaultValue="resumo" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-muted/30">
                    <TabsTrigger value="resumo">Visão Geral</TabsTrigger>
                    <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
                    <TabsTrigger value="evolucao">Evolução</TabsTrigger>
                    <TabsTrigger value="detalhes">Dados Detalhados</TabsTrigger>
                  </TabsList>

                  {/* Visão Geral */}
                  <TabsContent value="resumo" className="space-y-6 mt-6">
                    <ReformaTributariaSummary dados={resultados} />
                    <ReformaTributariaRecomendacoes dados={resultados} />
                  </TabsContent>

                  {/* Comparativo */}
                  <TabsContent value="comparativo" className="space-y-6 mt-6">
                    <ReformaTributariaComparativo dados={resultados} />
                    <ReformaTributariaCharts dados={resultados} />
                  </TabsContent>

                  {/* Evolução */}
                  <TabsContent value="evolucao" className="space-y-6 mt-6">
                    <ReformaTributariaTimeline dados={resultados} />
                    <ReformaTributariaCashflow dados={resultados} />
                  </TabsContent>

                  {/* Dados Detalhados */}
                  <TabsContent value="detalhes" className="space-y-6 mt-6">
                    <ReformaTributariaTable dados={resultados} />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Faça o upload de uma EFD para visualizar o detalhamento completo
              </div>
            )}
          </TabsContent>

          {/* Validação NF-e (IBS/CBS) - motor de qualidade item a item contra tabelas oficiais */}
          <TabsContent value="validacao-nfe" className="animate-fade-in">
            <ValidacaoNotasFiscais />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
