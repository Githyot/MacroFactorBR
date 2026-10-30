import { describe, expect, it } from '@jest/globals';

import { average, bucket, dailyMacros, datesBetween, difference, expenditureSeries, rangeDates, streak, weekOf } from '../dashboard';
import { Food } from '../foods';

const food: Food = { id: 'f', name: 'Frango', source: 'manual', kind: 'food', per100g: { kcal: 160, protein: 32, fat: 2.5, carbs: 0 }, createdAt: '2026-01-01' };

describe('painel', () => {
  it('soma os macros por dia e marca os dias sem registro', () => {
    const days = dailyMacros([{ id: '1', date: '2026-10-29', meal: 'lunch', foodId: 'f', grams: 200 }], { f: food }, ['2026-10-28', '2026-10-29']);
    expect(days[0]).toMatchObject({ logged: false, kcal: 0 });
    expect(days[1]).toMatchObject({ logged: true, kcal: 320, protein: 64 });
  });

  it('monta a semana de segunda a domingo', () => {
    // 30/10/2026 é sexta-feira
    expect(weekOf('2026-10-30')).toEqual(datesBetween('2026-10-26', '2026-11-01'));
  });

  it('períodos terminam hoje e "Tudo" começa no primeiro registro', () => {
    expect(rangeDates('1S', '2026-10-30')).toHaveLength(7);
    expect(rangeDates('1M', '2026-10-30')[0]).toBe('2026-10-01');
    expect(rangeDates('tudo', '2026-10-30', '2026-09-01')[0]).toBe('2026-09-01');
    expect(rangeDates('tudo', '2026-10-30')).toHaveLength(7);
  });

  it('sequência não quebra enquanto o dia de hoje não acabou', () => {
    const has = new Set(['2026-10-27', '2026-10-28', '2026-10-29']);
    expect(streak((d) => has.has(d), '2026-10-30')).toBe(3);
    has.add('2026-10-30');
    expect(streak((d) => has.has(d), '2026-10-30')).toBe(4);
    expect(streak(() => false, '2026-10-30')).toBe(0);
  });

  it('média, diferença e agrupamento ignoram dias vazios', () => {
    expect(average([undefined, 2, 4])).toBe(3);
    expect(difference([undefined, 70, 71.5, undefined])).toBe(1.5);
    expect(average([])).toBeUndefined();
    expect(bucket(['a', 'b', 'c'], [1, 3, undefined], 2)).toEqual({ dates: ['a', 'c'], values: [2, undefined] });
  });

  it('gasto energético aparece só quando há dados suficientes', () => {
    const dates = datesBetween('2026-10-01', '2026-10-30');
    const weights = dates.filter((_, i) => i % 2 === 0).map((date) => ({ date, kg: 72 }));
    const intake = Object.fromEntries(dates.map((d) => [d, 2500]));
    const s = expenditureSeries(weights, intake, dates);
    expect(s[0]).toBeUndefined();
    expect(s[s.length - 1]).toBe(2500);
  });
});
