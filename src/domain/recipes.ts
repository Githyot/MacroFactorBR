// Receitas e marmitas: ingredientes pesados crus, panela pesada pronta, porções pelo peso real.

import { Food } from './foods';
import { Nutrients, scaleNutrients, sumNutrients } from './nutrients';

export type RecipeIngredient = { foodId: string; grams: number };

export type Recipe = {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  /** Peso da panela pronta, sem a panela. Se vazio, usa a soma dos ingredientes. */
  cookedWeightGrams?: number;
  /** Em quantas marmitas/porções a receita foi dividida. */
  portions: number;
  /** Excluída mas ainda usada no diário. */
  archived?: boolean;
  createdAt: string;
};

export function recipeTotals(recipe: Recipe, foods: Record<string, Food>): Nutrients {
  return sumNutrients(
    recipe.ingredients.map((i) => (foods[i.foodId] ? scaleNutrients(foods[i.foodId].per100g, i.grams) : {})),
  );
}

export function recipeRawWeight(recipe: Recipe): number {
  return recipe.ingredients.reduce((s, i) => s + i.grams, 0);
}

export function recipeFinalWeight(recipe: Recipe): number {
  return recipe.cookedWeightGrams && recipe.cookedWeightGrams > 0 ? recipe.cookedWeightGrams : recipeRawWeight(recipe);
}

/** Nutrientes por 100 g do prato pronto (a água que evapora concentra os nutrientes). */
export function recipePer100g(recipe: Recipe, foods: Record<string, Food>): Nutrients {
  const total = recipeTotals(recipe, foods);
  const weight = recipeFinalWeight(recipe);
  return weight > 0 ? scaleNutrients(total, (100 / weight) * 100) : {};
}

/** Converte a receita em alimento do diário: "1 marmita" vira uma medida pronta. */
export function recipeToFood(recipe: Recipe, foods: Record<string, Food>): Food {
  const portionGrams = recipeFinalWeight(recipe) / Math.max(1, recipe.portions);
  return {
    id: `recipe-${recipe.id}`,
    name: recipe.name,
    source: 'recipe',
    kind: 'recipe',
    per100g: recipePer100g(recipe, foods),
    servingGrams: Math.round(portionGrams),
    servingDescription: recipe.portions > 1 ? '1 marmita' : 'receita inteira',
    archived: recipe.archived,
    createdAt: recipe.createdAt,
  };
}

// ---- Compartilhar receita ----
// Código de texto que inclui os ingredientes com seus valores, para funcionar
// mesmo se o amigo não tiver os mesmos alimentos cadastrados.

type SharedRecipe = {
  v: 1;
  name: string;
  portions: number;
  cooked?: number;
  items: { name: string; grams: number; per100g: Nutrients }[];
};

function toBase64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function fromBase64(s: string): string {
  const bin = atob(s);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeRecipe(recipe: Recipe, foods: Record<string, Food>): string {
  const payload: SharedRecipe = {
    v: 1,
    name: recipe.name,
    portions: recipe.portions,
    cooked: recipe.cookedWeightGrams,
    items: recipe.ingredients
      .filter((i) => foods[i.foodId])
      .map((i) => ({ name: foods[i.foodId].name, grams: i.grams, per100g: foods[i.foodId].per100g })),
  };
  return `MFBR1:${toBase64(JSON.stringify(payload))}`;
}

export function decodeRecipe(code: string): SharedRecipe | undefined {
  const m = code.trim().match(/^MFBR1:([A-Za-z0-9+/=]+)$/);
  if (!m) return undefined;
  try {
    const data = JSON.parse(fromBase64(m[1])) as SharedRecipe;
    return data.v === 1 && Array.isArray(data.items) ? data : undefined;
  } catch {
    return undefined;
  }
}
