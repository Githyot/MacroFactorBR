// Check-in semanal: compara o ritmo real de ganho com o alvo e propõe ajuste de calorias.

import { AdaptiveResult } from './adaptiveTdee';
import { Profile, targetWeeklyChangeKg } from './targets';

export type CheckIn = {
  date: string; // AAAA-MM-DD
  weeklyChangeKg: number;
  targetWeeklyChangeKg: number;
  /** Quanto a meta de calorias mudou desde o check-in anterior (só informativo). */
  adjustmentKcal: number;
  /** Meta de calorias no momento do check-in. */
  kcalTarget?: number;
  verdict: 'keep' | 'increase' | 'decrease' | 'insufficient';
  dirtyBulk: boolean;
  message: string;
};

const TOLERANCE_KG = 0.1; // diferença semanal que não vale ajuste (ruído)

export function isCheckInDue(lastCheckInDate: string | undefined, today: string): boolean {
  if (!lastCheckInDate) return true;
  const days = (new Date(`${today}T12:00:00`).getTime() - new Date(`${lastCheckInDate}T12:00:00`).getTime()) / 86_400_000;
  return days >= 7;
}

function fmtKg(kg: number): string {
  const g = Math.round(kg * 1000);
  return `${g > 0 ? '+' : ''}${g} g`;
}

/**
 * Com dados suficientes, a meta já usa o gasto real (TDEE adaptativo), que corrige sozinho
 * um ganho rápido ou lento demais. O check-in mostra o ritmo, compara com o alvo e
 * registra quanto a meta mudou desde a semana anterior. Não soma ajuste por cima do
 * gasto adaptativo, o que corrigiria duas vezes.
 */
export function runCheckIn(profile: Profile, adaptive: AdaptiveResult, today: string, currentKcal?: number, previousKcal?: number): CheckIn {
  const target = targetWeeklyChangeKg(profile);
  if (adaptive.status !== 'ok') {
    return {
      date: today,
      weeklyChangeKg: 0,
      targetWeeklyChangeKg: target,
      adjustmentKcal: 0,
      kcalTarget: currentKcal,
      verdict: 'insufficient',
      dirtyBulk: false,
      message: `Ainda faltam dados: registre o peso quase todo dia e as refeições (${adaptive.loggedDays} dias registrados nas últimas 4 semanas). Mantenha as metas atuais.`,
    };
  }

  const actual = adaptive.weeklyChangeKg;
  const diff = target - actual; // positivo: está ganhando menos que o alvo
  const verdict: CheckIn['verdict'] = Math.abs(diff) <= TOLERANCE_KG / 2 ? 'keep' : diff > 0 ? 'increase' : 'decrease';
  // Bulking sujo: ganhando mais de 1,5x o alvo e mais de 0,5% do peso por semana.
  const dirtyBulk = profile.goal === 'bulk' && actual > target * 1.5 && actual > profile.weightKg * 0.005;
  const change = currentKcal !== undefined && previousKcal !== undefined ? Math.round((currentKcal - previousKcal) / 25) * 25 : 0;

  let message = `Você ${actual >= 0 ? 'ganhou' : 'perdeu'} ${fmtKg(actual)} por semana na tendência; o alvo era ${fmtKg(target)}. `;
  if (verdict === 'keep') message += 'Ritmo certo.';
  else if (verdict === 'increase') message += 'Está abaixo do ritmo planejado.';
  else message += 'Está acima do ritmo planejado.';
  message += ` Seu gasto real estimado é ${adaptive.tdee} kcal`;
  if (currentKcal !== undefined) {
    message += `, então a meta ficou em ${currentKcal} kcal`;
    if (change !== 0) message += ` (${change > 0 ? '+' : ''}${change} kcal desde o último check-in)`;
  }
  message += '.';
  if (dirtyBulk) message += ' Atenção: ganho rápido demais tende a virar gordura (bulking sujo).';

  return { date: today, weeklyChangeKg: actual, targetWeeklyChangeKg: target, adjustmentKcal: change, kcalTarget: currentKcal, verdict, dirtyBulk, message };
}
