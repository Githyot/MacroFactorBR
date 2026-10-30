import { describe, expect, it } from '@jest/globals';
import { EXERCISES } from '../workout/exercises';
import { EXERCISE_MEDIA, exerciseFrames } from '../workout/media';
import {
  fmtCompact,
  fmtDuration,
  groupSets,
  monthGrid,
  monthlyReport,
  muscleSetsSeries,
  periodRange,
  relativeDay,
  topExercises,
  totals,
  weeklyTotals,
  weekStart,
  workoutReps,
} from '../workout/stats';
import { Workout } from '../workout/training';

const BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

function w(id: string, date: string, exerciseId: string, sets: [number, number][], minutes = 60): Workout {
  const start = new Date(`${date}T10:00:00.000Z`);
  return {
    id,
    name: 'Treino',
    startedAt: start.toISOString(),
    endedAt: new Date(start.getTime() + minutes * 60000).toISOString(),
    exercises: [{ exerciseId, restSec: 90, sets: sets.map(([weightKg, reps]) => ({ type: 'normal', weightKg, reps, done: true })) }],
  };
}

describe('totais e semanas', () => {
  const list = [
    w('a', '2026-10-05', 'supino-reto-barra', [[60, 10], [60, 8]], 45),
    w('b', '2026-10-07', 'agachamento-livre', [[100, 5]], 30),
    w('c', '2026-10-13', 'supino-reto-barra', [[62.5, 10]]),
  ];

  it('soma repetições, séries, volume e duração', () => {
    expect(workoutReps(list[0])).toBe(18);
    expect(totals(list)).toEqual({ workouts: 3, durationMin: 135, volume: 60 * 18 + 500 + 625, reps: 33, sets: 4 });
  });

  it('semana começa na segunda', () => {
    expect(weekStart('2026-10-07')).toBe('2026-10-05');
    expect(weekStart('2026-10-11')).toBe('2026-10-05');
    expect(weekStart('2026-10-12')).toBe('2026-10-12');
  });

  it('agrupa por semana até a atual', () => {
    const weeks = weeklyTotals(list, 3, '2026-10-14');
    expect(weeks.map((x) => x.weekStart)).toEqual(['2026-09-28', '2026-10-05', '2026-10-12']);
    expect(weeks.map((x) => x.workouts)).toEqual([0, 2, 1]);
    expect(weeks[1].durationMin).toBe(75);
  });

  it('período anterior tem o mesmo tamanho', () => {
    expect(periodRange('30d', '2026-10-30')).toEqual({ from: '2026-10-01', to: '2026-10-30', prevFrom: '2026-09-01', prevTo: '2026-09-30' });
  });

  it('séries por músculo viram os 6 grupos do radar', () => {
    const g = groupSets({ biceps: 4, triceps: 3, quadriceps: 5, abdomen: 2, lombar: 1, trapezio: 2 });
    expect(g).toEqual({ costas: 2, peito: 0, core: 3, ombros: 0, bracos: 7, pernas: 5 });
  });

  it('série semanal de séries por músculo', () => {
    const series = muscleSetsSeries(list, BY_ID, '2026-10-05', '2026-10-18', 'week');
    expect(series.map((s) => s.start)).toEqual(['2026-10-05', '2026-10-12']);
    expect(series[0].sets.peito).toBe(2);
    expect(series[0].sets.quadriceps).toBe(1);
    expect(series[1].sets.peito).toBe(1);
  });

  it('exercícios mais feitos', () => {
    expect(topExercises(list, '2026-10-01', '2026-10-31')).toEqual([
      { exerciseId: 'supino-reto-barra', times: 2 },
      { exerciseId: 'agachamento-livre', times: 1 },
    ]);
  });
});

describe('calendário e relatório mensal', () => {
  it('grade do mês começa no domingo', () => {
    const g = monthGrid('2026-09');
    // 1º de setembro de 2026 é terça-feira.
    expect(g[0]).toEqual([null, null, '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05']);
    expect(g[g.length - 1].filter(Boolean).pop()).toBe('2026-09-30');
  });

  it('relatório compara com o mês anterior e conta recordes', () => {
    const list = [
      w('a', '2026-08-20', 'supino-reto-barra', [[60, 10]]),
      w('b', '2026-09-03', 'supino-reto-barra', [[65, 10]]),
      w('c', '2026-09-10', 'supino-reto-barra', [[70, 8]]),
    ];
    const r = monthlyReport(list, BY_ID, '2026-09');
    expect(r.totals.workouts).toBe(2);
    expect(r.previous.workouts).toBe(1);
    expect(r.history).toHaveLength(12);
    expect(r.history[11].month).toBe('2026-09');
    expect(r.days).toEqual(['2026-09-03', '2026-09-10']);
    expect(r.records.length).toBeGreaterThan(0);
    expect(r.groups.peito).toBe(2);
    expect(r.top[0]).toEqual({ exerciseId: 'supino-reto-barra', times: 2 });
  });
});

describe('formatos', () => {
  it('duração, números e datas relativas', () => {
    expect(fmtDuration(467)).toBe('7h 47min');
    expect(fmtDuration(45)).toBe('45min');
    expect(fmtCompact(81234)).toBe('81 mil');
    expect(relativeDay('2026-10-28T10:00:00Z', '2026-10-29')).toBe('Ontem');
    expect(relativeDay('2026-10-06', '2026-10-29')).toBe('há 23 dias');
  });
});

describe('animações', () => {
  it('quase todos os exercícios têm animação', () => {
    const missing = EXERCISES.filter((e) => !EXERCISE_MEDIA[e.id]);
    expect(missing.length).toBeLessThan(10);
    expect(Object.keys(EXERCISE_MEDIA).every((id) => BY_ID[id])).toBe(true);
  });

  it('dois quadros por exercício', () => {
    expect(exerciseFrames('supino-reto-barra')?.[1]).toMatch(/Barbell_Bench_Press_-_Medium_Grip\/1\.jpg$/);
    expect(exerciseFrames('meu-exercicio')).toBeUndefined();
  });
});
