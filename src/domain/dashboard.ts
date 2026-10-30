// Números do Painel do modo Dieta: macros por dia, períodos dos gráficos,
// sequências de hábito e o histórico do gasto energético.

import { estimateAdaptiveTdee, WeightEntry } from './adaptiveTdee';
import { addDays, dayTotals, DiaryEntry, Food } from './foods';

export type DayMacros = { date: string; kcal: number; protein: number; fat: number; carbs: number; logged: boolean };

/** Totais de cada dia pedido; dias sem registro vêm zerados com logged = false. */
export function dailyMacros(entries: DiaryEntry[], foods: Record<string, Food>, dates: string[]): DayMacros[] {
  const byDate: Record<string, DiaryEntry[]> = {};
  for (const e of entries) (byDate[e.date] ??= []).push(e);
  return dates.map((date) => {
    const list = byDate[date] ?? [];
    const t = dayTotals(list, foods);
    return { date, kcal: t.kcal ?? 0, protein: t.protein ?? 0, fat: t.fat ?? 0, carbs: t.carbs ?? 0, logged: list.length > 0 };
  });
}

/** Datas de from a to, inclusive. */
export function datesBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to && out.length < 4000; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Semana de segunda a domingo que contém a data. */
export function weekOf(date: string): string[] {
  const weekday = (new Date(`${date}T12:00:00`).getDay() + 6) % 7; // 0 = segunda
  const monday = addDays(date, -weekday);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export type Range = '1S' | '1M' | '3M' | '6M' | '1A' | 'tudo';

export const RANGES: { value: Range; label: string; days?: number }[] = [
  { value: '1S', label: '1S', days: 7 },
  { value: '1M', label: '1M', days: 30 },
  { value: '3M', label: '3M', days: 91 },
  { value: '6M', label: '6M', days: 182 },
  { value: '1A', label: '1A', days: 365 },
  { value: 'tudo', label: 'Tudo' },
];

/** Datas do período terminando hoje. "Tudo" começa no primeiro registro (no mínimo 7 dias). */
export function rangeDates(range: Range, today: string, firstDate?: string): string[] {
  const days = RANGES.find((r) => r.value === range)?.days;
  const from = days ? addDays(today, -(days - 1)) : firstDate && firstDate < addDays(today, -6) ? firstDate : addDays(today, -6);
  return datesBetween(from, today);
}

/**
 * Dias seguidos com registro até hoje. Se hoje ainda não tem, conta até ontem
 * (o dia não acabou, a sequência não quebrou).
 */
export function streak(has: (date: string) => boolean, today: string): number {
  let d = has(today) ? today : addDays(today, -1);
  let n = 0;
  while (has(d) && n < 4000) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** Gasto energético estimado em cada data (undefined enquanto não há dados suficientes). */
export function expenditureSeries(weights: WeightEntry[], intakeByDate: Record<string, number>, dates: string[]): (number | undefined)[] {
  return dates.map((d) => {
    const r = estimateAdaptiveTdee(weights, intakeByDate, d);
    return r.status === 'ok' ? r.tdee : undefined;
  });
}

export function average(values: (number | undefined)[]): number | undefined {
  const v = values.filter((x): x is number => x !== undefined);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : undefined;
}

/** Último valor menos o primeiro (só valores existentes). */
export function difference(values: (number | undefined)[]): number | undefined {
  const v = values.filter((x): x is number => x !== undefined);
  return v.length ? v[v.length - 1] - v[0] : undefined;
}

/** Agrupa a série em blocos (semanas ou meses) pela média, para períodos longos. */
export function bucket(dates: string[], values: (number | undefined)[], size: number): { dates: string[]; values: (number | undefined)[] } {
  if (size <= 1) return { dates, values };
  const outD: string[] = [];
  const outV: (number | undefined)[] = [];
  for (let i = 0; i < dates.length; i += size) {
    outD.push(dates[i]);
    outV.push(average(values.slice(i, i + size)));
  }
  return { dates: outD, values: outV };
}
