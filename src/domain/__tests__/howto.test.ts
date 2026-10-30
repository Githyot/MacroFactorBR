import { describe, expect, it } from '@jest/globals';
import { EXERCISES } from '../workout/exercises';
import { boldParts, HOW_TO, howTo, intensityTip } from '../workout/howto';

const BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

describe('como executar', () => {
  it('todo exercício da biblioteca tem dicas próprias', () => {
    expect(EXERCISES.filter((e) => !HOW_TO[e.id]).map((e) => e.id)).toEqual([]);
  });

  it('não há dicas soltas para exercícios que não existem', () => {
    expect(Object.keys(HOW_TO).filter((id) => !BY_ID[id])).toEqual([]);
  });

  it('cada exercício tem pelo menos 2 dicas e negrito bem fechado', () => {
    for (const [id, steps] of Object.entries(HOW_TO)) {
      expect([id, steps.length >= 2]).toEqual([id, true]);
      for (const s of steps) expect([id, (s.match(/\*\*/g) ?? []).length % 2]).toEqual([id, 0]);
    }
  });

  it('intensidade depende do tipo de exercício', () => {
    expect(intensityTip(BY_ID['agachamento-livre'])).toMatch(/antes da falha/);
    expect(intensityTip(BY_ID['cadeira-extensora'])).toMatch(/até a falha/);
    expect(intensityTip(BY_ID['esteira'])).toBeUndefined();
  });

  it('exercício criado por você recebe orientação geral', () => {
    const r = howTo({ id: 'custom-1', name: 'Meu', primary: 'peito', secondary: [], equipment: 'halter', kind: 'weight_reps', custom: true });
    expect(r.generic).toBe(true);
    expect(r.steps.length).toBeGreaterThan(0);
  });

  it('separa o negrito', () => {
    expect(boldParts('Desça até **alongar** bem')).toEqual([
      { text: 'Desça até ', bold: false },
      { text: 'alongar', bold: true },
      { text: ' bem', bold: false },
    ]);
  });
});
