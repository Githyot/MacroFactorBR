import { describe, expect, it } from '@jest/globals';

import { Food } from '../foods';
import { microStatus, microTargets } from '../micros';
import {
  adherence,
  isSupplementFood,
  migrateHabits,
  proteinBySource,
  scheduledDoses,
  Supplement,
  supplementNutrients,
  SUPPLEMENT_PRESETS,
  upperLimitWarnings,
} from '../supplements';

const food = (id: string, name: string, protein: number, extra: Partial<Food> = {}): Food => ({ id, name, source: 'manual', per100g: { protein }, createdAt: '', ...extra });
const FOODS: Record<string, Food> = {
  frango: food('frango', 'Frango, peito, grelhado', 32, { source: 'taco' }),
  whey: food('whey', 'Whey', 78, { kind: 'supplement' }),
  rotulo: food('rotulo', 'Whey Protein Isolado Chocolate', 80),
  barra: food('barra', 'Barra de cereal', 5),
};
const sup = (s: Partial<Supplement>): Supplement => ({ id: 'x', name: 'X', kind: 'vitamina', dose: 1, unit: 'comprimido', timesPerDay: 1, createdAt: '', ...s });

describe('origem da proteína', () => {
  it('separa comida de pó, inclusive whey cadastrado pelo rótulo', () => {
    expect(isSupplementFood(FOODS.rotulo)).toBe(true);
    expect(isSupplementFood(FOODS.barra)).toBe(false);
    const e = (foodId: string, grams: number) => ({ id: foodId, date: '2026-10-28', meal: 'lunch' as const, foodId, grams });
    const split = proteinBySource([e('frango', 300), e('whey', 30), e('rotulo', 30)], FOODS);
    expect(split.food).toBeCloseTo(96);
    expect(split.supplement).toBeCloseTo(23.4 + 24);
    expect(split.supplementPct).toBeCloseTo(47.4 / 143.4);
  });
});

describe('protocolo de suplementos', () => {
  it('respeita os dias da semana', () => {
    const b12 = sup({ weekdays: [1, 4] }); // seg e qui
    expect(scheduledDoses(b12, '2026-10-26')).toBe(1); // segunda
    expect(scheduledDoses(b12, '2026-10-28')).toBe(0); // quarta
    expect(scheduledDoses({ ...b12, archived: true }, '2026-10-26')).toBe(0);
  });
  it('multivitamínico entra nos micros e tira a vitamina D de "sem dados"', () => {
    const multi = SUPPLEMENT_PRESETS.find((p) => p.presetId === 'multivitaminico')!;
    const vitD = sup({ id: 'd', nutrients: { vitaminD: 50 } });
    const supps = { m: { ...multi, id: 'm', createdAt: '' }, d: vitD };
    const n = supplementNutrients(supps, { m: 1, d: 1 });
    expect(n.vitaminD).toBe(60);
    const st = microStatus({}, microTargets('male', 30), { vitaminD: 0 }, n).find((x) => x.key === 'vitaminD')!;
    expect(st.ok).toBe(true);
    expect(st.known).toBe(true);
    expect(st.fromSupplements).toBe(60);
  });
  it('avisa quando passa do limite seguro só se o suplemento contribui', () => {
    expect(upperLimitWarnings({ vitaminD: 10 }, { vitaminD: 100 }).map((w) => w.key)).toEqual(['vitaminD']);
    expect(upperLimitWarnings({ iron: 50 }, {})).toEqual([]);
    expect(upperLimitWarnings({}, { magnesium: 400 }).map((w) => w.key)).toEqual(['magnesium']);
  });
  it('mede a adesão pelas doses programadas', () => {
    const creatina = sup({ id: 'c', timesPerDay: 1 });
    const omega = sup({ id: 'o', timesPerDay: 2 });
    const rate = adherence({ c: creatina, o: omega }, { '2026-10-28': { c: 1, o: 1 }, '2026-10-27': { c: 1 } }, ['2026-10-28', '2026-10-27']);
    expect(rate).toBeCloseTo(3 / 6);
  });
  it('migra a antiga caixinha de creatina para o protocolo', () => {
    const s = migrateHabits({ habits: { '2026-10-27': { creatine: true }, '2026-10-28': { creatine: false } }, supplements: {} as Record<string, Supplement>, supplementLog: {} });
    expect(s.supplements.creatina.dose).toBe(5);
    expect(s.supplementLog).toEqual({ '2026-10-27': { creatina: 1 } });
    expect(s.habits).toEqual({});
  });
});
