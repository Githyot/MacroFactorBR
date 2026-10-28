// Registro por texto livre ou voz: "2 ovos, 100 g de arroz e 1 concha de feijão".

import { yieldFor, rawFromCooked } from './cooking';
import { Food, normalizeSearch, searchFoods } from './foods';
import { findMeasure, measuresFor } from './measures';

export type ParsedItem = {
  text: string;
  quantity: number;
  unit?: string; // "g", "ml", "concha"...
  query: string;
  cooked?: boolean;
};

export type ResolvedItem = ParsedItem & {
  food?: Food;
  grams?: number;
  note?: string;
};

const NUMBER_WORDS: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
  meio: 0.5, meia: 0.5,
};

const UNITS = [
  'kg', 'g', 'gramas?', 'ml', 'litros?', 'l',
  'colher(?:es)? de sopa', 'colher(?:es)? de cha', 'colher(?:es)?', 'conchas?', 'escumadeiras?', 'pegador(?:es)?',
  'xicaras?', 'copos?', 'fatias?', 'unidades?', 'scoops?', 'doses?', 'potes?', 'files?', 'bifes?', 'pedacos?',
  'punhados?', 'pratos?', 'tigelas?', 'claras?', 'ramos?',
];
const UNIT_RE = new RegExp(`^(${UNITS.join('|')})\\b\\s*(de\\s+|do\\s+|da\\s+)?`);

function parseQuantity(s: string): [number, string] {
  const m = s.match(/^(\d+(?:[.,]\d+)?)\s*/);
  if (m) return [parseFloat(m[1].replace(',', '.')), s.slice(m[0].length)];
  const w = s.match(/^(\S+)\s+(e\s+meia?\s+)?/);
  if (w && NUMBER_WORDS[w[1]] !== undefined) {
    return [NUMBER_WORDS[w[1]] + (w[2] ? 0.5 : 0), s.slice(w[0].length)];
  }
  return [1, s];
}

export function parseFreeText(input: string): ParsedItem[] {
  const raw = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/(\d)\s*(g|kg|ml)\b/g, '$1 $2')
    .split(/\s*[,;+\n]\s*|\s+e\s+(?=\d|um\b|uma\b|dois\b|duas\b|tres\b|meio\b|meia\b)/)
    .map((p) => p.trim())
    .filter(Boolean);

  return raw.map((text) => {
    let rest = text;
    const [quantity, afterQty] = parseQuantity(rest);
    rest = afterQty;
    let unit: string | undefined;
    const u = rest.match(UNIT_RE);
    if (u) {
      unit = u[1].replace(/^gramas?$/, 'g').replace(/^litros?$/, 'l');
      rest = rest.slice(u[0].length);
    }
    const cooked = /\bcozid|\bgrelhad|\bassad|\bpronto/.test(rest);
    const query = rest.replace(/\b(de|do|da|dos|das)\b/g, ' ').replace(/\s+/g, ' ').trim();
    return { text, quantity, unit, query, cooked };
  });
}

/** Encontra o alimento e converte a quantidade em gramas na forma cadastrada. */
export function resolveItems(items: ParsedItem[], foods: Food[]): ResolvedItem[] {
  return items.map((item) => {
    const food = searchFoods(foods, item.query)[0];
    if (!food) return item;
    let grams: number | undefined;
    let note: string | undefined;
    const unit = item.unit;
    if (unit === 'g' || unit === 'ml') grams = item.quantity;
    else if (unit === 'kg' || unit === 'l') grams = item.quantity * 1000;
    else if (unit) {
      const m = findMeasure(food, unit);
      if (m) {
        grams = m.grams * item.quantity;
        note = `${item.quantity} ${m.label}`;
      }
    } else {
      // "2 ovos", "1 banana": usa a primeira medida caseira (unidade)
      const m = measuresFor(food)[0];
      if (m) {
        grams = m.grams * item.quantity;
        note = `${item.quantity} ${m.label}`;
      }
    }
    // "200 g de arroz cozido" num alimento cadastrado cru: converte pelo rendimento
    const y = yieldFor(food);
    if (grams !== undefined && item.cooked && y && !/cozid|grelhad|assad/.test(normalizeSearch(food.name))) {
      note = `${Math.round(grams)} g cozido`;
      grams = rawFromCooked(grams, y);
    }
    return { ...item, food, grams: grams !== undefined ? Math.round(grams) : undefined, note };
  });
}
