import type { Nota, ResultadoValidacao } from "@/types/nfe";

export const TIPO_LABEL: Record<string, string> = {
  ncm_formato_invalido: "NCM com formato inválido",
  ncm_invalido: "NCM inexistente na TIPI",
  valor_incoerente: "Valor incoerente (unit. x qtd.)",
  cfop_incompativel_operacao: "CFOP incompatível com a operação",
  cfop_invalido: "CFOP inexistente",
  cclasstrib_invalido: "cClassTrib inexistente",
  cst_cclasstrib_mismatch: "CST não bate com o cClassTrib",
  cclasstrib_documento_incompativel: "cClassTrib não habilitado para NF-e",
  cclasstrib_fora_vigencia: "cClassTrib fora da vigência",
  aliquota_reducao_divergente: "Redução de alíquota divergente",
  cnpj_invalido: "CNPJ com dígito verificador inválido",
  cnae_invalido: "CNAE inexistente",
};

export function scoreTone(score: number): "success" | "warning" | "destructive" {
  if (score >= 90) return "success";
  if (score >= 70) return "warning";
  return "destructive";
}

export function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatBRLCompact(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}K`;
  return formatBRL(v);
}

export function computeStats(resultados: ResultadoValidacao[]) {
  return {
    totalNotas: resultados.length,
    notasComAchado: resultados.filter((r) => r.achados.length > 0).length,
    scoreMedio: resultados.reduce((acc, r) => acc + r.score_qualidade, 0) / (resultados.length || 1),
    exposicaoTotal: resultados.reduce((acc, r) => acc + r.exposicao_financeira, 0),
    totalAchados: resultados.reduce((acc, r) => acc + r.achados.length, 0),
    achadosAlta: resultados.reduce((acc, r) => acc + r.achados.filter((a) => a.severidade === "alta").length, 0),
    achadosMedia: resultados.reduce((acc, r) => acc + r.achados.filter((a) => a.severidade === "media").length, 0),
  };
}

export function distribuicaoPorTipo(resultados: ResultadoValidacao[]) {
  const counts = new Map<string, number>();
  for (const r of resultados) {
    for (const a of r.achados) {
      counts.set(a.tipo, (counts.get(a.tipo) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tipo, count]) => ({ tipo, label: TIPO_LABEL[tipo] ?? tipo, count }))
    .sort((a, b) => b.count - a.count);
}

export interface RiscoEmpresa {
  nome: string;
  cnpj: string;
  exposicao: number;
  notasComAchado: number;
  totalNotas: number;
}

export function riscoPorEmpresa(notas: Nota[], resultados: ResultadoValidacao[]): RiscoEmpresa[] {
  const resultadoPorChave = new Map(resultados.map((r) => [r.chave_nfe, r]));
  const porNome = new Map<string, RiscoEmpresa>();

  for (const n of notas) {
    const r = resultadoPorChave.get(n.chave_nfe);
    if (!r) continue;
    const key = n.emitente.nome;
    const acc = porNome.get(key) ?? { nome: key, cnpj: n.emitente.cnpj, exposicao: 0, notasComAchado: 0, totalNotas: 0 };
    acc.exposicao += r.exposicao_financeira;
    acc.notasComAchado += r.achados.length > 0 ? 1 : 0;
    acc.totalNotas += 1;
    porNome.set(key, acc);
  }

  return Array.from(porNome.values()).sort((a, b) => b.exposicao - a.exposicao);
}
