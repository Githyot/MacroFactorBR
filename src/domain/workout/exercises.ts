// Biblioteca de exercícios em português, com músculo principal e secundários
// (usados para contar séries semanais por grupo muscular).

export type Muscle =
  | 'peito'
  | 'costas'
  | 'trapezio'
  | 'lombar'
  | 'ombros'
  | 'biceps'
  | 'triceps'
  | 'antebraco'
  | 'quadriceps'
  | 'posteriores'
  | 'gluteos'
  | 'panturrilha'
  | 'abdomen'
  | 'cardio';

export const MUSCLE_LABEL: Record<Muscle, string> = {
  peito: 'Peito',
  costas: 'Costas',
  trapezio: 'Trapézio',
  lombar: 'Lombar',
  ombros: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebraco: 'Antebraço',
  quadriceps: 'Quadríceps',
  posteriores: 'Posteriores de coxa',
  gluteos: 'Glúteos',
  panturrilha: 'Panturrilha',
  abdomen: 'Abdômen',
  cardio: 'Cardio',
};

export type Equipment = 'barra' | 'halter' | 'maquina' | 'polia' | 'peso_corporal' | 'kettlebell' | 'smith' | 'elastico' | 'nenhum';

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barra: 'Barra',
  halter: 'Halteres',
  maquina: 'Máquina',
  polia: 'Polia/cabo',
  peso_corporal: 'Peso corporal',
  kettlebell: 'Kettlebell',
  smith: 'Smith',
  elastico: 'Elástico',
  nenhum: 'Nenhum',
};

/** Como a série é medida: carga × repetições, só repetições, ou tempo. */
export type ExerciseKind = 'weight_reps' | 'bodyweight_reps' | 'duration';

export type Exercise = {
  id: string;
  name: string;
  primary: Muscle;
  secondary: Muscle[];
  equipment: Equipment;
  kind: ExerciseKind;
  /** Exercício que você criou. */
  custom?: boolean;
};

type Row = [id: string, name: string, primary: Muscle, secondary: Muscle[], equipment: Equipment, kind?: ExerciseKind];

const ROWS: Row[] = [
  // Peito
  ['supino-reto-barra', 'Supino reto (barra)', 'peito', ['triceps', 'ombros'], 'barra'],
  ['supino-reto-halter', 'Supino reto (halteres)', 'peito', ['triceps', 'ombros'], 'halter'],
  ['supino-inclinado-barra', 'Supino inclinado (barra)', 'peito', ['ombros', 'triceps'], 'barra'],
  ['supino-inclinado-halter', 'Supino inclinado (halteres)', 'peito', ['ombros', 'triceps'], 'halter'],
  ['supino-declinado', 'Supino declinado (barra)', 'peito', ['triceps'], 'barra'],
  ['supino-maquina', 'Supino na máquina', 'peito', ['triceps', 'ombros'], 'maquina'],
  ['supino-smith', 'Supino no Smith', 'peito', ['triceps', 'ombros'], 'smith'],
  ['crucifixo-halter', 'Crucifixo (halteres)', 'peito', [], 'halter'],
  ['crucifixo-maquina', 'Voador / peck deck', 'peito', [], 'maquina'],
  ['crossover', 'Crossover na polia', 'peito', [], 'polia'],
  ['flexao', 'Flexão de braço', 'peito', ['triceps', 'ombros'], 'peso_corporal', 'bodyweight_reps'],
  ['paralelas-peito', 'Paralelas (mergulho)', 'peito', ['triceps', 'ombros'], 'peso_corporal', 'bodyweight_reps'],
  // Costas
  ['barra-fixa', 'Barra fixa (pronada)', 'costas', ['biceps'], 'peso_corporal', 'bodyweight_reps'],
  ['barra-fixa-supinada', 'Barra fixa supinada', 'costas', ['biceps'], 'peso_corporal', 'bodyweight_reps'],
  ['puxada-frente', 'Puxada frontal (polia)', 'costas', ['biceps'], 'polia'],
  ['puxada-triangulo', 'Puxada com triângulo', 'costas', ['biceps'], 'polia'],
  ['remada-curvada', 'Remada curvada (barra)', 'costas', ['biceps', 'lombar', 'trapezio'], 'barra'],
  ['remada-unilateral', 'Remada unilateral (halter)', 'costas', ['biceps'], 'halter'],
  ['remada-baixa', 'Remada baixa (polia)', 'costas', ['biceps', 'trapezio'], 'polia'],
  ['remada-cavalinho', 'Remada cavalinho (T-bar)', 'costas', ['biceps', 'trapezio'], 'barra'],
  ['remada-maquina', 'Remada na máquina', 'costas', ['biceps'], 'maquina'],
  ['pulldown', 'Pulldown braço estendido', 'costas', [], 'polia'],
  ['levantamento-terra', 'Levantamento terra', 'costas', ['posteriores', 'gluteos', 'lombar', 'trapezio'], 'barra'],
  ['hiperextensao', 'Hiperextensão lombar', 'lombar', ['gluteos', 'posteriores'], 'peso_corporal', 'bodyweight_reps'],
  ['encolhimento-halter', 'Encolhimento (halteres)', 'trapezio', [], 'halter'],
  ['encolhimento-barra', 'Encolhimento (barra)', 'trapezio', [], 'barra'],
  // Ombros
  ['desenvolvimento-barra', 'Desenvolvimento (barra)', 'ombros', ['triceps'], 'barra'],
  ['desenvolvimento-halter', 'Desenvolvimento (halteres)', 'ombros', ['triceps'], 'halter'],
  ['desenvolvimento-maquina', 'Desenvolvimento na máquina', 'ombros', ['triceps'], 'maquina'],
  ['elevacao-lateral', 'Elevação lateral (halteres)', 'ombros', [], 'halter'],
  ['elevacao-lateral-polia', 'Elevação lateral na polia', 'ombros', [], 'polia'],
  ['elevacao-frontal', 'Elevação frontal', 'ombros', [], 'halter'],
  ['crucifixo-inverso', 'Crucifixo inverso', 'ombros', ['trapezio'], 'halter'],
  ['face-pull', 'Face pull', 'ombros', ['trapezio'], 'polia'],
  ['remada-alta', 'Remada alta', 'ombros', ['trapezio'], 'barra'],
  // Bíceps
  ['rosca-direta', 'Rosca direta (barra)', 'biceps', ['antebraco'], 'barra'],
  ['rosca-alternada', 'Rosca alternada (halteres)', 'biceps', ['antebraco'], 'halter'],
  ['rosca-martelo', 'Rosca martelo', 'biceps', ['antebraco'], 'halter'],
  ['rosca-scott', 'Rosca Scott', 'biceps', [], 'barra'],
  ['rosca-concentrada', 'Rosca concentrada', 'biceps', [], 'halter'],
  ['rosca-polia', 'Rosca na polia', 'biceps', [], 'polia'],
  ['rosca-inclinada', 'Rosca inclinada (halteres)', 'biceps', [], 'halter'],
  // Tríceps
  ['triceps-polia', 'Tríceps na polia (barra)', 'triceps', [], 'polia'],
  ['triceps-corda', 'Tríceps corda', 'triceps', [], 'polia'],
  ['triceps-testa', 'Tríceps testa', 'triceps', [], 'barra'],
  ['triceps-frances', 'Tríceps francês', 'triceps', [], 'halter'],
  ['triceps-banco', 'Tríceps no banco', 'triceps', [], 'peso_corporal', 'bodyweight_reps'],
  ['supino-fechado', 'Supino fechado', 'triceps', ['peito'], 'barra'],
  // Antebraço
  ['rosca-punho', 'Rosca punho', 'antebraco', [], 'barra'],
  // Pernas
  ['agachamento-livre', 'Agachamento livre', 'quadriceps', ['gluteos', 'posteriores', 'lombar'], 'barra'],
  ['agachamento-frontal', 'Agachamento frontal', 'quadriceps', ['gluteos'], 'barra'],
  ['agachamento-smith', 'Agachamento no Smith', 'quadriceps', ['gluteos'], 'smith'],
  ['agachamento-bulgaro', 'Agachamento búlgaro', 'quadriceps', ['gluteos'], 'halter'],
  ['agachamento-goblet', 'Agachamento goblet', 'quadriceps', ['gluteos'], 'halter'],
  ['hack', 'Agachamento hack', 'quadriceps', ['gluteos'], 'maquina'],
  ['leg-press', 'Leg press 45°', 'quadriceps', ['gluteos'], 'maquina'],
  ['cadeira-extensora', 'Cadeira extensora', 'quadriceps', [], 'maquina'],
  ['afundo', 'Afundo / passada', 'quadriceps', ['gluteos'], 'halter'],
  ['stiff', 'Stiff', 'posteriores', ['gluteos', 'lombar'], 'barra'],
  ['terra-romeno', 'Levantamento terra romeno', 'posteriores', ['gluteos', 'lombar'], 'barra'],
  ['mesa-flexora', 'Mesa flexora', 'posteriores', [], 'maquina'],
  ['cadeira-flexora', 'Cadeira flexora', 'posteriores', [], 'maquina'],
  ['elevacao-pelvica', 'Elevação pélvica (hip thrust)', 'gluteos', ['posteriores'], 'barra'],
  ['gluteo-polia', 'Glúteo na polia (coice)', 'gluteos', [], 'polia'],
  ['cadeira-abdutora', 'Cadeira abdutora', 'gluteos', [], 'maquina'],
  ['cadeira-adutora', 'Cadeira adutora', 'quadriceps', [], 'maquina'],
  ['panturrilha-pe', 'Panturrilha em pé', 'panturrilha', [], 'maquina'],
  ['panturrilha-sentado', 'Panturrilha sentado', 'panturrilha', [], 'maquina'],
  ['panturrilha-leg', 'Panturrilha no leg press', 'panturrilha', [], 'maquina'],
  // Abdômen
  ['abdominal-supra', 'Abdominal supra', 'abdomen', [], 'peso_corporal', 'bodyweight_reps'],
  ['abdominal-infra', 'Elevação de pernas', 'abdomen', [], 'peso_corporal', 'bodyweight_reps'],
  ['abdominal-polia', 'Abdominal na polia', 'abdomen', [], 'polia'],
  ['prancha', 'Prancha', 'abdomen', [], 'peso_corporal', 'duration'],
  ['roda-abdominal', 'Roda abdominal', 'abdomen', [], 'nenhum', 'bodyweight_reps'],
  // Cardio
  ['esteira', 'Esteira', 'cardio', [], 'maquina', 'duration'],
  ['bicicleta', 'Bicicleta ergométrica', 'cardio', [], 'maquina', 'duration'],
  ['eliptico', 'Elíptico', 'cardio', [], 'maquina', 'duration'],
  ['escada', 'Escada / simulador', 'cardio', [], 'maquina', 'duration'],
  ['corda', 'Pular corda', 'cardio', [], 'nenhum', 'duration'],
];

export const EXERCISES: Exercise[] = ROWS.map(([id, name, primary, secondary, equipment, kind]) => ({
  id,
  name,
  primary,
  secondary,
  equipment,
  kind: kind ?? 'weight_reps',
}));

function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function searchExercises(list: Exercise[], query: string, muscle?: Muscle): Exercise[] {
  const terms = norm(query).split(/\s+/).filter(Boolean);
  return list
    .filter((e) => !muscle || e.primary === muscle || e.secondary.includes(muscle))
    .filter((e) => {
      const hay = norm(`${e.name} ${MUSCLE_LABEL[e.primary]} ${EQUIPMENT_LABEL[e.equipment]}`);
      return terms.every((t) => hay.includes(t));
    })
    .sort((a, b) => (muscle ? Number(b.primary === muscle) - Number(a.primary === muscle) : 0) || a.name.localeCompare(b.name, 'pt-BR'));
}
