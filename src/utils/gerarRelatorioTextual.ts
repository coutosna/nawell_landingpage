import { OportunidadeTributaria } from './detectarOportunidadesTributarias';

export interface RelatorioTextual {
  id: string;
  oportunidade: OportunidadeTributaria;
  textoTecnico: string;
  fundamentacaoLegal: string[];
  recomendacoes: string[];
}

/**
 * Gera relatório textual técnico-jurídico para uma oportunidade tributária
 */
export const gerarRelatorioTextual = (oportunidade: OportunidadeTributaria): RelatorioTextual => {
  const id = `REL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  let textoTecnico = '';
  let fundamentacaoLegal: string[] = [];
  let recomendacoes: string[] = [];

  switch (oportunidade.tipo) {
    case 'CREDITO_NAO_APROVEITADO':
      textoTecnico = gerarTextoCreditoNaoAproveitado(oportunidade);
      fundamentacaoLegal = [
        'Lei nº 10.637/2002 - Art. 3º, inciso II (PIS não cumulativo)',
        'Lei nº 10.833/2003 - Art. 3º, inciso II (COFINS não cumulativo)',
        'Instrução Normativa RFB nº 1.911/2019 - Normas sobre aproveitamento de créditos',
        'Decreto nº 8.426/2015 - Regulamento da contribuição para o PIS/PASEP'
      ];
      recomendacoes = [
        'Análise jurídica e contábil para aproveitamento retroativo via PER/DCOMP',
        'Observar prazo decadencial de cinco anos (Art. 168, I do CTN)',
        'Verificar documentação suporte da operação (notas fiscais, contratos)',
        'Realizar teste de insumo para validar a essencialidade do item',
        'Considerar atualização pela taxa SELIC desde a data de pagamento indevido'
      ];
      break;

    case 'PAGAMENTO_A_MAIOR':
      textoTecnico = gerarTextoPagamentoAMaior(oportunidade);
      fundamentacaoLegal = [
        'Lei nº 10.147/2000 - Regimes especiais de tributação (monofásico/concentrado)',
        'Lei nº 10.637/2002 e Lei nº 10.833/2003 - Regimes de apuração do PIS/COFINS',
        'Tabela 4.3.10 do SPED - Alíquotas por NCM',
        'Tabela 4.3.13 do SPED - Alíquotas específicas por unidade de medida',
        'Decreto nº 8.426/2015 - Regulamentação de alíquotas diferenciadas'
      ];
      recomendacoes = [
        'Calcular valores pagos a maior com atualização pela SELIC',
        'Elaborar pedido de restituição via PER/DCOMP',
        'Corrigir parametrização fiscal no sistema ERP',
        'Retificar escrituração fiscal digital se necessário',
        'Manter documentação probatória arquivada por 5 anos'
      ];
      break;

    case 'INCONSISTENCIA_CST':
      textoTecnico = gerarTextoInconsistenciaCST(oportunidade);
      fundamentacaoLegal = [
        'Instrução Normativa RFB nº 1.009/2010 - Tabela de CST',
        'Lei nº 10.637/2002 e Lei nº 10.833/2003 - Regimes cumulativo e não cumulativo',
        'Guia Prático EFD-Contribuições - Orientações sobre CST',
        'Ato Declaratório Executivo COFIS nº 31/2010 - Códigos de situação tributária'
      ];
      recomendacoes = [
        'Revisar parametrização fiscal do cadastro de produtos no ERP',
        'Retificar EFD-Contribuições com CST correto',
        'Calcular eventual impacto tributário da correção',
        'Implementar controles internos para evitar recorrência',
        'Realizar auditoria preventiva dos demais produtos'
      ];
      break;

    case 'INCONSISTENCIA_CFOP':
      textoTecnico = gerarTextoInconsistenciaCFOP(oportunidade);
      fundamentacaoLegal = [
        'Ajuste SINIEF nº 19/2016 - Tabela de CFOPs',
        'Lei nº 10.147/2000 - Regime monofásico de tributação',
        'Instrução Normativa RFB nº 1.911/2019 - Escrituração fiscal',
        'Convênio ICMS nº 142/2018 - Operações interestaduais'
      ];
      recomendacoes = [
        'Corrigir CFOP nas operações futuras',
        'Avaliar necessidade de retificação de escriturações anteriores',
        'Verificar se há débito não recolhido ou crédito indevido',
        'Treinar equipe fiscal sobre classificação correta de operações',
        'Implementar validações automáticas no sistema de emissão de notas'
      ];
      break;

    case 'MONOFASICO_INCORRETO':
      textoTecnico = gerarTextoMonofasicoIncorreto(oportunidade);
      fundamentacaoLegal = [
        'Lei nº 10.147/2000 - Regime monofásico de PIS/COFINS',
        'Lei nº 10.485/2002 - Produtos farmacêuticos',
        'Lei nº 10.560/2002 - Produtos de perfumaria e higiene pessoal',
        'Decreto nº 8.393/2015 - Alíquotas específicas do regime monofásico',
        'Instrução Normativa RFB nº 1.911/2019 - Escrituração do regime monofásico'
      ];
      recomendacoes = [
        'Utilizar CST adequado para produto monofásico (04, 05, 06, 07, 08 ou 09)',
        'Verificar se a empresa é substituta tributária do produto',
        'Retificar escriturações com tributação indevida',
        'Calcular valores recolhidos indevidamente para restituição',
        'Revisar todo o cadastro de produtos monofásicos no sistema'
      ];
      break;

    case 'SALDO_CREDOR_ICMS':
    case 'SALDO_CREDOR_IPI':
    case 'FECHAMENTO_DIVERGENTE':
      textoTecnico = gerarTextoApuracaoIcmsIpi(oportunidade);
      fundamentacaoLegal = [
        'Lei Complementar nº 87/1996 - Apuração do ICMS e créditos',
        'Regulamento/Decreto estadual do ICMS (imposto de competência estadual)',
        'Decreto nº 7.212/2010 (RIPI/2010), art. 264 - Apuração do IPI',
        'Lei nº 9.430/1996, arts. 73 a 85 - Restituição e compensação de créditos',
        'Instrução Normativa RFB nº 1.717/2017 - Restituição de saldos credores',
        'Guia Prático EFD ICMS/IPI (bloco E) - Apuração de impostos'
      ];
      recomendacoes = [
        'Conferir os valores de débitos, créditos e estornos do bloco E (E110 do ICMS e E510/E520 do IPI)',
        'Validar a escrituração contra os livros de apuração (GIA/ECF e Livro de Apuração do IPI)',
        'Formalizar pedido de ressarcimento/compensação no eCAC para saldos credores',
        'Revisar a apuração com o contador/fiscal antes de retificar o arquivo',
        'Acompanhar os prazos de homologação e a atualização da escrituração contábil e fiscal'
      ];
      break;
  }

  return {
    id,
    oportunidade,
    textoTecnico,
    fundamentacaoLegal,
    recomendacoes
  };
};

function gerarTextoCreditoNaoAproveitado(op: OportunidadeTributaria): string {
  return `Foi identificada a possibilidade de aproveitamento de crédito de PIS/COFINS referente ao item ${op.ncm ? `NCM ${op.ncm}` : ''} ${op.produto ? `(${op.produto})` : ''}, lançado com o CFOP ${op.cfop || 'não informado'}.

A operação está enquadrada no regime não cumulativo, e o ${op.cst ? `CST ${op.cst}` : 'código de situação tributária utilizado'} permite o aproveitamento integral de créditos, nos termos do art. 3º, inciso II, da Lei nº 10.637/2002 e da Lei nº 10.833/2003.

Contudo, não foram encontrados lançamentos correspondentes nos registros de apuração de créditos (Bloco M105/M505 da EFD-Contribuições), sugerindo crédito não escriturado no valor estimado de ${formatarMoeda(op.impactoFinanceiro)}.

${op.valorBase > 0 ? `A base de cálculo da operação foi de ${formatarMoeda(op.valorBase)}, e considerando as alíquotas padrão do regime não cumulativo (1,65% para PIS e 7,6% para COFINS), o crédito potencial totaliza ${formatarMoeda(op.diferenca)}.` : ''}

Esta situação representa uma **oportunidade de recuperação de créditos tributários** não aproveitados anteriormente, caracterizando direito creditório da empresa perante a Receita Federal do Brasil.`;
}

function gerarTextoPagamentoAMaior(op: OportunidadeTributaria): string {
  const aliqAplicada = op.aliquotaAplicada || 0;
  const aliqDevida = op.aliquotaDevida || 0;
  const diferenca = aliqAplicada - aliqDevida;
  
  return `Constatou-se tributação em desconformidade com a legislação vigente para o item ${op.ncm ? `NCM ${op.ncm}` : ''} ${op.produto ? `(${op.produto})` : ''}, ${diferenca > 0 ? 'com aplicação de alíquota superior à devida' : 'com possível inconsistência nas alíquotas aplicadas'}.

${aliqAplicada > 0 && aliqDevida > 0 ? `A operação foi tributada com alíquota total de ${aliqAplicada.toFixed(2)}%, enquanto a legislação vigente (Lei nº 10.147/2000 e Tabelas 4.3.10, 4.3.13 e 4.3.14 do SPED) estabelece alíquota ${diferenca > 0 ? 'reduzida' : 'diferenciada'} de ${aliqDevida.toFixed(2)}%.` : ''}

${diferenca > 0 ? `A diferença gerou recolhimento a maior no montante de ${formatarMoeda(op.diferenca)}, sobre base de cálculo de ${formatarMoeda(op.valorBase)}, representando potencial de recuperação tributária via PER/DCOMP.` : `Verificou-se inconsistência no valor de ${formatarMoeda(op.diferenca)}, que requer análise detalhada para determinar o correto tratamento tributário.`}

Recomenda-se ${diferenca > 0 ? 'proceder à solicitação de restituição/compensação dos valores pagos a maior' : 'regularizar a situação fiscal'}, com acréscimos de juros calculados conforme a taxa SELIC acumulada desde a data do recolhimento indevido até a efetiva restituição ou compensação.

${op.impactoFinanceiro > 10000 ? 'Considerando a materialidade do valor envolvido, sugere-se priorizar esta ação no planejamento tributário da empresa.' : ''}`;
}

function gerarTextoInconsistenciaCST(op: OportunidadeTributaria): string {
  return `Verificou-se utilização de código de situação tributária (CST) incompatível com o regime tributário da empresa ${op.cst ? `(CST ${op.cst} aplicado)` : ''} para o item ${op.ncm ? `NCM ${op.ncm}` : ''} ${op.produto ? `(${op.produto})` : ''}.

A classificação incorreta do CST configura **erro material de escrituração fiscal digital**, podendo resultar em:
- Recolhimento tributário em valor divergente do devido (a maior ou a menor);
- Aproveitamento indevido ou perda de créditos fiscais legítimos;
- Exposição a autuações fiscais e aplicação de multas pela Receita Federal.

${op.cfop ? `A operação foi registrada com CFOP ${op.cfop}, ` : ''}${op.diferenca !== 0 ? `resultando em divergência de ${formatarMoeda(Math.abs(op.diferenca))} ${op.diferenca > 0 ? 'de recolhimento a maior' : 'de potencial débito não recolhido'}.` : 'o que requer análise quanto ao impacto tributário.'}

Esta inconsistência demanda **revisão imediata das parametrizações fiscais** no sistema ERP da empresa, bem como **retificação da EFD-Contribuições** para os períodos afetados.

${op.impactoFinanceiro > 0 ? `O impacto financeiro estimado desta inconsistência é de ${formatarMoeda(op.impactoFinanceiro)}, considerando as operações identificadas no período analisado.` : ''}

A correção tempestiva mitiga riscos de autuação e permite regularização espontânea, nos termos do art. 138 do Código Tributário Nacional, com redução de penalidades.`;
}

function gerarTextoInconsistenciaCFOP(op: OportunidadeTributaria): string {
  return `Identificou-se utilização inadequada do Código Fiscal de Operações e Prestações (CFOP ${op.cfop || 'não informado'}) na operação envolvendo ${op.ncm ? `o item NCM ${op.ncm}` : 'o produto'} ${op.produto ? `(${op.produto})` : ''}.

O CFOP é elemento essencial para determinação do correto tratamento tributário das operações, impactando diretamente:
- O direito ao aproveitamento de créditos de PIS/COFINS;
- A base de cálculo das contribuições;
- A apuração de débitos no regime não cumulativo;
- A classificação entre operações tributadas, isentas, suspensas ou com alíquota zero.

${op.diferenca > 0 ? `A classificação incorreta resultou em ${formatarMoeda(op.diferenca)} de divergência tributária, ` : ''}${op.tipo === 'MONOFASICO_INCORRETO' ? 'sendo que o produto está sujeito ao regime monofásico de tributação e não deveria gerar débito nesta etapa da cadeia.' : 'podendo caracterizar tanto crédito não aproveitado quanto débito indevido.'}

Importante destacar que ${op.cfop?.startsWith('1') || op.cfop?.startsWith('2') || op.cfop?.startsWith('3') ? 'operações de entrada (CFOPs iniciados em 1, 2 ou 3) com CST de crédito admitido devem gerar crédito correspondente nos registros M105/M505' : 'a correta classificação do CFOP é fundamental para conformidade fiscal'}.

Recomenda-se:
- Revisão da tabela de CFOPs parametrizada no sistema de emissão de documentos fiscais;
- Análise das operações semelhantes para identificar padrão de erro;
- ${op.diferenca !== 0 ? 'Retificação das escriturações fiscais e regularização do valor divergente;' : 'Correção imediata para operações futuras;'}
- Treinamento da equipe fiscal sobre classificação fiscal de operações.`;
}

function gerarTextoMonofasicoIncorreto(op: OportunidadeTributaria): string {
  return `Detectou-se **tributação incorreta de produto sujeito ao regime monofásico** de PIS/COFINS, especificamente o item ${op.ncm ? `NCM ${op.ncm}` : ''} ${op.produto ? `(${op.produto})` : ''}.

No regime monofásico, estabelecido pela Lei nº 10.147/2000 e legislações posteriores, a tributação de PIS/COFINS ocorre **concentrada em uma única etapa da cadeia produtiva**, geralmente na indústria ou importação, com alíquotas específicas e majoradas. As demais etapas (atacado, varejo, revenda) operam com **alíquota zero ou suspensão**.

${op.cst ? `O código de situação tributária utilizado (CST ${op.cst}) indica tributação na etapa de revenda, o que está em desacordo com o regime monofásico aplicável ao produto.` : 'A forma de tributação aplicada não está em conformidade com o regime especial.'}

**Produtos típicos do regime monofásico incluem:**
- Medicamentos e produtos farmacêuticos (NCMs iniciados em 30);
- Produtos de perfumaria, higiene pessoal e cosméticos;
- Autopeças e pneumáticos;
- Papel imune (jornais e periódicos);
- Máquinas e veículos.

${op.diferenca > 0 ? `A tributação indevida resultou em recolhimento a maior de ${formatarMoeda(op.diferenca)} sobre base de ${formatarMoeda(op.valorBase)}, passível de restituição via PER/DCOMP.` : ''}

**Consequências da classificação incorreta:**
- Recolhimento indevido de PIS/COFINS em etapa não tributada;
- Bitributação (caso o produto já tenha sido tributado na origem);
- Perda de competitividade por oneração fiscal incorreta;
- Risco de autuação por escrituração incorreta.

${op.impactoFinanceiro > 0 ? `O impacto financeiro total estimado é de ${formatarMoeda(op.impactoFinanceiro)}, considerando as operações identificadas no período.` : ''}

**Ações corretivas necessárias:**
1. Verificar se a empresa é substituta tributária ou revendedora;
2. Utilizar CST adequado ao regime monofásico (04, 05, 06, 07, 08 ou 09);
3. Retificar escriturações fiscais dos períodos incorretos;
4. Solicitar restituição dos valores pagos indevidamente;
5. Corrigir cadastro fiscal de todos os produtos monofásicos.`;
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

/**
 * Gera relatórios textuais para múltiplas oportunidades
 */
export const gerarRelatoriosTextuais = (oportunidades: OportunidadeTributaria[]): RelatorioTextual[] => {
  return oportunidades.map(op => gerarRelatorioTextual(op));
};

/**
 * Gera resumo executivo consolidado de todas as oportunidades
 */
export const gerarResumoExecutivo = (relatorios: RelatorioTextual[]): string => {
  if (relatorios.length === 0) {
    return 'Nenhuma oportunidade tributária identificada no período analisado.';
  }

  const totalImpacto = relatorios.reduce((sum, r) => sum + r.oportunidade.impactoFinanceiro, 0);
  const porTipo = relatorios.reduce((acc, r) => {
    acc[r.oportunidade.tipo] = (acc[r.oportunidade.tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const porSeveridade = relatorios.reduce((acc, r) => {
    acc[r.oportunidade.severidade] = (acc[r.oportunidade.severidade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return `# RESUMO EXECUTIVO - OPORTUNIDADES TRIBUTÁRIAS

## Contexto Geral

O presente relatório consolida a análise técnica de oportunidades tributárias identificadas na escrituração fiscal digital EFD-Contribuições da empresa, referente ao período apurado.

Foram identificadas **${relatorios.length} oportunidades tributárias**, com impacto financeiro total estimado de **${formatarMoeda(totalImpacto)}**, abrangendo créditos não aproveitados, pagamentos indevidos e inconsistências na classificação fiscal.

## Distribuição por Categoria

${Object.entries(porTipo).map(([tipo, qtd]) => `- **${getTipoNome(tipo)}**: ${qtd} ocorrência${qtd > 1 ? 's' : ''}`).join('\n')}

## Classificação por Severidade

${Object.entries(porSeveridade).map(([sev, qtd]) => `- **${sev.charAt(0).toUpperCase() + sev.slice(1)}**: ${qtd} caso${qtd > 1 ? 's' : ''}`).join('\n')}

## Principais Achados

${relatorios.slice(0, 3).map((r, i) => 
  `${i + 1}. **${r.oportunidade.titulo}** - Impacto: ${formatarMoeda(r.oportunidade.impactoFinanceiro)}`
).join('\n')}

## Recomendações Gerais

1. **Priorização**: Recomenda-se iniciar pelas oportunidades de alta severidade e maior impacto financeiro.
2. **Prazo Decadencial**: Observar o prazo de 5 anos para pleitear restituição/compensação de tributos pagos indevidamente.
3. **Retificação**: Proceder à retificação das escriturações fiscais quando necessário.
4. **Conformidade**: Implementar controles internos para evitar recorrência das inconsistências.
5. **Documentação**: Manter documentação suporte arquivada pelo prazo legal de 5 anos.

---

*Relatório gerado automaticamente pelo Sistema de Análise Fiscal EFD*`;
};

function getTipoNome(tipo: string): string {
  const nomes: Record<string, string> = {
    'CREDITO_NAO_APROVEITADO': 'Créditos Não Aproveitados',
    'PAGAMENTO_A_MAIOR': 'Pagamentos a Maior',
    'INCONSISTENCIA_CST': 'Inconsistências de CST',
    'INCONSISTENCIA_CFOP': 'Inconsistências de CFOP',
    'MONOFASICO_INCORRETO': 'Tributação Monofásica Incorreta',
    'SALDO_CREDOR_ICMS': 'Saldos Credores de ICMS',
    'SALDO_CREDOR_IPI': 'Saldos Credores de IPI',
    'FECHAMENTO_DIVERGENTE': 'Fechamentos Divergentes'
  };
  return nomes[tipo] || tipo;
}

function gerarTextoApuracaoIcmsIpi(op: OportunidadeTributaria): string {
  switch (op.tipo) {
    case 'SALDO_CREDOR_ICMS':
      return `A apuração do ICMS no período (bloco E100/E110 da EFD ICMS/IPI) encerrou com **saldo credor de ${formatarMoeda(op.impactoFinanceiro)}**. Esse valor pode ser transportado para os períodos seguintes, utilizado em compensação com débitos do próprio imposto ou, conforme a legislação estadual, objeto de ressarcimento/transferência de crédito.

Para formalizar o aproveitamento é recomendável: (i) conferir a apuração contra a GIA/ECF; (ii) verificar a admissibilidade do crédito (não cumulatividade do ICMS, art. 20 da LC 87/1996); e (iii) observar a legislação estadual quanto a FECP, CIAP e saldo credor acumulado.

O valor está sujeito à validação pela autoridade tributária — não constitui direito líquido e certo antes da homologação.`;
    case 'SALDO_CREDOR_IPI':
      return `A apuração do IPI no período (bloco E500/E520) encerrou com **saldo credor de ${formatarMoeda(op.impactoFinanceiro)}**, passível de manutenção em conta gráfica, compensação ou ressarcimento (art. 264 do RIPI/2010; Lei nº 9.430/1996, arts. 73 a 85).

Creditos de IPI decorrentes de entradas (E510) e outros créditos (E530) devem estar devidamente escriturados e comprovados por documentos fiscais idôneos. Recomenda-se formalizar o pedido de ressarcimento/compensação no eCAC e retificar o arquivo caso a conferência do E520 aponte diferenças.`;
    case 'FECHAMENTO_DIVERGENTE':
    default:
      return `As conferências de fechamento do bloco E apontam divergências de apuração no valor de **${formatarMoeda(op.impactoFinanceiro)}**: ${op.descricao}.

${op.detalhamentoTecnico ? `**Análise técnica:** ${op.detalhamentoTecnico}` : ''}

A diferença pode indicar (i) débito não recolhido (salvo estorno ou crédito não escriturado), (ii) crédito indevido aproveitado, ou (iii) erro de preenchimento dos campos do E110/E520. Recomenda-se revisar a escrituração do bloco E contra a GIA/ECF e os livros fiscais antes de retificar o arquivo.`;
  }
}
