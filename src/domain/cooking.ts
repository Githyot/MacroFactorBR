// Conversão cru ↔ cozido por fatores de rendimento (peso cozido ÷ peso cru).
// Rótulos de arroz, macarrão, feijão e carnes trazem valores do produto cru,
// mas a gente pesa o prato pronto. Os fatores vêm da razão de energia cru/cozido da TACO
// e de tabelas de rendimento usuais.

import { Food, normalizeSearch } from './foods';

export type YieldRule = { label: string; match: RegExp; factor: number };

export const YIELDS: YieldRule[] = [
  { label: 'Arroz (cozido)', match: /arroz/, factor: 2.8 },
  { label: 'Macarrão (cozido)', match: /macarrao|espaguete|massa|talharim|penne|parafuso/, factor: 2.4 },
  { label: 'Feijão (cozido, sem caldo)', match: /feijao|lentilha|grao de bico|ervilha seca/, factor: 2.5 },
  { label: 'Aveia (mingau)', match: /aveia/, factor: 1 },
  { label: 'Frango (grelhado/assado)', match: /frango|galinha|peru/, factor: 0.75 },
  { label: 'Carne bovina (grelhada)', match: /carne|patinho|alcatra|contra file|file mignon|maminha|picanha|acem|coxao|musculo|bovin/, factor: 0.65 },
  { label: 'Carne suína (grelhada)', match: /porco|suin|lombo|pernil/, factor: 0.7 },
  { label: 'Peixe (grelhado)', match: /peixe|tilapia|salmao|merluza|pescada|atum fresco|sardinha fresca/, factor: 0.8 },
  { label: 'Batata/mandioca (cozida)', match: /batata|mandioca|aipim|inhame|cara/, factor: 0.95 },
  { label: 'Quinoa (cozida)', match: /quinoa/, factor: 2.7 },
];

/** Sugere o fator para um alimento cru (só quando o nome indica que é cru ou é um rótulo de grão/carne). */
export function suggestYield(food: Pick<Food, 'name' | 'source'>): YieldRule | undefined {
  const name = normalizeSearch(food.name);
  if (/cozid|grelhad|assad|frit|refogad|ensopad/.test(name)) return undefined;
  const isRaw = /\bcru|\bcrua/.test(name) || food.source === 'label' || food.source === 'openfoodfacts';
  if (!isRaw) return undefined;
  const rule = YIELDS.find((y) => y.match.test(name));
  return rule && rule.factor !== 1 ? rule : undefined;
}

export function yieldFor(food: Food): number | undefined {
  return food.cookingYield ?? suggestYield(food)?.factor;
}

/** Peso cozido → peso cru equivalente (o que entra na conta, já que o cadastro é do cru). */
export function rawFromCooked(cookedGrams: number, factor: number): number {
  return factor > 0 ? cookedGrams / factor : cookedGrams;
}

export function cookedFromRaw(rawGrams: number, factor: number): number {
  return rawGrams * factor;
}
