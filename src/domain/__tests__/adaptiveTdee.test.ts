import { describe, expect, it } from '@jest/globals';
import { estimateAdaptiveTdee, trendWeights } from '../adaptiveTdee';

function days(n: number, from = '2026-10-01'): string[] {
  const start = new Date(`${from}T00:00:00Z`).getTime();
  return Array.from({ length: n }, (_, i) => new Date(start + i * 86_400_000).toISOString().slice(0, 10));
}

describe('estimateAdaptiveTdee', () => {
  it('peso estável: TDEE igual à média consumida', () => {
    const d = days(28);
    const weights = d.map((date) => ({ date, kg: 80 }));
    const intake = Object.fromEntries(d.map((date) => [date, 2800]));
    const r = estimateAdaptiveTdee(weights, intake, d[27]);
    expect(r).toMatchObject({ status: 'ok', tdee: 2800, avgIntake: 2800 });
  });

  it('ganhando peso: TDEE menor que o consumido', () => {
    const d = days(60, '2026-09-01');
    // +0,25 kg/semana
    const weights = d.map((date, i) => ({ date, kg: 80 + (0.25 / 7) * i }));
    const intake = Object.fromEntries(d.map((date) => [date, 3000]));
    const r = estimateAdaptiveTdee(weights, intake, d[59]);
    if (r.status !== 'ok') throw new Error('esperava ok');
    expect(r.weeklyChangeKg).toBeCloseTo(0.25, 1);
    expect(r.tdee).toBeGreaterThan(2650);
    expect(r.tdee).toBeLessThan(2800);
  });

  it('pede mais dados quando há poucos registros', () => {
    const d = days(5);
    const r = estimateAdaptiveTdee(d.map((date) => ({ date, kg: 80 })), { [d[0]]: 2500 }, d[4]);
    expect(r.status).toBe('insufficient');
  });

  it('a tendência suaviza oscilações', () => {
    const t = trendWeights([{ date: '2026-10-01', kg: 80 }, { date: '2026-10-02', kg: 82 }]);
    expect(t[1].kg).toBeCloseTo(80.2);
  });
});
