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

export type Equipment =
  | 'barra'
  | 'barra_w'
  | 'halter'
  | 'maquina'
  | 'articulada'
  | 'polia'
  | 'smith'
  | 'peso_corporal'
  | 'anilha'
  | 'kettlebell'
  | 'elastico'
  | 'caneleira'
  | 'suspenso'
  | 'nenhum';

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barra: 'Barra',
  barra_w: 'Barra W',
  halter: 'Halteres',
  maquina: 'Máquina',
  articulada: 'Articulada (Hammer)',
  polia: 'Polia/cross',
  smith: 'Smith',
  peso_corporal: 'Peso corporal',
  anilha: 'Anilha',
  kettlebell: 'Kettlebell',
  elastico: 'Elástico',
  caneleira: 'Caneleira',
  suspenso: 'TRX/fita',
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
  // ---- Variações e aparelhos extras (academias brasileiras) ----
  // Peito
  ['supino-articulado', 'Supino reto articulado (Hammer)', 'peito', ['triceps', 'ombros'], 'articulada'],
  ['supino-inclinado-articulado', 'Supino inclinado articulado (Hammer)', 'peito', ['ombros', 'triceps'], 'articulada'],
  ['supino-declinado-articulado', 'Supino declinado articulado', 'peito', ['triceps'], 'articulada'],
  ['supino-inclinado-maquina', 'Supino inclinado na máquina', 'peito', ['ombros', 'triceps'], 'maquina'],
  ['supino-inclinado-smith', 'Supino inclinado no Smith', 'peito', ['ombros', 'triceps'], 'smith'],
  ['supino-declinado-halter', 'Supino declinado (halteres)', 'peito', ['triceps'], 'halter'],
  ['supino-pegada-neutra-halter', 'Supino com pegada neutra (halteres)', 'peito', ['triceps'], 'halter'],
  ['supino-sentado-maquina', 'Chest press sentado', 'peito', ['triceps', 'ombros'], 'maquina'],
  ['crucifixo-inclinado-halter', 'Crucifixo inclinado (halteres)', 'peito', ['ombros'], 'halter'],
  ['crucifixo-declinado-halter', 'Crucifixo declinado (halteres)', 'peito', [], 'halter'],
  ['crossover-alto', 'Crossover polia alta (de cima para baixo)', 'peito', [], 'polia'],
  ['crossover-baixo', 'Crossover polia baixa (de baixo para cima)', 'peito', ['ombros'], 'polia'],
  ['crossover-medio', 'Crossover polia média', 'peito', [], 'polia'],
  ['crucifixo-polia-banco', 'Crucifixo na polia deitado', 'peito', [], 'polia'],
  ['supino-polia-unilateral', 'Supino unilateral na polia', 'peito', ['triceps'], 'polia'],
  ['pullover-halter', 'Pullover (halter)', 'peito', ['costas', 'triceps'], 'halter'],
  ['flexao-inclinada', 'Flexão inclinada (mãos no banco)', 'peito', ['triceps'], 'peso_corporal', 'bodyweight_reps'],
  ['flexao-declinada', 'Flexão declinada (pés no banco)', 'peito', ['ombros', 'triceps'], 'peso_corporal', 'bodyweight_reps'],
  ['flexao-diamante', 'Flexão diamante', 'triceps', ['peito'], 'peso_corporal', 'bodyweight_reps'],
  ['paralelas-maquina', 'Mergulho na máquina (paralela assistida)', 'peito', ['triceps'], 'maquina'],
  ['supino-elastico', 'Supino com elástico', 'peito', ['triceps'], 'elastico'],
  ['flexao-trx', 'Flexão no TRX', 'peito', ['triceps', 'abdomen'], 'suspenso', 'bodyweight_reps'],
  // Costas
  ['puxada-articulada', 'Puxada articulada (Hammer)', 'costas', ['biceps'], 'articulada'],
  ['puxada-articulada-unilateral', 'Puxada articulada unilateral', 'costas', ['biceps'], 'articulada'],
  ['puxada-pegada-aberta', 'Puxada frontal pegada aberta', 'costas', ['biceps'], 'polia'],
  ['puxada-supinada', 'Puxada frontal supinada', 'costas', ['biceps'], 'polia'],
  ['puxada-neutra', 'Puxada com pegada neutra (barra romana)', 'costas', ['biceps'], 'polia'],
  ['puxada-unilateral-polia', 'Puxada unilateral na polia', 'costas', ['biceps'], 'polia'],
  ['puxada-nuca', 'Puxada por trás (nuca)', 'costas', ['biceps', 'ombros'], 'polia'],
  ['barra-fixa-neutra', 'Barra fixa pegada neutra', 'costas', ['biceps'], 'peso_corporal', 'bodyweight_reps'],
  ['barra-fixa-assistida', 'Barra fixa assistida (gravitron)', 'costas', ['biceps'], 'maquina'],
  ['barra-fixa-lastro', 'Barra fixa com lastro', 'costas', ['biceps'], 'anilha'],
  ['remada-articulada', 'Remada articulada (Hammer)', 'costas', ['biceps', 'trapezio'], 'articulada'],
  ['remada-articulada-unilateral', 'Remada articulada unilateral', 'costas', ['biceps'], 'articulada'],
  ['remada-baixa-aberta', 'Remada baixa pegada aberta', 'costas', ['ombros', 'trapezio'], 'polia'],
  ['remada-baixa-unilateral', 'Remada baixa unilateral', 'costas', ['biceps'], 'polia'],
  ['remada-curvada-supinada', 'Remada curvada supinada (Yates)', 'costas', ['biceps'], 'barra'],
  ['remada-pendlay', 'Remada Pendlay', 'costas', ['trapezio', 'lombar'], 'barra'],
  ['remada-smith', 'Remada no Smith', 'costas', ['biceps'], 'smith'],
  ['remada-halter-banco', 'Remada com halteres no banco inclinado (serrote apoiado)', 'costas', ['biceps', 'ombros'], 'halter'],
  ['remada-cavalinho-maquina', 'Remada cavalinho com apoio de peito', 'costas', ['biceps', 'trapezio'], 'articulada'],
  ['remada-landmine', 'Remada meadow (landmine)', 'costas', ['biceps'], 'barra'],
  ['remada-invertida', 'Remada invertida (barra baixa)', 'costas', ['biceps'], 'peso_corporal', 'bodyweight_reps'],
  ['remada-trx', 'Remada no TRX', 'costas', ['biceps'], 'suspenso', 'bodyweight_reps'],
  ['remada-elastico', 'Remada com elástico', 'costas', ['biceps'], 'elastico'],
  ['pulldown-corda', 'Pulldown com corda', 'costas', [], 'polia'],
  ['pullover-maquina', 'Pullover na máquina', 'costas', [], 'maquina'],
  ['levantamento-terra-sumo', 'Levantamento terra sumô', 'costas', ['gluteos', 'quadriceps', 'posteriores'], 'barra'],
  ['levantamento-terra-trap', 'Levantamento terra com barra hexagonal', 'quadriceps', ['costas', 'gluteos', 'trapezio'], 'barra'],
  ['rack-pull', 'Rack pull (terra parcial)', 'costas', ['trapezio', 'gluteos'], 'barra'],
  ['good-morning', 'Bom dia (good morning)', 'posteriores', ['lombar', 'gluteos'], 'barra'],
  ['banco-lombar-anilha', 'Hiperextensão com anilha', 'lombar', ['gluteos', 'posteriores'], 'anilha'],
  ['lombar-maquina', 'Extensão lombar na máquina', 'lombar', [], 'maquina'],
  ['encolhimento-smith', 'Encolhimento no Smith', 'trapezio', [], 'smith'],
  ['encolhimento-maquina', 'Encolhimento na máquina', 'trapezio', [], 'maquina'],
  ['encolhimento-polia', 'Encolhimento na polia', 'trapezio', [], 'polia'],
  // Ombros
  ['desenvolvimento-articulado', 'Desenvolvimento articulado (Hammer)', 'ombros', ['triceps'], 'articulada'],
  ['desenvolvimento-smith', 'Desenvolvimento no Smith', 'ombros', ['triceps'], 'smith'],
  ['desenvolvimento-arnold', 'Desenvolvimento Arnold', 'ombros', ['triceps'], 'halter'],
  ['desenvolvimento-sentado-barra', 'Desenvolvimento sentado (barra)', 'ombros', ['triceps'], 'barra'],
  ['desenvolvimento-nuca', 'Desenvolvimento por trás (nuca)', 'ombros', ['triceps'], 'barra'],
  ['desenvolvimento-landmine', 'Desenvolvimento landmine', 'ombros', ['peito', 'triceps'], 'barra'],
  ['desenvolvimento-kettlebell', 'Desenvolvimento com kettlebell', 'ombros', ['triceps'], 'kettlebell'],
  ['elevacao-lateral-maquina', 'Elevação lateral na máquina', 'ombros', [], 'maquina'],
  ['elevacao-lateral-sentado', 'Elevação lateral sentado', 'ombros', [], 'halter'],
  ['elevacao-lateral-inclinado', 'Elevação lateral deitado no banco inclinado', 'ombros', [], 'halter'],
  ['elevacao-lateral-unilateral-polia', 'Elevação lateral unilateral na polia (por trás)', 'ombros', [], 'polia'],
  ['elevacao-lateral-elastico', 'Elevação lateral com elástico', 'ombros', [], 'elastico'],
  ['elevacao-frontal-polia', 'Elevação frontal na polia', 'ombros', [], 'polia'],
  ['elevacao-frontal-anilha', 'Elevação frontal com anilha', 'ombros', [], 'anilha'],
  ['elevacao-frontal-barra', 'Elevação frontal com barra', 'ombros', [], 'barra'],
  ['crucifixo-inverso-maquina', 'Crucifixo inverso no voador (peck deck invertido)', 'ombros', ['trapezio'], 'maquina'],
  ['crucifixo-inverso-polia', 'Crucifixo inverso na polia (cross)', 'ombros', ['trapezio'], 'polia'],
  ['crucifixo-inverso-banco', 'Crucifixo inverso deitado no banco inclinado', 'ombros', ['trapezio'], 'halter'],
  ['remada-alta-polia', 'Remada alta na polia', 'ombros', ['trapezio'], 'polia'],
  ['remada-alta-halter', 'Remada alta (halteres)', 'ombros', ['trapezio'], 'halter'],
  ['face-pull-elastico', 'Face pull com elástico', 'ombros', ['trapezio'], 'elastico'],
  ['rotacao-externa-polia', 'Rotação externa na polia (manguito)', 'ombros', [], 'polia'],
  ['rotacao-externa-halter', 'Rotação externa com halter (manguito)', 'ombros', [], 'halter'],
  // Bíceps
  ['rosca-barra-w', 'Rosca direta com barra W', 'biceps', ['antebraco'], 'barra_w'],
  ['rosca-scott-barra-w', 'Rosca Scott com barra W', 'biceps', [], 'barra_w'],
  ['rosca-scott-halter', 'Rosca Scott unilateral (halter)', 'biceps', [], 'halter'],
  ['rosca-scott-maquina', 'Rosca Scott na máquina', 'biceps', [], 'maquina'],
  ['rosca-maquina', 'Rosca bíceps na máquina articulada', 'biceps', [], 'articulada'],
  ['rosca-simultanea', 'Rosca simultânea (halteres)', 'biceps', ['antebraco'], 'halter'],
  ['rosca-martelo-corda', 'Rosca martelo na corda', 'biceps', ['antebraco'], 'polia'],
  ['rosca-martelo-cruzada', 'Rosca martelo cruzada', 'biceps', ['antebraco'], 'halter'],
  ['rosca-inversa', 'Rosca inversa (pronada)', 'antebraco', ['biceps'], 'barra_w'],
  ['rosca-polia-unilateral', 'Rosca unilateral na polia baixa', 'biceps', [], 'polia'],
  ['rosca-polia-alta', 'Rosca na polia alta (bíceps no cross)', 'biceps', [], 'polia'],
  ['rosca-bayesian', 'Rosca bayesiana (polia por trás)', 'biceps', [], 'polia'],
  ['rosca-spider', 'Rosca spider (banco inclinado de frente)', 'biceps', [], 'halter'],
  ['rosca-21', 'Rosca 21', 'biceps', [], 'barra'],
  ['rosca-zottman', 'Rosca Zottman', 'biceps', ['antebraco'], 'halter'],
  ['rosca-elastico', 'Rosca com elástico', 'biceps', [], 'elastico'],
  ['rosca-kettlebell', 'Rosca com kettlebell', 'biceps', ['antebraco'], 'kettlebell'],
  // Tríceps
  ['triceps-polia-v', 'Tríceps na polia com barra V', 'triceps', [], 'polia'],
  ['triceps-polia-inverso', 'Tríceps na polia pegada inversa', 'triceps', [], 'polia'],
  ['triceps-unilateral-polia', 'Tríceps unilateral na polia', 'triceps', [], 'polia'],
  ['triceps-frances-polia', 'Tríceps francês na polia (corda acima da cabeça)', 'triceps', [], 'polia'],
  ['triceps-frances-barra-w', 'Tríceps francês com barra W', 'triceps', [], 'barra_w'],
  ['triceps-testa-barra-w', 'Tríceps testa com barra W', 'triceps', [], 'barra_w'],
  ['triceps-testa-halter', 'Tríceps testa com halteres', 'triceps', [], 'halter'],
  ['triceps-coice', 'Tríceps coice (halter)', 'triceps', [], 'halter'],
  ['triceps-coice-polia', 'Tríceps coice na polia', 'triceps', [], 'polia'],
  ['triceps-maquina', 'Tríceps na máquina', 'triceps', [], 'maquina'],
  ['triceps-paralela-maquina', 'Tríceps paralela na máquina (dip machine)', 'triceps', ['peito'], 'articulada'],
  ['paralelas-triceps', 'Paralelas com tronco reto (tríceps)', 'triceps', ['peito', 'ombros'], 'peso_corporal', 'bodyweight_reps'],
  ['supino-fechado-smith', 'Supino fechado no Smith', 'triceps', ['peito'], 'smith'],
  ['triceps-elastico', 'Tríceps com elástico', 'triceps', [], 'elastico'],
  ['triceps-trx', 'Tríceps no TRX', 'triceps', [], 'suspenso', 'bodyweight_reps'],
  // Antebraço
  ['rosca-punho-inversa', 'Rosca punho inversa', 'antebraco', [], 'barra'],
  ['rosca-punho-halter', 'Rosca punho com halter', 'antebraco', [], 'halter'],
  ['farmer-walk', 'Caminhada do fazendeiro', 'antebraco', ['trapezio', 'abdomen'], 'halter', 'duration'],
  ['suspensao-barra', 'Suspensão na barra (dead hang)', 'antebraco', ['costas'], 'peso_corporal', 'duration'],
  // Quadríceps
  ['agachamento-sumo', 'Agachamento sumô', 'quadriceps', ['gluteos'], 'halter'],
  ['agachamento-sumo-barra', 'Agachamento sumô com barra', 'quadriceps', ['gluteos'], 'barra'],
  ['agachamento-pausado', 'Agachamento com pausa', 'quadriceps', ['gluteos'], 'barra'],
  ['agachamento-box', 'Agachamento no banco (box squat)', 'quadriceps', ['gluteos'], 'barra'],
  ['agachamento-livre-peso-corporal', 'Agachamento livre (peso corporal)', 'quadriceps', ['gluteos'], 'peso_corporal', 'bodyweight_reps'],
  ['agachamento-pendulo', 'Agachamento pêndulo', 'quadriceps', ['gluteos'], 'articulada'],
  ['agachamento-belt', 'Agachamento belt squat (cinto)', 'quadriceps', ['gluteos'], 'maquina'],
  ['agachamento-v-squat', 'V-squat (agachamento articulado)', 'quadriceps', ['gluteos'], 'articulada'],
  ['hack-invertido', 'Hack invertido', 'gluteos', ['quadriceps'], 'maquina'],
  ['agachamento-sissy', 'Agachamento sissy', 'quadriceps', [], 'peso_corporal', 'bodyweight_reps'],
  ['agachamento-kettlebell', 'Agachamento com kettlebell', 'quadriceps', ['gluteos'], 'kettlebell'],
  ['agachamento-bulgaro-smith', 'Agachamento búlgaro no Smith', 'quadriceps', ['gluteos'], 'smith'],
  ['agachamento-bulgaro-barra', 'Agachamento búlgaro com barra', 'quadriceps', ['gluteos'], 'barra'],
  ['afundo-smith', 'Afundo no Smith', 'quadriceps', ['gluteos'], 'smith'],
  ['afundo-barra', 'Afundo com barra', 'quadriceps', ['gluteos'], 'barra'],
  ['afundo-reverso', 'Afundo reverso (passo atrás)', 'gluteos', ['quadriceps'], 'halter'],
  ['passada-andando', 'Passada andando', 'quadriceps', ['gluteos'], 'halter'],
  ['subida-banco', 'Subida no banco (step-up)', 'quadriceps', ['gluteos'], 'halter'],
  ['leg-press-horizontal', 'Leg press horizontal', 'quadriceps', ['gluteos'], 'maquina'],
  ['leg-press-unilateral', 'Leg press unilateral', 'quadriceps', ['gluteos'], 'maquina'],
  ['leg-press-pes-altos', 'Leg press com pés altos', 'gluteos', ['posteriores', 'quadriceps'], 'maquina'],
  ['leg-press-vertical', 'Leg press vertical', 'quadriceps', ['gluteos'], 'maquina'],
  ['cadeira-extensora-unilateral', 'Cadeira extensora unilateral', 'quadriceps', [], 'maquina'],
  ['agachamento-elastico', 'Agachamento com elástico', 'quadriceps', ['gluteos'], 'elastico'],
  ['agachamento-salto', 'Agachamento com salto', 'quadriceps', ['gluteos', 'panturrilha'], 'peso_corporal', 'bodyweight_reps'],
  // Posteriores
  ['stiff-halter', 'Stiff com halteres', 'posteriores', ['gluteos', 'lombar'], 'halter'],
  ['stiff-smith', 'Stiff no Smith', 'posteriores', ['gluteos'], 'smith'],
  ['stiff-unilateral', 'Stiff unilateral (halter)', 'posteriores', ['gluteos'], 'halter'],
  ['terra-romeno-halter', 'Terra romeno com halteres', 'posteriores', ['gluteos', 'lombar'], 'halter'],
  ['stiff-kettlebell', 'Stiff com kettlebell', 'posteriores', ['gluteos'], 'kettlebell'],
  ['mesa-flexora-unilateral', 'Mesa flexora unilateral', 'posteriores', [], 'maquina'],
  ['flexora-em-pe', 'Flexora em pé (unilateral)', 'posteriores', [], 'maquina'],
  ['flexora-polia', 'Flexão de joelhos na polia', 'posteriores', [], 'polia'],
  ['flexao-nordica', 'Flexão nórdica', 'posteriores', [], 'peso_corporal', 'bodyweight_reps'],
  ['flexora-bola', 'Flexão de joelhos na bola suíça', 'posteriores', ['gluteos'], 'peso_corporal', 'bodyweight_reps'],
  ['kettlebell-swing', 'Kettlebell swing', 'posteriores', ['gluteos', 'lombar'], 'kettlebell'],
  // Glúteos
  ['elevacao-pelvica-maquina', 'Elevação pélvica na máquina', 'gluteos', ['posteriores'], 'maquina'],
  ['elevacao-pelvica-smith', 'Elevação pélvica no Smith', 'gluteos', ['posteriores'], 'smith'],
  ['elevacao-pelvica-unilateral', 'Elevação pélvica unilateral', 'gluteos', ['posteriores'], 'peso_corporal', 'bodyweight_reps'],
  ['ponte-gluteo', 'Ponte de glúteo no chão', 'gluteos', ['posteriores'], 'barra'],
  ['gluteo-maquina', 'Glúteo na máquina (coice)', 'gluteos', [], 'maquina'],
  ['gluteo-4-apoios', 'Glúteo quatro apoios com caneleira', 'gluteos', [], 'caneleira'],
  ['abducao-polia', 'Abdução de quadril na polia', 'gluteos', [], 'polia'],
  ['abducao-elastico', 'Abdução com elástico (mini band)', 'gluteos', [], 'elastico'],
  ['abducao-caneleira', 'Abdução de quadril deitado com caneleira', 'gluteos', [], 'caneleira'],
  ['cadeira-abdutora-inclinada', 'Cadeira abdutora com tronco à frente', 'gluteos', [], 'maquina'],
  ['extensao-quadril-polia', 'Extensão de quadril na polia em pé', 'gluteos', ['posteriores'], 'polia'],
  ['pull-through', 'Pull through na polia', 'gluteos', ['posteriores'], 'polia'],
  ['frog-pump', 'Frog pump', 'gluteos', [], 'peso_corporal', 'bodyweight_reps'],
  ['adutora-polia', 'Adução de quadril na polia', 'quadriceps', [], 'polia'],
  // Panturrilha
  ['panturrilha-smith', 'Panturrilha no Smith', 'panturrilha', [], 'smith'],
  ['panturrilha-halter', 'Panturrilha unilateral com halter', 'panturrilha', [], 'halter'],
  ['panturrilha-hack', 'Panturrilha no hack', 'panturrilha', [], 'maquina'],
  ['panturrilha-burrinho', 'Panturrilha burrinho (donkey)', 'panturrilha', [], 'maquina'],
  ['panturrilha-degrau', 'Panturrilha no degrau (peso corporal)', 'panturrilha', [], 'peso_corporal', 'bodyweight_reps'],
  ['tibial-anterior', 'Tibial anterior (dorsiflexão)', 'panturrilha', [], 'maquina'],
  // Abdômen
  ['abdominal-maquina', 'Abdominal na máquina', 'abdomen', [], 'maquina'],
  ['abdominal-declinado', 'Abdominal no banco declinado', 'abdomen', [], 'peso_corporal', 'bodyweight_reps'],
  ['abdominal-bicicleta', 'Abdominal bicicleta', 'abdomen', [], 'peso_corporal', 'bodyweight_reps'],
  ['abdominal-remador', 'Abdominal remador', 'abdomen', [], 'peso_corporal', 'bodyweight_reps'],
  ['abdominal-obliquo', 'Abdominal oblíquo', 'abdomen', [], 'peso_corporal', 'bodyweight_reps'],
  ['elevacao-pernas-barra', 'Elevação de pernas na barra fixa', 'abdomen', [], 'peso_corporal', 'bodyweight_reps'],
  ['elevacao-joelhos-paralela', 'Elevação de joelhos na paralela (cadeira capitão)', 'abdomen', [], 'peso_corporal', 'bodyweight_reps'],
  ['prancha-lateral', 'Prancha lateral', 'abdomen', [], 'peso_corporal', 'duration'],
  ['pallof-press', 'Pallof press (antirrotação)', 'abdomen', [], 'polia'],
  ['rotacao-polia', 'Rotação de tronco na polia (lenhador)', 'abdomen', [], 'polia'],
  ['russian-twist', 'Russian twist', 'abdomen', [], 'anilha'],
  ['abdominal-anilha', 'Abdominal com anilha', 'abdomen', [], 'anilha'],
  ['dead-bug', 'Dead bug', 'abdomen', [], 'peso_corporal', 'bodyweight_reps'],
  ['vacuo', 'Vácuo abdominal', 'abdomen', [], 'peso_corporal', 'duration'],
  ['mountain-climber', 'Escalador (mountain climber)', 'abdomen', ['cardio'], 'peso_corporal', 'duration'],
  ['abdominal-trx', 'Abdominal canivete no TRX', 'abdomen', [], 'suspenso', 'bodyweight_reps'],
  // Funcional / corpo inteiro
  ['thruster', 'Thruster', 'quadriceps', ['ombros', 'gluteos'], 'barra'],
  ['clean', 'Clean (arremesso ao peito)', 'posteriores', ['gluteos', 'trapezio', 'quadriceps'], 'barra'],
  ['snatch-halter', 'Snatch com halter', 'ombros', ['gluteos', 'posteriores'], 'halter'],
  ['turkish-getup', 'Levantamento turco (kettlebell)', 'abdomen', ['ombros', 'gluteos'], 'kettlebell'],
  ['burpee', 'Burpee', 'cardio', ['peito', 'quadriceps'], 'peso_corporal', 'bodyweight_reps'],
  ['wall-ball', 'Wall ball', 'quadriceps', ['ombros'], 'anilha'],
  ['sled-push', 'Empurrar trenó', 'quadriceps', ['gluteos', 'cardio'], 'maquina', 'duration'],
  ['battle-rope', 'Corda naval (battle rope)', 'cardio', ['ombros'], 'nenhum', 'duration'],
  // Cardio
  ['remo-ergometro', 'Remo ergômetro', 'cardio', ['costas'], 'maquina', 'duration'],
  ['bike-air', 'Air bike (assault)', 'cardio', [], 'maquina', 'duration'],
  ['spinning', 'Bike de spinning', 'cardio', [], 'maquina', 'duration'],
  ['transport', 'Transport', 'cardio', [], 'maquina', 'duration'],
  ['caminhada', 'Caminhada', 'cardio', [], 'nenhum', 'duration'],
  ['corrida', 'Corrida ao ar livre', 'cardio', [], 'nenhum', 'duration'],
  ['natacao', 'Natação', 'cardio', [], 'nenhum', 'duration'],
  ['hiit-esteira', 'HIIT na esteira (tiros)', 'cardio', [], 'maquina', 'duration'],
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
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function searchExercises(list: Exercise[], query: string, muscle?: Muscle, equipment?: Equipment): Exercise[] {
  const terms = norm(query).split(/\s+/).filter(Boolean);
  return list
    .filter((e) => !muscle || e.primary === muscle || e.secondary.includes(muscle))
    .filter((e) => !equipment || e.equipment === equipment)
    .filter((e) => {
      const hay = norm(`${e.name} ${MUSCLE_LABEL[e.primary]} ${EQUIPMENT_LABEL[e.equipment]}`);
      return terms.every((t) => hay.includes(t));
    })
    .sort((a, b) => (muscle ? Number(b.primary === muscle) - Number(a.primary === muscle) : 0) || a.name.localeCompare(b.name, 'pt-BR'));
}
