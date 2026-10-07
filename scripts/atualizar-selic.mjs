// Regera src/data/selicMensal.ts a partir da série 4390 do Bacen (Selic acumulada no mês).
import { writeFileSync } from 'node:fs';

const hoje = new Date();
const fim = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados?formato=json&dataInicial=01/01/2015&dataFinal=${fim}`;

const resp = await fetch(url);
if (!resp.ok) throw new Error(`Bacen respondeu ${resp.status}`);
const dados = await resp.json();

const mesCorrente = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
const linhas = dados
  .map(({ data, valor }) => {
    const [, mm, yyyy] = data.split('/');
    return [`${yyyy}-${mm}`, Number(valor)];
  })
  .filter(([mes]) => mes !== mesCorrente)
  .map(([mes, valor]) => `  '${mes}': ${valor},`);

writeFileSync(
  new URL('../src/data/selicMensal.ts', import.meta.url),
  '/** Selic acumulada no mês (% a.m.), série 4390 do Bacen. Atualizar com `npm run atualizar-selic`. */\n' +
    `export const SELIC_MENSAL: Record<string, number> = {\n${linhas.join('\n')}\n};\n`,
);
console.log(`${linhas.length} meses gravados (último: ${linhas.at(-1)})`);
