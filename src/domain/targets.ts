// Cálculo de gasto energético e metas diárias, com foco em hipertrofia.

export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete';
export type Goal = 'bulk' | 'recomp' | 'cut';

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
};

export const ACTIVITY_FACTORS: Record<ActivityLevel, { factor: number; label: string }> = {
  sedentary: { factor: 1.2, label: 'Sedentário (sem treino)' },
  light: { factor: 1.375, label: 'Leve (treino 1–3x/semana)' },
  moderate: { factor: 1.55, label: 'Moderado (treino 3–5x/semana)' },
  high: { factor: 1.725, label: 'Alto (treino 6–7x/semana)' },
  athlete: { factor: 1.9, label: 'Atleta (2 treinos/dia ou trabalho físico)' },
};

// Ajuste calórico sobre o gasto. Superávit pequeno no bulk para priorizar massa magra.
export const GOALS: Record<Goal, { adjustment: number; label: string; description: string }> = {
  bulk: { adjustment: 0.1, label: 'Ganho de massa magra', description: 'Superávit de ~10%' },
  recomp: { adjustment: 0, label: 'Recomposição', description: 'Calorias de manutenção' },
  cut: { adjustment: -0.2, label: 'Definição', description: 'Déficit de ~20%, proteína alta' },
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

export function computeTargets(p: Profile, adaptiveTdee?: number, today = new Date()): Targets {
  const tdee = adaptiveTdee ?? formulaTdee(p, today);
  const kcal = tdee * (1 + GOALS[p.goal].adjustment);
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
