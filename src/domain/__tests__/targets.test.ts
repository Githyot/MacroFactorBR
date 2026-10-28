import { describe, expect, it } from '@jest/globals';
import { bmr, computeTargets, Profile, proteinPerMealRange } from '../targets';

const base: Profile = {
  sex: 'male', birthDate: '1996-01-01', heightCm: 180, weightKg: 80,
  activity: 'moderate', goal: 'bulk', proteinPerKg: 2.0, mealsPerDay: 4,
};
const today = new Date('2026-10-28T12:00:00');

describe('targets', () => {
  it('usa Mifflin-St Jeor sem % de gordura', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(bmr(base, today)).toBe(1780);
  });

  it('usa Katch-McArdle quando há % de gordura', () => {
    expect(bmr({ ...base, bodyFatPct: 15 }, today)).toBeCloseTo(370 + 21.6 * 68);
  });

  it('meta de bulk: superávit pela taxa de ganho (intermediário) e proteína 2 g/kg', () => {
    const t = computeTargets(base, undefined, today);
    expect(t.tdee).toBe(Math.round(1780 * 1.55));
    // 80 kg × 0,75%/mês = 0,6 kg/mês → 154 kcal/dia (dentro da faixa de 5–15%)
    expect(t.kcal).toBe(Math.round(1780 * 1.55 + (80 * 0.0075 * 7700) / 30));
    expect(t.protein).toBe(160);
    expect(t.proteinPerMeal).toBe(40);
    expect(t.protein * 4 + t.carbs * 4 + t.fat * 9).toBeGreaterThan(t.kcal - 15);
    expect(t.protein * 4 + t.carbs * 4 + t.fat * 9).toBeLessThan(t.kcal + 15);
  });

  it('prefere o TDEE adaptativo quando existe', () => {
    const t = computeTargets({ ...base, goal: 'recomp' }, 3000, today);
    expect(t).toMatchObject({ tdee: 3000, kcal: 3000, tdeeSource: 'adaptive' });
  });

  it('gordura nunca fica abaixo de 0,6 g/kg', () => {
    const t = computeTargets({ ...base, goal: 'cut', activity: 'sedentary' }, 1500, today);
    expect(t.fat).toBeGreaterThanOrEqual(48);
  });

  it('faixa de proteína por refeição 0,3–0,4 g/kg', () => {
    expect(proteinPerMealRange(80)).toEqual([24, 32]);
  });
});
