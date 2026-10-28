// Programas prontos para hipertrofia, como as rotinas da aba "Explorar" do Hevy.
// Volume pensado para ficar dentro de 10–20 séries por músculo na semana.

import { RoutineExercise } from './training';

export type Program = {
  id: string;
  name: string;
  daysPerWeek: number;
  level: 'iniciante' | 'intermediario' | 'avancado';
  description: string;
  routines: { name: string; exercises: RoutineExercise[] }[];
};

const ex = (exerciseId: string, sets: number, lo: number, hi: number, restSec = 90): RoutineExercise => ({
  exerciseId,
  sets,
  repRange: [lo, hi],
  restSec,
});

export const PROGRAMS: Program[] = [
  {
    id: 'fullbody-3',
    name: 'Full body 3x',
    daysPerWeek: 3,
    level: 'iniciante',
    description: 'Corpo inteiro em dias alternados (seg, qua, sex). Ideal para o primeiro ano de treino.',
    routines: [
      {
        name: 'Full body A',
        exercises: [ex('agachamento-livre', 3, 6, 10, 150), ex('supino-reto-barra', 3, 6, 10, 150), ex('remada-curvada', 3, 8, 12, 120), ex('elevacao-lateral', 2, 12, 15, 60), ex('rosca-direta', 2, 10, 12, 60)],
      },
      {
        name: 'Full body B',
        exercises: [ex('terra-romeno', 3, 8, 10, 150), ex('desenvolvimento-halter', 3, 8, 12, 120), ex('puxada-frente', 3, 8, 12, 120), ex('leg-press', 2, 10, 15, 120), ex('triceps-corda', 2, 10, 15, 60)],
      },
      {
        name: 'Full body C',
        exercises: [ex('agachamento-bulgaro', 3, 8, 12, 120), ex('supino-inclinado-halter', 3, 8, 12, 120), ex('remada-baixa', 3, 10, 12, 90), ex('mesa-flexora', 2, 10, 15, 90), ex('panturrilha-pe', 3, 10, 15, 60)],
      },
    ],
  },
  {
    id: 'upper-lower-4',
    name: 'Superior / Inferior 4x',
    daysPerWeek: 4,
    level: 'intermediario',
    description: 'Dois treinos de superiores e dois de inferiores. Cada músculo treinado 2x por semana.',
    routines: [
      {
        name: 'Superiores A',
        exercises: [ex('supino-reto-barra', 4, 6, 8, 150), ex('remada-curvada', 4, 6, 10, 150), ex('desenvolvimento-halter', 3, 8, 12, 120), ex('puxada-frente', 3, 8, 12, 90), ex('rosca-alternada', 3, 10, 12, 60), ex('triceps-corda', 3, 10, 12, 60)],
      },
      {
        name: 'Inferiores A',
        exercises: [ex('agachamento-livre', 4, 6, 8, 180), ex('terra-romeno', 3, 8, 10, 150), ex('leg-press', 3, 10, 12, 120), ex('mesa-flexora', 3, 10, 12, 90), ex('panturrilha-pe', 4, 10, 15, 60)],
      },
      {
        name: 'Superiores B',
        exercises: [ex('supino-inclinado-halter', 4, 8, 10, 120), ex('barra-fixa', 4, 6, 10, 120), ex('elevacao-lateral', 4, 12, 15, 60), ex('remada-unilateral', 3, 8, 12, 90), ex('rosca-martelo', 3, 10, 12, 60), ex('triceps-testa', 3, 8, 12, 60)],
      },
      {
        name: 'Inferiores B',
        exercises: [ex('levantamento-terra', 3, 5, 6, 180), ex('agachamento-bulgaro', 3, 8, 12, 120), ex('cadeira-extensora', 3, 12, 15, 90), ex('cadeira-flexora', 3, 10, 12, 90), ex('panturrilha-sentado', 4, 12, 15, 60), ex('abdominal-polia', 3, 10, 15, 60)],
      },
    ],
  },
  {
    id: 'ppl-6',
    name: 'Push / Pull / Legs 6x',
    daysPerWeek: 6,
    level: 'avancado',
    description: 'Empurrar, puxar e pernas, duas vezes por semana. Mais volume para quem já treina há anos.',
    routines: [
      {
        name: 'Push (empurrar)',
        exercises: [ex('supino-reto-barra', 4, 6, 8, 150), ex('desenvolvimento-halter', 3, 8, 10, 120), ex('supino-inclinado-halter', 3, 8, 12, 90), ex('elevacao-lateral', 4, 12, 15, 60), ex('triceps-corda', 3, 10, 12, 60), ex('triceps-frances', 2, 10, 12, 60)],
      },
      {
        name: 'Pull (puxar)',
        exercises: [ex('barra-fixa', 4, 6, 10, 120), ex('remada-curvada', 4, 6, 10, 120), ex('remada-baixa', 3, 10, 12, 90), ex('face-pull', 3, 12, 15, 60), ex('rosca-direta', 3, 8, 12, 60), ex('rosca-martelo', 2, 10, 12, 60)],
      },
      {
        name: 'Legs (pernas)',
        exercises: [ex('agachamento-livre', 4, 6, 8, 180), ex('terra-romeno', 3, 8, 10, 150), ex('leg-press', 3, 10, 12, 120), ex('cadeira-flexora', 3, 10, 12, 90), ex('elevacao-pelvica', 3, 8, 12, 90), ex('panturrilha-pe', 4, 10, 15, 60)],
      },
    ],
  },
  {
    id: 'abc-5',
    name: 'ABC clássico',
    daysPerWeek: 5,
    level: 'intermediario',
    description: 'A: peito e tríceps, B: costas e bíceps, C: pernas e ombros. A divisão mais comum nas academias brasileiras.',
    routines: [
      {
        name: 'A: peito e tríceps',
        exercises: [ex('supino-reto-barra', 4, 6, 10, 150), ex('supino-inclinado-halter', 3, 8, 12, 120), ex('crucifixo-maquina', 3, 12, 15, 60), ex('triceps-polia', 3, 10, 12, 60), ex('triceps-testa', 3, 8, 12, 60)],
      },
      {
        name: 'B: costas e bíceps',
        exercises: [ex('puxada-frente', 4, 8, 12, 120), ex('remada-curvada', 4, 6, 10, 120), ex('remada-unilateral', 3, 8, 12, 90), ex('rosca-direta', 3, 8, 12, 60), ex('rosca-martelo', 3, 10, 12, 60)],
      },
      {
        name: 'C: pernas e ombros',
        exercises: [ex('agachamento-livre', 4, 6, 10, 180), ex('leg-press', 3, 10, 12, 120), ex('mesa-flexora', 3, 10, 12, 90), ex('desenvolvimento-halter', 3, 8, 12, 90), ex('elevacao-lateral', 4, 12, 15, 60), ex('panturrilha-pe', 4, 10, 15, 60)],
      },
    ],
  },
  {
    id: 'maquinas-4',
    name: 'Só máquinas 4x',
    daysPerWeek: 4,
    level: 'iniciante',
    description: 'Superior/inferior com aparelhos articulados, polias e Smith. Aprende fácil e é seguro treinar perto da falha.',
    routines: [
      {
        name: 'Superiores (máquinas) A',
        exercises: [ex('supino-articulado', 3, 8, 12, 120), ex('puxada-articulada', 3, 8, 12, 120), ex('desenvolvimento-maquina', 3, 8, 12, 90), ex('remada-articulada', 3, 8, 12, 90), ex('rosca-scott-maquina', 2, 10, 15, 60), ex('triceps-maquina', 2, 10, 15, 60)],
      },
      {
        name: 'Inferiores (máquinas) A',
        exercises: [ex('agachamento-smith', 3, 8, 12, 150), ex('leg-press', 3, 10, 15, 120), ex('cadeira-flexora', 3, 10, 15, 90), ex('cadeira-extensora', 3, 12, 15, 90), ex('panturrilha-sentado', 3, 12, 15, 60)],
      },
      {
        name: 'Superiores (máquinas) B',
        exercises: [ex('supino-inclinado-articulado', 3, 8, 12, 120), ex('remada-baixa', 3, 10, 12, 90), ex('crucifixo-maquina', 3, 12, 15, 60), ex('elevacao-lateral-maquina', 3, 12, 15, 60), ex('crucifixo-inverso-maquina', 2, 12, 15, 60), ex('rosca-polia', 2, 10, 15, 60), ex('triceps-corda', 2, 10, 15, 60)],
      },
      {
        name: 'Inferiores (máquinas) B',
        exercises: [ex('hack', 3, 8, 12, 150), ex('mesa-flexora', 3, 10, 12, 90), ex('elevacao-pelvica-maquina', 3, 10, 12, 90), ex('cadeira-abdutora', 3, 12, 15, 60), ex('panturrilha-leg', 3, 12, 15, 60), ex('abdominal-maquina', 3, 10, 15, 60)],
      },
    ],
  },
  {
    id: 'gluteos-pernas-4',
    name: 'Glúteos e pernas 4x',
    daysPerWeek: 4,
    level: 'intermediario',
    description: 'Ênfase em glúteos e pernas (3 dias) com um dia de superiores. Para quem prioriza o inferior.',
    routines: [
      {
        name: 'Glúteo e posterior',
        exercises: [ex('elevacao-pelvica', 4, 8, 12, 150), ex('terra-romeno', 3, 8, 10, 150), ex('mesa-flexora', 3, 10, 12, 90), ex('abducao-polia', 3, 12, 15, 60), ex('gluteo-polia', 3, 12, 15, 60)],
      },
      {
        name: 'Quadríceps',
        exercises: [ex('agachamento-livre', 4, 6, 10, 180), ex('leg-press', 3, 10, 12, 120), ex('agachamento-bulgaro', 3, 8, 12, 120), ex('cadeira-extensora', 3, 12, 15, 90), ex('panturrilha-pe', 3, 10, 15, 60)],
      },
      {
        name: 'Superiores',
        exercises: [ex('puxada-frente', 3, 8, 12, 90), ex('supino-inclinado-halter', 3, 8, 12, 90), ex('remada-baixa', 3, 10, 12, 90), ex('elevacao-lateral', 3, 12, 15, 60), ex('triceps-corda', 2, 10, 15, 60), ex('rosca-alternada', 2, 10, 12, 60)],
      },
      {
        name: 'Glúteo completo',
        exercises: [ex('hack-invertido', 3, 10, 12, 120), ex('stiff-halter', 3, 10, 12, 120), ex('afundo-reverso', 3, 10, 12, 90), ex('cadeira-abdutora-inclinada', 3, 12, 20, 60), ex('extensao-quadril-polia', 3, 12, 15, 60)],
      },
    ],
  },
];
