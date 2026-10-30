// Estatísticas do modo Treino no estilo Hevy: gráfico semanal, resumo do período
// comparado com o anterior, distribuição muscular, calendário e relatório mensal.

import { Exercise, Muscle } from './exercises';
import { completedSets, detectNewRecords, isWorkingSet, NewRecord, setsPerMuscle, weekStreak, Workout, workoutDurationMin, workoutVolume } from './training';

export type Metric = 'duration' | 'volume' | 'reps' | 'sets' | 'workouts';

export const METRIC_LABEL: Record<Metric, string> = {
  duration: 'Duração',
  volume: 'Volume',
  reps: 'Repetições',
  sets: 'Séries',
  workouts: 'Treinos',
};

export function workoutReps(w: Workout): number {
  return w.exercises.reduce((n, e) => n + e.sets.filter(isWorkingSet).reduce((s, x) => s + (x.reps ?? 0), 0), 0);
}

export function workoutDistanceKm(w: Workout): number {
  return w.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).reduce((s, x) => s + (x.distanceKm ?? 0), 0), 0);
}

const dayOf = (w: Workout) => w.startedAt.slice(0, 10);

function addDaysIso(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Segunda-feira da semana do dia. */
export function weekStart(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return addDaysIso(iso, -((d.getUTCDay() + 6) % 7));
}

export type Totals = { workouts: number; durationMin: number; volume: number; reps: number; sets: number };

export function totals(list: Workout[]): Totals {
  return list.reduce<Totals>(
    (t, w) => ({
      workouts: t.workouts + 1,
      durationMin: t.durationMin + workoutDurationMin(w),
      volume: t.volume + workoutVolume(w),
      reps: t.reps + workoutReps(w),
      sets: t.sets + completedSets(w),
    }),
    { workouts: 0, durationMin: 0, volume: 0, reps: 0, sets: 0 },
  );
}

export function metricValue(t: Totals, m: Metric): number {
  return m === 'duration' ? t.durationMin : m === 'volume' ? t.volume : m === 'reps' ? t.reps : m === 'sets' ? t.sets : t.workouts;
}

export function inRange(list: Workout[], fromIso: string, toIso: string): Workout[] {
  return list.filter((w) => w.endedAt && dayOf(w) >= fromIso && dayOf(w) <= toIso);
}

export type WeekBucket = Totals & { weekStart: string };

/** Totais por semana (segunda a domingo), da mais antiga para a atual. */
export function weeklyTotals(list: Workout[], weeks: number, todayIso: string): WeekBucket[] {
  const current = weekStart(todayIso);
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDaysIso(current, -7 * (weeks - 1 - i));
    return { weekStart: start, ...totals(inRange(list, start, addDaysIso(start, 6))) };
  });
}

export type Period = '7d' | '30d' | '3m' | '1a' | 'tudo';

export const PERIOD_LABEL: Record<Period, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '3m': 'Últimos 3 meses',
  '1a': 'Último ano',
  tudo: 'Todo o período',
};

const PERIOD_DAYS: Record<Exclude<Period, 'tudo'>, number> = { '7d': 7, '30d': 30, '3m': 91, '1a': 365 };

/** Intervalo do período e o intervalo anterior de mesmo tamanho (para comparar). */
export function periodRange(p: Period, todayIso: string, list: Workout[] = []): { from: string; to: string; prevFrom: string; prevTo: string } {
  if (p === 'tudo') {
    const first = list.reduce((m, w) => (dayOf(w) < m ? dayOf(w) : m), todayIso);
    return { from: first, to: todayIso, prevFrom: first, prevTo: addDaysIso(first, -1) };
  }
  const n = PERIOD_DAYS[p];
  const from = addDaysIso(todayIso, -(n - 1));
  return { from, to: todayIso, prevFrom: addDaysIso(from, -n), prevTo: addDaysIso(from, -1) };
}

// Grupos do gráfico radar (os 6 eixos do Hevy).
export type MuscleGroup = 'costas' | 'peito' | 'core' | 'ombros' | 'bracos' | 'pernas';

export const GROUP_LABEL: Record<MuscleGroup, string> = {
  costas: 'Costas',
  peito: 'Peito',
  core: 'Core',
  ombros: 'Ombros',
  bracos: 'Braços',
  pernas: 'Pernas',
};

export const RADAR_ORDER: MuscleGroup[] = ['costas', 'peito', 'core', 'ombros', 'bracos', 'pernas'];

export const MUSCLE_GROUP: Record<Exclude<Muscle, 'cardio'>, MuscleGroup> = {
  peito: 'peito',
  costas: 'costas',
  trapezio: 'costas',
  lombar: 'core',
  ombros: 'ombros',
  biceps: 'bracos',
  triceps: 'bracos',
  antebraco: 'bracos',
  quadriceps: 'pernas',
  posteriores: 'pernas',
  gluteos: 'pernas',
  panturrilha: 'pernas',
  abdomen: 'core',
};

export function groupSets(perMuscle: Partial<Record<Muscle, number>>): Record<MuscleGroup, number> {
  const out: Record<MuscleGroup, number> = { costas: 0, peito: 0, core: 0, ombros: 0, bracos: 0, pernas: 0 };
  for (const [m, n] of Object.entries(perMuscle) as [Muscle, number][]) if (m !== 'cardio') out[MUSCLE_GROUP[m]] += n;
  return out;
}

/** Séries por músculo em cada semana ou mês do período (gráfico de linhas). */
export function muscleSetsSeries(
  list: Workout[],
  exercises: Record<string, Exercise>,
  fromIso: string,
  toIso: string,
  step: 'week' | 'month',
): { start: string; sets: Partial<Record<Muscle, number>> }[] {
  const out: { start: string; sets: Partial<Record<Muscle, number>> }[] = [];
  let start = step === 'week' ? weekStart(fromIso) : `${fromIso.slice(0, 7)}-01`;
  while (start <= toIso) {
    const next = step === 'week' ? addDaysIso(start, 7) : nextMonth(start);
    out.push({ start, sets: setsPerMuscle(list, exercises, start, addDaysIso(next, -1)) });
    start = next;
  }
  return out;
}

function nextMonth(firstIso: string): string {
  const [y, m] = firstIso.split('-').map(Number);
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
}

export function monthRange(ym: string): { from: string; to: string } {
  const from = `${ym}-01`;
  return { from, to: addDaysIso(nextMonth(from), -1) };
}

export function prevMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

/** Exercícios mais feitos no período (quantas vezes apareceram em treinos). */
export function topExercises(list: Workout[], fromIso: string, toIso: string): { exerciseId: string; times: number }[] {
  const count: Record<string, number> = {};
  for (const w of inRange(list, fromIso, toIso)) {
    for (const id of new Set(w.exercises.filter((e) => e.sets.some((s) => s.done)).map((e) => e.exerciseId))) count[id] = (count[id] ?? 0) + 1;
  }
  return Object.entries(count)
    .map(([exerciseId, times]) => ({ exerciseId, times }))
    .sort((a, b) => b.times - a.times || a.exerciseId.localeCompare(b.exerciseId));
}

/** Dias com treino (YYYY-MM-DD). */
export function trainedDays(list: Workout[]): Set<string> {
  return new Set(list.filter((w) => w.endedAt).map(dayOf));
}

/** Semanas do mês para o calendário (domingo a sábado), com null fora do mês. */
export function monthGrid(ym: string): (string | null)[][] {
  const { from, to } = monthRange(ym);
  const first = new Date(`${from}T12:00:00Z`).getUTCDay();
  const cells: (string | null)[] = Array.from({ length: first }, () => null);
  for (let d = from; d <= to; d = addDaysIso(d, 1)) cells.push(d);
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
}

export type MonthlyReport = {
  month: string;
  totals: Totals;
  previous: Totals;
  /** Treinos por mês nos últimos 12 meses (o último é o do relatório). */
  history: { month: string; totals: Totals }[];
  days: string[];
  streakWeeks: number;
  perMuscle: Partial<Record<Muscle, number>>;
  groups: Record<MuscleGroup, number>;
  previousGroups: Record<MuscleGroup, number>;
  top: { exerciseId: string; times: number }[];
  records: NewRecord[];
};

export function monthlyReport(list: Workout[], exercises: Record<string, Exercise>, ym: string): MonthlyReport {
  const { from, to } = monthRange(ym);
  const prev = monthRange(prevMonth(ym));
  const done = list.filter((w) => w.endedAt);
  const inMonth = inRange(done, from, to);
  const history: { month: string; totals: Totals }[] = [];
  let m = ym;
  for (let i = 0; i < 12; i++) {
    const r = monthRange(m);
    history.unshift({ month: m, totals: totals(inRange(done, r.from, r.to)) });
    m = prevMonth(m);
  }
  const perMuscle = setsPerMuscle(done, exercises, from, to);
  return {
    month: ym,
    totals: totals(inMonth),
    previous: totals(inRange(done, prev.from, prev.to)),
    history,
    days: [...trainedDays(inMonth)].sort(),
    streakWeeks: weekStreak(done.filter((w) => dayOf(w) <= to), to),
    perMuscle,
    groups: groupSets(perMuscle),
    previousGroups: groupSets(setsPerMuscle(done, exercises, prev.from, prev.to)),
    top: topExercises(done, from, to),
    records: inMonth.flatMap((w) => detectNewRecords(w, done)),
  };
}

/** Recordes de cada treino (para o selo no feed). */
export function recordsCount(w: Workout, history: Workout[]): number {
  return detectNewRecords(w, history).length;
}

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function monthName(ym: string, short = false): string {
  const i = Number(ym.slice(5, 7)) - 1;
  return short ? MONTHS_SHORT[i] : MONTHS[i];
}

export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h ${m}min` : `${m}min`;
}

export function fmtNumber(n: number, digits = 0): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: digits });
}

/** Volume compacto para eixos e cartões: 81.000 → "81 mil". */
export function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1000) return `${fmtNumber(n / 1000, n >= 10000 ? 0 : 1)} mil`;
  return fmtNumber(n, 1);
}

export function fmtMetric(m: Metric, v: number): string {
  if (m === 'duration') return fmtDuration(v);
  if (m === 'volume') return `${fmtNumber(Math.round(v))} kg`;
  return fmtNumber(v, 1);
}

/** "Hoje", "Ontem", "há 3 dias" ou a data. */
export function relativeDay(iso: string, todayIso: string): string {
  const diff = Math.round((new Date(`${todayIso}T12:00:00Z`).getTime() - new Date(`${iso.slice(0, 10)}T12:00:00Z`).getTime()) / 86400000);
  if (diff <= 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  if (diff < 30) return `há ${diff} dias`;
  return iso.slice(0, 10).split('-').reverse().join('/');
}
