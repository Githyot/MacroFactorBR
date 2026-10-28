import { describe, expect, it } from '@jest/globals';
import { EXERCISES, searchExercises } from '../workout/exercises';
import { PROGRAMS } from '../workout/programs';
import {
  detectNewRecords,
  estimate1RM,
  personalRecords,
  platesPerSide,
  previousSets,
  setsPerMuscle,
  suggestNext,
  weekStreak,
  Workout,
  workoutFromRoutine,
  workoutVolume,
} from '../workout/training';

const BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
const supino = BY_ID['supino-reto-barra'];

function w(id: string, date: string, sets: [number, number][], exerciseId = 'supino-reto-barra'): Workout {
  return {
    id,
    name: 'Treino',
    startedAt: `${date}T10:00:00.000Z`,
    endedAt: `${date}T11:00:00.000Z`,
    exercises: [{ exerciseId, restSec: 90, sets: sets.map(([weightKg, reps]) => ({ type: 'normal', weightKg, reps, done: true })) }],
  };
}

describe('treino', () => {
  it('biblioteca: ids únicos e programas usam exercícios existentes', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    for (const p of PROGRAMS) for (const r of p.routines) for (const e of r.exercises) expect(BY_ID[e.exerciseId]).toBeDefined();
  });

  it('busca sem acento e por músculo', () => {
    expect(searchExercises(EXERCISES, 'triceps corda')[0].id).toBe('triceps-corda');
    const peito = searchExercises(EXERCISES, '', 'peito');
    expect(peito.length).toBeGreaterThan(5);
    expect(peito[0].primary).toBe('peito');
  });

  it('1RM de Epley e volume ignoram aquecimento', () => {
    expect(estimate1RM(100, 1)).toBe(100);
    expect(estimate1RM(100, 10)).toBeCloseTo(133.3, 1);
    const t = w('a', '2026-10-01', [[100, 10], [100, 8]]);
    t.exercises[0].sets.unshift({ type: 'warmup', weightKg: 60, reps: 10, done: true });
    expect(workoutVolume(t)).toBe(1800);
  });

  it('recordes e detecção de recorde novo', () => {
    const h = [w('a', '2026-10-01', [[80, 10]]), w('b', '2026-10-04', [[85, 8]])];
    const pr = personalRecords(h, 'supino-reto-barra');
    expect(pr.heaviestKg).toBe(85);
    expect(pr.byReps[10]).toBe(80);
    const novo = w('c', '2026-10-08', [[87.5, 10]]);
    const recs = detectNewRecords(novo, [...h, novo]);
    expect(recs.map((r) => r.kind)).toEqual(expect.arrayContaining(['carga', '1RM', 'volume']));
    // Primeiro treino de um exercício não gera "recorde"
    expect(detectNewRecords(h[0], h)).toEqual([]);
  });

  it('coluna Anterior pega o último treino com o exercício', () => {
    const h = [w('a', '2026-10-01', [[80, 10]]), w('b', '2026-10-04', [[85, 8], [85, 7]])];
    expect(previousSets(h, 'supino-reto-barra').map((s) => s.weightKg)).toEqual([85, 85]);
  });

  it('progressão dupla', () => {
    const topo = suggestNext(supino, w('a', '2026-10-01', [[80, 12], [80, 12], [80, 12]]).exercises[0].sets, [8, 12]);
    expect(topo).toMatchObject({ weightKg: 82.5, reps: 8 });
    const meio = suggestNext(supino, w('a', '2026-10-01', [[80, 10], [80, 9]]).exercises[0].sets, [8, 12]);
    expect(meio).toMatchObject({ weightKg: 80, reps: 10 });
    const lateral = suggestNext(BY_ID['elevacao-lateral'], w('a', '2026-10-01', [[10, 15], [10, 15]]).exercises[0].sets, [12, 15]);
    expect(lateral?.weightKg).toBe(11);
  });

  it('séries por músculo: secundário conta meia', () => {
    const h = [w('a', '2026-10-01', [[80, 10], [80, 10], [80, 10]])];
    const s = setsPerMuscle(h, BY_ID, '2026-09-28', '2026-10-04');
    expect(s.peito).toBe(3);
    expect(s.triceps).toBe(1.5);
    expect(setsPerMuscle(h, BY_ID, '2026-10-05', '2026-10-11').peito).toBeUndefined();
  });

  it('anilhas por lado', () => {
    expect(platesPerSide(100)).toEqual({ plates: [25, 15], remainderKg: 0 });
    expect(platesPerSide(62.5).plates).toEqual([20, 1.25]);
  });

  it('sequência semanal', () => {
    const h = [w('a', '2026-10-13', []), w('b', '2026-10-20', []), w('c', '2026-10-27', [])];
    expect(weekStreak(h, '2026-10-28')).toBe(3);
    expect(weekStreak(h.slice(0, 2), '2026-10-28')).toBe(2); // semana atual ainda aberta
    expect(weekStreak(h.slice(0, 1), '2026-10-28')).toBe(0);
  });

  it('treino a partir da rotina já traz a carga anterior', () => {
    const r = { id: 'r', name: 'A', createdAt: '', exercises: [{ exerciseId: 'supino-reto-barra', sets: 3, repRange: [8, 12] as [number, number], restSec: 120 }] };
    const t = workoutFromRoutine(r, [w('a', '2026-10-01', [[80, 10]])], 'x');
    expect(t.exercises[0].sets).toHaveLength(3);
    expect(t.exercises[0].sets.every((s) => s.weightKg === 80 && !s.done)).toBe(true);
  });
});

describe('biblioteca ampliada', () => {
  it('tem aparelhos articulados, smith, polia e filtro por equipamento', () => {
    expect(EXERCISES.length).toBeGreaterThan(250);
    const hammer = searchExercises(EXERCISES, '', undefined, 'articulada');
    expect(hammer.length).toBeGreaterThan(10);
    expect(hammer.every((e) => e.equipment === 'articulada')).toBe(true);
    expect(searchExercises(EXERCISES, 'hammer supino')[0].equipment).toBe('articulada');
    expect(searchExercises(EXERCISES, 'pendulo').map((e) => e.id)).toContain('agachamento-pendulo');
  });
});
