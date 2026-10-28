import { NutrientKey, Nutrients, scaleNutrients, sumNutrients } from './nutrients';

export type FoodSource = 'taco' | 'label' | 'openfoodfacts' | 'manual';

export type Food = {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  source: FoodSource;
  per100g: Nutrients;
  servingGrams?: number;
  servingDescription?: string;
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

export type DiaryEntry = {
  id: string;
  date: string; // AAAA-MM-DD
  meal: Meal;
  foodId: string;
  grams: number;
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
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function searchFoods(foods: Food[], query: string): Food[] {
  const q = normalizeSearch(query);
  if (!q) return foods;
  const terms = q.split(/\s+/);
  return foods.filter((f) => {
    const hay = normalizeSearch(`${f.name} ${f.brand ?? ''} ${f.barcode ?? ''}`);
    return terms.every((t) => hay.includes(t));
  });
}

export function todayIso(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type { NutrientKey };
