// Gera src/data/tacoFull.ts a partir dos CSVs da TACO 4ª ed. (NEPA/Unicamp),
// na versão estruturada do projeto github.com/raulfdm/taco-api (MIT).
// Uso: node scripts/import-taco.mjs

import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(path.dirname(new URL(import.meta.url).pathname), 'taco-csv');

function parseCsv(file) {
  const text = fs.readFileSync(path.join(dir, file), 'utf8').trim();
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    const cells = [];
    let cur = '';
    let quoted = false;
    for (const ch of line) {
      if (ch === '"') quoted = !quoted;
      else if (ch === ',' && !quoted) {
        cells.push(cur);
        cur = '';
      } else cur += ch;
    }
    cells.push(cur);
    rows.push(cells);
  }
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

const num = (v) => {
  if (v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const foods = parseCsv('food.csv');
const categories = Object.fromEntries(parseCsv('categories.csv').map((c) => [c.id, c.name]));
const nutrients = Object.fromEntries(parseCsv('nutrients.csv').map((n) => [n.foodId, n]));
const fats = Object.fromEntries(parseCsv('fatty-acids.csv').map((n) => [n.foodId, n]));
const aminos = Object.fromEntries(parseCsv('amino-acids.csv').map((n) => [n.foodId, n]));

const MAP = {
  kcal: 'kcal',
  protein: 'protein',
  carbohydrates: 'carbs',
  lipids: 'fat',
  dietaryFiber: 'fiber',
  cholesterol: 'cholesterol',
  sodium: 'sodium',
  calcium: 'calcium',
  iron: 'iron',
  potassium: 'potassium',
  magnesium: 'magnesium',
  zinc: 'zinc',
  vitaminC: 'vitaminC',
  rae: 'vitaminA',
};

const out = foods.map((f) => {
  const n = nutrients[f.id] ?? {};
  const per100g = {};
  for (const [src, key] of Object.entries(MAP)) {
    const v = num(n[src]);
    if (v !== undefined) per100g[key] = v;
  }
  const sat = num(fats[f.id]?.saturated);
  if (sat !== undefined) per100g.saturatedFat = sat;
  const leu = num(aminos[f.id]?.leucine);
  if (leu !== undefined) per100g.leucine = leu;
  return { id: `taco-${f.id}`, name: f.name, category: categories[f.categoryId], per100g };
});

const banner = `// Gerado por scripts/import-taco.mjs. Não edite à mão.
// Fonte: Tabela Brasileira de Composição de Alimentos (TACO), 4ª ed., NEPA/Unicamp, 2011.
`;
fs.writeFileSync(
  path.join(dir, '..', '..', 'src', 'data', 'tacoFull.ts'),
  `${banner}\nimport { Nutrients } from '../domain/nutrients';\n\nexport type TacoRow = { id: string; name: string; category: string; per100g: Nutrients };\n\nexport const TACO_ROWS: TacoRow[] = ${JSON.stringify(out)};\n`,
);
console.log(`${out.length} alimentos`);
