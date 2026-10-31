import { describe, expect, it } from '@jest/globals';
import {
  computeTargets,
  energyDelta,
  explainTargets,
  formulaTdee,
  goalForecast,
  goalReached,
  goalWeightConflict,
  Profile,
  suggestActivity,
  targetWeeklyChangeKg,
  weeklyRatePct,
} from '../targets';

const base: Profile = {
  sex: 'male', birthDate: '1996-01-01', heightCm: 180, weightKg: 80,
  activity: 'moderate', goal: 'bulk', proteinPerKg: 2.0, mealsPerDay: 4, trainingLevel: 'intermediate',
};
const today = new Date('2026-10-28T12:00:00');

describe('meta de peso e ritmo', () => {
  it('sem ritmo escolhido usa o recomendado do nível', () => {
    expect(weeklyRatePct(base)).toBeCloseTo(0.75 / (30 / 7));
    expect(weeklyRatePct({ ...base, goal: 'cut' })).toBe(0.75);
    expect(weeklyRatePct({ ...base, goal: 'recomp' })).toBe(0);
  });

  it('ritmo escolhido define o superávit (7700 kcal/kg)', () => {
    const p = { ...base, weeklyRatePct: 0.25 };
    expect(targetWeeklyChangeKg(p)).toBeCloseTo(0.2);
    const tdee = formulaTdee(p, today);
    expect(energyDelta(p, tdee)).toBeCloseTo((0.2 * 7700) / 7);
    const t = computeTargets(p, undefined, today);
    expect(t.kcal).toBe(Math.round(tdee + 220));
  });

  it('déficit da definição segue o ritmo e respeita o teto de 30%', () => {
    const p: Profile = { ...base, goal: 'cut', weeklyRatePct: 0.5 };
    expect(targetWeeklyChangeKg(p)).toBeCloseTo(-0.4);
    expect(energyDelta(p, 2700)).toBeCloseTo((-0.4 * 7700) / 7);
    // ritmo exagerado é limitado a 1,25%/semana e a -30% do gasto
    expect(weeklyRatePct({ ...p, weeklyRatePct: 3 })).toBe(1.25);
    expect(energyDelta({ ...p, weeklyRatePct: 3 }, 2000)).toBe(-600);
  });

  it('no peso alvo vira manutenção', () => {
    const p = { ...base, goalWeightKg: 80 };
    expect(goalReached(p)).toBe(true);
    expect(targetWeeklyChangeKg(p)).toBe(0);
    const t = computeTargets(p, 2900, today);
    expect(t.kcal).toBe(2900);
    expect(explainTargets(p, t, today)[1]).toContain('chegou ao peso alvo');
  });

  it('acusa peso alvo na direção errada', () => {
    expect(goalWeightConflict({ goal: 'bulk', weightKg: 80, goalWeightKg: 75 })).toBe(true);
    expect(goalWeightConflict({ goal: 'cut', weightKg: 80, goalWeightKg: 75 })).toBe(false);
    expect(goalForecast({ ...base, goalWeightKg: 75 })).toBeUndefined();
  });

  it('prevê a data de chegada ao peso alvo', () => {
    const f = goalForecast({ ...base, goalWeightKg: 84, weeklyRatePct: 0.25 }, 80, today)!;
    expect(f.remainingKg).toBe(4);
    expect(f.weeks).toBe(20); // 4 kg ÷ 0,2 kg/semana
    expect(f.date.toISOString().slice(0, 10)).toBe('2027-03-17');
  });

  it('estilo de dieta muda a fração de gordura', () => {
    const lowcarb = computeTargets({ ...base, dietStyle: 'lowcarb' }, 3000, today);
    const lowfat = computeTargets({ ...base, dietStyle: 'lowfat' }, 3000, today);
    expect(lowcarb.fat).toBeGreaterThan(lowfat.fat);
    expect(lowcarb.carbs).toBeLessThan(lowfat.carbs);
    expect(lowcarb.protein).toBe(lowfat.protein);
  });

  it('sugere o nível de atividade pela rotina e pelos treinos', () => {
    expect(suggestActivity('seated', 0)).toBe('sedentary');
    expect(suggestActivity('seated', 4)).toBe('moderate');
    expect(suggestActivity('standing', 4)).toBe('high');
    expect(suggestActivity('physical', 6)).toBe('athlete');
  });
});
