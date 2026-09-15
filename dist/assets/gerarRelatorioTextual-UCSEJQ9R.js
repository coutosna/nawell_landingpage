import{av as H,r as u,aw as j,j as n,ax as U,ay as P,az as K,aA as fe,aB as W,aC as ve,aD as Ce,R as f,aE as be,$ as w,aF as Ie}from"./index-DPuSzKld.js";var h="Collapsible",[ge,X]=H(h),[Ae,q]=ge(h),Y=u.forwardRef((e,t)=>{const{__scopeCollapsible:o,open:r,defaultOpen:a,disabled:i,onOpenChange:s,...d}=e,[m,p]=j({prop:r,defaultProp:a??!1,onChange:s,caller:h});return n.jsx(Ae,{scope:o,disabled:i,contentId:U(),open:m,onOpenToggle:u.useCallback(()=>p(v=>!v),[p]),children:n.jsx(P.div,{"data-state":L(m),"data-disabled":i?"":void 0,...d,ref:t})})});Y.displayName=h;var J="CollapsibleTrigger",Q=u.forwardRef((e,t)=>{const{__scopeCollapsible:o,...r}=e,a=q(J,o);return n.jsx(P.button,{type:"button","aria-controls":a.contentId,"aria-expanded":a.open||!1,"data-state":L(a.open),"data-disabled":a.disabled?"":void 0,disabled:a.disabled,...r,ref:t,onClick:K(e.onClick,a.onOpenToggle)})});Q.displayName=J;var y="CollapsibleContent",Z=u.forwardRef((e,t)=>{const{forceMount:o,...r}=e,a=q(y,e.__scopeCollapsible);return n.jsx(fe,{present:o||a.open,children:({present:i})=>n.jsx(Re,{...r,ref:t,present:i})})});Z.displayName=y;var Re=u.forwardRef((e,t)=>{const{__scopeCollapsible:o,present:r,children:a,...i}=e,s=q(y,o),[d,m]=u.useState(r),p=u.useRef(null),v=W(t,p),C=u.useRef(0),E=C.current,I=u.useRef(0),S=I.current,g=s.open||d,A=u.useRef(g),R=u.useRef(void 0);return u.useEffect(()=>{const c=requestAnimationFrame(()=>A.current=!1);return()=>cancelAnimationFrame(c)},[]),ve(()=>{const c=p.current;if(c){R.current=R.current||{transitionDuration:c.style.transitionDuration,animationName:c.style.animationName},c.style.transitionDuration="0s",c.style.animationName="none";const O=c.getBoundingClientRect();C.current=O.height,I.current=O.width,A.current||(c.style.transitionDuration=R.current.transitionDuration,c.style.animationName=R.current.animationName),m(r)}},[s.open,r]),n.jsx(P.div,{"data-state":L(s.open),"data-disabled":s.disabled?"":void 0,id:s.contentId,hidden:!g,...i,ref:v,style:{"--radix-collapsible-content-height":E?`${E}px`:void 0,"--radix-collapsible-content-width":S?`${S}px`:void 0,...e.style},children:g&&a})});function L(e){return e?"open":"closed"}var Ee=Y,Oe=Q,Pe=Z,b="Accordion",Se=["Home","End","ArrowDown","ArrowUp","ArrowLeft","ArrowRight"],[z,Ne,he]=Ce(b),[x,Xe]=H(b,[he,X]),k=X(),ee=f.forwardRef((e,t)=>{const{type:o,...r}=e,a=r,i=r;return n.jsx(z.Provider,{scope:e.__scopeAccordion,children:o==="multiple"?n.jsx(Fe,{...i,ref:t}):n.jsx(Te,{...a,ref:t})})});ee.displayName=b;var[oe,xe]=x(b),[ae,$e]=x(b,{collapsible:!1}),Te=f.forwardRef((e,t)=>{const{value:o,defaultValue:r,onValueChange:a=()=>{},collapsible:i=!1,...s}=e,[d,m]=j({prop:o,defaultProp:r??"",onChange:a,caller:b});return n.jsx(oe,{scope:e.__scopeAccordion,value:f.useMemo(()=>d?[d]:[],[d]),onItemOpen:m,onItemClose:f.useCallback(()=>i&&m(""),[i,m]),children:n.jsx(ae,{scope:e.__scopeAccordion,collapsible:i,children:n.jsx(re,{...s,ref:t})})})}),Fe=f.forwardRef((e,t)=>{const{value:o,defaultValue:r,onValueChange:a=()=>{},...i}=e,[s,d]=j({prop:o,defaultProp:r??[],onChange:a,caller:b}),m=f.useCallback(v=>d((C=[])=>[...C,v]),[d]),p=f.useCallback(v=>d((C=[])=>C.filter(E=>E!==v)),[d]);return n.jsx(oe,{scope:e.__scopeAccordion,value:s,onItemOpen:m,onItemClose:p,children:n.jsx(ae,{scope:e.__scopeAccordion,collapsible:!0,children:n.jsx(re,{...i,ref:t})})})}),[_e,$]=x(b),re=f.forwardRef((e,t)=>{const{__scopeAccordion:o,disabled:r,dir:a,orientation:i="vertical",...s}=e,d=f.useRef(null),m=W(d,t),p=Ne(o),C=be(a)==="ltr",E=K(e.onKeyDown,I=>{var B;if(!Se.includes(I.key))return;const S=I.target,g=p().filter(D=>{var G;return!((G=D.ref.current)!=null&&G.disabled)}),A=g.findIndex(D=>D.ref.current===S),R=g.length;if(A===-1)return;I.preventDefault();let c=A;const O=0,T=R-1,F=()=>{c=A+1,c>T&&(c=O)},_=()=>{c=A-1,c<O&&(c=T)};switch(I.key){case"Home":c=O;break;case"End":c=T;break;case"ArrowRight":i==="horizontal"&&(C?F():_());break;case"ArrowDown":i==="vertical"&&F();break;case"ArrowLeft":i==="horizontal"&&(C?_():F());break;case"ArrowUp":i==="vertical"&&_();break}const pe=c%R;(B=g[pe].ref.current)==null||B.focus()});return n.jsx(_e,{scope:o,disabled:r,direction:a,orientation:i,children:n.jsx(z.Slot,{scope:o,children:n.jsx(P.div,{...s,"data-orientation":i,ref:m,onKeyDown:r?void 0:E})})})}),N="AccordionItem",[De,V]=x(N),ie=f.forwardRef((e,t)=>{const{__scopeAccordion:o,value:r,...a}=e,i=$(N,o),s=xe(N,o),d=k(o),m=U(),p=r&&s.value.includes(r)||!1,v=i.disabled||e.disabled;return n.jsx(De,{scope:o,open:p,disabled:v,triggerId:m,children:n.jsx(Ee,{"data-orientation":i.orientation,"data-state":le(p),...d,...a,ref:t,disabled:v,open:p,onOpenChange:C=>{C?s.onItemOpen(r):s.onItemClose(r)}})})});ie.displayName=N;var te="AccordionHeader",ne=f.forwardRef((e,t)=>{const{__scopeAccordion:o,...r}=e,a=$(b,o),i=V(te,o);return n.jsx(P.h3,{"data-orientation":a.orientation,"data-state":le(i.open),"data-disabled":i.disabled?"":void 0,...r,ref:t})});ne.displayName=te;var M="AccordionTrigger",se=f.forwardRef((e,t)=>{const{__scopeAccordion:o,...r}=e,a=$(b,o),i=V(M,o),s=$e(M,o),d=k(o);return n.jsx(z.ItemSlot,{scope:o,children:n.jsx(Oe,{"aria-disabled":i.open&&!s.collapsible||void 0,"data-orientation":a.orientation,id:i.triggerId,...d,...r,ref:t})})});se.displayName=M;var ce="AccordionContent",de=f.forwardRef((e,t)=>{const{__scopeAccordion:o,...r}=e,a=$(b,o),i=V(ce,o),s=k(o);return n.jsx(Pe,{role:"region","aria-labelledby":i.triggerId,"data-orientation":a.orientation,...s,...r,ref:t,style:{"--radix-accordion-content-height":"var(--radix-collapsible-content-height)","--radix-accordion-content-width":"var(--radix-collapsible-content-width)",...e.style}})});de.displayName=ce;function le(e){return e?"open":"closed"}var Me=ee,je=ie,we=ne,ue=se,me=de;const Ye=Me,qe=u.forwardRef(({className:e,...t},o)=>n.jsx(je,{ref:o,className:w("border-b",e),...t}));qe.displayName="AccordionItem";const ye=u.forwardRef(({className:e,children:t,...o},r)=>n.jsx(we,{className:"flex",children:n.jsxs(ue,{ref:r,className:w("flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",e),...o,children:[t,n.jsx(Ie,{className:"h-4 w-4 shrink-0 transition-transform duration-200"})]})}));ye.displayName=ue.displayName;const Le=u.forwardRef(({className:e,children:t,...o},r)=>n.jsx(me,{ref:r,className:"overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",...o,children:n.jsx("div",{className:w("pb-4 pt-0",e),children:t})}));Le.displayName=me.displayName;const ze=e=>{const t=`REL_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;let o="",r=[],a=[];switch(e.tipo){case"CREDITO_NAO_APROVEITADO":o=ke(e),r=["Lei nº 10.637/2002 - Art. 3º, inciso II (PIS não cumulativo)","Lei nº 10.833/2003 - Art. 3º, inciso II (COFINS não cumulativo)","Instrução Normativa RFB nº 1.911/2019 - Normas sobre aproveitamento de créditos","Decreto nº 8.426/2015 - Regulamento da contribuição para o PIS/PASEP"],a=["Análise jurídica e contábil para aproveitamento retroativo via PER/DCOMP","Observar prazo decadencial de cinco anos (Art. 168, I do CTN)","Verificar documentação suporte da operação (notas fiscais, contratos)","Realizar teste de insumo para validar a essencialidade do item","Considerar atualização pela taxa SELIC desde a data de pagamento indevido"];break;case"PAGAMENTO_A_MAIOR":o=Ve(e),r=["Lei nº 10.147/2000 - Regimes especiais de tributação (monofásico/concentrado)","Lei nº 10.637/2002 e Lei nº 10.833/2003 - Regimes de apuração do PIS/COFINS","Tabela 4.3.10 do SPED - Alíquotas por NCM","Tabela 4.3.13 do SPED - Alíquotas específicas por unidade de medida","Decreto nº 8.426/2015 - Regulamentação de alíquotas diferenciadas"],a=["Calcular valores pagos a maior com atualização pela SELIC","Elaborar pedido de restituição via PER/DCOMP","Corrigir parametrização fiscal no sistema ERP","Retificar escrituração fiscal digital se necessário","Manter documentação probatória arquivada por 5 anos"];break;case"INCONSISTENCIA_CST":o=Be(e),r=["Instrução Normativa RFB nº 1.009/2010 - Tabela de CST","Lei nº 10.637/2002 e Lei nº 10.833/2003 - Regimes cumulativo e não cumulativo","Guia Prático EFD-Contribuições - Orientações sobre CST","Ato Declaratório Executivo COFIS nº 31/2010 - Códigos de situação tributária"],a=["Revisar parametrização fiscal do cadastro de produtos no ERP","Retificar EFD-Contribuições com CST correto","Calcular eventual impacto tributário da correção","Implementar controles internos para evitar recorrência","Realizar auditoria preventiva dos demais produtos"];break;case"INCONSISTENCIA_CFOP":o=Ge(e),r=["Ajuste SINIEF nº 19/2016 - Tabela de CFOPs","Lei nº 10.147/2000 - Regime monofásico de tributação","Instrução Normativa RFB nº 1.911/2019 - Escrituração fiscal","Convênio ICMS nº 142/2018 - Operações interestaduais"],a=["Corrigir CFOP nas operações futuras","Avaliar necessidade de retificação de escriturações anteriores","Verificar se há débito não recolhido ou crédito indevido","Treinar equipe fiscal sobre classificação correta de operações","Implementar validações automáticas no sistema de emissão de notas"];break;case"MONOFASICO_INCORRETO":o=He(e),r=["Lei nº 10.147/2000 - Regime monofásico de PIS/COFINS","Lei nº 10.485/2002 - Produtos farmacêuticos","Lei nº 10.560/2002 - Produtos de perfumaria e higiene pessoal","Decreto nº 8.393/2015 - Alíquotas específicas do regime monofásico","Instrução Normativa RFB nº 1.911/2019 - Escrituração do regime monofásico"],a=["Utilizar CST adequado para produto monofásico (04, 05, 06, 07, 08 ou 09)","Verificar se a empresa é substituta tributária do produto","Retificar escriturações com tributação indevida","Calcular valores recolhidos indevidamente para restituição","Revisar todo o cadastro de produtos monofásicos no sistema"];break;case"SALDO_CREDOR_ICMS":case"SALDO_CREDOR_IPI":case"FECHAMENTO_DIVERGENTE":o=Ke(e),r=["Lei Complementar nº 87/1996 - Apuração do ICMS e créditos","Regulamento/Decreto estadual do ICMS (imposto de competência estadual)","Decreto nº 7.212/2010 (RIPI/2010), art. 264 - Apuração do IPI","Lei nº 9.430/1996, arts. 73 a 85 - Restituição e compensação de créditos","Instrução Normativa RFB nº 1.717/2017 - Restituição de saldos credores","Guia Prático EFD ICMS/IPI (bloco E) - Apuração de impostos"],a=["Conferir os valores de débitos, créditos e estornos do bloco E (E110 do ICMS e E510/E520 do IPI)","Validar a escrituração contra os livros de apuração (GIA/ECF e Livro de Apuração do IPI)","Formalizar pedido de ressarcimento/compensação no eCAC para saldos credores","Revisar a apuração com o contador/fiscal antes de retificar o arquivo","Acompanhar os prazos de homologação e a atualização da escrituração contábil e fiscal"];break}return{id:t,oportunidade:e,textoTecnico:o,fundamentacaoLegal:r,recomendacoes:a}};function ke(e){return`Foi identificada a possibilidade de aproveitamento de crédito de PIS/COFINS referente ao item ${e.ncm?`NCM ${e.ncm}`:""} ${e.produto?`(${e.produto})`:""}, lançado com o CFOP ${e.cfop||"não informado"}.

A operação está enquadrada no regime não cumulativo, e o ${e.cst?`CST ${e.cst}`:"código de situação tributária utilizado"} permite o aproveitamento integral de créditos, nos termos do art. 3º, inciso II, da Lei nº 10.637/2002 e da Lei nº 10.833/2003.

Contudo, não foram encontrados lançamentos correspondentes nos registros de apuração de créditos (Bloco M105/M505 da EFD-Contribuições), sugerindo crédito não escriturado no valor estimado de ${l(e.impactoFinanceiro)}.

${e.valorBase>0?`A base de cálculo da operação foi de ${l(e.valorBase)}, e considerando as alíquotas padrão do regime não cumulativo (1,65% para PIS e 7,6% para COFINS), o crédito potencial totaliza ${l(e.diferenca)}.`:""}

Esta situação representa uma **oportunidade de recuperação de créditos tributários** não aproveitados anteriormente, caracterizando direito creditório da empresa perante a Receita Federal do Brasil.`}function Ve(e){const t=e.aliquotaAplicada||0,o=e.aliquotaDevida||0,r=t-o;return`Constatou-se tributação em desconformidade com a legislação vigente para o item ${e.ncm?`NCM ${e.ncm}`:""} ${e.produto?`(${e.produto})`:""}, ${r>0?"com aplicação de alíquota superior à devida":"com possível inconsistência nas alíquotas aplicadas"}.

${t>0&&o>0?`A operação foi tributada com alíquota total de ${t.toFixed(2)}%, enquanto a legislação vigente (Lei nº 10.147/2000 e Tabelas 4.3.10, 4.3.13 e 4.3.14 do SPED) estabelece alíquota ${r>0?"reduzida":"diferenciada"} de ${o.toFixed(2)}%.`:""}

${r>0?`A diferença gerou recolhimento a maior no montante de ${l(e.diferenca)}, sobre base de cálculo de ${l(e.valorBase)}, representando potencial de recuperação tributária via PER/DCOMP.`:`Verificou-se inconsistência no valor de ${l(e.diferenca)}, que requer análise detalhada para determinar o correto tratamento tributário.`}

Recomenda-se ${r>0?"proceder à solicitação de restituição/compensação dos valores pagos a maior":"regularizar a situação fiscal"}, com acréscimos de juros calculados conforme a taxa SELIC acumulada desde a data do recolhimento indevido até a efetiva restituição ou compensação.

${e.impactoFinanceiro>1e4?"Considerando a materialidade do valor envolvido, sugere-se priorizar esta ação no planejamento tributário da empresa.":""}`}function Be(e){return`Verificou-se utilização de código de situação tributária (CST) incompatível com o regime tributário da empresa ${e.cst?`(CST ${e.cst} aplicado)`:""} para o item ${e.ncm?`NCM ${e.ncm}`:""} ${e.produto?`(${e.produto})`:""}.

A classificação incorreta do CST configura **erro material de escrituração fiscal digital**, podendo resultar em:
- Recolhimento tributário em valor divergente do devido (a maior ou a menor);
- Aproveitamento indevido ou perda de créditos fiscais legítimos;
- Exposição a autuações fiscais e aplicação de multas pela Receita Federal.

${e.cfop?`A operação foi registrada com CFOP ${e.cfop}, `:""}${e.diferenca!==0?`resultando em divergência de ${l(Math.abs(e.diferenca))} ${e.diferenca>0?"de recolhimento a maior":"de potencial débito não recolhido"}.`:"o que requer análise quanto ao impacto tributário."}

Esta inconsistência demanda **revisão imediata das parametrizações fiscais** no sistema ERP da empresa, bem como **retificação da EFD-Contribuições** para os períodos afetados.

${e.impactoFinanceiro>0?`O impacto financeiro estimado desta inconsistência é de ${l(e.impactoFinanceiro)}, considerando as operações identificadas no período analisado.`:""}

A correção tempestiva mitiga riscos de autuação e permite regularização espontânea, nos termos do art. 138 do Código Tributário Nacional, com redução de penalidades.`}function Ge(e){var t,o,r;return`Identificou-se utilização inadequada do Código Fiscal de Operações e Prestações (CFOP ${e.cfop||"não informado"}) na operação envolvendo ${e.ncm?`o item NCM ${e.ncm}`:"o produto"} ${e.produto?`(${e.produto})`:""}.

O CFOP é elemento essencial para determinação do correto tratamento tributário das operações, impactando diretamente:
- O direito ao aproveitamento de créditos de PIS/COFINS;
- A base de cálculo das contribuições;
- A apuração de débitos no regime não cumulativo;
- A classificação entre operações tributadas, isentas, suspensas ou com alíquota zero.

${e.diferenca>0?`A classificação incorreta resultou em ${l(e.diferenca)} de divergência tributária, `:""}${e.tipo==="MONOFASICO_INCORRETO"?"sendo que o produto está sujeito ao regime monofásico de tributação e não deveria gerar débito nesta etapa da cadeia.":"podendo caracterizar tanto crédito não aproveitado quanto débito indevido."}

Importante destacar que ${(t=e.cfop)!=null&&t.startsWith("1")||(o=e.cfop)!=null&&o.startsWith("2")||(r=e.cfop)!=null&&r.startsWith("3")?"operações de entrada (CFOPs iniciados em 1, 2 ou 3) com CST de crédito admitido devem gerar crédito correspondente nos registros M105/M505":"a correta classificação do CFOP é fundamental para conformidade fiscal"}.

Recomenda-se:
- Revisão da tabela de CFOPs parametrizada no sistema de emissão de documentos fiscais;
- Análise das operações semelhantes para identificar padrão de erro;
- ${e.diferenca!==0?"Retificação das escriturações fiscais e regularização do valor divergente;":"Correção imediata para operações futuras;"}
- Treinamento da equipe fiscal sobre classificação fiscal de operações.`}function He(e){return`Detectou-se **tributação incorreta de produto sujeito ao regime monofásico** de PIS/COFINS, especificamente o item ${e.ncm?`NCM ${e.ncm}`:""} ${e.produto?`(${e.produto})`:""}.

No regime monofásico, estabelecido pela Lei nº 10.147/2000 e legislações posteriores, a tributação de PIS/COFINS ocorre **concentrada em uma única etapa da cadeia produtiva**, geralmente na indústria ou importação, com alíquotas específicas e majoradas. As demais etapas (atacado, varejo, revenda) operam com **alíquota zero ou suspensão**.

${e.cst?`O código de situação tributária utilizado (CST ${e.cst}) indica tributação na etapa de revenda, o que está em desacordo com o regime monofásico aplicável ao produto.`:"A forma de tributação aplicada não está em conformidade com o regime especial."}

**Produtos típicos do regime monofásico incluem:**
- Medicamentos e produtos farmacêuticos (NCMs iniciados em 30);
- Produtos de perfumaria, higiene pessoal e cosméticos;
- Autopeças e pneumáticos;
- Papel imune (jornais e periódicos);
- Máquinas e veículos.

${e.diferenca>0?`A tributação indevida resultou em recolhimento a maior de ${l(e.diferenca)} sobre base de ${l(e.valorBase)}, passível de restituição via PER/DCOMP.`:""}

**Consequências da classificação incorreta:**
- Recolhimento indevido de PIS/COFINS em etapa não tributada;
- Bitributação (caso o produto já tenha sido tributado na origem);
- Perda de competitividade por oneração fiscal incorreta;
- Risco de autuação por escrituração incorreta.

${e.impactoFinanceiro>0?`O impacto financeiro total estimado é de ${l(e.impactoFinanceiro)}, considerando as operações identificadas no período.`:""}

**Ações corretivas necessárias:**
1. Verificar se a empresa é substituta tributária ou revendedora;
2. Utilizar CST adequado ao regime monofásico (04, 05, 06, 07, 08 ou 09);
3. Retificar escriturações fiscais dos períodos incorretos;
4. Solicitar restituição dos valores pagos indevidamente;
5. Corrigir cadastro fiscal de todos os produtos monofásicos.`}function l(e){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(e)}const Je=e=>e.map(t=>ze(t)),Qe=e=>{if(e.length===0)return"Nenhuma oportunidade tributária identificada no período analisado.";const t=e.reduce((a,i)=>a+i.oportunidade.impactoFinanceiro,0),o=e.reduce((a,i)=>(a[i.oportunidade.tipo]=(a[i.oportunidade.tipo]||0)+1,a),{}),r=e.reduce((a,i)=>(a[i.oportunidade.severidade]=(a[i.oportunidade.severidade]||0)+1,a),{});return`# RESUMO EXECUTIVO - OPORTUNIDADES TRIBUTÁRIAS

## Contexto Geral

O presente relatório consolida a análise técnica de oportunidades tributárias identificadas na escrituração fiscal digital EFD-Contribuições da empresa, referente ao período apurado.

Foram identificadas **${e.length} oportunidades tributárias**, com impacto financeiro total estimado de **${l(t)}**, abrangendo créditos não aproveitados, pagamentos indevidos e inconsistências na classificação fiscal.

## Distribuição por Categoria

${Object.entries(o).map(([a,i])=>`- **${Ue(a)}**: ${i} ocorrência${i>1?"s":""}`).join(`
`)}

## Classificação por Severidade

${Object.entries(r).map(([a,i])=>`- **${a.charAt(0).toUpperCase()+a.slice(1)}**: ${i} caso${i>1?"s":""}`).join(`
`)}

## Principais Achados

${e.slice(0,3).map((a,i)=>`${i+1}. **${a.oportunidade.titulo}** - Impacto: ${l(a.oportunidade.impactoFinanceiro)}`).join(`
`)}

## Recomendações Gerais

1. **Priorização**: Recomenda-se iniciar pelas oportunidades de alta severidade e maior impacto financeiro.
2. **Prazo Decadencial**: Observar o prazo de 5 anos para pleitear restituição/compensação de tributos pagos indevidamente.
3. **Retificação**: Proceder à retificação das escriturações fiscais quando necessário.
4. **Conformidade**: Implementar controles internos para evitar recorrência das inconsistências.
5. **Documentação**: Manter documentação suporte arquivada pelo prazo legal de 5 anos.

---

*Relatório gerado automaticamente pelo Sistema de Análise Fiscal EFD*`};function Ue(e){return{CREDITO_NAO_APROVEITADO:"Créditos Não Aproveitados",PAGAMENTO_A_MAIOR:"Pagamentos a Maior",INCONSISTENCIA_CST:"Inconsistências de CST",INCONSISTENCIA_CFOP:"Inconsistências de CFOP",MONOFASICO_INCORRETO:"Tributação Monofásica Incorreta",SALDO_CREDOR_ICMS:"Saldos Credores de ICMS",SALDO_CREDOR_IPI:"Saldos Credores de IPI",FECHAMENTO_DIVERGENTE:"Fechamentos Divergentes"}[e]||e}function Ke(e){switch(e.tipo){case"SALDO_CREDOR_ICMS":return`A apuração do ICMS no período (bloco E100/E110 da EFD ICMS/IPI) encerrou com **saldo credor de ${l(e.impactoFinanceiro)}**. Esse valor pode ser transportado para os períodos seguintes, utilizado em compensação com débitos do próprio imposto ou, conforme a legislação estadual, objeto de ressarcimento/transferência de crédito.

Para formalizar o aproveitamento é recomendável: (i) conferir a apuração contra a GIA/ECF; (ii) verificar a admissibilidade do crédito (não cumulatividade do ICMS, art. 20 da LC 87/1996); e (iii) observar a legislação estadual quanto a FECP, CIAP e saldo credor acumulado.

O valor está sujeito à validação pela autoridade tributária — não constitui direito líquido e certo antes da homologação.`;case"SALDO_CREDOR_IPI":return`A apuração do IPI no período (bloco E500/E520) encerrou com **saldo credor de ${l(e.impactoFinanceiro)}**, passível de manutenção em conta gráfica, compensação ou ressarcimento (art. 264 do RIPI/2010; Lei nº 9.430/1996, arts. 73 a 85).

Creditos de IPI decorrentes de entradas (E510) e outros créditos (E530) devem estar devidamente escriturados e comprovados por documentos fiscais idôneos. Recomenda-se formalizar o pedido de ressarcimento/compensação no eCAC e retificar o arquivo caso a conferência do E520 aponte diferenças.`;case"FECHAMENTO_DIVERGENTE":default:return`As conferências de fechamento do bloco E apontam divergências de apuração no valor de **${l(e.impactoFinanceiro)}**: ${e.descricao}.

${e.detalhamentoTecnico?`**Análise técnica:** ${e.detalhamentoTecnico}`:""}

A diferença pode indicar (i) débito não recolhido (salvo estorno ou crédito não escriturado), (ii) crédito indevido aproveitado, ou (iii) erro de preenchimento dos campos do E110/E520. Recomenda-se revisar a escrituração do bloco E contra a GIA/ECF e os livros fiscais antes de retificar o arquivo.`}}export{Ye as A,Qe as a,qe as b,ye as c,Le as d,Je as g};
