// Regera src/data/oficial/spedPisCofins.json a partir das Tabelas 4.3.10, 4.3.11 e 4.3.13 do SPED (linhas sem NCM das 4.3.11/4.3.13 ficam de fora: o motor casa por NCM).
import { readFileSync, writeFileSync } from 'node:fs';

const BASE = 'http://www.sped.fazenda.gov.br/spedtabelas/appconsulta/obterTabelaExterna.aspx?idPacote=72&idTabela=';
const TABELAS = { '4.3.10': 162, '4.3.11': 164, '4.3.13': 166 };

const isoDe = (ddmmaaaa) => (ddmmaaaa ? `${ddmmaaaa.slice(4, 8)}-${ddmmaaaa.slice(2, 4)}-${ddmmaaaa.slice(0, 2)}` : null);
const num = (v) => (v ? Number(v.replace(/\./g, '').replace(',', '.')) : null);

const baixar = async (id) => {
  const resp = await fetch(`${BASE}${id}`);
  if (!resp.ok) throw new Error(`SPED respondeu ${resp.status} para a tabela ${id}`);
  const texto = new TextDecoder('latin1').decode(await resp.arrayBuffer());
  const [cabecalho, ...linhas] = texto.split(/\r?\n/).filter(Boolean);
  if (!cabecalho.startsWith('vers')) throw new Error(`Tabela ${id} veio sem cabeçalho de versão`);
  const versao = cabecalho.match(/=\s*([\d.]+)/)?.[1] ?? '';
  return { versao, linhas: linhas.map((l) => l.split('|')) };
};

const resumo = (texto) => (texto.length > 140 ? `${texto.slice(0, 137)}...` : texto);
const ncms = (campo) => (campo || '').split(';').map((n) => n.trim()).filter(Boolean);

const t10 = await baixar(TABELAS['4.3.10']);
const t11 = await baixar(TABELAS['4.3.11']);
const t13 = await baixar(TABELAS['4.3.13']);

const saida = {
  geradoEm: new Date().toISOString().slice(0, 10),
  fonte: 'Portal SPED — Tabelas externas do Sistema PIS/COFINS',
  versoes: { '4.3.10': t10.versao, '4.3.11': t11.versao, '4.3.13': t13.versao },
  // CODIGO, DESC_PROD, DT_INI, DT_FIM, NCM, NCM_EX, EX_IPI, ALIQ_PIS, ALIQ_COFINS
  monofasicoAdValorem: t10.linhas.map((c) => ({
    codigo: c[0], descricao: resumo(c[1]), inicio: isoDe(c[2]), fim: isoDe(c[3]), ncms: ncms(c[4]),
    aliquotaPIS: num(c[7]), aliquotaCOFINS: num(c[8]),
  })),
  // CODIGO, DESC_PROD, DT_INI, DT_FIM, NCM, NCM_EX, EX_IPI, UNID, ALIQ_PIS, ALIQ_COFINS
  porUnidade: t11.linhas.filter((c) => c[4]).map((c) => ({
    codigo: c[0], descricao: resumo(c[1]), inicio: isoDe(c[2]), fim: isoDe(c[3]), ncms: ncms(c[4]),
    unidade: c[7], aliquotaPIS: num(c[8]), aliquotaCOFINS: num(c[9]),
  })),
  // CODIGO, DESC_PROD, DT_INI, DT_FIM, NCM, NCM_EX, EX_IPI
  aliquotaZero: t13.linhas.filter((c) => c[4]).map((c) => ({
    codigo: c[0], descricao: resumo(c[1]), inicio: isoDe(c[2]), fim: isoDe(c[3]), ncms: ncms(c[4]),
  })),
};

const destino = new URL('../src/data/oficial/spedPisCofins.json', import.meta.url);
const semData = ({ geradoEm, ...resto }) => JSON.stringify(resto);
let anterior = null;
try { anterior = JSON.parse(readFileSync(destino, 'utf8')); } catch { /* primeira geração */ }
if (anterior && semData(anterior) === semData(saida)) {
  console.log('Tabelas do SPED sem alteração.');
  process.exit(0);
}
writeFileSync(destino, JSON.stringify(saida) + '\n');
console.log(
  `4.3.10: ${saida.monofasicoAdValorem.length} linhas · 4.3.11: ${saida.porUnidade.length} · 4.3.13: ${saida.aliquotaZero.length}`,
);
