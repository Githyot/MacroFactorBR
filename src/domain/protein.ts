// Qualidade da proteína e leucina: nem todo grama de proteína estimula a síntese muscular igual.

import { Food, normalizeSearch } from './foods';
import { Nutrients } from './nutrients';

export type ProteinSource = 'whey' | 'egg' | 'dairy' | 'meat' | 'fish' | 'soy' | 'legume' | 'grain' | 'other';

// DIAAS aproximado (adulto) e fração de leucina na proteína, por tipo de fonte.
// Valores médios da literatura (FAO 2013; van Vliet 2015; Gorissen 2018).
export const PROTEIN_SOURCES: Record<ProteinSource, { label: string; diaas: number; leucineFraction: number }> = {
  whey: { label: 'Whey/soro do leite', diaas: 1.09, leucineFraction: 0.11 },
  dairy: { label: 'Leite e derivados', diaas: 1.14, leucineFraction: 0.095 },
  egg: { label: 'Ovo', diaas: 1.13, leucineFraction: 0.085 },
  meat: { label: 'Carnes', diaas: 1.0, leucineFraction: 0.08 },
  fish: { label: 'Peixes', diaas: 1.0, leucineFraction: 0.08 },
  soy: { label: 'Soja', diaas: 0.91, leucineFraction: 0.08 },
  legume: { label: 'Leguminosas', diaas: 0.65, leucineFraction: 0.075 },
  grain: { label: 'Cereais', diaas: 0.5, leucineFraction: 0.08 },
  other: { label: 'Outros', diaas: 0.6, leucineFraction: 0.07 },
};

export const LEUCINE_PER_MEAL_TARGET = 2.5; // g

export function proteinSource(food: Pick<Food, 'name' | 'category'>): ProteinSource {
  const n = normalizeSearch(`${food.name} ${food.category ?? ''}`);
  if (/whey|soro de leite|proteina do soro|caseina/.test(n)) return 'whey';
  if (/\bovo|clara|albumina/.test(n)) return 'egg';
  if (/soja|tofu/.test(n)) return 'soy';
  if (/leite|iogurte|queijo|requeijao|ricota/.test(n)) return 'dairy';
  if (/pescado|peixe|atum|sardinha|tilapia|salmao|camarao|merluza|bacalhau/.test(n)) return 'fish';
  if (/carne|frango|bovin|porco|suin|patinho|peru|figado|presunto|carnes e derivados/.test(n)) return 'meat';
  if (/feijao|lentilha|grao de bico|ervilha|leguminosa/.test(n)) return 'legume';
  if (/arroz|pao|aveia|trigo|milho|cereais|macarrao|cuscuz/.test(n)) return 'grain';
  return 'other';
}

/** Leucina por 100 g: valor da TACO quando existe, senão estimado pela fonte da proteína. */
export function leucinePer100g(food: Food): number {
  if (food.per100g.leucine !== undefined) return food.per100g.leucine;
  return (food.per100g.protein ?? 0) * PROTEIN_SOURCES[proteinSource(food)].leucineFraction;
}

/** Proteína "útil" ajustada pela qualidade (DIAAS limitado a 1). */
export function qualityAdjustedProtein(food: Food, grams: number): number {
  const p = ((food.per100g.protein ?? 0) * grams) / 100;
  return p * Math.min(1, PROTEIN_SOURCES[proteinSource(food)].diaas);
}

export function leucineIn(food: Food, grams: number): number {
  return (leucinePer100g(food) * grams) / 100;
}

export function withLeucine(food: Food): Nutrients {
  return { ...food.per100g, leucine: leucinePer100g(food) };
}
