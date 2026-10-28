// Conversão de produtos da Open Food Facts (base aberta, com muitos produtos brasileiros).

import { atwaterKcal, Nutrients } from './nutrients';

export type OffProduct = {
  code?: string;
  product_name?: string;
  product_name_pt?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string | undefined>;
};

export type FoodDraft = {
  name: string;
  brand?: string;
  barcode?: string;
  per100g: Nutrients;
  servingGrams?: number;
  servingDescription?: string;
};

// A OFF guarda tudo em gramas por 100 g; convertemos para a unidade do app.
const MAP: [string, keyof Nutrients, number][] = [
  ['energy-kcal_100g', 'kcal', 1],
  ['proteins_100g', 'protein', 1],
  ['carbohydrates_100g', 'carbs', 1],
  ['sugars_100g', 'sugars', 1],
  ['added-sugars_100g', 'addedSugars', 1],
  ['fat_100g', 'fat', 1],
  ['saturated-fat_100g', 'saturatedFat', 1],
  ['trans-fat_100g', 'transFat', 1],
  ['fiber_100g', 'fiber', 1],
  ['sodium_100g', 'sodium', 1000],
  ['calcium_100g', 'calcium', 1000],
  ['iron_100g', 'iron', 1000],
  ['potassium_100g', 'potassium', 1000],
  ['magnesium_100g', 'magnesium', 1000],
  ['zinc_100g', 'zinc', 1000],
  ['vitamin-a_100g', 'vitaminA', 1_000_000],
  ['vitamin-c_100g', 'vitaminC', 1000],
  ['vitamin-d_100g', 'vitaminD', 1_000_000],
  ['vitamin-b12_100g', 'vitaminB12', 1_000_000],
  ['cholesterol_100g', 'cholesterol', 1000],
];

function num(v: unknown): number | undefined {
  const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
}

export function offToFoodDraft(p: OffProduct, barcode?: string): FoodDraft | undefined {
  const n = p.nutriments ?? {};
  const per100g: Nutrients = {};
  for (const [offKey, key, factor] of MAP) {
    const v = num(n[offKey]);
    if (v !== undefined) per100g[key] = Math.round(v * factor * 1000) / 1000;
  }
  if (per100g.kcal === undefined) {
    const kj = num(n['energy_100g']) ?? num(n['energy-kj_100g']);
    if (kj !== undefined) per100g.kcal = Math.round(kj / 4.184);
    else if (per100g.protein !== undefined || per100g.carbs !== undefined) per100g.kcal = Math.round(atwaterKcal(per100g));
  }
  // Sem proteína/carboidrato/gordura o cadastro não serve para o app: melhor pedir a foto da tabela.
  if (per100g.protein === undefined && per100g.carbs === undefined && per100g.fat === undefined) return undefined;

  const name = (p.product_name_pt || p.product_name || '').trim();
  return {
    name: name || 'Produto sem nome',
    brand: p.brands?.split(',')[0]?.trim() || undefined,
    barcode: barcode ?? p.code,
    per100g,
    servingGrams: num(p.serving_quantity),
    servingDescription: p.serving_size || undefined,
  };
}

const FIELDS = 'code,product_name,product_name_pt,brands,serving_size,serving_quantity,nutriments';

export async function fetchOffProduct(barcode: string, fetchImpl: typeof fetch = fetch): Promise<FoodDraft | undefined> {
  const res = await fetchImpl(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`);
  if (!res.ok) return undefined;
  const json = (await res.json()) as { status?: number; product?: OffProduct };
  if (json.status !== 1 || !json.product) return undefined;
  return offToFoodDraft(json.product, barcode);
}
