import { ECFAnaliseCompleta } from "./ecfCalculations";

export interface Alerta {
  code: string;
  severity: "high" | "medium" | "low";
  message: string;
  impact: string;
}

export function validarECF(analise: ECFAnaliseCompleta): Alerta[] {
  const alertas: Alerta[] = [];

  // IRPJ-END-002: Corte IRPJ→CSLL por fallback
  if (analise.flags.irpjEndFallback) {
    alertas.push({
      code: "IRPJ-END-002",
      severity: "low",
      message: "M300/176 ausente; corte IRPJ→CSLL definido por fallback (último M300 ou primeiro M350).",
      impact: "Verificar preenchimento do código 176",
    });
  }

  // CSLL-AUS-001: CSLL ausente após IRPJ
  if (analise.flags.csllAusente) {
    alertas.push({
      code: "CSLL-AUS-001",
      severity: "medium",
      message: "M350 não encontrado após encerramento do IRPJ na janela M030.",
      impact: "Possível ausência de apuração da CSLL",
    });
  }

  // IRPJ-040: Validar adicional IRPJ
  const adicionalEsperado = Math.max(0, (analise.apuracao.baseIRPJ - 240000)) * 0.10;
  if (Math.abs(adicionalEsperado - analise.apuracao.adicionalIRPJ) > 0.5) {
    alertas.push({
      code: "IRPJ-040",
      severity: "medium",
      message: `Adicional IRPJ calculado (R$ ${analise.apuracao.adicionalIRPJ.toLocaleString('pt-BR', {minimumFractionDigits: 2})}) difere do esperado (R$ ${adicionalEsperado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}).`,
      impact: "Recalcular adicional",
    });
  }

  // CSLL-050: Base CSLL x IRPJ divergente
  if (analise.apuracao.baseIRPJ > 0) {
    const difPct = Math.abs(analise.apuracao.baseIRPJ - analise.apuracao.baseCSLL) / analise.apuracao.baseIRPJ;
    if (difPct > 0.01) {
      alertas.push({
        code: "CSLL-050",
        severity: "medium",
        message: `Base CSLL difere da IRPJ acima de tolerância (${(difPct * 100).toFixed(2)}%).`,
        impact: "Checar ajustes",
      });
    }
  }

  // MAP-001: Verificar se tem J050/J051 (plano de contas)
  if (analise.documento.j050.length === 0) {
    alertas.push({
      code: "MAP-001",
      severity: "high",
      message: "Plano de contas (J050) não encontrado no arquivo ECF.",
      impact: "Pode bloquear validações contábeis",
    });
  }

  // ECD-010: Balanço não fecha (simulado - precisa de dados do J100)
  if (analise.documento.j100.length > 0) {
    let ativo = 0;
    let passivoPL = 0;
    for (const reg of analise.documento.j100) {
      const conta = reg.campos.COD_CTA || "";
      const valor = reg.campos.VLR_CTA || 0;
      if (conta.startsWith("1.")) {
        ativo += valor;
      } else if (conta.startsWith("2.") || conta.startsWith("3.")) {
        passivoPL += valor;
      }
    }
    if (Math.abs(ativo - passivoPL) > 0.5) {
      alertas.push({
        code: "ECD-010",
        severity: "high",
        message: `Ativo (R$ ${ativo.toLocaleString('pt-BR', {minimumFractionDigits: 2})}) ≠ Passivo+PL (R$ ${passivoPL.toLocaleString('pt-BR', {minimumFractionDigits: 2})}).`,
        impact: "Inconsistência contábil",
      });
    }
  }

  return alertas;
}

export function gerarOportunidades(analise: ECFAnaliseCompleta): Array<{
  titulo: string;
  descricao: string;
  economia: number;
  prioridade: "alta" | "media" | "baixa";
}> {
  const oportunidades = [];

  // Oportunidade 1: Compensação de prejuízo
  if (analise.apuracao.baseIRPJ > 240000) {
    const potencialCompensacao = analise.apuracao.baseIRPJ * 0.30;
    const economia = potencialCompensacao * 0.25; // 15% IRPJ + 10% adicional
    oportunidades.push({
      titulo: "Compensação de Prejuízos Fiscais",
      descricao: `Verificar disponibilidade de prejuízos fiscais para compensação. Limite máximo de 30% da base de cálculo.`,
      economia,
      prioridade: "alta" as const,
    });
  }

  // Oportunidade 2: Revisão de adições
  if (analise.totais.m300_93_adicoes > 0) {
    const economia = analise.totais.m300_93_adicoes * 0.25 * 0.10; // 10% de potencial revisão
    oportunidades.push({
      titulo: "Revisão de Adições ao Lucro Líquido",
      descricao: `Identificadas R$ ${analise.totais.m300_93_adicoes.toLocaleString('pt-BR', {minimumFractionDigits: 2})} em adições. Revisar se todas são obrigatórias.`,
      economia,
      prioridade: "media" as const,
    });
  }

  // Oportunidade 3: Planejamento de exclusões
  if (analise.totais.m300_168_exclusoes < analise.totais.m300_93_adicoes * 0.3) {
    const economia = (analise.totais.m300_93_adicoes * 0.3 - analise.totais.m300_168_exclusoes) * 0.25;
    oportunidades.push({
      titulo: "Maximizar Exclusões Permitidas",
      descricao: `Volume de exclusões pode ser aumentado. Verificar incentivos fiscais, subvenções e demais exclusões aplicáveis.`,
      economia,
      prioridade: "alta" as const,
    });
  }

  return oportunidades;
}
