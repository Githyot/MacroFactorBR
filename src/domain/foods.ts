import { NutrientKey, Nutrients, scaleNutrients, sumNutrients } from './nutrients';
import { expandTerm } from './synonyms';

export type FoodSource = 'taco' | 'label' | 'openfoodfacts' | 'manual' | 'recipe' | 'shared' | 'ai';

/** Tipo do item: suplementos e pratos típicos ganham tratamento próprio na busca e no diário. */
export type FoodKind = 'food' | 'supplement' | 'recipe' | 'dish';

export type Measure = { label: string; grams: number };

export type Food = {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  source: FoodSource;
  kind?: FoodKind;
  category?: string;
  per100g: Nutrients;
  servingGrams?: number;
  servingDescription?: string;
  /** Medidas caseiras extras cadastradas pelo usuário. */
  measures?: Measure[];
  /** Peso cozido ÷ peso cru. Permite registrar pesando cozido um alimento cadastrado cru. */
  cookingYield?: number;
  /** Líquidos usam limites diferentes nos selos "alto em" (por 100 ml). */
  liquid?: boolean;
  /** Selos "alto em" lidos na frente da embalagem. */
  highIn?: ('addedSugars' | 'saturatedFat' | 'sodium')[];
  /** Id na base compartilhada, quando veio de lá (permite confirmar ou apontar erro). */
  sharedId?: string;
  sharedStatus?: 'pending' | 'verified' | 'rejected';
  createdAt: string;
};

export type Meal = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'supper';

export const MEALS: { key: Meal; label: string }[] = [
  { key: 'breakfast', label: 'Café da manhã' },
  { key: 'lunch', label: 'Almoço' },
  { key: 'snack', label: 'Lanche' },
  { key: 'dinner', label: 'Jantar' },
  { key: 'supper', label: 'Ceia' },
];

/** Refeição mais provável pelo horário. */
export function defaultMeal(hour = new Date().getHours()): Meal {
  if (hour < 10) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 18) return 'snack';
  if (hour < 22) return 'dinner';
  return 'supper';
}

export type DiaryEntry = {
  id: string;
  date: string; // AAAA-MM-DD
  meal: Meal;
  foodId: string;
  /** Gramas na forma em que o alimento está cadastrado (ex.: cru). */
  grams: number;
  /** Como foi registrado, para exibição: "1 concha", "180 g cozido". */
  note?: string;
};

export function entryNutrients(entry: DiaryEntry, food: Food | undefined): Nutrients {
  return food ? scaleNutrients(food.per100g, entry.grams) : {};
}

export function dayTotals(entries: DiaryEntry[], foods: Record<string, Food>): Nutrients {
  return sumNutrients(entries.map((e) => entryNutrients(e, foods[e.foodId])));
}

export function mealTotals(entries: DiaryEntry[], foods: Record<string, Food>): Record<Meal, Nutrients> {
  const out = {} as Record<Meal, Nutrients>;
  for (const { key } of MEALS) out[key] = dayTotals(entries.filter((e) => e.meal === key), foods);
  return out;
}

/** Gramas de proteína por real gasto (diferencial do app para quem compra suplemento e carne). */
export function proteinPerReal(per100g: Nutrients, packageGrams: number, priceBrl: number): number {
  if (priceBrl <= 0) return 0;
  return ((per100g.protein ?? 0) * packageGrams) / 100 / priceBrl;
}

/** Custo em reais de 30 g de proteína (uma refeição de hipertrofia). */
export function costPer30gProtein(per100g: Nutrients, packageGrams: number, priceBrl: number): number | undefined {
  const g = proteinPerReal(per100g, packageGrams, priceBrl);
  return g > 0 ? 30 / g : undefined;
}

/** Valida EAN-8, EAN-13, UPC-A e GTIN-14 pelo dígito verificador. */
export function isValidGtin(code: string): boolean {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false;
  const digits = code.split('').map(Number);
  const check = digits.pop()!;
  const sum = digits
    .reverse()
    .reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

export function normalizeSearch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[,.;()/-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Remove plural simples para "ovos" achar "ovo" e "bananas" achar "banana". */
function singular(t: string): string {
  if (t.length > 4 && t.endsWith('oes')) return `${t.slice(0, -3)}ao`;
  if (t.length > 3 && t.endsWith('s')) return t.slice(0, -1);
  return t;
}

/** Radical sem a vogal de gênero: "cozido" acha "cozida", "assado" acha "assada". */
function stem(t: string): string {
  return t.length > 4 && /[oa]$/.test(t) ? t.slice(0, -1) : t;
}

// Versão "padrão" de cada alimento básico: quem digita "ovo" ou "feijão" quer esta.
const EVERYDAY = [
  /^ovo de galinha inteiro cozido/,
  /^feijao carioca cozido/,
  /^arroz tipo 1 cozido/,
  /^frango peito sem pele grelhado/,
  /^carne bovina patinho sem gordura grelhado/,
  /^leite de vaca integral$/,
  /^pao trigo frances/,
  /^batata doce cozida/,
  /^mandioca cozida/,
  /^whey protein concentrado/,
];

/**
 * Busca em português com sinônimos regionais (aipim/mandioca/macaxeira) e plural.
 * Ordena: nome que começa com a busca, depois nomes mais curtos (mais genéricos).
 */
export function searchFoods(foods: Food[], query: string): Food[] {
  const q = normalizeSearch(query);
  if (!q) return foods;
  const terms = q.split(' ').map((t) => expandTerm(singular(t)).map(stem));
  const wantsRaw = /\bcru/.test(q);
  const scored: { food: Food; score: number }[] = [];
  for (const f of foods) {
    const name = normalizeSearch(f.name);
    const hay = `${name} ${normalizeSearch(f.brand ?? '')} ${f.barcode ?? ''} ${normalizeSearch(f.category ?? '')}`;
    if (!terms.every((alts) => alts.some((a) => hay.includes(a)))) continue;
    let score = name.length;
    if (terms[0].some((a) => name.startsWith(a))) score -= 100;
    if (f.source !== 'taco') score -= 20; // o que você cadastrou aparece antes
    if (EVERYDAY.some((re) => re.test(name))) score -= 25;
    if (!wantsRaw && /\bcrua?\b/.test(name)) score += 15; // quem busca "feijão" quer o pronto
    // Partes e formas específicas só quando pedidas ("ovo" é o inteiro, não a gema)
    for (const part of ['gema', 'clara', 'po', 'desidratad', 'pele']) {
      if (new RegExp(`\\b${part}`).test(name) && !q.includes(part)) score += 12;
    }
    scored.push({ food: f, score });
  }
  return scored.sort((a, b) => a.score - b.score).map((s) => s.food);
}

export function todayIso(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return todayIso(d);
}

/** Alimentos mais usados recentemente, para a lista de favoritos por horário. */
export function recentFoodIds(entries: DiaryEntry[], meal?: Meal, limit = 12): string[] {
  const counts = new Map<string, { n: number; last: string }>();
  for (const e of entries) {
    if (meal && e.meal !== meal) continue;
    const c = counts.get(e.foodId) ?? { n: 0, last: '' };
    counts.set(e.foodId, { n: c.n + 1, last: e.date > c.last ? e.date : c.last });
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].n - a[1].n || b[1].last.localeCompare(a[1].last))
    .slice(0, limit)
    .map(([id]) => id);
}

export type { NutrientKey };
