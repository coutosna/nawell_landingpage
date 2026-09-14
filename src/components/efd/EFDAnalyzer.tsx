import React, { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileUpload } from './FileUpload';
import { FileEvidenceBar } from './FileEvidenceBar';
import { parseEFD, analisarAlertas, detectarLeiaute, EFDData, AlertaFiscal } from '@/utils/efdParser';
import { mergeEFDData, mergeEFDContents } from '@/utils/efdMerge';
import { FiscalSummaryCards } from '@/components/dashboard/FiscalSummaryCards';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { useToast } from '@/hooks/use-toast';

// Lazy load dos componentes pesados
const ReceitaPorProduto = lazy(() => import('./ReceitaPorProduto').then(m => ({ default: m.ReceitaPorProduto })));
const CFOPAnalysis = lazy(() => import('./CFOPAnalysis').then(m => ({ default: m.CFOPAnalysis })));
const NCMReport = lazy(() => import('./NCMReport').then(m => ({ default: m.NCMReport })));
const SalesDestinationMap = lazy(() => import('./SalesDestinationMap'));
const AcquisicoesMap = lazy(() => import('./AcquisicoesMap'));
const TopSuppliers = lazy(() => import('./TopSuppliers').then(m => ({ default: m.TopSuppliers })));
const TopClientes = lazy(() => import('./TopClientes').then(m => ({ default: m.TopClientes })));
const OportunidadesTributarias = lazy(() => import('./OportunidadesTributarias').then(m => ({ default: m.OportunidadesTributarias })));
const Conclusoes = lazy(() => import('./Conclusoes').then(m => ({ default: m.Conclusoes })));
const RelatorioCompleto = lazy(() => import('./RelatorioCompleto').then(m => ({ default: m.RelatorioCompleto })));
const CreditosAnalyzer = lazy(() => import('../creditos/CreditosAnalyzer').then(m => ({ default: m.CreditosAnalyzer })));

// Loading component
const TabLoading = () => (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

interface EFDAnalyzerProps {
  initialTab?: string;
}

const LEIAUTE_LABEL: Record<string, string> = {
  'desconhecido': 'obrigação não identificada',
};

export const EFDAnalyzer = ({ initialTab = "upload" }: EFDAnalyzerProps) => {
  const [efdData, setEfdData] = useState<EFDData | null>(null);
  const [efdContent, setEfdContent] = useState<string>('');
  const [alertas, setAlertas] = useState<AlertaFiscal[]>([]);
  const [arquivosNomes, setArquivosNomes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const { toast } = useToast();

  // Update active tab when initialTab changes
  React.useEffect(() => {
    if (initialTab && initialTab !== 'upload') {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const readFileLatin1 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file, 'latin1');
    });
  };

  const handleFilesSelect = async (files: File[]) => {
    try {
      toast({
        title: `Processando ${files.length} arquivo${files.length > 1 ? 's' : ''}...`,
        description: "Analisando dados fiscais do EFD",
      });

      const contribList: EFDData[] = [];
      const icmsList: Array<{ nome: string; texto: string }> = [];
      const contents: string[] = [];
      const arquivosComErro: string[] = [];
      const arquivosRecusados: string[] = [];

      for (const file of files) {
        try {
          const text = await readFileLatin1(file);
          const leiaute = detectarLeiaute(text);
          if (leiaute === 'efd-contribuicoes') {
            contribList.push({
              ...parseEFD(text),
              fontes: { arquivos: [file.name], quantidade: 1 },
            });
            contents.push(text);
          } else if (leiaute === 'efd-icms-ipi') {
            icmsList.push({ nome: file.name, texto: text });
          } else {
            arquivosRecusados.push(`${file.name} (${LEIAUTE_LABEL[leiaute]})`);
          }
        } catch (error) {
          arquivosComErro.push(file.name);
          console.error(`Erro ao processar ${file.name}:`, error);
        }
      }

      if (arquivosRecusados.length > 0) {
        toast({
          title: "Arquivo não identificado",
          description: `${arquivosRecusados.join(', ')}. Envie uma EFD-Contribuições (PIS/COFINS) ou uma EFD ICMS/IPI (SPED Fiscal).`,
          variant: "destructive",
        });
      }

      // EFD ICMS/IPI: mesmo pipeline de telas; a leitura da apuração (bloco E)
      // é feita pelo parseEFD, que anexa os dados de ICMS/IPI.
      if (icmsList.length > 0) {
        if (contribList.length > 0) {
          toast({
            title: "Tipos de obrigação diferentes",
            description: "Selecione arquivos de uma só obrigação por vez (Contribuições ou ICMS/IPI).",
            variant: "destructive",
          });
          return;
        }

        const icmsParsed = icmsList.map(f => ({
          ...parseEFD(f.texto),
          fontes: { arquivos: [f.nome], quantidade: 1 },
        }));

        // Consolidar CNPJs distintos somaria empresas diferentes num mesmo laudo.
        const cnpjs = new Set(icmsParsed.map(d => d.cadastro.cnpj).filter(Boolean));
        if (cnpjs.size > 1) {
          toast({
            title: "Arquivos de empresas diferentes",
            description: `Foram identificados ${cnpjs.size} CNPJs distintos. Envie um cliente por vez.`,
            variant: "destructive",
          });
          return;
        }

        const periodos = icmsParsed.map(d => `${d.cadastro.periodoInicial}-${d.cadastro.periodoFinal}`);
        if (new Set(periodos).size !== periodos.length) {
          toast({
            title: "Períodos repetidos",
            description: "Há mais de um arquivo cobrindo o mesmo período — as apurações seriam somadas em duplicidade. Confira a seleção.",
            variant: "destructive",
          });
          return;
        }

        const parsedData = mergeEFDData(icmsParsed);
        const content = mergeEFDContents(icmsList.map(f => f.texto));
        const alertasIdentificados = analisarAlertas(parsedData);

        setEfdContent(content);
        setEfdData(parsedData);
        setAlertas(alertasIdentificados);
        setArquivosNomes(icmsList.map(f => f.nome));
        setActiveTab('results');

        const conferencias = parsedData.icmsIpi?.conferencias ?? [];
        const conferidas = conferencias.filter(c => c.fechou).length;
        const divergentes = conferencias.length - conferidas;
        toast({
          title: "Apuração ICMS/IPI lida",
          description: `${icmsParsed.length} arquivo${icmsParsed.length === 1 ? '' : 's'} · ${conferencias.length} conferência${conferencias.length === 1 ? '' : 's'} de fechamento, ${conferidas} confere${conferidas === 1 ? '' : 'm'} e ${divergentes} não · ${alertasIdentificados.length} alerta${alertasIdentificados.length === 1 ? '' : 's'}.`,
        });

        if (arquivosComErro.length > 0) {
          toast({
            title: "Alguns arquivos foram ignorados",
            description: `Falha ao processar: ${arquivosComErro.join(', ')}`,
            variant: "destructive",
          });
        }
        return;
      }

      if (contribList.length === 0) {
        throw new Error('Nenhum arquivo pôde ser processado');
      }

      // Consolidar CNPJs distintos somaria empresas diferentes num mesmo laudo.
      const cnpjs = new Set(contribList.map(d => d.cadastro.cnpj).filter(Boolean));
      if (cnpjs.size > 1) {
        toast({
          title: "Arquivos de empresas diferentes",
          description: `Foram identificados ${cnpjs.size} CNPJs distintos. Envie um cliente por vez.`,
          variant: "destructive",
        });
        return;
      }

      const periodos = contribList.map(d => `${d.cadastro.periodoInicial}-${d.cadastro.periodoFinal}`);
      if (new Set(periodos).size !== periodos.length) {
        toast({
          title: "Períodos repetidos",
          description: "Há mais de um arquivo cobrindo o mesmo período — os valores seriam somados em duplicidade. Confira a seleção.",
          variant: "destructive",
        });
        return;
      }

      // Consolida todos os arquivos em uma única análise
      const parsedData = mergeEFDData(contribList);
      const content = mergeEFDContents(contents);
      const alertasIdentificados = analisarAlertas(parsedData);

      setEfdContent(content);
      setEfdData(parsedData);
      setAlertas(alertasIdentificados);
      setArquivosNomes(files.map(f => f.name));
      setActiveTab('results');

      toast({
        title: "Análise concluída!",
        description: `${contribList.length} arquivo${contribList.length > 1 ? 's consolidados' : ''} · ${alertasIdentificados.length} alerta${alertasIdentificados.length === 1 ? '' : 's'} identificado${alertasIdentificados.length === 1 ? '' : 's'}`,
      });

      if (arquivosComErro.length > 0) {
        toast({
          title: "Alguns arquivos foram ignorados",
          description: `Falha ao processar: ${arquivosComErro.join(', ')}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao processar arquivos",
        description: "Verifique se os arquivos estão no formato correto",
        variant: "destructive",
      });
      console.error('Erro ao processar EFD:', error);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-display font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-2 animate-fade-in">
          Análise Fiscal Inteligente
        </h1>
        <p className="text-muted-foreground animate-fade-in">
          Análise completa de arquivos EFD com insights fiscais e tributários
        </p>
      </div>
      
      <div className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tabs melhoradas com design moderno - scroll horizontal em mobile */}
          <div className="bg-card/80 backdrop-blur-sm py-3 sm:py-4 mb-6 border rounded-2xl shadow-md animate-fade-in-down">
            <div className="overflow-x-auto px-4 pb-2 hide-scrollbar">
              <TabsList className="inline-flex lg:grid w-auto lg:w-full lg:grid-cols-12 gap-2 h-auto p-2 bg-muted/50 rounded-xl min-w-max lg:min-w-0">
              <TabsTrigger 
                value="upload" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-2.5 sm:py-3 px-4 sm:px-6 font-medium text-sm whitespace-nowrap min-h-[44px] flex items-center justify-center"
              >
                📁 Upload
              </TabsTrigger>
              
              <TabsTrigger 
                value="results" 
                disabled={!efdData}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-destructive data-[state=active]:to-destructive/90 data-[state=active]:text-destructive-foreground data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-2.5 sm:py-3 px-4 sm:px-6 font-medium text-sm whitespace-nowrap min-h-[44px] flex items-center justify-center"
              >
                ⚠️ Riscos
              </TabsTrigger>
              
              <TabsTrigger 
                value="oportunidades" 
                disabled={!efdData}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-efd-primary data-[state=active]:to-destructive data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-2.5 sm:py-3 px-4 sm:px-6 font-medium text-sm whitespace-nowrap min-h-[44px] flex items-center justify-center"
              >
                💡 Oportunidades
              </TabsTrigger>
              
              <TabsTrigger 
                value="conclusoes" 
                disabled={!efdData}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-efd-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-2.5 sm:py-3 px-4 sm:px-6 font-medium text-sm whitespace-nowrap min-h-[44px] flex items-center justify-center"
              >
                📋 Conclusões
              </TabsTrigger>
              
              <TabsTrigger 
                value="revenue"
                disabled={!efdData}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-success data-[state=active]:to-success/90 data-[state=active]:text-success-foreground data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-2.5 sm:py-3 px-4 sm:px-6 font-medium text-sm whitespace-nowrap min-h-[44px] flex items-center justify-center"
              >
                💰 Receita
              </TabsTrigger>
              
              <TabsTrigger 
                value="cfop" 
                disabled={!efdData}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-2.5 sm:py-3 px-4 sm:px-6 font-medium text-sm whitespace-nowrap min-h-[44px] flex items-center justify-center"
              >
                📋 CFOPs
              </TabsTrigger>
              
              <TabsTrigger 
                value="creditos" 
                disabled={!efdData}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-success data-[state=active]:to-success data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-2.5 sm:py-3 px-4 sm:px-6 font-medium text-sm whitespace-nowrap min-h-[44px] flex items-center justify-center"
              >
                💳 Créditos
              </TabsTrigger>
              
              <TabsTrigger 
                value="ncm" 
                disabled={!efdData}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-accent/90 data-[state=active]:text-accent-foreground data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-2.5 sm:py-3 px-4 sm:px-6 font-medium text-sm whitespace-nowrap min-h-[44px] flex items-center justify-center"
              >
                🏷️ NCM
              </TabsTrigger>
              
              <TabsTrigger 
                value="maps" 
                disabled={!efdData}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-2.5 sm:py-3 px-4 sm:px-6 font-medium text-sm whitespace-nowrap min-h-[44px] flex items-center justify-center"
              >
                🗺️ Mapas
              </TabsTrigger>
              
              <TabsTrigger 
                value="partners" 
                disabled={!efdData}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-2.5 sm:py-3 px-4 sm:px-6 font-medium text-sm whitespace-nowrap min-h-[44px] flex items-center justify-center"
              >
                🤝 Parceiros
              </TabsTrigger>
              
              <TabsTrigger 
                value="report" 
                disabled={!efdData}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200 rounded-lg py-2.5 sm:py-3 px-4 sm:px-6 font-medium text-sm whitespace-nowrap min-h-[44px] flex items-center justify-center"
              >
                📄 Relatório
              </TabsTrigger>
            </TabsList>
            </div>
          </div>

          {/* Evidência documental: arquivos que originam a análise */}
          {activeTab !== 'upload' && efdData && (
            <FileEvidenceBar efdData={efdData} className="mb-6 animate-fade-in" />
          )}

          <TabsContent value="upload" className="mt-6">
            <FileUpload onFilesSelect={handleFilesSelect} />
          </TabsContent>

          <TabsContent value="results" className="mt-6">
          {efdData ? (
            <div className="space-y-6 animate-fade-in">
              <FiscalSummaryCards efdData={efdData} />

              <AlertsPanel alertas={alertas} efdData={efdData} />
              </div>
            ) : (
              <Card className="shadow-lg hover:shadow-xl transition-all">
                <CardContent className="text-center py-16">
                  <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center">
                    <div className="text-5xl">📊</div>
                  </div>
                  <h3 className="text-xl font-display font-bold mb-2">Nenhum Dado Disponível</h3>
                  <p className="text-muted-foreground mb-6">Faça o upload de um arquivo EFD para ver o dashboard de riscos</p>
                  <Button onClick={() => setActiveTab("upload")} variant="gradient">
                    📁 Fazer Upload
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="revenue" className="mt-6">
            <Suspense fallback={<TabLoading />}>
              {efdData && efdContent ? (
                <ReceitaPorProduto efdTxt={efdContent} />
              ) : (
              <Card className="shadow-lg hover:shadow-xl transition-all">
                <CardContent className="text-center py-16">
                  <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center">
                    <div className="text-5xl">💰</div>
                  </div>
                  <h3 className="text-xl font-display font-bold mb-2">Análise de Receita</h3>
                  <p className="text-muted-foreground mb-6">Faça o upload de um arquivo EFD para ver a análise detalhada de receita</p>
                  <Button onClick={() => setActiveTab("upload")} variant="gradient">
                    📁 Fazer Upload
                  </Button>
                </CardContent>
              </Card>
              )}
            </Suspense>
          </TabsContent>

          <TabsContent value="cfop" className="mt-6">
            <Suspense fallback={<TabLoading />}>
              {efdData && efdContent ? (
                <CFOPAnalysis efdTxt={efdContent} efdData={efdData} />
            ) : (
              <Card className="shadow-lg hover:shadow-xl transition-all">
                <CardContent className="text-center py-16">
                  <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                    <div className="text-5xl">📋</div>
                  </div>
                  <h3 className="text-xl font-display font-bold mb-2">Análise de CFOPs</h3>
                  <p className="text-muted-foreground mb-6">Faça o upload de um arquivo EFD para ver a análise de CFOPs</p>
                  <Button onClick={() => setActiveTab("upload")} variant="gradient">
                    📁 Fazer Upload
                  </Button>
                </CardContent>
              </Card>
              )}
            </Suspense>
          </TabsContent>

          <TabsContent value="creditos" className="mt-6">
            <Suspense fallback={<TabLoading />}>
              {efdData && efdContent ? (
                <CreditosAnalyzer efdData={efdData} efdContent={efdContent} />
            ) : (
              <Card className="shadow-lg hover:shadow-xl transition-all">
                <CardContent className="text-center py-16">
                  <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center">
                    <div className="text-5xl">💳</div>
                  </div>
                  <h3 className="text-xl font-display font-bold mb-2">Análise de Créditos PIS/COFINS</h3>
                  <p className="text-muted-foreground mb-6">Faça o upload de um arquivo EFD para ver a análise de créditos</p>
                  <Button onClick={() => setActiveTab("upload")} variant="gradient">
                    📁 Fazer Upload
                  </Button>
                </CardContent>
              </Card>
              )}
            </Suspense>
          </TabsContent>

          <TabsContent value="ncm" className="mt-6">
            <Suspense fallback={<TabLoading />}>
              {efdData && efdContent ? (
                <NCMReport efdTxt={efdContent} />
            ) : (
              <Card className="shadow-lg hover:shadow-xl transition-all">
                <CardContent className="text-center py-16">
                  <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                    <div className="text-5xl">🏷️</div>
                  </div>
                  <h3 className="text-xl font-display font-bold mb-2">Relatório NCM</h3>
                  <p className="text-muted-foreground mb-6">Faça o upload de um arquivo EFD para ver o relatório de NCM</p>
                  <Button onClick={() => setActiveTab("upload")} variant="gradient">
                    📁 Fazer Upload
                  </Button>
                </CardContent>
              </Card>
              )}
            </Suspense>
          </TabsContent>

          <TabsContent value="maps" className="mt-6">
            <Suspense fallback={<TabLoading />}>
              {efdData && efdContent ? (
                <Tabs defaultValue="destinos" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="destinos">Destinos</TabsTrigger>
                    <TabsTrigger value="aquisicoes">Aquisições</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="destinos" className="mt-6">
                    <SalesDestinationMap
                    efdTxt={efdContent}
                    origin={{
                      codMun: efdData.cadastro.municipio || "3550308",
                      name: efdData.cadastro.razaoSocial,
                      uf: efdData.cadastro.uf
                    }}
                    height={600}
                  />
                </TabsContent>
                
                <TabsContent value="aquisicoes" className="mt-6">
                  <AcquisicoesMap
                    efdTxt={efdContent}
                    origin={{
                      codMun: efdData.cadastro.municipio || "3550308",
                      name: efdData.cadastro.razaoSocial,
                      uf: efdData.cadastro.uf
                    }}
                    height={600}
                  />
                </TabsContent>
              </Tabs>
              ) : (
              <Card className="shadow-lg hover:shadow-xl transition-all">
                <CardContent className="text-center py-16">
                  <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-success/10 flex items-center justify-center">
                    <div className="text-5xl">🗺️</div>
                  </div>
                  <h3 className="text-xl font-display font-bold mb-2">Mapas Geográficos</h3>
                  <p className="text-muted-foreground mb-6">Faça o upload de um arquivo EFD para visualizar mapas</p>
                  <Button onClick={() => setActiveTab("upload")} variant="gradient">
                    📁 Fazer Upload
                  </Button>
                </CardContent>
               </Card>
             )}
            </Suspense>
          </TabsContent>

          <TabsContent value="partners" className="mt-6">
            <Suspense fallback={<TabLoading />}>
              {efdData && efdContent ? (
              <Tabs defaultValue="suppliers" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
                  <TabsTrigger value="customers">Clientes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="suppliers" className="mt-6">
                  <TopSuppliers efdTxt={efdContent} />
                </TabsContent>
                
                <TabsContent value="customers" className="mt-6">
                  <TopClientes efdTxt={efdContent} />
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="shadow-lg hover:shadow-xl transition-all">
                <CardContent className="text-center py-16">
                  <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                    <div className="text-5xl">🤝</div>
                  </div>
                  <h3 className="text-xl font-display font-bold mb-2">Fornecedores e Clientes</h3>
                  <p className="text-muted-foreground mb-6">Faça o upload de um arquivo EFD para ver parceiros</p>
                  <Button onClick={() => setActiveTab("upload")} variant="gradient">
                    📁 Fazer Upload
                  </Button>
                </CardContent>
              </Card>
              )}
            </Suspense>
          </TabsContent>

          <TabsContent value="oportunidades" className="mt-6">
            <Suspense fallback={<TabLoading />}>
              {efdData ? (
                <OportunidadesTributarias efdData={efdData} />
            ) : (
              <Card className="shadow-lg hover:shadow-xl transition-all">
                <CardContent className="text-center py-16">
                  <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-efd-primary/20 to-destructive/10 flex items-center justify-center">
                    <div className="text-5xl">💡</div>
                  </div>
                  <h3 className="text-xl font-display font-bold mb-2">Oportunidades Tributárias</h3>
                  <p className="text-muted-foreground mb-6">Faça o upload de um arquivo EFD para detectar oportunidades fiscais</p>
                  <Button onClick={() => setActiveTab("upload")} variant="gradient">
                    📁 Fazer Upload
                  </Button>
                </CardContent>
              </Card>
              )}
            </Suspense>
          </TabsContent>

          <TabsContent value="conclusoes" className="mt-6">
            <Suspense fallback={<TabLoading />}>
              {efdData ? (
                <Conclusoes efdData={efdData} />
            ) : (
              <Card className="shadow-lg hover:shadow-xl transition-all">
                <CardContent className="text-center py-16">
                  <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-efd-primary/10 flex items-center justify-center">
                    <div className="text-5xl">📋</div>
                  </div>
                  <h3 className="text-xl font-display font-bold mb-2">Conclusões Técnico-Jurídicas</h3>
                  <p className="text-muted-foreground mb-6">Faça o upload de um arquivo EFD para ver as conclusões técnicas</p>
                  <Button onClick={() => setActiveTab("upload")} variant="gradient">
                    📁 Fazer Upload
                  </Button>
                </CardContent>
              </Card>
              )}
            </Suspense>
          </TabsContent>

<TabsContent value="report" className="mt-6">
            <Suspense fallback={<TabLoading />}>
              {efdData ? (
                <RelatorioCompleto efdData={efdData} alertas={alertas} />
              ) : (
              <Card className="shadow-lg hover:shadow-xl transition-all">
                <CardContent className="text-center py-16">
                  <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-destructive/20 to-warning/10 flex items-center justify-center">
                    <div className="text-5xl">📄</div>
                  </div>
                  <h3 className="text-xl font-display font-bold mb-2">Relatório Completo de Análise Fiscal</h3>
                  <p className="text-muted-foreground mb-6">Faça o upload dos arquivos EFD para gerar o relatório consolidado</p>
                  <Button onClick={() => setActiveTab("upload")} variant="gradient">
                    📁 Fazer Upload
                  </Button>
                </CardContent>
              </Card>
              )}
            </Suspense>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};
