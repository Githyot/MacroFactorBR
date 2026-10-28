// Cardápio automático com comida brasileira que bate a meta de proteína, e lista de compras.
// Determinístico: mesma meta, mesmo cardápio (fácil de testar e de explicar).

import { Food, Meal } from './foods';
import { Nutrients, scaleNutrients, sumNutrients } from './nutrients';
import { Targets } from './targets';

export type PlanItem = { foodId: string; grams: number; label: string };
export type PlanMeal = { meal: Meal; items: PlanItem[]; totals: Nutrients };
export type PlanDay = { day: number; meals: PlanMeal[]; totals: Nutrients };

// IDs da TACO usados no cardápio.
export const F = {
  arroz: 'taco-3',
  feijao: 'taco-561',
  feijaoPreto: 'taco-567',
  frango: 'taco-410',
  patinho: 'taco-377',
  acem: 'taco-326',
  ovo: 'taco-488',
  atum: 'taco-277',
  sardinha: 'taco-319',
  pao: 'taco-53',
  paoIntegral: 'taco-52',
  banana: 'taco-182',
  mamao: 'taco-226',
  maca: 'taco-222',
  aveia: 'taco-7',
  leite: 'taco-458',
  iogurte: 'taco-448',
  batataDoce: 'taco-88',
  mandioca: 'taco-129',
  batata: 'taco-91',
  cuscuz: 'taco-533',
  alface: 'taco-78',
  tomate: 'taco-157',
  brocolis: 'taco-100',
  azeite: 'taco-260',
  queijo: 'taco-461',
  whey: 'generico-whey-concentrado',
} as const;

type Slot =
  | { role: 'protein'; options: string[]; unitGrams?: number; min: number; max: number }
  | { role: 'carb'; options: string[]; unitGrams?: number; share: number; min: number; max: number }
  | { role: 'fixed'; options: string[]; grams: number };

const TEMPLATES: Record<Meal, Slot[]> = {
  breakfast: [
    { role: 'protein', options: [F.ovo, F.ovo, F.queijo], unitGrams: 50, min: 50, max: 200 },
    { role: 'carb', options: [F.pao, F.cuscuz, F.paoIntegral], unitGrams: 25, share: 0.2, min: 25, max: 150 },
    { role: 'fixed', options: [F.banana, F.mamao, F.banana], grams: 70 },
    { role: 'fixed', options: [F.leite], grams: 200 },
  ],
  lunch: [
    { role: 'carb', options: [F.arroz, F.arroz, F.batataDoce, F.arroz, F.mandioca], share: 0.3, min: 50, max: 400 },
    { role: 'fixed', options: [F.feijao, F.feijaoPreto], grams: 86 },
    { role: 'protein', options: [F.frango, F.patinho, F.frango, F.acem, F.frango, F.patinho, F.sardinha], min: 60, max: 250 },
    { role: 'fixed', options: [F.alface], grams: 30 },
    { role: 'fixed', options: [F.tomate, F.brocolis], grams: 80 },
  ],
  snack: [
    { role: 'fixed', options: [F.iogurte], grams: 170 },
    { role: 'carb', options: [F.aveia], share: 0.15, min: 15, max: 80 },
    { role: 'protein', options: [F.whey], min: 0, max: 60 },
    { role: 'fixed', options: [F.banana, F.maca], grams: 70 },
  ],
  dinner: [
    { role: 'carb', options: [F.arroz, F.batataDoce, F.arroz, F.batata, F.arroz], share: 0.25, min: 50, max: 400 },
    { role: 'fixed', options: [F.feijao], grams: 86 },
    { role: 'protein', options: [F.patinho, F.frango, F.atum, F.frango, F.patinho, F.ovo, F.frango], min: 60, max: 250 },
    { role: 'fixed', options: [F.brocolis, F.alface], grams: 60 },
  ],
  supper: [
    { role: 'protein', options: [F.ovo, F.queijo, F.iogurte], unitGrams: 50, min: 50, max: 200 },
    { role: 'carb', options: [F.mamao, F.banana, F.maca], share: 0.1, min: 50, max: 200 },
  ],
};

export function mealsForCount(n: number): Meal[] {
  if (n <= 3) return ['breakfast', 'lunch', 'dinner'];
  if (n === 4) return ['breakfast', 'lunch', 'snack', 'dinner'];
  return ['breakfast', 'lunch', 'snack', 'dinner', 'supper'];
}

function roundTo(g: number, step: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(g / step) * step));
}

function nutrientsOf(foods: Record<string, Food>, items: PlanItem[]): Nutrients {
  return sumNutrients(items.map((i) => (foods[i.foodId] ? scaleNutrients(foods[i.foodId].per100g, i.grams) : {})));
}

export function generateDay(targets: Targets, mealsPerDay: number, foods: Record<string, Food>, day = 0): PlanDay {
  const meals = mealsForCount(mealsPerDay);
  const proteinPerMeal = targets.protein / meals.length;
  const shareSum = meals.reduce((s, m) => s + (TEMPLATES[m].find((x) => x.role === 'carb') as { share: number } | undefined ?? { share: 0 }).share, 0);

  const planMeals: PlanMeal[] = meals.map((meal) => {
    const items: PlanItem[] = [];
    const pick = (options: string[]) => options[day % options.length];
    // 1) fixos
    for (const slot of TEMPLATES[meal]) {
      if (slot.role === 'fixed') items.push({ foodId: pick(slot.options), grams: slot.grams, label: '' });
    }
    // 2) carboidrato pela fatia do dia
    const carbSlot = TEMPLATES[meal].find((s) => s.role === 'carb') as Extract<Slot, { role: 'carb' }> | undefined;
    if (carbSlot) {
      const id = pick(carbSlot.options);
      const f = foods[id];
      const carbsAlready = nutrientsOf(foods, items).carbs ?? 0;
      const want = (targets.carbs * carbSlot.share) / shareSum - carbsAlready;
      const density = (f?.per100g.carbs ?? 0) / 100;
      const g = density > 0 ? want / density : carbSlot.min;
      items.push({ foodId: id, grams: roundTo(g, carbSlot.unitGrams ?? 10, carbSlot.min, carbSlot.max), label: '' });
    }
    // 3) proteína completa a meta da refeição
    const protSlot = TEMPLATES[meal].find((s) => s.role === 'protein') as Extract<Slot, { role: 'protein' }> | undefined;
    if (protSlot) {
      const id = pick(protSlot.options);
      const f = foods[id];
      const have = nutrientsOf(foods, items).protein ?? 0;
      const density = (f?.per100g.protein ?? 0) / 100;
      const g = density > 0 ? (proteinPerMeal - have) / density : 0;
      const grams = roundTo(g, protSlot.unitGrams ?? 10, protSlot.min, protSlot.max);
      if (grams > 0) items.push({ foodId: id, grams, label: '' });
    }
    return { meal, items, totals: nutrientsOf(foods, items) };
  });

  // 4) gordura que faltar vira azeite no almoço e no jantar
  const dayFat = sumNutrients(planMeals.map((m) => m.totals)).fat ?? 0;
  const missingFat = targets.fat - dayFat;
  if (missingFat > 3) {
    const targetsMeals = planMeals.filter((m) => m.meal === 'lunch' || m.meal === 'dinner');
    for (const m of targetsMeals) {
      const g = roundTo(missingFat / targetsMeals.length, 1, 0, 26);
      if (g > 0) {
        m.items.push({ foodId: F.azeite, grams: g, label: '' });
        m.totals = nutrientsOf(foods, m.items);
      }
    }
  }

  for (const m of planMeals) {
    for (const i of m.items) i.label = foods[i.foodId]?.name ?? i.foodId;
  }
  return { day, meals: planMeals, totals: sumNutrients(planMeals.map((m) => m.totals)) };
}

export function generateWeek(targets: Targets, mealsPerDay: number, foods: Record<string, Food>): PlanDay[] {
  return Array.from({ length: 7 }, (_, d) => generateDay(targets, mealsPerDay, foods, d));
}

// ---- Lista de compras ----

export type ShoppingItem = { name: string; amount: number; unit: string; foodIds: string[] };

// Item pronto → o que se compra (cru), com o rendimento cru → pronto.
const PURCHASE: Record<string, { name: string; yield?: number; unit: 'kg' | 'un' | 'L' | 'dúzia'; unitGrams?: number }> = {
  [F.arroz]: { name: 'Arroz (cru)', yield: 2.8, unit: 'kg' },
  [F.feijao]: { name: 'Feijão carioca (cru)', yield: 2.5, unit: 'kg' },
  [F.feijaoPreto]: { name: 'Feijão preto (cru)', yield: 2.5, unit: 'kg' },
  [F.frango]: { name: 'Peito de frango sem pele (cru)', yield: 0.75, unit: 'kg' },
  [F.patinho]: { name: 'Patinho (cru)', yield: 0.65, unit: 'kg' },
  [F.acem]: { name: 'Acém moído (cru)', yield: 0.7, unit: 'kg' },
  [F.ovo]: { name: 'Ovos', unit: 'dúzia', unitGrams: 50 * 12 },
  [F.pao]: { name: 'Pão francês', unit: 'un', unitGrams: 50 },
  [F.paoIntegral]: { name: 'Pão de forma integral', unit: 'kg' },
  [F.leite]: { name: 'Leite integral', unit: 'L', unitGrams: 1000 },
  [F.banana]: { name: 'Banana prata', unit: 'un', unitGrams: 70 },
  [F.maca]: { name: 'Maçã', unit: 'un', unitGrams: 130 },
  [F.mamao]: { name: 'Mamão papaia', unit: 'un', unitGrams: 350 },
  [F.iogurte]: { name: 'Iogurte natural (pote 170 g)', unit: 'un', unitGrams: 170 },
  [F.batataDoce]: { name: 'Batata-doce', yield: 0.95, unit: 'kg' },
  [F.batata]: { name: 'Batata inglesa', yield: 0.95, unit: 'kg' },
  [F.mandioca]: { name: 'Mandioca', yield: 0.95, unit: 'kg' },
  [F.azeite]: { name: 'Azeite extra virgem', unit: 'L', unitGrams: 920 },
  [F.whey]: { name: 'Whey protein', unit: 'kg' },
};

export function shoppingList(days: PlanDay[], foods: Record<string, Food>): ShoppingItem[] {
  const grams = new Map<string, number>();
  for (const d of days) for (const m of d.meals) for (const i of m.items) grams.set(i.foodId, (grams.get(i.foodId) ?? 0) + i.grams);

  const byName = new Map<string, ShoppingItem>();
  for (const [id, g] of grams) {
    const p = PURCHASE[id];
    const name = p?.name ?? foods[id]?.name ?? id;
    const raw = p?.yield ? g / p.yield : g;
    let amount: number;
    let unit: string;
    if (!p || p.unit === 'kg') {
      amount = Math.ceil(raw / 50) * 50;
      unit = 'g';
      if (amount >= 1000) {
        amount = Math.ceil(raw / 100) / 10;
        unit = 'kg';
      }
    } else {
      amount = Math.ceil((raw / (p.unitGrams ?? 1000)) * (p.unit === 'L' ? 10 : 1)) / (p.unit === 'L' ? 10 : 1);
      unit = p.unit;
    }
    const existing = byName.get(name);
    if (existing) existing.foodIds.push(id);
    else byName.set(name, { name, amount, unit, foodIds: [id] });
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}
