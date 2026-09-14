import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Database, 
  Calculator, 
  AlertTriangle, 
  TrendingUp, 
  Settings,
  CheckCircle2
} from 'lucide-react';

export const TechnicalInfo: React.FC = () => {
  const features = [
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Leitura de Cadastro e Regime",
      description: "Análise dos registros |0000| (CNPJ, UF, município, período) e |0110| (regime: Não Cumulativo, Cumulativo, Misto)",
      status: "complete"
    },
    {
      icon: <Database className="h-5 w-5" />,
      title: "Tabelas Normativas por NCM",
      description: "Tabela 4.3.10 (alíquotas diferenciadas/monofásicas), 4.3.13 (alíquota zero), 4.3.14 (isenção)",
      status: "complete"
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Mapeamento de Itens",
      description: "Registro |0200| mapeia COD_ITEM -> NCM para cruzamento com tabelas normativas",
      status: "complete"
    },
    {
      icon: <Calculator className="h-5 w-5" />,
      title: "Análise de Documentos",
      description: "Bloco A (serviços), Bloco C (mercadorias), Bloco F (demais operações) com extração de CST/BC/ALIQ/VL",
      status: "complete"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Consolidação de Receitas",
      description: "Blocos de apuração |M400| e |M800| com soma de VL_TOT_REC por CST",
      status: "complete"
    },
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      title: "Regras e Alertas",
      description: "Validação de alíquotas vs regime, NCM monofásico, alíquota zero, isenção, reconciliação M400/M800",
      status: "complete"
    }
  ];

  const calculations = [
    "Diferença por item = (BC esperada × alíquota esperada) – valor lançado",
    "SELIC acumulada com fatores mensais + 1% no mês do pagamento", 
    "Multa de mora: 0,33% ao dia, limitada a 20% (configurável)",
    "Due date padrão: 25 do mês seguinte ao período (ajustável)"
  ];

  const outputs = [
    "JSON consolidado com resumo, alertas e totais por CFOP/CST",
    "CSVs auxiliares por CFOP e itens com alerta",
    "Mensagens detalhadas de alerta com payload de apoio",
    "Cálculo de correção monetária com SELIC e multa"
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Funcionalidades do Motor de Análise
          </CardTitle>
          <CardDescription>
            Sistema completo baseado no motor consolidado de análise da EFD Contribuições
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="text-primary mt-1">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-sm">{feature.title}</h4>
                    <Badge variant="success" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Cálculos Financeiros
            </CardTitle>
            <CardDescription>
              Correção monetária e multa de mora
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calculations.map((calc, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm leading-relaxed">{calc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Relatórios Gerados
            </CardTitle>
            <CardDescription>
              Saídas do sistema de análise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {outputs.map((output, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm leading-relaxed">{output}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Observações Técnicas</CardTitle>
          <CardDescription>
            Detalhes importantes sobre o processamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Registro C170 (Mercadorias)</h4>
              <p className="text-sm text-muted-foreground">
                VL_ITEM = campo 07; CFOP = campo 11; PIS/COFINS extraídos por varredura [CST,BC,ALIQ,VL]
              </p>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Registro A170 (Serviços)</h4>
              <p className="text-sm text-muted-foreground">
                Usa COD_ITEM (campo 03) e varredura PIS/COFINS [CST,BC,ALIQ,VL]; integra NCM via registro 0200
              </p>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Registros M400/M800</h4>
              <p className="text-sm text-muted-foreground">
                VL_TOT_REC = campo 03; reconciliação automática com soma dos documentos
              </p>
            </div>
            
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <h4 className="font-semibold mb-2 text-primary">Regime Tributário (0110)</h4>
              <div className="text-sm space-y-1">
                <p><strong>1 = Não Cumulativo:</strong> PIS 1,65% / COFINS 7,6%</p>
                <p><strong>2 = Cumulativo:</strong> PIS 0,65% / COFINS 3,0%</p>
                <p><strong>3 = Misto:</strong> Prioridade às tabelas específicas por NCM</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Tipos de Perguntas Suportadas
          </CardTitle>
          <CardDescription>
            Consultas que você pode fazer sobre os arquivos processados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border-l-4 border-primary bg-primary/5 rounded">
              <h4 className="font-semibold mb-2 text-primary">G1 - Divergências de PIS/COFINS</h4>
              <ul className="space-y-1 text-sm">
                <li>• "Quantos alertas de divergência foram encontrados?"</li>
                <li>• "Mostre alertas por severidade"</li>
                <li>• "Quais itens têm divergência de alíquota?"</li>
              </ul>
            </div>

            <div className="p-4 border-l-4 border-warning bg-warning/5 rounded">
              <h4 className="font-semibold mb-2 text-warning">G2 - Incompatibilidade de Regime</h4>
              <ul className="space-y-1 text-sm">
                <li>• "Qual o regime tributário?"</li>
                <li>• "Há incompatibilidades entre regime e alíquotas?"</li>
                <li>• "Quais as alíquotas padrão?"</li>
              </ul>
            </div>

            <div className="p-4 border-l-4 border-primary bg-primary/5 rounded">
              <h4 className="font-semibold mb-2 text-primary">G3 - Reconciliação M × Documentos</h4>
              <ul className="space-y-1 text-sm">
                <li>• "Qual o total de receitas?"</li>
                <li>• "Compare M400/M800 com documentos"</li>
                <li>• "Há diferenças na reconciliação?"</li>
              </ul>
            </div>

            <div className="p-4 border-l-4 border-efd-primary bg-efd-primary/5 rounded">
              <h4 className="font-semibold mb-2 text-efd-primary">G4 - Classificação/NCM</h4>
              <ul className="space-y-1 text-sm">
                <li>• "Quantos NCMs foram mapeados?"</li>
                <li>• "Quantos itens foram analisados?"</li>
                <li>• "Há itens sem NCM?"</li>
              </ul>
            </div>

            <div className="p-4 border-l-4 border-success bg-success/5 rounded">
              <h4 className="font-semibold mb-2 text-success">Informações Gerais</h4>
              <ul className="space-y-1 text-sm">
                <li>• "Mostre os CFOPs de saída"</li>
                <li>• "Qual o período analisado?"</li>
                <li>• "Qual o CNPJ e UF da empresa?"</li>
                <li>• "Mostre resumo executivo"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};