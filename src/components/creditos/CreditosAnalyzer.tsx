import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, BarChart3, ListTree, AlertTriangle, GitCompare, FileText } from 'lucide-react';
import { EFDData } from '@/utils/efdParser';
import { eixoOperacao } from '@/utils/cfopPolicyMonolith';
import { analisarCreditosPorNatureza } from '@/utils/creditosPorNatureza';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const moeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface CreditosAnalyzerProps {
  efdData: EFDData;
  efdContent: string;
}

export function CreditosAnalyzer({ efdData }: CreditosAnalyzerProps) {
  const [activeTab, setActiveTab] = useState('visao-geral');

  // Entradas com CST de crédito (50 a 66), já lidas pelo parser no leiaute oficial do C170
  const creditosData = useMemo(() => {
    const linhas = efdData.vendas.filter(v => {
      const cst = parseInt(v.pisCst, 10);
      return eixoOperacao(v.cfop) === 'entrada' && cst >= 50 && cst <= 66;
    });
    const totalPIS = linhas.reduce((sum, r) => sum + r.pisValor, 0);
    const totalCOFINS = linhas.reduce((sum, r) => sum + r.cofinsValor, 0);
    return {
      linhas,
      totais: {
        linhasElegiveis: linhas.length,
        totalPIS,
        totalCOFINS,
        totalCreditos: totalPIS + totalCOFINS,
      },
    };
  }, [efdData]);

  const naturezas = useMemo(() => analisarCreditosPorNatureza(efdData), [efdData]);

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
                              <p className="font-medium text-sm">{linha.produto}</p>
                              <p className="text-xs text-muted-foreground">CFOP: {linha.cfop} | CST PIS: {linha.pisCst} | CST COFINS: {linha.cofinsCst}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">PIS:</span>
                              <span className="ml-2 font-semibold text-primary">
                                R$ {linha.pisValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">COFINS:</span>
                              <span className="ml-2 font-semibold text-efd-primary">
                                R$ {linha.cofinsValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              {naturezas.linhas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma entrada com crédito nem M105/M505 no arquivo.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Natureza</TableHead>
                      <TableHead className="text-right">Base declarada (M105)</TableHead>
                      <TableHead className="text-right">Base C170 por CFOP</TableHead>
                      <TableHead className="text-right">Crédito PIS (C170)</TableHead>
                      <TableHead className="text-right">Crédito COFINS (C170)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {naturezas.linhas.map(l => (
                      <TableRow key={l.natureza}>
                        <TableCell><span className="font-mono">{l.natureza}</span> · {l.descricao}</TableCell>
                        <TableCell className="text-right">{moeda(l.baseDeclaradaPIS)}</TableCell>
                        <TableCell className="text-right">{moeda(l.baseDeduzidaC170)}</TableCell>
                        <TableCell className="text-right">{moeda(l.creditoPISC170)}</TableCell>
                        <TableCell className="text-right">{moeda(l.creditoCOFINSC170)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {naturezas.itensSemNatureza > 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  {naturezas.itensSemNatureza} item(ns) de entrada com CST de crédito e CFOP sem natureza mapeada (base {moeda(naturezas.baseSemNatureza)}).
                </p>
              )}
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
                Natureza declarada pelo contribuinte (M105) × natureza deduzida do CFOP das entradas do C170
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!naturezas.temDeclaracao ? (
                <p className="text-sm text-muted-foreground">O arquivo não traz M105/M505: não há declaração para confrontar.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Natureza</TableHead>
                      <TableHead className="text-right">Declarado (M105)</TableHead>
                      <TableHead className="text-right">Deduzido (C170)</TableHead>
                      <TableHead className="text-right">Diferença</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {naturezas.linhas.map(l => (
                      <TableRow key={l.natureza}>
                        <TableCell><span className="font-mono">{l.natureza}</span> · {l.descricao}</TableCell>
                        <TableCell className="text-right">{moeda(l.baseDeclaradaPIS)}</TableCell>
                        <TableCell className="text-right">{moeda(l.baseDeduzidaC170)}</TableCell>
                        <TableCell className="text-right">
                          {l.divergencia === null ? 'não dedutível do C170' : moeda(l.divergencia)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <p className="text-xs text-muted-foreground mt-3">
                O M105 é a fonte primária. A dedução por CFOP cobre só os itens do C170; bases vindas de C190/C191, A, D, F ou C500 aparecem como diferença.
              </p>
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
