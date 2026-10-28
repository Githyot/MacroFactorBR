// Alvos de micronutrientes por sexo e idade (DRIs do IOM/National Academies, adultos)
// e sugestões de comida brasileira para cobrir o que está faltando.

import { DiaryEntry, Food, normalizeSearch } from './foods';
import { measuresFor } from './measures';
import { NutrientKey, Nutrients } from './nutrients';
import { Sex } from './targets';

export type MicroTarget = { key: NutrientKey; target: number; kind: 'min' | 'max' };

export const TRACKED_MICROS: NutrientKey[] = [
  'fiber', 'sodium', 'calcium', 'iron', 'potassium', 'magnesium', 'zinc', 'vitaminA', 'vitaminC', 'vitaminD', 'vitaminB12',
];

export function microTargets(sex: Sex, age: number): MicroTarget[] {
  const m = sex === 'male';
  const older = age >= 51;
  return [
    { key: 'fiber', target: m ? (older ? 30 : 38) : older ? 21 : 25, kind: 'min' },
    { key: 'sodium', target: 2300, kind: 'max' },
    { key: 'calcium', target: (m && age >= 71) || (!m && older) ? 1200 : 1000, kind: 'min' },
    { key: 'iron', target: m || older ? 8 : 18, kind: 'min' },
    { key: 'potassium', target: m ? 3400 : 2600, kind: 'min' },
    { key: 'magnesium', target: m ? (age <= 30 ? 400 : 420) : age <= 30 ? 310 : 320, kind: 'min' },
    { key: 'zinc', target: m ? 11 : 8, kind: 'min' },
    { key: 'vitaminA', target: m ? 900 : 700, kind: 'min' },
    { key: 'vitaminC', target: m ? 90 : 75, kind: 'min' },
    { key: 'vitaminD', target: age >= 71 ? 20 : 15, kind: 'min' },
    { key: 'vitaminB12', target: 2.4, kind: 'min' },
  ];
}

export type MicroStatus = MicroTarget & {
  value: number;
  pct: number;
  ok: boolean;
  /** false quando boa parte do que foi comido não tem esse dado (a TACO não traz vitamina D nem B12). */
  known: boolean;
};

/** Para cada nutriente, a fração das calorias do dia vinda de alimentos que informam esse nutriente. */
export function microCoverage(entries: DiaryEntry[], foods: Record<string, Food>, keys: NutrientKey[] = TRACKED_MICROS): Partial<Record<NutrientKey, number>> {
  let total = 0;
  const covered: Partial<Record<NutrientKey, number>> = {};
  for (const e of entries) {
    const f = foods[e.foodId];
    if (!f) continue;
    // Pesa pelas calorias (água e café não contam); alimentos sem caloria pesam pelo peso mínimo.
    const w = Math.max(((f.per100g.kcal ?? 0) * e.grams) / 100, 1);
    total += w;
    for (const k of keys) if (f.per100g[k] !== undefined) covered[k] = (covered[k] ?? 0) + w;
  }
  return Object.fromEntries(keys.map((k) => [k, total > 0 ? (covered[k] ?? 0) / total : 0]));
}

const MIN_COVERAGE = 0.6;

export function microStatus(totals: Nutrients, targets: MicroTarget[], coverage?: Partial<Record<NutrientKey, number>>): MicroStatus[] {
  return targets.map((t) => {
    const value = totals[t.key] ?? 0;
    const pct = t.target > 0 ? value / t.target : 0;
    const ok = t.kind === 'min' ? pct >= 1 : pct <= 1;
    // Com pouco dado não dá para dizer que falta; mas se já passou do alvo, sabemos que atingiu.
    const known = !coverage || (coverage[t.key] ?? 0) >= MIN_COVERAGE || (t.kind === 'min' && ok) || (t.kind === 'max' && !ok);
    return { ...t, value, pct, ok, known };
  });
}

// Alimentos que não fazem sentido sugerir (temperos, itens crus que ninguém come assim etc.).
const NOT_SUGGESTED = /sal\b|fermento|caldo|tempero|po para|gelatina|cru\b.*(arroz|feijao|frango|carne)|farinha|amido|oleo|banha|manteiga|acucar|achocolatado|refrigerante|cerveja|aguardente|whisky|vinho|figado/;

export type MicroSuggestion = { food: Food; portionLabel: string; portionGrams: number; amount: number; kcal: number };

/**
 * Melhores fontes do nutriente na base, por porção caseira, priorizando as que trazem
 * mais nutriente por caloria (para não estourar a meta de energia).
 */
export function suggestFoodsFor(key: NutrientKey, foods: Food[], limit = 5): MicroSuggestion[] {
  const out: (MicroSuggestion & { score: number })[] = [];
  for (const food of foods) {
    const per100 = food.per100g[key];
    if (!per100 || food.source !== 'taco') continue;
    if (NOT_SUGGESTED.test(normalizeSearch(food.name))) continue;
    const m = measuresFor(food)[0] ?? { label: '100 g', grams: 100 };
    const amount = (per100 * m.grams) / 100;
    const kcal = ((food.per100g.kcal ?? 0) * m.grams) / 100;
    const score = amount / Math.max(kcal, 20);
    out.push({ food, portionLabel: m.label, portionGrams: m.grams, amount, kcal, score });
  }
  // Uma sugestão por "família" (primeira palavra do nome) para variar a lista.
  const seen = new Set<string>();
  return out
    .sort((a, b) => b.score - a.score)
    .filter((s) => {
      const fam = normalizeSearch(s.food.name).split(' ')[0];
      if (seen.has(fam)) return false;
      seen.add(fam);
      return true;
    })
    .slice(0, limit)
    .map(({ score: _s, ...rest }) => rest);
}
