// Registro de treinos no estilo Hevy: séries com carga e repetições, recordes,
// volume semanal por músculo e sugestão de progressão para hipertrofia.

import { Exercise, Muscle } from './exercises';

export type SetType = 'warmup' | 'normal' | 'failure' | 'drop';

export const SET_TYPE_LABEL: Record<SetType, string> = {
  warmup: 'Aquecimento',
  normal: 'Normal',
  failure: 'Até a falha',
  drop: 'Drop set',
};

export type WorkoutSet = {
  type: SetType;
  weightKg?: number;
  reps?: number;
  durationSec?: number;
  /** Distância do cardio (km). */
  distanceKm?: number;
  /** Esforço percebido, 6 a 10 (10 = falha). */
  rpe?: number;
  done: boolean;
};

export type WorkoutExercise = {
  exerciseId: string;
  sets: WorkoutSet[];
  restSec: number;
  notes?: string;
  /** Exercícios com o mesmo id de superset são feitos em sequência. */
  supersetId?: string;
  /** Faixa de repetições alvo, vinda da rotina (ex.: 8–12). */
  repRange?: [number, number];
};

export type Workout = {
  id: string;
  name: string;
  routineId?: string;
  startedAt: string; // ISO
  endedAt?: string; // ISO
  exercises: WorkoutExercise[];
  notes?: string;
};

export type RoutineExercise = {
  exerciseId: string;
  sets: number;
  repRange: [number, number];
  restSec: number;
  supersetId?: string;
};

export type Routine = {
  id: string;
  name: string;
  exercises: RoutineExercise[];
  folder?: string;
  createdAt: string;
};

/** Séries de aquecimento não contam para volume nem recordes. */
export function isWorkingSet(s: WorkoutSet): boolean {
  return s.done && s.type !== 'warmup';
}

/** 1RM estimado (Epley). Acima de 12 repetições a estimativa piora, então limitamos. */
export function estimate1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + Math.min(reps, 12) / 30);
}

export function setVolume(s: WorkoutSet): number {
  return (s.weightKg ?? 0) * (s.reps ?? 0);
}

export function workoutVolume(w: Workout): number {
  return w.exercises.reduce((sum, e) => sum + e.sets.filter(isWorkingSet).reduce((s, x) => s + setVolume(x), 0), 0);
}

export function workoutDurationMin(w: Workout, now = new Date()): number {
  const end = w.endedAt ? new Date(w.endedAt) : now;
  return Math.max(0, Math.round((end.getTime() - new Date(w.startedAt).getTime()) / 60000));
}

export function completedSets(w: Workout): number {
  return w.exercises.reduce((n, e) => n + e.sets.filter(isWorkingSet).length, 0);
}

export type PersonalRecords = {
  heaviestKg: number;
  best1RM: number;
  bestSetVolume: number;
  mostReps: number;
  /** Melhor carga para cada número de repetições (1 a 15). */
  byReps: Record<number, number>;
};

const EMPTY_PR: PersonalRecords = { heaviestKg: 0, best1RM: 0, bestSetVolume: 0, mostReps: 0, byReps: {} };

export function recordsFromSets(sets: WorkoutSet[], base: PersonalRecords = EMPTY_PR): PersonalRecords {
  const pr: PersonalRecords = { ...base, byReps: { ...base.byReps } };
  for (const s of sets) {
    if (!isWorkingSet(s)) continue;
    const w = s.weightKg ?? 0;
    const r = s.reps ?? 0;
    pr.heaviestKg = Math.max(pr.heaviestKg, w);
    pr.best1RM = Math.max(pr.best1RM, estimate1RM(w, r));
    pr.bestSetVolume = Math.max(pr.bestSetVolume, w * r);
    pr.mostReps = Math.max(pr.mostReps, r);
    if (r >= 1 && r <= 15 && w > 0) pr.byReps[r] = Math.max(pr.byReps[r] ?? 0, w);
  }
  return pr;
}

/** Recordes de um exercício em todo o histórico (treinos concluídos). */
export function personalRecords(history: Workout[], exerciseId: string): PersonalRecords {
  let pr = EMPTY_PR;
  for (const w of history) for (const e of w.exercises) if (e.exerciseId === exerciseId) pr = recordsFromSets(e.sets, pr);
  return pr;
}

export type NewRecord = { exerciseId: string; kind: 'carga' | '1RM' | 'volume' | 'repetições'; value: number; previous: number };

/** Recordes batidos neste treino em relação ao histórico anterior. */
export function detectNewRecords(workout: Workout, history: Workout[]): NewRecord[] {
  const out: NewRecord[] = [];
  const past = history.filter((w) => w.id !== workout.id && w.startedAt < workout.startedAt);
  for (const e of workout.exercises) {
    const before = personalRecords(past, e.exerciseId);
    // Sem histórico não há recorde a bater: o primeiro treino só cria a marca.
    if (before.best1RM === 0 && before.mostReps === 0) continue;
    const now = recordsFromSets(e.sets);
    if (now.heaviestKg > before.heaviestKg) out.push({ exerciseId: e.exerciseId, kind: 'carga', value: now.heaviestKg, previous: before.heaviestKg });
    if (now.best1RM > before.best1RM + 0.05) out.push({ exerciseId: e.exerciseId, kind: '1RM', value: now.best1RM, previous: before.best1RM });
    if (now.bestSetVolume > before.bestSetVolume) out.push({ exerciseId: e.exerciseId, kind: 'volume', value: now.bestSetVolume, previous: before.bestSetVolume });
    if (now.heaviestKg === 0 && now.mostReps > before.mostReps) out.push({ exerciseId: e.exerciseId, kind: 'repetições', value: now.mostReps, previous: before.mostReps });
  }
  return out;
}

/** Séries da última vez que o exercício foi feito (coluna "Anterior"). */
export function previousSets(history: Workout[], exerciseId: string, beforeIso?: string): WorkoutSet[] {
  const sorted = [...history].filter((w) => w.endedAt && (!beforeIso || w.startedAt < beforeIso)).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  for (const w of sorted) {
    const e = w.exercises.find((x) => x.exerciseId === exerciseId && x.sets.some((s) => s.done));
    if (e) return e.sets.filter((s) => s.done);
  }
  return [];
}

// Faixa de séries semanais por músculo com melhor evidência para hipertrofia (Schoenfeld 2017; Pelland 2024).
export const WEEKLY_SETS_RANGE: [number, number] = [10, 20];

/**
 * Séries efetivas por músculo no período: o músculo principal conta 1 série,
 * cada secundário conta meia (método fracionado).
 */
export function setsPerMuscle(workouts: Workout[], exercises: Record<string, Exercise>, fromIso: string, toIso: string): Partial<Record<Muscle, number>> {
  const out: Partial<Record<Muscle, number>> = {};
  for (const w of workouts) {
    const day = w.startedAt.slice(0, 10);
    if (day < fromIso || day > toIso) continue;
    for (const e of w.exercises) {
      const ex = exercises[e.exerciseId];
      if (!ex || ex.primary === 'cardio') continue;
      const n = e.sets.filter(isWorkingSet).length;
      if (!n) continue;
      out[ex.primary] = (out[ex.primary] ?? 0) + n;
      for (const m of ex.secondary) out[m] = (out[m] ?? 0) + n / 2;
    }
  }
  return out;
}

export type Suggestion = { weightKg: number; reps: number; reason: string };

/** Incremento de carga: menor para isolados e halteres (anilhas de 1 kg em cada lado). */
export function weightStep(ex: Exercise): number {
  if (ex.equipment === 'halter' || ex.equipment === 'polia' || ex.equipment === 'caneleira' || ex.equipment === 'elastico') return 1;
  // Máquinas de placa sobem de 5 em 5 kg na maioria das academias.
  if (ex.equipment === 'maquina') return 5;
  const compound = ex.secondary.length >= 2;
  return compound ? 2.5 : 2;
}

/**
 * Progressão dupla: sobe repetições dentro da faixa; quando todas as séries chegam
 * ao topo com folga (RPE ≤ 9 ou sem RPE), sobe a carga e volta ao início da faixa.
 */
export function suggestNext(ex: Exercise, last: WorkoutSet[], repRange: [number, number] = [8, 12]): Suggestion | undefined {
  const work = last.filter((s) => s.type !== 'warmup' && (s.weightKg ?? 0) > 0 && (s.reps ?? 0) > 0);
  if (work.length === 0) return undefined;
  const [lo, hi] = repRange;
  const top = Math.max(...work.map((s) => s.weightKg!));
  const atTop = work.filter((s) => s.weightKg === top);
  const minReps = Math.min(...atTop.map((s) => s.reps!));
  const hardest = Math.max(...atTop.map((s) => s.rpe ?? 8));
  if (minReps >= hi && hardest <= 9) {
    const w = Math.round((top + weightStep(ex)) * 4) / 4;
    return { weightKg: w, reps: lo, reason: `Você fez ${hi}+ repetições em todas as séries: suba para ${fmtKg(w)} kg e volte a ${lo} reps.` };
  }
  if (minReps < lo && hardest >= 10) {
    const w = Math.max(0, Math.round((top - weightStep(ex)) * 4) / 4);
    return { weightKg: w, reps: lo, reason: `Ficou abaixo de ${lo} reps na falha: reduza para ${fmtKg(w)} kg.` };
  }
  const target = Math.min(hi, minReps + 1);
  return { weightKg: top, reps: target, reason: `Mantenha ${fmtKg(top)} kg e busque ${target} reps em todas as séries.` };
}

function fmtKg(kg: number): string {
  return String(Math.round(kg * 100) / 100).replace('.', ',');
}

/** Anilhas por lado da barra para chegar à carga desejada. */
export function platesPerSide(targetKg: number, barKg = 20, available = [25, 20, 15, 10, 5, 2.5, 1.25]): { plates: number[]; remainderKg: number } {
  let side = Math.max(0, (targetKg - barKg) / 2);
  const plates: number[] = [];
  for (const p of available) {
    while (side + 1e-9 >= p) {
      plates.push(p);
      side -= p;
    }
  }
  return { plates, remainderKg: Math.round(side * 2 * 100) / 100 };
}

/**
 * Gasto estimado do treino de musculação (MET ~5 para treino moderado-intenso).
 * Só informativo: o gasto adaptativo da dieta já captura o efeito real do treino.
 */
export function estimateKcal(durationMin: number, bodyWeightKg: number, met = 5): number {
  return Math.round((met * 3.5 * bodyWeightKg * durationMin) / 200);
}

/** Semanas seguidas com pelo menos um treino (a "sequência" do Hevy é semanal). */
export function weekStreak(workouts: Workout[], todayIso: string): number {
  const weekKey = (iso: string) => {
    const d = new Date(`${iso}T12:00:00`);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return monday.toISOString().slice(0, 10);
  };
  const weeks = new Set(workouts.filter((w) => w.endedAt).map((w) => weekKey(w.startedAt.slice(0, 10))));
  let streak = 0;
  const cursor = new Date(`${weekKey(todayIso)}T12:00:00`);
  // A semana atual sem treino ainda não quebra a sequência.
  if (!weeks.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 7);
  while (weeks.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

/** Monta o treino a partir da rotina, já preenchendo as cargas da última vez. */
export function workoutFromRoutine(routine: Routine, history: Workout[], id: string, now = new Date()): Workout {
  return {
    id,
    name: routine.name,
    routineId: routine.id,
    startedAt: now.toISOString(),
    exercises: routine.exercises.map((re) => {
      const prev = previousSets(history, re.exerciseId).filter((s) => s.type !== 'warmup');
      return {
        exerciseId: re.exerciseId,
        restSec: re.restSec,
        supersetId: re.supersetId,
        repRange: re.repRange,
        sets: Array.from({ length: re.sets }, (_, i) => ({
          type: 'normal' as SetType,
          weightKg: prev[i]?.weightKg ?? prev[prev.length - 1]?.weightKg,
          reps: undefined,
          done: false,
        })),
      };
    }),
  };
}
