import{c as P,R as z,r as m,j as e,af as S,a as x,b as u,d as h,n as N,f as g,ag as V,S as T,e as O,L as b,I as U,g as E,h as I,i as A,k as F,l as o,B as D,m as G,ah as J,aa as H,ai as w}from"./index-DN_2--jl.js";import{g as W,a as q,A as Y,b as K,c as Q,d as X}from"./gerarRelatorioTextual-MAEE7uXH.js";import{d as Z,T as $}from"./detectarOportunidadesTributarias-D4_hczGA.js";import{D as R}from"./download-mkDz9Fqu.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ee=P("CircleCheckBig",[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]),v=i=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(i),ae=i=>{switch(i){case"alta":return e.jsx(w,{className:"h-5 w-5 text-destructive"});case"media":return e.jsx(w,{className:"h-5 w-5 text-warning"});case"baixa":return e.jsx(ee,{className:"h-5 w-5 text-primary"});default:return e.jsx(w,{className:"h-5 w-5 text-muted-foreground"})}},C=i=>({CREDITO_NAO_APROVEITADO:"Crédito Não Aproveitado",PAGAMENTO_A_MAIOR:"Pagamento a Maior",INCONSISTENCIA_CST:"Inconsistência CST",INCONSISTENCIA_CFOP:"Inconsistência CFOP",MONOFASICO_INCORRETO:"Monofásico Incorreto",SALDO_CREDOR_ICMS:"Saldo Credor ICMS",SALDO_CREDOR_IPI:"Saldo Credor IPI",FECHAMENTO_DIVERGENTE:"Fechamento Divergente"})[i]||i,ie=z.memo(({efdData:i})=>{const[n,L]=m.useState(""),[f,k]=m.useState("TODOS"),[j,B]=m.useState("TODOS"),c=m.useMemo(()=>{const s=Z(i);return W(s)},[i]),y=m.useMemo(()=>q(c),[c]),p=m.useMemo(()=>c.filter(s=>{var l,r;const d=n===""||s.oportunidade.titulo.toLowerCase().includes(n.toLowerCase())||((l=s.oportunidade.ncm)==null?void 0:l.toLowerCase().includes(n.toLowerCase()))||((r=s.oportunidade.produto)==null?void 0:r.toLowerCase().includes(n.toLowerCase()))||s.textoTecnico.toLowerCase().includes(n.toLowerCase()),t=f==="TODOS"||s.oportunidade.tipo===f,a=j==="TODOS"||s.oportunidade.severidade===j;return d&&t&&a}),[c,n,f,j]),M=()=>{let s=y+`

---

`;p.forEach((a,l)=>{s+=`
## ${l+1}. ${a.oportunidade.titulo}

`,s+=`**Tipo:** ${C(a.oportunidade.tipo)}  
`,s+=`**Severidade:** ${a.oportunidade.severidade.toUpperCase()}  
`,s+=`**Impacto Financeiro:** ${v(a.oportunidade.impactoFinanceiro)}  

`,a.oportunidade.ncm&&(s+=`**NCM:** ${a.oportunidade.ncm}  
`),a.oportunidade.cfop&&(s+=`**CFOP:** ${a.oportunidade.cfop}  
`),a.oportunidade.cst&&(s+=`**CST:** ${a.oportunidade.cst}  
`),a.oportunidade.produto&&(s+=`**Produto:** ${a.oportunidade.produto}  

`),s+=`### Análise Técnico-Jurídica

${a.textoTecnico}

`,s+=`### Fundamentação Legal

`,a.fundamentacaoLegal.forEach(r=>{s+=`- ${r}
`}),s+=`
### Recomendações

`,a.recomendacoes.forEach(r=>{s+=`- ${r}
`}),s+=`
### Ação Sugerida

${a.oportunidade.acaoSugerida}

`,s+=`---

`});const d=new Blob([s],{type:"text/markdown;charset=utf-8;"}),t=document.createElement("a");t.href=URL.createObjectURL(d),t.download=`conclusoes_tecnicas_${new Date().toISOString().split("T")[0]}.md`,t.click()},_=()=>{let s=`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conclusões Técnico-Jurídicas - Análise Fiscal EFD</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.8;
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #F3F6F5;
      color: #1B2A28;
    }
    .header {
      background: linear-gradient(135deg, #0D2B28 0%, #14403B 100%);
      color: white;
      padding: 40px;
      border-radius: 12px;
      margin-bottom: 40px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    h1 { margin: 0 0 10px 0; font-size: 2.5em; }
    h2 { color: #0D2B28; margin-top: 40px; border-bottom: 3px solid #14403B; padding-bottom: 10px; }
    h3 { color: #14403B; margin-top: 30px; }
    .card {
      background: white;
      padding: 30px;
      margin: 20px 0;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 600;
      margin-right: 10px;
    }
    .badge-alta { background: #D7E2E0; color: #0D2B28; }
    .badge-media { background: #DDE8EE; color: #31726B; }
    .badge-baixa { background: #EDF2F1; color: #14403B; }
    .metadata {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      margin: 20px 0;
      padding: 20px;
      background: #EDF2F1;
      border-radius: 8px;
    }
    .metadata-item {
      display: flex;
      flex-direction: column;
    }
    .metadata-label {
      font-size: 0.85em;
      color: #6B7C79;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .metadata-value {
      font-size: 1em;
      color: #1B2A28;
      font-weight: 500;
    }
    .text-section {
      background: #F3F6F5;
      padding: 25px;
      border-left: 4px solid #14403B;
      margin: 20px 0;
      border-radius: 4px;
    }
    ul {
      margin: 15px 0;
      padding-left: 25px;
    }
    li {
      margin: 10px 0;
    }
    .resumo {
      background: linear-gradient(135deg, #0D2B2815 0%, #14403B15 100%);
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 40px;
    }
    .footer {
      text-align: center;
      margin-top: 60px;
      padding-top: 30px;
      border-top: 2px solid #D7E2E0;
      color: #6B7C79;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 Conclusões Técnico-Jurídicas</h1>
    <p>Análise Fiscal Automatizada - EFD-Contribuições</p>
    <p><strong>Data de Geração:</strong> ${new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}</p>
  </div>

  <div class="card resumo">
    <h2>Resumo Executivo</h2>
    ${y.split(`
`).map(a=>a.startsWith("# ")?`<h2>${a.substring(2)}</h2>`:a.startsWith("## ")?`<h3>${a.substring(3)}</h3>`:a.startsWith("- ")?`<li>${a.substring(2)}</li>`:a.includes("**")?`<p>${a.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")}</p>`:a?`<p>${a}</p>`:"").join("")}
  </div>
`;p.forEach((a,l)=>{s+=`
  <div class="card">
    <h2>${l+1}. ${a.oportunidade.titulo}</h2>
    
    <div>
      <span class="badge badge-${a.oportunidade.severidade}">${a.oportunidade.severidade.toUpperCase()}</span>
      <span class="badge" style="background: #DDE8EE; color: #14403B;">${C(a.oportunidade.tipo)}</span>
    </div>

    <div class="metadata">
      <div class="metadata-item">
        <span class="metadata-label">Impacto Financeiro</span>
        <span class="metadata-value">${v(a.oportunidade.impactoFinanceiro)}</span>
      </div>
      ${a.oportunidade.ncm?`
      <div class="metadata-item">
        <span class="metadata-label">NCM</span>
        <span class="metadata-value">${a.oportunidade.ncm}</span>
      </div>`:""}
      ${a.oportunidade.cfop?`
      <div class="metadata-item">
        <span class="metadata-label">CFOP</span>
        <span class="metadata-value">${a.oportunidade.cfop}</span>
      </div>`:""}
      ${a.oportunidade.cst?`
      <div class="metadata-item">
        <span class="metadata-label">CST</span>
        <span class="metadata-value">${a.oportunidade.cst}</span>
      </div>`:""}
      ${a.oportunidade.produto?`
      <div class="metadata-item">
        <span class="metadata-label">Produto</span>
        <span class="metadata-value">${a.oportunidade.produto}</span>
      </div>`:""}
    </div>

    <h3>⚖️ Análise Técnico-Jurídica</h3>
    <div class="text-section">
      ${a.textoTecnico.split(`

`).map(r=>`<p>${r.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")}</p>`).join("")}
    </div>

    <h3>📚 Fundamentação Legal</h3>
    <ul>
      ${a.fundamentacaoLegal.map(r=>`<li>${r}</li>`).join("")}
    </ul>

    <h3>💡 Recomendações</h3>
    <ul>
      ${a.recomendacoes.map(r=>`<li>${r}</li>`).join("")}
    </ul>

    <h3>✅ Ação Sugerida</h3>
    <div class="text-section">
      <p><strong>${a.oportunidade.acaoSugerida}</strong></p>
    </div>
  </div>
`}),s+=`
  <div class="footer">
    <p><strong>Sistema de Análise Fiscal EFD</strong></p>
    <p>Relatório gerado automaticamente para fins de análise técnica tributária</p>
    <p>Este documento não substitui análise jurídica especializada</p>
  </div>
</body>
</html>
`;const d=new Blob([s],{type:"text/html;charset=utf-8;"}),t=document.createElement("a");t.href=URL.createObjectURL(d),t.download=`conclusoes_tecnicas_${new Date().toISOString().split("T")[0]}.html`,t.click()};return e.jsxs("div",{className:"space-y-6 animate-fade-in",children:[e.jsxs("div",{className:"relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-efd-primary/5 to-background border-2 p-8 shadow-xl",children:[e.jsx("div",{className:"relative z-10",children:e.jsxs("div",{className:"flex items-center gap-3 mb-3",children:[e.jsx("div",{className:"p-3 bg-gradient-to-br from-primary to-efd-primary rounded-xl shadow-lg shadow-primary/30",children:e.jsx(S,{className:"h-7 w-7 text-white"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-4xl font-display font-bold bg-gradient-to-r from-primary to-efd-primary bg-clip-text text-transparent",children:"Conclusões Técnico-Jurídicas"}),e.jsx("p",{className:"text-muted-foreground font-medium mt-1",children:"Relatórios detalhados com fundamentação legal e recomendações práticas"})]})]})}),e.jsx("div",{className:"absolute -right-8 -top-8 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse-slow"}),e.jsx("div",{className:"absolute -left-8 -bottom-8 w-48 h-48 bg-efd-primary/10 rounded-full blur-3xl animate-pulse-slow"})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-6",children:[e.jsxs(x,{className:"relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 group",children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"}),e.jsxs(u,{className:"flex flex-row items-center justify-between space-y-0 pb-2",children:[e.jsx(h,{className:"text-sm font-semibold text-muted-foreground",children:"Total de Relatórios"}),e.jsx("div",{className:"p-2 bg-primary/10 rounded-lg",children:e.jsx(N,{className:"h-5 w-5 text-primary"})})]}),e.jsxs(g,{children:[e.jsx("div",{className:"text-3xl font-bold text-primary",children:c.length}),e.jsx("p",{className:"text-xs text-muted-foreground mt-1",children:"Análises técnicas completas"})]})]}),e.jsxs(x,{className:"relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 group",children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-br from-success/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"}),e.jsxs(u,{className:"flex flex-row items-center justify-between space-y-0 pb-2",children:[e.jsx(h,{className:"text-sm font-semibold text-muted-foreground",children:"Impacto Total"}),e.jsx("div",{className:"p-2 bg-success/10 rounded-lg",children:e.jsx($,{className:"h-5 w-5 text-success"})})]}),e.jsxs(g,{children:[e.jsx("div",{className:"text-3xl font-bold text-success",children:v(c.reduce((s,d)=>s+d.oportunidade.impactoFinanceiro,0))}),e.jsx("p",{className:"text-xs text-muted-foreground mt-1",children:"Valor potencial identificado"})]})]}),e.jsxs(x,{className:"relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300 group",children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-br from-destructive/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"}),e.jsxs(u,{className:"flex flex-row items-center justify-between space-y-0 pb-2",children:[e.jsx(h,{className:"text-sm font-semibold text-muted-foreground",children:"Alta Prioridade"}),e.jsx("div",{className:"p-2 bg-destructive/10 rounded-lg",children:e.jsx(V,{className:"h-5 w-5 text-destructive"})})]}),e.jsxs(g,{children:[e.jsx("div",{className:"text-3xl font-bold text-destructive",children:c.filter(s=>s.oportunidade.severidade==="alta").length}),e.jsx("p",{className:"text-xs text-muted-foreground mt-1",children:"Requerem ação imediata"})]})]})]}),e.jsxs(x,{className:"border-2 shadow-lg",children:[e.jsxs(u,{children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(T,{className:"h-5 w-5 text-primary"}),e.jsx(h,{children:"Filtros e Exportação"})]}),e.jsx(O,{children:"Refine sua busca e exporte relatórios completos"})]}),e.jsxs(g,{children:[e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-4 mb-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx(b,{htmlFor:"search",children:"Buscar"}),e.jsxs("div",{className:"relative",children:[e.jsx(T,{className:"absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"}),e.jsx(U,{id:"search",placeholder:"NCM, produto, texto...",value:n,onChange:s=>L(s.target.value),className:"pl-9"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(b,{htmlFor:"tipo",children:"Tipo"}),e.jsxs(E,{value:f,onValueChange:k,children:[e.jsx(I,{id:"tipo",children:e.jsx(A,{})}),e.jsxs(F,{children:[e.jsx(o,{value:"TODOS",children:"Todos"}),e.jsx(o,{value:"CREDITO_NAO_APROVEITADO",children:"Crédito Não Aproveitado"}),e.jsx(o,{value:"PAGAMENTO_A_MAIOR",children:"Pagamento a Maior"}),e.jsx(o,{value:"INCONSISTENCIA_CST",children:"Inconsistência CST"}),e.jsx(o,{value:"INCONSISTENCIA_CFOP",children:"Inconsistência CFOP"}),e.jsx(o,{value:"MONOFASICO_INCORRETO",children:"Monofásico Incorreto"}),e.jsx(o,{value:"SALDO_CREDOR_ICMS",children:"Saldo Credor ICMS"}),e.jsx(o,{value:"SALDO_CREDOR_IPI",children:"Saldo Credor IPI"}),e.jsx(o,{value:"FECHAMENTO_DIVERGENTE",children:"Fechamento Divergente"})]})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(b,{htmlFor:"severidade",children:"Severidade"}),e.jsxs(E,{value:j,onValueChange:B,children:[e.jsx(I,{id:"severidade",children:e.jsx(A,{})}),e.jsxs(F,{children:[e.jsx(o,{value:"TODOS",children:"Todas"}),e.jsx(o,{value:"alta",children:"Alta"}),e.jsx(o,{value:"media",children:"Média"}),e.jsx(o,{value:"baixa",children:"Baixa"})]})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(b,{children:"Exportar"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs(D,{onClick:_,variant:"outline",className:"flex-1",children:[e.jsx(R,{className:"h-4 w-4 mr-2"}),"HTML"]}),e.jsxs(D,{onClick:M,variant:"outline",className:"flex-1",children:[e.jsx(R,{className:"h-4 w-4 mr-2"}),"MD"]})]})]})]}),e.jsxs("div",{className:"text-sm text-muted-foreground",children:["Mostrando ",p.length," de ",c.length," relatórios"]})]})]}),e.jsxs(x,{className:"border-2 shadow-lg",children:[e.jsxs(u,{children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(N,{className:"h-5 w-5 text-primary"}),e.jsx(h,{children:"Relatórios Detalhados"})]}),e.jsx(O,{children:"Análise técnico-jurídica de cada oportunidade identificada"})]}),e.jsx(g,{children:p.length>0?e.jsx(Y,{type:"single",collapsible:!0,className:"w-full space-y-4",children:p.map((s,d)=>e.jsxs(K,{value:s.id,className:"border-2 rounded-lg px-4 data-[state=open]:shadow-lg transition-shadow",children:[e.jsx(Q,{className:"hover:no-underline py-4",children:e.jsxs("div",{className:"flex items-start gap-4 text-left w-full pr-4",children:[e.jsx("div",{className:"flex-shrink-0 mt-1",children:ae(s.oportunidade.severidade)}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2 flex-wrap",children:[e.jsxs("span",{className:"font-bold text-lg",children:[d+1,". ",s.oportunidade.titulo]}),e.jsx(G,{variant:"outline",className:"font-semibold",children:C(s.oportunidade.tipo)})]}),e.jsxs("div",{className:"text-sm text-muted-foreground",children:[e.jsx("span",{className:"font-semibold text-success",children:v(s.oportunidade.impactoFinanceiro)}),s.oportunidade.ncm&&e.jsxs("span",{className:"ml-2",children:["• NCM: ",e.jsx("span",{className:"font-mono",children:s.oportunidade.ncm})]}),s.oportunidade.cfop&&e.jsxs("span",{className:"ml-2",children:["• CFOP: ",e.jsx("span",{className:"font-mono",children:s.oportunidade.cfop})]})]})]})]})}),e.jsx(X,{children:e.jsxs("div",{className:"space-y-6 pt-2 pb-4",children:[e.jsxs("div",{className:"bg-gradient-to-br from-primary/50 to-transparent dark:from-primary/20 p-6 rounded-xl border",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-4",children:[e.jsx(S,{className:"h-5 w-5 text-primary"}),e.jsx("h4",{className:"font-bold text-lg",children:"Análise Técnico-Jurídica"})]}),e.jsx("div",{className:"space-y-3 text-sm leading-relaxed",children:s.textoTecnico.split(`

`).map((t,a)=>e.jsx("p",{className:t.includes("**")?"font-semibold text-foreground":"text-muted-foreground",children:t.replace(/\*\*/g,"")},a))})]}),e.jsxs("div",{className:"bg-gradient-to-br from-efd-primary/50 to-transparent dark:from-efd-primary/20 p-6 rounded-xl border",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-4",children:[e.jsx(J,{className:"h-5 w-5 text-efd-primary"}),e.jsx("h4",{className:"font-bold text-lg",children:"Fundamentação Legal"})]}),e.jsx("ul",{className:"space-y-3 ml-1",children:s.fundamentacaoLegal.map((t,a)=>e.jsxs("li",{className:"text-sm flex gap-3",children:[e.jsx("span",{className:"text-efd-primary font-bold",children:"•"}),e.jsx("span",{className:"flex-1",children:t})]},a))})]}),e.jsxs("div",{className:"bg-gradient-to-br from-warning/50 to-transparent dark:from-warning/20 p-6 rounded-xl border",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-4",children:[e.jsx(H,{className:"h-5 w-5 text-warning dark:text-warning"}),e.jsx("h4",{className:"font-bold text-lg",children:"Recomendações"})]}),e.jsx("ul",{className:"space-y-3 ml-1",children:s.recomendacoes.map((t,a)=>e.jsxs("li",{className:"text-sm flex gap-3",children:[e.jsx("span",{className:"text-warning dark:text-warning font-bold",children:"•"}),e.jsx("span",{className:"flex-1",children:t})]},a))})]}),e.jsxs("div",{className:"bg-gradient-to-r from-primary/10 to-efd-primary/10 p-6 rounded-xl border-2 border-primary/20",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx($,{className:"h-5 w-5 text-primary"}),e.jsx("h4",{className:"font-bold text-lg",children:"Ação Sugerida"})]}),e.jsx("p",{className:"text-sm font-semibold text-foreground",children:s.oportunidade.acaoSugerida})]})]})})]},s.id))}):e.jsxs("div",{className:"text-center py-12",children:[e.jsx(N,{className:"h-16 w-16 text-muted-foreground mx-auto mb-4"}),e.jsx("p",{className:"text-lg font-semibold mb-2",children:"Nenhum relatório encontrado"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Ajuste os filtros para ver mais resultados"})]})})]})]})});export{ie as Conclusoes};
