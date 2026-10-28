// Check-in semanal: compara o ritmo real de ganho com o alvo e propõe ajuste de calorias.

import { AdaptiveResult } from './adaptiveTdee';
import { Profile, targetWeeklyChangeKg } from './targets';

export type CheckIn = {
  date: string; // AAAA-MM-DD
  weeklyChangeKg: number;
  targetWeeklyChangeKg: number;
  adjustmentKcal: number;
  verdict: 'keep' | 'increase' | 'decrease' | 'insufficient';
  dirtyBulk: boolean;
  message: string;
};

const KCAL_PER_KG = 7700;
const MAX_STEP = 250; // nunca mexer mais que isso de uma vez
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

export function runCheckIn(profile: Profile, adaptive: AdaptiveResult, today: string): CheckIn {
  const target = targetWeeklyChangeKg(profile);
  if (adaptive.status !== 'ok') {
    return {
      date: today,
      weeklyChangeKg: 0,
      targetWeeklyChangeKg: target,
      adjustmentKcal: 0,
      verdict: 'insufficient',
      dirtyBulk: false,
      message: `Ainda faltam dados: registre o peso quase todo dia e as refeições (${adaptive.loggedDays} dias registrados nas últimas 4 semanas). Mantenha as metas atuais.`,
    };
  }

  const actual = adaptive.weeklyChangeKg;
  const diff = target - actual; // positivo: está ganhando menos que o alvo
  let adjustment = 0;
  if (Math.abs(diff) > TOLERANCE_KG / 2) {
    adjustment = Math.round(((diff * KCAL_PER_KG) / 7) / 25) * 25;
    adjustment = Math.max(-MAX_STEP, Math.min(MAX_STEP, adjustment));
  }
  // Bulking sujo: ganhando mais de 1,5x o alvo e mais de 0,5% do peso por semana.
  const dirtyBulk = profile.goal === 'bulk' && actual > target * 1.5 && actual > profile.weightKg * 0.005;
  const verdict: CheckIn['verdict'] = adjustment > 0 ? 'increase' : adjustment < 0 ? 'decrease' : 'keep';

  let message = `Você ${actual >= 0 ? 'ganhou' : 'perdeu'} ${fmtKg(actual)} por semana na tendência; o alvo era ${fmtKg(target)}. `;
  if (verdict === 'keep') message += 'Ritmo certo: mantenha as metas.';
  else if (verdict === 'increase') message += `Vamos subir ${adjustment} kcal por dia.`;
  else message += `Vamos reduzir ${-adjustment} kcal por dia.`;
  if (dirtyBulk) message += ' Atenção: ganho rápido demais tende a virar gordura (bulking sujo).';

  return { date: today, weeklyChangeKg: actual, targetWeeklyChangeKg: target, adjustmentKcal: adjustment, verdict, dirtyBulk, message };
}
