import { describe, expect, it } from '@jest/globals';

import { TACO_FOODS } from '../../data/taco';
import { estimateAdaptiveTdee } from '../adaptiveTdee';
import { isCheckInDue, runCheckIn } from '../checkin';
import { rawFromCooked, suggestYield, yieldFor } from '../cooking';
import { Food, recentFoodIds, searchFoods } from '../foods';
import { parseFreeText, resolveItems } from '../freeText';
import { computeHighIn, guessNameFromFront, parseHighInStamp } from '../labelFront';
import { findMeasure, measuresFor } from '../measures';
import { generateDay, generateWeek, shoppingList } from '../mealPlan';
import { microCoverage, microStatus, microTargets, suggestFoodsFor } from '../micros';
import { leucinePer100g, proteinSource } from '../protein';
import { decodeRecipe, encodeRecipe, Recipe, recipePer100g, recipeToFood } from '../recipes';
import { diaryCsv, reportHtml } from '../report';
import { computeTargets, dayTargets, energyDelta, explainTargets, Profile, targetWeeklyChangeKg } from '../targets';

const FOODS = Object.fromEntries(TACO_FOODS.map((f) => [f.id, f]));
const LIST = TACO_FOODS;
const profile: Profile = {
  sex: 'male', birthDate: '1996-01-01', heightCm: 180, weightKg: 80, activity: 'moderate', goal: 'bulk',
  proteinPerKg: 2, mealsPerDay: 4, trainingLevel: 'intermediate', trainingDays: 4,
};
const today = new Date('2026-10-28T12:00:00');

describe('base TACO', () => {
  it('tem a TACO completa e os suplementos', () => {
    expect(TACO_FOODS.length).toBeGreaterThan(600);
    expect(FOODS['taco-410'].name).toBe('Frango, peito, sem pele, grelhado');
    expect(FOODS['generico-whey-concentrado'].kind).toBe('supplement');
    expect(FOODS['taco-540'].kind).toBe('dish');
  });

  it('busca com sinônimos regionais e plural', () => {
    const names = (q: string) => searchFoods(LIST, q).map((f) => f.name);
    expect(names('aipim cozido')[0]).toBe('Mandioca, cozida');
    expect(names('macaxeira').some((n) => n.startsWith('Mandioca'))).toBe(true);
    expect(names('ovos cozido')[0]).toContain('Ovo, de galinha, inteiro, cozido');
    expect(names('frango grelhado peito')[0]).toBe('Frango, peito, sem pele, grelhado');
  });
});

describe('medidas caseiras', () => {
  it('acha concha de feijão e unidade de ovo', () => {
    expect(findMeasure(FOODS['taco-561'], 'conchas')?.grams).toBe(86);
    expect(measuresFor(FOODS['taco-488'])[0]).toEqual({ label: 'unidade', grams: 50 });
    expect(findMeasure(FOODS['generico-whey-concentrado'], 'scoop')?.grams).toBe(30);
  });
});

describe('cru ↔ cozido', () => {
  it('sugere rendimento só para alimento cru', () => {
    expect(suggestYield(FOODS['taco-4'])?.factor).toBe(2.8); // arroz cru
    expect(suggestYield(FOODS['taco-3'])).toBeUndefined(); // arroz cozido
    expect(yieldFor(FOODS['taco-409'])).toBe(0.75); // frango cru
    expect(rawFromCooked(280, 2.8)).toBeCloseTo(100);
  });
});

describe('receitas e marmitas', () => {
  const recipe: Recipe = {
    id: 'r1', name: 'Marmita de frango', portions: 4, createdAt: '',
    cookedWeightGrams: 1200,
    ingredients: [ { foodId: 'taco-409', grams: 800 }, { foodId: 'taco-4', grams: 300 }, { foodId: 'taco-260', grams: 20 } ],
  };
  it('divide pelo peso real da panela', () => {
    const food = recipeToFood(recipe, FOODS);
    expect(food.servingGrams).toBe(300);
    const per100 = recipePer100g(recipe, FOODS);
    // 800 g de frango cru (21,5 g P/100) + 300 g de arroz cru (7,3) = 193,9 g de proteína em 1200 g
    expect(per100.protein).toBeCloseTo((800 * 0.215 + 300 * 0.073) / 12, 1);
  });
  it('compartilha por código', () => {
    const code = encodeRecipe(recipe, FOODS);
    const back = decodeRecipe(code);
    expect(back?.name).toBe('Marmita de frango');
    expect(back?.items).toHaveLength(3);
    expect(decodeRecipe('lixo')).toBeUndefined();
  });
});

describe('selos ALTO EM', () => {
  it('calcula pelos limites da ANVISA', () => {
    expect(computeHighIn({ addedSugars: 20, saturatedFat: 2, sodium: 700 })).toEqual(['addedSugars', 'sodium']);
    expect(computeHighIn({ addedSugars: 8 }, true)).toEqual(['addedSugars']);
  });
  it('lê a lupa e o nome na foto da frente', () => {
    expect(parseHighInStamp('ALTO EM\nAÇÚCAR ADICIONADO\nALTO EM SÓDIO')).toEqual(['addedSugars', 'sodium']);
    const g = guessNameFromFront('NESTLÉ\nIogurte Grego Tradicional\nPeso líquido 100 g\nALTO EM AÇÚCAR ADICIONADO');
    expect(g).toEqual({ name: 'Iogurte Grego Tradicional', brand: 'Nestlé' });
  });
});

describe('proteína', () => {
  it('estima leucina e fonte', () => {
    expect(proteinSource(FOODS['generico-whey-concentrado'])).toBe('whey');
    expect(proteinSource(FOODS['taco-561'])).toBe('legume');
    expect(leucinePer100g(FOODS['taco-410'])).toBeCloseTo(32 * 0.08, 0);
  });
});

describe('micronutrientes', () => {
  it('alvos por sexo e idade', () => {
    const m = microTargets('male', 30);
    const f = microTargets('female', 30);
    expect(m.find((x) => x.key === 'iron')!.target).toBe(8);
    expect(f.find((x) => x.key === 'iron')!.target).toBe(18);
    expect(microTargets('female', 55).find((x) => x.key === 'calcium')!.target).toBe(1200);
  });
  it('sódio é limite', () => {
    const s = microStatus({ sodium: 3000 }, microTargets('male', 30)).find((x) => x.key === 'sodium')!;
    expect(s.ok).toBe(false);
  });
  it('sem dado de vitamina D nos alimentos, não acusa falta', () => {
    const arroz = LIST.find((f) => f.per100g.vitaminD === undefined && (f.per100g.kcal ?? 0) > 100)!;
    const entries = [{ id: '1', date: '2026-10-28', meal: 'lunch' as const, foodId: arroz.id, grams: 300 }];
    const cov = microCoverage(entries, FOODS, ['vitaminD', 'iron']);
    expect(cov.vitaminD).toBe(0);
    const st = microStatus({ vitaminD: 0 }, microTargets('male', 30), cov).find((x) => x.key === 'vitaminD')!;
    expect(st.known).toBe(false);
    expect(microStatus({ vitaminD: 0 }, microTargets('male', 30)).find((x) => x.key === 'vitaminD')!.known).toBe(true);
  });
  it('alimento arquivado some da busca', () => {
    const f: Food = { id: 'x', name: 'Whey velho', source: 'manual', per100g: { kcal: 400 }, createdAt: '', archived: true };
    expect(searchFoods([f], 'whey')).toHaveLength(0);
    expect(searchFoods([{ ...f, archived: false }], 'whey')).toHaveLength(1);
  });
  it('sugere comida brasileira para ferro', () => {
    const s = suggestFoodsFor('iron', LIST);
    expect(s.length).toBeGreaterThan(2);
    expect(s.every((x) => x.amount > 0)).toBe(true);
  });
});

describe('metas por nível e ciclo de carbo', () => {
  it('superávit pela taxa de ganho, limitado a 5–15%', () => {
    expect(targetWeeklyChangeKg(profile)).toBeCloseTo((80 * 0.0075) / (30 / 7));
    const d = energyDelta(profile, 2759);
    expect(d).toBeGreaterThanOrEqual(2759 * 0.05);
    expect(d).toBeLessThanOrEqual(2759 * 0.15);
  });
  it('média semanal igual com ciclo de carbo', () => {
    const p = { ...profile, carbCycling: true, trainingDays: 4 };
    const t = computeTargets(p, undefined, today);
    const train = dayTargets(t, p, true);
    const rest = dayTargets(t, p, false);
    expect(train.carbs).toBeGreaterThan(rest.carbs);
    expect((train.kcal * 4 + rest.kcal * 3) / 7).toBeCloseTo(t.kcal, -1);
  });
  it('explica cada número', () => {
    const t = computeTargets(profile, undefined, today);
    expect(explainTargets(profile, t, today).join(' ')).toContain('Proteína: 2 g × 80 kg = 160 g');
  });
});

describe('check-in semanal', () => {
  function days(n: number) {
    return Array.from({ length: n }, (_, i) => new Date(Date.UTC(2026, 9, 1) + i * 86_400_000).toISOString().slice(0, 10));
  }
  it('sobe calorias quando o peso não sobe no bulk', () => {
    const d = days(28);
    const r = estimateAdaptiveTdee(d.map((date) => ({ date, kg: 80 })), Object.fromEntries(d.map((x) => [x, 2800])), d[27]);
    const kcal = computeTargets(profile, r.status === 'ok' ? r.tdee : undefined).kcal;
    const c = runCheckIn(profile, r, d[27], kcal, 2800);
    expect(c.verdict).toBe('increase');
    // Meta nova = gasto real (2800, peso parado) + superávit; o check-in só registra a diferença.
    expect(kcal).toBeGreaterThan(2800);
    expect(c.adjustmentKcal).toBe(Math.round((kcal - 2800) / 25) * 25);
    expect(c.kcalTarget).toBe(kcal);
  });
  it('ajuste antigo de check-in não se soma ao gasto adaptativo', () => {
    const p = { ...profile, kcalAdjustment: 200 };
    expect(computeTargets(p, 2800).kcal).toBe(computeTargets(profile, 2800).kcal);
    expect(computeTargets(p).kcal).toBe(computeTargets(profile).kcal + 200);
  });
  it('detecta bulking sujo', () => {
    const d = days(42);
    const weights = d.map((date, i) => ({ date, kg: 80 + (0.8 / 7) * i }));
    const r = estimateAdaptiveTdee(weights, Object.fromEntries(d.map((x) => [x, 3500])), d[41]);
    const c = runCheckIn(profile, r, d[41]);
    expect(c.dirtyBulk).toBe(true);
    expect(c.verdict).toBe('decrease');
  });
  it('a cada 7 dias', () => {
    expect(isCheckInDue(undefined, '2026-10-28')).toBe(true);
    expect(isCheckInDue('2026-10-25', '2026-10-28')).toBe(false);
    expect(isCheckInDue('2026-10-21', '2026-10-28')).toBe(true);
  });
});

describe('texto livre', () => {
  it('entende quantidades, medidas e cozido', () => {
    const items = resolveItems(parseFreeText('2 ovos cozidos, 100g de arroz cozido e 1 concha de feijão carioca; 1 scoop de whey'), LIST);
    expect(items).toHaveLength(4);
    expect(items[0].grams).toBe(100);
    expect(items[0].food?.name).toContain('Ovo');
    expect(items[1].food?.name).toBe('Arroz, tipo 1, cozido');
    expect(items[1].grams).toBe(100);
    expect(items[2].grams).toBe(86);
    expect(items[3].food?.kind).toBe('supplement');
    expect(items[3].grams).toBe(30);
  });
  it('números por extenso', () => {
    const [i] = parseFreeText('duas bananas');
    expect(i.quantity).toBe(2);
  });
});

describe('cardápio automático', () => {
  it('bate a proteína com comida brasileira', () => {
    const t = computeTargets(profile, undefined, today);
    const day = generateDay(t, 4, FOODS, 0);
    expect(day.meals).toHaveLength(4);
    expect(day.totals.protein!).toBeGreaterThan(t.protein * 0.9);
    expect(day.totals.protein!).toBeLessThan(t.protein * 1.15);
    expect(day.totals.kcal!).toBeGreaterThan(t.kcal * 0.8);
    expect(day.totals.kcal!).toBeLessThan(t.kcal * 1.15);
  });
  it('lista de compras da semana em cru', () => {
    const t = computeTargets(profile, undefined, today);
    const list = shoppingList(generateWeek(t, 4, FOODS), FOODS);
    const arroz = list.find((i) => i.name === 'Arroz (cru)');
    expect(arroz).toBeDefined();
    expect(list.find((i) => i.name === 'Ovos')?.unit).toBe('dúzia');
  });
});

describe('relatórios', () => {
  it('CSV no padrão brasileiro', () => {
    const csv = diaryCsv([{ id: '1', date: '2026-10-28', meal: 'lunch', foodId: 'taco-410', grams: 150 }], FOODS);
    expect(csv.split('\n')[1]).toBe('2026-10-28;Almoço;Frango, peito, sem pele, grelhado;150;238,5;48;0;3,8;;75');
  });
  it('HTML do relatório', () => {
    const t = computeTargets(profile, undefined, today);
    const html = reportHtml({ profile, targets: t, entries: [{ id: '1', date: '2026-10-28', meal: 'lunch', foodId: 'taco-410', grams: 150 }], weights: [], foods: FOODS, endDate: '2026-10-28' });
    expect(html).toContain('Dias registrados: 1 de 14');
  });
});

describe('favoritos', () => {
  it('mais usados primeiro', () => {
    const e = (id: string, foodId: string, date: string) => ({ id, foodId, date, meal: 'lunch' as const, grams: 100 });
    expect(recentFoodIds([e('1', 'a', '2026-10-01'), e('2', 'b', '2026-10-02'), e('3', 'a', '2026-10-03')])).toEqual(['a', 'b']);
  });
});

void ({} as Food);

describe('busca: versão do dia a dia primeiro', () => {
  it('ovo, feijão e whey trazem a forma mais comum', () => {
    expect(searchFoods(TACO_FOODS, 'ovos')[0].name).toMatch(/inteiro, cozido/);
    expect(searchFoods(TACO_FOODS, 'feijão')[0].name).toBe('Feijão, carioca, cozido');
    expect(searchFoods(TACO_FOODS, 'whey')[0].name).toMatch(/concentrado/);
  });
});
