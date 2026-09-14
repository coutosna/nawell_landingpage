import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ClienteData {
  codPart: string;
  cliente: string;
  cnpj?: string;
  uf: string;
  valorTotal: number;
  countNf: number;
  ticketMedio: number;
  participacao: number;
  acumuladoPareto: number;
}

interface TopClientesProps {
  efdTxt: string;
}

const parseDecimal = (value: string): number => {
  if (!value) return 0;
  return parseFloat(value.replace(',', '.')) || 0;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatPercent = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

export const TopClientes: React.FC<TopClientesProps> = ({ efdTxt }) => {
  const [topN, setTopN] = useState(10);

  const clientesData = useMemo(() => {
    const lines = efdTxt.split('\n').map(l => l.trim()).filter(l => l);
    
    // Maps para armazenar dados
    const participantes = new Map<string, { nome: string; cnpj?: string; codMun?: string; uf?: string }>();
    const documentosC100 = new Map<string, { codPart: string; dtDoc: string; codSit: string; vlDoc: number; indOper: string }>();
    const itensC170 = new Map<string, Array<{ cfop: string; vlItem: number }>>();
    let docKeyAtual = '';

    // Parse do arquivo EFD
    lines.forEach(line => {
      const campos = line.split('|');
      const registro = campos[1];

      switch (registro) {
        case '0150':
          // Participante: COD_PART=2, NOME=3, CNPJ=5, COD_MUN=8
          const codPart = campos[2] || '';
          const nome = campos[3] || '';
          const cnpj = campos[5] || '';
          const codMun = campos[8] || '';
          
          // Derivar UF dos 2 primeiros dígitos do código municipal IBGE
          let uf = '';
          if (codMun && codMun.length >= 2) {
            const ufCode = codMun.substring(0, 2);
            const ufMap: Record<string, string> = {
              '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
              '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL',
              '28': 'SE', '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP', '41': 'PR',
              '42': 'SC', '43': 'RS', '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF'
            };
            uf = ufMap[ufCode] || '';
          }

          participantes.set(codPart, { nome, cnpj, codMun, uf });
          break;

        case 'C100':
          // C100 Layout: IND_OPER=2, COD_PART=4, CHV_NFE=9, DT_DOC=10, VL_DOC=12
          const indOper = campos[2] || '';
          const codPartDoc = campos[4] || '';
          const chvNfe = campos[9] || '';
          const dtDoc = campos[10] || '';
          const codSit = campos[6] || ''; // COD_SIT na posição 6
          const vlDoc = parseDecimal(campos[12]);

          docKeyAtual = chvNfe || `${codPartDoc}_${dtDoc}`;
          
          documentosC100.set(docKeyAtual, {
            codPart: codPartDoc,
            dtDoc,
            codSit,
            vlDoc,
            indOper,
          });
          
          // Inicializa array de itens para este documento
          if (!itensC170.has(docKeyAtual)) {
            itensC170.set(docKeyAtual, []);
          }
          break;

        case 'C170':
          // C170: CFOP=12, VL_ITEM=7
          if (docKeyAtual) {
            const cfop = campos[12] || '';
            const vlItem = parseDecimal(campos[7]);
            
            const items = itensC170.get(docKeyAtual) || [];
            items.push({ cfop, vlItem });
            itensC170.set(docKeyAtual, items);
          }
          break;

        case 'A100':
          // A100 (Notas de serviço): IND_OPER=2, COD_PART=4, DT_DOC=10, VL_DOC=12
          const indOperA = campos[2] || '';
          const codPartA = campos[4] || '';
          const dtDocA = campos[10] || '';
          const codSitA = campos[5] || '';
          const vlDocA = parseDecimal(campos[12]);
          
          const docKeyA = `A_${codPartA}_${dtDocA}`;
          docKeyAtual = docKeyA;
          
          documentosC100.set(docKeyA, {
            codPart: codPartA,
            dtDoc: dtDocA,
            codSit: codSitA,
            vlDoc: vlDocA,
            indOper: indOperA,
          });
          
          if (!itensC170.has(docKeyA)) {
            itensC170.set(docKeyA, []);
          }
          break;

        case 'A170':
          // A170 (itens de serviço): VL_ITEM=5
          if (docKeyAtual && docKeyAtual.startsWith('A_')) {
            const vlItemA = parseDecimal(campos[5]);
            const cfopA = campos[8] || '';
            
            const items = itensC170.get(docKeyAtual) || [];
            items.push({ cfop: cfopA, vlItem: vlItemA });
            itensC170.set(docKeyAtual, items);
          }
          break;

        case 'D100':
          // D100 (Notas de serviço telecomunicações): IND_OPER=2, COD_PART=4, DT_DOC=11, VL_DOC=19
          const indOperD = campos[2] || '';
          const codPartD = campos[4] || '';
          const dtDocD = campos[11] || '';
          const codSitD = campos[5] || '';
          const vlDocD = parseDecimal(campos[19]);
          
          const docKeyD = `D_${codPartD}_${dtDocD}`;
          docKeyAtual = docKeyD;
          
          documentosC100.set(docKeyD, {
            codPart: codPartD,
            dtDoc: dtDocD,
            codSit: codSitD,
            vlDoc: vlDocD,
            indOper: indOperD,
          });
          
          if (!itensC170.has(docKeyD)) {
            itensC170.set(docKeyD, []);
          }
          break;
      }
    });

    // Agregar dados por cliente
    const clienteAgg = new Map<string, { valorTotal: number; countNf: number; uf: string; nome: string; cnpj?: string }>();

    documentosC100.forEach((doc, docKey) => {
      // Filtrar apenas saídas (IND_OPER = 1)
      if (doc.indOper !== '1') return;
      
      // Excluir documentos cancelados/denegados
      if (doc.codSit && doc.codSit !== '00') return;

      const participante = participantes.get(doc.codPart);
      if (!participante) return;

      const items = itensC170.get(docKey) || [];
      
      // Calcular valor total dos itens ou usar fallback
      const valorDoc = items.length > 0
        ? items.reduce((sum, item) => sum + item.vlItem, 0)
        : doc.vlDoc;

      if (!clienteAgg.has(doc.codPart)) {
        clienteAgg.set(doc.codPart, {
          valorTotal: 0,
          countNf: 0,
          uf: participante.uf || 'N/A',
          nome: participante.nome || doc.codPart,
          cnpj: participante.cnpj,
        });
      }

      const agg = clienteAgg.get(doc.codPart)!;
      agg.valorTotal += valorDoc;
      agg.countNf += 1;
    });

    // Converter para array e calcular métricas
    const clientes: ClienteData[] = Array.from(clienteAgg.entries()).map(([codPart, data]) => ({
      codPart,
      cliente: data.nome,
      cnpj: data.cnpj,
      uf: data.uf,
      valorTotal: data.valorTotal,
      countNf: data.countNf,
      ticketMedio: data.valorTotal / data.countNf,
      participacao: 0, // será calculado depois
      acumuladoPareto: 0,
    }));

    // Ordenar por valor total
    clientes.sort((a, b) => b.valorTotal - a.valorTotal);

    // Calcular participação e Pareto
    const totalGeral = clientes.reduce((sum, s) => sum + s.valorTotal, 0);
    let acumulado = 0;

    clientes.forEach(cliente => {
      cliente.participacao = totalGeral > 0 ? cliente.valorTotal / totalGeral : 0;
      acumulado += cliente.participacao;
      cliente.acumuladoPareto = acumulado;
    });

    return {
      clientes,
      totalGeral,
      totalNfs: clientes.reduce((sum, s) => sum + s.countNf, 0),
      totalClientes: clientes.length,
    };
  }, [efdTxt]);

  const topClientes = clientesData.clientes.slice(0, topN);
  const top5Total = clientesData.clientes.slice(0, 5).reduce((sum, s) => sum + s.valorTotal, 0);
  const top5Percent = clientesData.totalGeral > 0 ? top5Total / clientesData.totalGeral : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cards de Sumário com design aprimorado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-lift group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Valor Total</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden relative z-10">
            <div className="text-2xl lg:text-3xl font-bold break-words bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              {formatCurrency(clientesData.totalGeral)}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Em vendas realizadas</p>
          </CardContent>
        </Card>

        <Card className="hover-lift group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Notas Fiscais</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FileText className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold">{clientesData.totalNfs.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Documentos emitidos</p>
          </CardContent>
        </Card>

        <Card className="hover-lift group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Clientes</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success/20 to-success/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Users className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold">{clientesData.totalClientes}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Clientes ativos</p>
          </CardContent>
        </Card>

        <Card className="hover-lift group relative overflow-hidden border-2 border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wider">Top 5 Concentração</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-primary">{formatPercent(top5Percent)}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Dos 5 maiores clientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Barras aprimorado */}
      <Card className="hover-float border-2">
        <CardHeader className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <BarChart className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Top {topN} Clientes por Valor</CardTitle>
              <CardDescription className="text-base mt-2">
                Ranking dos principais clientes por valor total de saídas
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[10, 20, 50].map(n => (
              <Badge
                key={n}
                variant={topN === n ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-4 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105",
                  topN === n 
                    ? "bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/30" 
                    : "hover:bg-primary/10 hover:border-primary/50"
                )}
                onClick={() => setTopN(n)}
              >
                Top {n}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(450, topClientes.length * 45)}>
            <BarChart 
              data={topClientes} 
              layout="vertical" 
              margin={{ left: 20, right: 30, top: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                type="number" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
                  return formatCurrency(value);
                }}
              />
              <YAxis 
                type="category" 
                dataKey="cliente" 
                width={220}
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
                tickFormatter={(value: string) => {
                  if (value.length > 32) {
                    return value.substring(0, 29) + '...';
                  }
                  return value;
                }}
              />
              <Tooltip 
                cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ClienteData;
                    return (
                      <div className="bg-background/95 backdrop-blur-xl border-2 border-border rounded-xl p-4 shadow-2xl">
                        <p className="font-bold text-base mb-3 text-primary">{data.cliente}</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground font-medium">CNPJ:</span>
                            <span className="font-mono font-semibold">{data.cnpj || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground font-medium">UF:</span>
                            <Badge variant="outline" className="font-bold">{data.uf}</Badge>
                          </div>
                          <div className="h-px bg-border my-2" />
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground font-medium">Valor Total:</span>
                            <span className="font-bold text-primary">{formatCurrency(data.valorTotal)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground font-medium">Nº NFs:</span>
                            <span className="font-semibold">{data.countNf}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground font-medium">Ticket Médio:</span>
                            <span className="font-semibold">{formatCurrency(data.ticketMedio)}</span>
                          </div>
                          <div className="h-px bg-border my-2" />
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground font-medium">Participação:</span>
                            <span className="font-bold text-accent">{formatPercent(data.participacao)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="valorTotal" radius={[0, 8, 8, 0]}>
                {topClientes.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.acumuladoPareto <= 0.8 
                      ? 'url(#colorPrimary)' 
                      : 'hsl(var(--muted-foreground) / 0.4)'}
                  />
                ))}
              </Bar>
              <defs>
                <linearGradient id="colorPrimary" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela Detalhada aprimorada */}
      <Card className="hover-float border-2">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Detalhamento Completo</CardTitle>
              <CardDescription className="text-base mt-2">
                Lista completa dos clientes com todas as métricas e indicadores
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] font-bold">#</TableHead>
                <TableHead className="font-bold">Cliente</TableHead>
                <TableHead className="font-bold">CNPJ</TableHead>
                <TableHead className="font-bold text-center">UF</TableHead>
                <TableHead className="text-right font-bold">Valor Total</TableHead>
                <TableHead className="text-right font-bold">Nº NFs</TableHead>
                <TableHead className="text-right font-bold">Ticket Médio</TableHead>
                <TableHead className="text-right font-bold">Participação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topClientes.map((cliente, index) => (
                <TableRow key={cliente.codPart} className="group">
                  <TableCell className="font-bold text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center font-bold text-sm group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
                      {index + 1}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold max-w-xs">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-1 h-8 rounded-full",
                        cliente.acumuladoPareto <= 0.8 
                          ? "bg-gradient-to-b from-primary to-accent" 
                          : "bg-muted-foreground/30"
                      )} />
                      <span className="truncate">{cliente.cliente}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {cliente.cnpj || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline" 
                      className="font-bold bg-gradient-to-r from-primary/5 to-accent/5 border-primary/30"
                    >
                      {cliente.uf}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {formatCurrency(cliente.valorTotal)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{cliente.countNf}</TableCell>
                  <TableCell className="text-right font-medium text-muted-foreground">
                    {formatCurrency(cliente.ticketMedio)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "font-bold px-2 py-1 rounded-lg",
                      cliente.acumuladoPareto <= 0.8 
                        ? 'text-primary bg-primary/10' 
                        : 'text-muted-foreground'
                    )}>
                      {formatPercent(cliente.participacao)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
