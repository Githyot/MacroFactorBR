// Cálculo de gasto energético e metas diárias, com foco em hipertrofia.

export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete';
export type Goal = 'bulk' | 'recomp' | 'cut';
export type TrainingLevel = 'beginner' | 'intermediate' | 'advanced';

export type Profile = {
  name?: string;
  sex: Sex;
  birthDate: string; // AAAA-MM-DD
  heightCm: number;
  weightKg: number;
  bodyFatPct?: number;
  activity: ActivityLevel;
  goal: Goal;
  proteinPerKg: number; // g por kg de peso corporal
  mealsPerDay: number;
  trainingLevel?: TrainingLevel;
  trainingDays?: number; // por semana
  /** Mais carboidrato nos dias de treino e menos no descanso, mesma média semanal. */
  carbCycling?: boolean;
  /** Ajuste acumulado pelos check-ins semanais (kcal/dia). */
  kcalAdjustment?: number;
};

// Taxa de ganho alvo no bulk, em % do peso por mês (Aragon/Helms).
export const TRAINING_LEVELS: Record<TrainingLevel, { label: string; monthlyGainPct: number; description: string }> = {
  beginner: { label: 'Iniciante (< 1 ano)', monthlyGainPct: 1.25, description: '1–1,5% do peso por mês' },
  intermediate: { label: 'Intermediário (1–3 anos)', monthlyGainPct: 0.75, description: '0,5–1% do peso por mês' },
  advanced: { label: 'Avançado (> 3 anos)', monthlyGainPct: 0.375, description: '0,25–0,5% do peso por mês' },
};

// Perda alvo na definição: ~0,75% do peso por semana preserva massa magra.
export const CUT_WEEKLY_LOSS_PCT = 0.75;
const KCAL_PER_KG = 7700;

/** Variação de peso semanal desejada (kg/semana; negativa na definição). */
export function targetWeeklyChangeKg(p: Profile): number {
  if (p.goal === 'bulk') {
    const pct = TRAINING_LEVELS[p.trainingLevel ?? 'intermediate'].monthlyGainPct;
    return (p.weightKg * pct) / 100 / (30 / 7);
  }
  if (p.goal === 'cut') return -(p.weightKg * CUT_WEEKLY_LOSS_PCT) / 100;
  return 0;
}

export const ACTIVITY_FACTORS: Record<ActivityLevel, { factor: number; label: string }> = {
  sedentary: { factor: 1.2, label: 'Sedentário (sem treino)' },
  light: { factor: 1.375, label: 'Leve (treino 1–3x/semana)' },
  moderate: { factor: 1.55, label: 'Moderado (treino 3–5x/semana)' },
  high: { factor: 1.725, label: 'Alto (treino 6–7x/semana)' },
  athlete: { factor: 1.9, label: 'Atleta (2 treinos/dia ou trabalho físico)' },
};

// Ajuste calórico sobre o gasto. Superávit pequeno no bulk para priorizar massa magra.
export const GOALS: Record<Goal, { label: string; description: string }> = {
  bulk: { label: 'Ganho de massa magra', description: 'Superávit pequeno (5–15%), calculado pela taxa de ganho do seu nível' },
  recomp: { label: 'Recomposição', description: 'Calorias de manutenção' },
  cut: { label: 'Definição', description: 'Déficit para perder ~0,75% do peso por semana, proteína alta' },
};

export const DEFAULT_PROTEIN_PER_KG = 2.0;
// Dose por refeição associada à máxima síntese proteica muscular.
export const PROTEIN_PER_MEAL_PER_KG = 0.4;

export function ageFromBirthDate(birthDate: string, today = new Date()): number {
  const b = new Date(`${birthDate}T00:00:00`);
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
}

/** Taxa metabólica basal: Katch-McArdle se houver % de gordura, senão Mifflin-St Jeor. */
export function bmr(p: Profile, today = new Date()): number {
  if (p.bodyFatPct !== undefined && p.bodyFatPct > 0 && p.bodyFatPct < 70) {
    const leanMass = p.weightKg * (1 - p.bodyFatPct / 100);
    return 370 + 21.6 * leanMass;
  }
  const age = ageFromBirthDate(p.birthDate, today);
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * age;
  return p.sex === 'male' ? base + 5 : base - 161;
}

export function formulaTdee(p: Profile, today = new Date()): number {
  return bmr(p, today) * ACTIVITY_FACTORS[p.activity].factor;
}

export type Targets = {
  tdee: number;
  tdeeSource: 'formula' | 'adaptive';
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  proteinPerMeal: number;
};

/**
 * Superávit/déficit diário a partir da taxa de ganho alvo, limitado à faixa
 * recomendada (bulk: +5 a 15%; definição: até -25%).
 */
export function energyDelta(p: Profile, tdee: number): number {
  const raw = (targetWeeklyChangeKg(p) * KCAL_PER_KG) / 7;
  if (p.goal === 'bulk') return Math.min(Math.max(raw, tdee * 0.05), tdee * 0.15);
  if (p.goal === 'cut') return Math.max(Math.min(raw, -tdee * 0.1), -tdee * 0.25);
  return 0;
}

export function computeTargets(p: Profile, adaptiveTdee?: number, today = new Date()): Targets {
  const tdee = adaptiveTdee ?? formulaTdee(p, today);
  const kcal = tdee + energyDelta(p, tdee) + (p.kcalAdjustment ?? 0);
  const protein = p.proteinPerKg * p.weightKg;
  // Gordura: 25% das calorias, nunca abaixo de 0,6 g/kg (saúde hormonal).
  const fat = Math.max((kcal * 0.25) / 9, 0.6 * p.weightKg);
  const carbs = Math.max(0, (kcal - protein * 4 - fat * 9) / 4);
  const proteinPerMeal = Math.max(protein / Math.max(1, p.mealsPerDay), 0);
  return {
    tdee: Math.round(tdee),
    tdeeSource: adaptiveTdee !== undefined ? 'adaptive' : 'formula',
    kcal: Math.round(kcal),
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
    proteinPerMeal: Math.round(proteinPerMeal),
  };
}

/** Faixa de proteína por refeição que maximiza a síntese muscular (0,3–0,4 g/kg). */
export function proteinPerMealRange(weightKg: number): [number, number] {
  return [Math.round(0.3 * weightKg), Math.round(PROTEIN_PER_MEAL_PER_KG * weightKg)];
}

export type DayTargets = Pick<Targets, 'kcal' | 'carbs'> & { isTrainingDay: boolean };

/**
 * Ciclo de carboidrato: no dia de treino +10% de calorias, todas em carboidrato;
 * nos dias de descanso o mesmo total sai do carboidrato, mantendo a média semanal.
 */
export function dayTargets(t: Targets, p: Profile, isTrainingDay: boolean): DayTargets {
  const days = Math.min(6, Math.max(1, p.trainingDays ?? 4));
  if (!p.carbCycling) return { kcal: t.kcal, carbs: t.carbs, isTrainingDay };
  const plus = t.kcal * 0.1;
  const delta = isTrainingDay ? plus : -(plus * days) / (7 - days);
  const carbs = Math.max(0, t.carbs + delta / 4);
  return { kcal: Math.round(t.kcal + (carbs - t.carbs) * 4), carbs: Math.round(carbs), isTrainingDay };
}

/** Explica cada número da meta em linguagem simples. */
export function explainTargets(p: Profile, t: Targets, today = new Date()): string[] {
  const delta = t.kcal - t.tdee - (p.kcalAdjustment ?? 0);
  const lines = [
    `Gasto diário estimado: ${t.tdee} kcal (${t.tdeeSource === 'adaptive' ? 'calculado pelo seu peso e pelo que você comeu' : `taxa basal ${Math.round(bmr(p, today))} kcal × fator de atividade ${ACTIVITY_FACTORS[p.activity].factor}`}).`,
  ];
  if (p.goal === 'bulk') {
    const lvl = TRAINING_LEVELS[p.trainingLevel ?? 'intermediate'];
    lines.push(`Superávit de ${Math.round(delta)} kcal para ganhar ${lvl.description} (${(targetWeeklyChangeKg(p) * 1000).toFixed(0)} g por semana), ritmo que favorece massa magra.`);
  } else if (p.goal === 'cut') {
    lines.push(`Déficit de ${Math.round(-delta)} kcal para perder cerca de ${(-targetWeeklyChangeKg(p) * 1000).toFixed(0)} g por semana.`);
  } else {
    lines.push('Calorias de manutenção: o treino e a proteína alta fazem a recomposição.');
  }
  if (p.kcalAdjustment) lines.push(`Ajuste dos check-ins semanais: ${p.kcalAdjustment > 0 ? '+' : ''}${p.kcalAdjustment} kcal.`);
  lines.push(`Proteína: ${p.proteinPerKg} g × ${p.weightKg} kg = ${t.protein} g (faixa com melhor evidência para hipertrofia: 1,6–2,2 g/kg).`);
  lines.push(`Gordura: ${t.fat} g, pelo menos 25% das calorias e 0,6 g/kg para a saúde hormonal.`);
  lines.push(`Carboidrato: o restante, ${t.carbs} g, combustível para o treino.`);
  return lines;
}
