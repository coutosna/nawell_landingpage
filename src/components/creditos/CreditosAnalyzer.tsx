import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, BarChart3, ListTree, AlertTriangle, GitCompare, FileText } from 'lucide-react';
import { EFDData } from '@/utils/efdParser';

interface CreditosAnalyzerProps {
  efdData: EFDData;
  efdContent: string;
}

export function CreditosAnalyzer({ efdData, efdContent }: CreditosAnalyzerProps) {
  const [activeTab, setActiveTab] = useState('visao-geral');

  // Processar créditos dos registros C170
  const creditosData = useMemo(() => {
    const linhas = efdContent.split('\n');
    const c170Records: any[] = [];
    
    linhas.forEach(linha => {
      if (linha.startsWith('|C170|')) {
        const campos = linha.split('|');
        const registro = {
          COD_ITEM: campos[2],
          DESCR_COMPL: campos[3],
          CFOP: campos[6],
          CST_PIS: campos[13],
          VL_BC_PIS: parseFloat(campos[14]?.replace(',', '.') || '0'),
          ALIQ_PIS: parseFloat(campos[15]?.replace(',', '.') || '0'),
          VL_PIS: parseFloat(campos[16]?.replace(',', '.') || '0'),
          CST_COFINS: campos[17],
          VL_BC_COFINS: parseFloat(campos[18]?.replace(',', '.') || '0'),
          ALIQ_COFINS: parseFloat(campos[19]?.replace(',', '.') || '0'),
          VL_COFINS: parseFloat(campos[20]?.replace(',', '.') || '0'),
        };
        
        // Apenas registros com créditos (CST 50-56, 60-66)
        const cstCredito = ['50','51','52','53','54','55','56','60','61','62','63','64','65','66'];
        if (cstCredito.includes(registro.CST_PIS) || cstCredito.includes(registro.CST_COFINS)) {
          c170Records.push(registro);
        }
      }
    });

    const totalLinhas = c170Records.length;
    const totalPIS = c170Records.reduce((sum, r) => sum + r.VL_PIS, 0);
    const totalCOFINS = c170Records.reduce((sum, r) => sum + r.VL_COFINS, 0);
    const totalCreditos = totalPIS + totalCOFINS;

    return {
      linhas: c170Records,
      totais: {
        linhasElegiveis: totalLinhas,
        totalPIS,
        totalCOFINS,
        totalCreditos,
        totalOrigens: totalCreditos,
        totalM: 0, // Seria do Bloco M quando disponível
        diferenca: totalCreditos
      }
    };
  }, [efdContent]);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-auto p-2 gap-2">
          <TabsTrigger value="visao-geral" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="natureza" className="flex items-center gap-2">
            <ListTree className="h-4 w-4" />
            <span className="hidden sm:inline">Por Natureza</span>
          </TabsTrigger>
          <TabsTrigger value="insumos" className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            <span className="hidden sm:inline">Insumos</span>
          </TabsTrigger>
          <TabsTrigger value="alertas" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Alertas</span>
          </TabsTrigger>
          <TabsTrigger value="reconciliacao" className="flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            <span className="hidden sm:inline">Reconciliação</span>
          </TabsTrigger>
          <TabsTrigger value="documentos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documentos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Visão Geral dos Créditos</CardTitle>
              <CardDescription>
                Panorama consolidado de créditos PIS/COFINS por natureza (Tabela 4.3.7)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-success/10 to-success/10 border-success/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Linhas Elegíveis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-success">
                      {creditosData.totais.linhasElegiveis.toLocaleString('pt-BR')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Registros com direito a crédito
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-primary/10 to-primary/10 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total PIS
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      R$ {creditosData.totais.totalPIS.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Créditos PIS identificados
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-efd-primary/10 to-destructive/10 border-efd-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total COFINS
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-efd-primary">
                      R$ {creditosData.totais.totalCOFINS.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Créditos COFINS identificados
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-warning/10 to-destructive/10 border-warning/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Geral
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-warning">
                      R$ {creditosData.totais.totalCreditos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      PIS + COFINS
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Registros Analisados</CardTitle>
                    <CardDescription>
                      Primeiros 10 registros com créditos identificados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {creditosData.linhas.slice(0, 10).map((linha, idx) => (
                        <div key={idx} className="p-3 bg-muted/50 rounded-lg border border-border/50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{linha.DESCR_COMPL || linha.COD_ITEM}</p>
                              <p className="text-xs text-muted-foreground">CFOP: {linha.CFOP} | CST PIS: {linha.CST_PIS} | CST COFINS: {linha.CST_COFINS}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">PIS:</span>
                              <span className="ml-2 font-semibold text-primary">
                                R$ {linha.VL_PIS.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">COFINS:</span>
                              <span className="ml-2 font-semibold text-efd-primary">
                                R$ {linha.VL_COFINS.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {creditosData.linhas.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center mt-4">
                        Exibindo 10 de {creditosData.linhas.length} registros
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="natureza" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Créditos por Natureza (Tabela 4.3.7)</CardTitle>
              <CardDescription>
                Análise detalhada por código de natureza da base de crédito
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 bg-muted/30 rounded-xl border-2 border-dashed border-border text-center">
                <ListTree className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Tabela de créditos por natureza (01-Revenda, 02-Insumos, 03-Serviços, etc.)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insumos" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Essencialidade de Insumos (NAT 02/03)</CardTitle>
              <CardDescription>
                Classificação automática de insumos por essencialidade e NCM
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 bg-muted/30 rounded-xl border-2 border-dashed border-border text-center">
                <FileUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Análise de essencialidade com score, status (aceito/duvidoso/negado) e fundamentos
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertas" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Validação</CardTitle>
              <CardDescription>
                Inconsistências, CSTs incorretos e naturezas indefinidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 bg-muted/30 rounded-xl border-2 border-dashed border-border text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Lista de alertas por gravidade (alta/média/baixa)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliacao" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Reconciliação com Bloco M</CardTitle>
              <CardDescription>
                Comparação entre total de origens (A+C+D+F) e consolidado M105/M505
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 bg-muted/30 rounded-xl border-2 border-dashed border-border text-center">
                <GitCompare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Análise waterfall e diferenças por natureza 4.3.7
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Documentos (Drill-down)</CardTitle>
              <CardDescription>
                Detalhamento por documento fiscal e item
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 bg-muted/30 rounded-xl border-2 border-dashed border-border text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Lista completa de documentos com detalhes de créditos por linha
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
