// Lê o texto (OCR) de uma tabela nutricional brasileira e converte para valores por 100 g.
// Suporta o formato novo (RDC 429/2020 e IN 75/2020: colunas 100 g | porção | %VD)
// e o formato antigo (RDC 360/2003: só porção | %VD).

import { atwaterKcal, NutrientKey, Nutrients } from './nutrients';

export type ParsedLabel = {
  per100g: Nutrients;
  serving?: { amount: number; unit: 'g' | 'ml'; description?: string };
  format: 'per100' | 'perServing' | 'unknown';
  found: NutrientKey[];
  warnings: string[];
};

// A ordem importa: rótulos mais específicos antes dos genéricos.
const LINE_PATTERNS: [NutrientKey, RegExp][] = [
  ['kcal', /valor\s*energ|energia\b|calorias/],
  ['addedSugars', /acucares?\s*adicionad/],
  ['sugars', /acucares?(\s*totais)?/],
  ['carbs', /carboidratos?/],
  ['protein', /proteinas?/],
  ['saturatedFat', /gorduras?\s*saturad/],
  ['transFat', /gorduras?\s*trans/],
  ['fat', /gorduras?\s*(totais|total)|lipidios|^gorduras?\b/],
  ['fiber', /fibras?\s*(alimentar|alimentares)?/],
  ['sodium', /sodio/],
  ['calcium', /calcio/],
  ['iron', /ferro\b/],
  ['potassium', /potassio/],
  ['magnesium', /magnesio/],
  ['zinc', /zinco/],
  ['vitaminA', /vitamina\s*a\b/],
  ['vitaminC', /vitamina\s*c\b/],
  ['vitaminD', /vitamina\s*d\b/],
  ['vitaminB12', /vitamina\s*b\s*12/],
  ['cholesterol', /colesterol/],
];

// Linhas que citam um nutriente mas não trazem o valor dele.
const IGNORE_LINE = /nao contem quantidade|percentual de valores|valores diarios|%\s*vd\s*\*|dieta de/;

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[|]/g, ' ')
    .replace(/µg|mcg/g, 'ug')
    // OCR troca 0 por "o" perto de dígitos: "1oo", "6,o", "o,5"
    .replace(/\b(?:\d[\do]*(?:[.,][\do]+)?|o[.,]\d+)(?=\s|$|g\b|mg\b|%)/gm, (t) => t.replace(/o/g, '0'))
    .replace(/[ \t]+/g, ' ');
}

function toNumber(s: string): number {
  return parseFloat(s.replace(',', '.'));
}

function parseServing(text: string): ParsedLabel['serving'] {
  const m = text.match(/porcao(?:\s*de)?\s*:?\s*(\d+(?:[.,]\d+)?)\s*(g|ml)\b\s*(\([^)]*\))?/);
  if (!m) return undefined;
  const description = m[3]?.replace(/[()]/g, '').trim();
  return { amount: toNumber(m[1]), unit: m[2] as 'g' | 'ml', description: description || undefined };
}

/** Números de valor da linha, sem kJ, %VD e números que fazem parte do rótulo (ex.: "B12"). */
export function valuesInLine(rest: string): number[] {
  const cleaned = rest
    .replace(/\(\s*(k?cal|kj|g|mg|ug)\s*\)/g, ' ')
    .replace(/\d+(?:[.,]\d+)?\s*kj\b/g, ' ')
    .replace(/\d+(?:[.,]\d+)?\s*%/g, ' ')
    .replace(/[=*]/g, ' ');
  const nums = cleaned.match(/\d+(?:[.,]\d+)?/g) ?? [];
  return nums.map(toNumber).filter((n) => Number.isFinite(n));
}

export function parseNutritionLabel(rawText: string): ParsedLabel {
  const text = normalize(rawText);
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const serving = parseServing(text);
  const warnings: string[] = [];

  // Formato novo: cabeçalho com coluna "100 g"/"100 ml" fora da linha de porção.
  const hasPer100Column = lines.some(
    (l) => /\b100\s*(g|ml)\b/.test(l) && !/porcao/.test(l) && !/kcal|kj/.test(l),
  );
  const format: ParsedLabel['format'] = hasPer100Column ? 'per100' : serving ? 'perServing' : 'unknown';

  const raw: Nutrients = {};
  for (const line of lines) {
    if (IGNORE_LINE.test(line)) continue;
    for (const [key, pattern] of LINE_PATTERNS) {
      const m = line.match(pattern);
      if (!m || m.index === undefined) continue;
      if (raw[key] !== undefined) break; // primeira ocorrência vale
      if (key === 'kcal' && /\bkj\b/.test(line) && !/kcal/.test(line)) break; // linha só em kJ
      const values = valuesInLine(line.slice(m.index + m[0].length));
      if (values.length > 0) raw[key] = values[0];
      break;
    }
  }

  let per100g: Nutrients = raw;
  if (format === 'perServing' && serving && serving.amount > 0) {
    const factor = 100 / serving.amount;
    per100g = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, Math.round((v as number) * factor * 100) / 100]),
    ) as Nutrients;
  } else if (format === 'unknown' && Object.keys(raw).length > 0) {
    warnings.push('Não encontrei a porção nem a coluna de 100 g. Confira se os valores são por 100 g.');
  }

  if (per100g.kcal === undefined && (per100g.protein ?? per100g.carbs ?? per100g.fat) !== undefined) {
    per100g.kcal = Math.round(atwaterKcal(per100g));
    warnings.push('Valor energético não lido; estimei pelas gramas de proteína, carboidrato e gordura.');
  }

  const macroSum = (per100g.protein ?? 0) + (per100g.carbs ?? 0) + (per100g.fat ?? 0);
  if (macroSum > 105) {
    warnings.push('A soma dos macronutrientes passa de 100 g por 100 g. Revise os números.');
  }
  if (per100g.kcal !== undefined && macroSum > 0) {
    const estimated = atwaterKcal(per100g);
    if (Math.abs(estimated - per100g.kcal) > Math.max(40, per100g.kcal * 0.25)) {
      warnings.push('As calorias não batem com os macronutrientes. Revise os números.');
    }
  }

  const found = (Object.keys(raw) as NutrientKey[]).filter((k) => raw[k] !== undefined);
  for (const key of ['kcal', 'protein', 'carbs', 'fat'] as NutrientKey[]) {
    if (!found.includes(key)) warnings.push(`Não consegui ler: ${key === 'kcal' ? 'valor energético' : key}.`);
  }

  return { per100g, serving, format, found, warnings };
}

// ---- Reconstrução de linhas a partir de caixas do OCR ----
// O OCR nativo pode devolver o nome do nutriente e os números em blocos separados
// (colunas). Agrupamos as palavras pela altura na foto para refazer cada linha da tabela.

export type OcrWord = { text: string; left: number; top: number; width: number; height: number };

export function linesFromWords(words: OcrWord[]): string {
  if (words.length === 0) return '';
  const heights = words.map((w) => w.height).sort((a, b) => a - b);
  const medianHeight = heights[Math.floor(heights.length / 2)] || 1;
  const sorted = [...words].sort((a, b) => a.top + a.height / 2 - (b.top + b.height / 2));

  const rows: { center: number; words: OcrWord[] }[] = [];
  for (const w of sorted) {
    const center = w.top + w.height / 2;
    const row = rows.find((r) => Math.abs(r.center - center) < medianHeight * 0.6);
    if (row) {
      row.words.push(w);
      row.center = row.words.reduce((s, x) => s + x.top + x.height / 2, 0) / row.words.length;
    } else {
      rows.push({ center, words: [w] });
    }
  }
  return rows
    .sort((a, b) => a.center - b.center)
    .map((r) => r.words.sort((a, b) => a.left - b.left).map((w) => w.text).join(' '))
    .join('\n');
}
