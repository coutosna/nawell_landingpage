import { useMemo, useState } from 'react';
import { ShieldAlert, ShieldCheck, Wallet, FileCheck2, AlertTriangle, TrendingDown, UploadCloud } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { validarNotas } from '@/utils/nfeIbsCbsValidator';
import { computeStats, distribuicaoPorTipo, riscoPorEmpresa, scoreTone, formatBRL, formatBRLCompact, TIPO_LABEL } from '@/utils/nfeIbsCbsLabels';
import type { Nota, ResultadoValidacao } from '@/types/nfe';

function BarRow({ label, value, max, formatValue = String }: { label: string; value: number; max: number; formatValue?: (v: number) => string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-52 shrink-0 truncate text-[12.5px] text-foreground">{label}</span>
      <div className="h-2.5 min-w-0 flex-1 rounded-full bg-muted">
        <div className="h-2.5 rounded-r-full bg-reforma-primary" style={{ width: `${Math.max((value / max) * 100, 3)}%` }} />
      </div>
      <span className="w-16 shrink-0 text-right text-[12.5px] font-semibold tabular-nums text-foreground">{formatValue(value)}</span>
    </div>
  );
}

export function ValidacaoNotasFiscais() {
  const [selecionada, setSelecionada] = useState<{ nota: Nota; resultado: ResultadoValidacao } | null>(null);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        const lista: Nota[] = Array.isArray(data) ? data : (data.notas ?? []);
        if (!Array.isArray(lista) || lista.length === 0) {
          throw new Error('Nenhuma nota encontrada no arquivo');
        }
        setNotas(lista);
        setErroArquivo(null);
        setSelecionada(null);
        toast({ title: `${lista.length} nota(s) carregada(s)`, description: "Validação contra tabelas oficiais em andamento" });
      } catch (err) {
        setErroArquivo(err instanceof Error ? err.message : 'Arquivo inválido');
        toast({ title: "Erro ao carregar arquivo", description: "Use um JSON de notas no formato esperado", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  const resultados = useMemo(() => validarNotas(notas), [notas]);
  const stats = useMemo(() => computeStats(resultados), [resultados]);
  const distribuicao = useMemo(() => distribuicaoPorTipo(resultados), [resultados]);
  const empresas = useMemo(() => riscoPorEmpresa(notas, resultados), [notas, resultados]);
  const resultadoPorChave = useMemo(() => new Map(resultados.map((r) => [r.chave_nfe, r])), [resultados]);

  const notasOrdenadas = useMemo(
    () => [...notas].sort((a, b) => resultadoPorChave.get(a.chave_nfe)!.score_qualidade - resultadoPorChave.get(b.chave_nfe)!.score_qualidade),
    [notas, resultadoPorChave],
  );

  const maxDistribuicao = Math.max(...distribuicao.map((d) => d.count), 1);
  const maxEmpresa = Math.max(...empresas.map((e) => e.exposicao), 1);

  if (selecionada) {
    const { nota, resultado } = selecionada;
    const achadosPorItem = new Map<number | null, typeof resultado.achados>();
    for (const a of resultado.achados) {
      achadosPorItem.set(a.nItem, [...(achadosPorItem.get(a.nItem) ?? []), a]);
    }
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => setSelecionada(null)}>← Voltar para a lista</Button>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nota fiscal · {nota.chave_nfe}</p>
          <h2 className="text-xl font-bold text-foreground">{nota.emitente.nome}</h2>
          <p className="text-sm text-muted-foreground">CNPJ {nota.emitente.cnpj} · CNAE {nota.emitente.cnae} — {nota.emitente.descricao_cnae}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card><CardContent className="pt-4">
            <p className="mb-1 text-[11px] text-muted-foreground">Score de qualidade</p>
            <Progress value={resultado.score_qualidade} className="mb-1 h-2.5" />
            <p className="text-2xl font-bold text-foreground">{resultado.score_qualidade}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-[11px] text-muted-foreground">Exposição financeira</p>
            <p className="text-2xl font-bold text-warning">{formatBRL(resultado.exposicao_financeira)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-[11px] text-muted-foreground">Valor total da nota</p>
            <p className="text-2xl font-bold text-foreground">{formatBRL(nota.valor_total_nota)}</p>
          </CardContent></Card>
        </div>

        {resultado.achados.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-1.5"><ShieldAlert className="h-4 w-4 text-destructive" /> Achados ({resultado.achados.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {resultado.achados.map((a, i) => (
                <div key={i} className="rounded-lg border border-border px-3 py-2.5">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-foreground">
                      {TIPO_LABEL[a.tipo] ?? a.tipo}
                      {a.nItem != null && <span className="ml-1.5 font-normal text-muted-foreground">· item {a.nItem}</span>}
                    </span>
                    <Badge variant={a.severidade === 'alta' ? 'destructive' : 'warning'}>{a.severidade}</Badge>
                  </div>
                  <p className="text-[12px] text-muted-foreground">{a.detalhe}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Itens da nota</CardTitle></CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead><TableHead>NCM</TableHead><TableHead>CFOP</TableHead>
                  <TableHead>CST / cClassTrib</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nota.itens.map((item) => {
                  const achadosItem = achadosPorItem.get(item.nItem) ?? [];
                  return (
                    <TableRow key={item.nItem}>
                      <TableCell className="text-[12px] text-muted-foreground">{item.nItem}</TableCell>
                      <TableCell><span className="block font-mono text-[12px]">{item.ncm}</span><span className="block max-w-[200px] truncate text-[11px] text-muted-foreground">{item.descricao_ncm}</span></TableCell>
                      <TableCell><span className="block font-mono text-[12px]">{item.cfop}</span><span className="block max-w-[180px] truncate text-[11px] text-muted-foreground">{item.descricao_cfop}</span></TableCell>
                      <TableCell><span className="block text-[12px]">CST {item.cst_ibs_cbs} · {item.cclasstrib ?? '—'}</span><span className="block max-w-[180px] truncate text-[11px] text-muted-foreground">{item.descricao_cclasstrib ?? item.descricao_cst}</span></TableCell>
                      <TableCell className="text-[13px] tabular-nums">{formatBRL(item.valor_total)}</TableCell>
                      <TableCell>{achadosItem.length > 0 ? <Badge variant={achadosItem.some((a) => a.severidade === 'alta') ? 'destructive' : 'warning'}>{achadosItem.length} achado{achadosItem.length > 1 ? 's' : ''}</Badge> : <Badge variant="success">ok</Badge>}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Cruza NCM, CFOP, CST/cClassTrib, CNAE e CNPJ de cada nota contra as tabelas oficiais (Receita Federal, CONFAZ, Portal NF-e, IBGE) —
        cada achado aponta a norma correspondente.
      </p>

      {notas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-reforma-primary/20 to-reforma-primary/5 flex items-center justify-center">
              <UploadCloud className="h-10 w-10 text-reforma-primary" />
            </div>
            <h3 className="text-xl font-display font-bold mb-2">Nenhuma nota carregada</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Carregue um arquivo JSON com as notas fiscais (NF-e) para validar contra as tabelas oficiais da reforma tributária.
            </p>
            <label className="cursor-pointer">
              <input type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
              <Button type="button" variant="gradient" asChild>
                <span>Carregar notas (JSON)</span>
              </Button>
            </label>
            {erroArquivo && <p className="mt-3 text-sm text-destructive">{erroArquivo}</p>}
          </CardContent>
        </Card>
      ) : (
      <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card><CardContent className="flex items-center gap-3 pt-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-reforma-primary/15 text-reforma-primary"><FileCheck2 className="h-4.5 w-4.5" /></span>
          <div><p className="text-[11px] text-muted-foreground">Notas analisadas</p><p className="text-xl font-bold text-foreground">{stats.totalNotas}</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/15 text-destructive"><AlertTriangle className="h-4.5 w-4.5" /></span>
          <div><p className="text-[11px] text-muted-foreground">Notas com achado</p><p className="text-xl font-bold text-foreground">{stats.notasComAchado}</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15 text-warning"><Wallet className="h-4.5 w-4.5" /></span>
          <div><p className="text-[11px] text-muted-foreground">Exposição financeira</p><p className="text-xl font-bold text-foreground">{formatBRL(stats.exposicaoTotal)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/15 text-success"><TrendingDown className="h-4.5 w-4.5" /></span>
          <div><p className="text-[11px] text-muted-foreground">Score médio</p><p className="text-xl font-bold text-foreground">{stats.scoreMedio.toFixed(1)}</p></div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Onde o risco se concentra</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {distribuicao.map((d) => <BarRow key={d.tipo} label={d.label} value={d.count} max={maxDistribuicao} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Exposição por empresa</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {empresas.map((e) => <BarRow key={e.nome} label={e.nome} value={e.exposicao} max={maxEmpresa} formatValue={formatBRLCompact} />)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Notas fiscais ({notas.length})</CardTitle></CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Chave / Emitente</TableHead><TableHead>Valor total</TableHead><TableHead>Achados</TableHead><TableHead>Exposição</TableHead><TableHead>Score</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {notasOrdenadas.map((n) => {
                const r = resultadoPorChave.get(n.chave_nfe)!;
                const tone = scoreTone(r.score_qualidade);
                return (
                  <TableRow key={n.chave_nfe} className="cursor-pointer" onClick={() => setSelecionada({ nota: n, resultado: r })}>
                    <TableCell><span className="block font-medium text-foreground">{n.emitente.nome}</span><span className="block text-[11px] text-muted-foreground">{n.chave_nfe}</span></TableCell>
                    <TableCell className="text-[13px] tabular-nums">{formatBRL(n.valor_total_nota)}</TableCell>
                    <TableCell>{r.achados.length > 0 ? <Badge variant="destructive">{r.achados.length}</Badge> : <Badge variant="success">0</Badge>}</TableCell>
                    <TableCell className="text-[13px] tabular-nums">{r.exposicao_financeira > 0 ? formatBRL(r.exposicao_financeira) : '—'}</TableCell>
                    <TableCell><Badge variant={tone}>{r.score_qualidade}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}
