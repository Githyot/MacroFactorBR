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
  /** Peso que a pessoa quer atingir. Ao chegar nele, as metas passam para manutenção. */
  goalWeightKg?: number;
  /** Ritmo escolhido, em % do peso por semana (sempre positivo; o sinal vem do objetivo). */
  weeklyRatePct?: number;
  /** Distribuição de gordura e carboidrato nas calorias que sobram da proteína. */
  dietStyle?: DietStyle;
  /** Rotina fora do treino (trabalho e deslocamento), usada para sugerir o nível de atividade. */
  dailyRoutine?: DailyRoutine;
};

export type DietStyle = 'balanced' | 'lowfat' | 'lowcarb';
export type DailyRoutine = 'seated' | 'mixed' | 'standing' | 'physical';

export const DIET_STYLES: Record<DietStyle, { label: string; fatPct: number; description: string }> = {
  balanced: { label: 'Equilibrada', fatPct: 0.25, description: 'Gordura em ~25% das calorias, o resto em carboidrato. A melhor para quem treina pesado.' },
  lowfat: { label: 'Menos gordura', fatPct: 0.2, description: 'Gordura em ~20% das calorias e mais carboidrato para o treino.' },
  lowcarb: { label: 'Menos carboidrato', fatPct: 0.35, description: 'Gordura em ~35% das calorias. Para quem se sente melhor com menos carboidrato.' },
};

export const DAILY_ROUTINES: Record<DailyRoutine, { label: string; description: string }> = {
  seated: { label: 'Sentado quase o dia todo', description: 'Escritório, estudo, home office' },
  mixed: { label: 'Sentado e em pé', description: 'Professor, atendimento, anda um pouco' },
  standing: { label: 'Em pé a maior parte do dia', description: 'Vendas, saúde, cozinha' },
  physical: { label: 'Trabalho físico', description: 'Obra, carga, entregas a pé ou de bicicleta' },
};

/** Sugere o nível de atividade a partir da rotina e dos dias de treino por semana. */
export function suggestActivity(routine: DailyRoutine, trainingDays: number): ActivityLevel {
  const levels: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'high', 'athlete'];
  let i = trainingDays <= 0 ? 0 : trainingDays <= 3 ? 1 : trainingDays <= 5 ? 2 : 3;
  if (routine === 'standing') i += 1;
  if (routine === 'physical') i += 2;
  return levels[Math.min(levels.length - 1, i)];
}

// Taxa de ganho alvo no bulk, em % do peso por mês (Aragon/Helms).
export const TRAINING_LEVELS: Record<TrainingLevel, { label: string; monthlyGainPct: number; description: string }> = {
  beginner: { label: 'Iniciante (< 1 ano)', monthlyGainPct: 1.25, description: '1–1,5% do peso por mês' },
  intermediate: { label: 'Intermediário (1–3 anos)', monthlyGainPct: 0.75, description: '0,5–1% do peso por mês' },
  advanced: { label: 'Avançado (> 3 anos)', monthlyGainPct: 0.375, description: '0,25–0,5% do peso por mês' },
};

// Perda alvo na definição: ~0,75% do peso por semana preserva massa magra.
export const CUT_WEEKLY_LOSS_PCT = 0.75;
const KCAL_PER_KG = 7700;

/** Ritmo recomendado (% do peso por semana, positivo) para o objetivo e o nível de treino. */
export function recommendedWeeklyRatePct(goal: Goal, level: TrainingLevel = 'intermediate'): number {
  if (goal === 'bulk') return TRAINING_LEVELS[level].monthlyGainPct / (30 / 7);
  if (goal === 'cut') return CUT_WEEKLY_LOSS_PCT;
  return 0;
}

/** Opções de ritmo oferecidas no perfil (% do peso por semana). */
export const RATE_OPTIONS: Record<'bulk' | 'cut', { pct: number; label: string }[]> = {
  bulk: [
    { pct: 0.1, label: 'Bem devagar' },
    { pct: 0.2, label: 'Devagar' },
    { pct: 0.3, label: 'Moderado' },
    { pct: 0.5, label: 'Rápido' },
  ],
  cut: [
    { pct: 0.25, label: 'Devagar' },
    { pct: 0.5, label: 'Moderado' },
    { pct: 0.75, label: 'Recomendado' },
    { pct: 1, label: 'Agressivo' },
  ],
};

/** Limites de segurança para um ritmo digitado à mão. */
export const RATE_LIMITS = { bulk: { min: 0.05, max: 0.75 }, cut: { min: 0.1, max: 1.25 } } as const;

/** Ritmo efetivo (% do peso por semana, positivo): o escolhido ou o recomendado. */
export function weeklyRatePct(p: Profile): number {
  if (p.goal === 'recomp') return 0;
  const lim = RATE_LIMITS[p.goal];
  const chosen = p.weeklyRatePct;
  if (chosen === undefined || !(chosen > 0)) return recommendedWeeklyRatePct(p.goal, p.trainingLevel);
  return Math.min(lim.max, Math.max(lim.min, chosen));
}

/** Verdadeiro quando a pessoa já chegou (ou passou) do peso alvo na direção do objetivo. */
export function goalReached(p: Profile, currentKg = p.weightKg): boolean {
  if (p.goalWeightKg === undefined) return false;
  if (p.goal === 'bulk') return currentKg >= p.goalWeightKg;
  if (p.goal === 'cut') return currentKg <= p.goalWeightKg;
  return false;
}

/** O peso alvo aponta para o lado contrário do objetivo (ex.: ganhar massa com alvo menor). */
export function goalWeightConflict(p: Pick<Profile, 'goal' | 'goalWeightKg' | 'weightKg'>): boolean {
  if (p.goalWeightKg === undefined) return false;
  if (p.goal === 'bulk') return p.goalWeightKg < p.weightKg;
  if (p.goal === 'cut') return p.goalWeightKg > p.weightKg;
  return false;
}

/** Variação de peso semanal desejada (kg/semana; negativa na definição). Zero ao atingir a meta. */
export function targetWeeklyChangeKg(p: Profile): number {
  if (p.goal === 'recomp' || goalReached(p)) return 0;
  const kg = (p.weightKg * weeklyRatePct(p)) / 100;
  return p.goal === 'bulk' ? kg : -kg;
}

/** Semanas e data prevista para chegar ao peso alvo no ritmo atual. */
export function goalForecast(p: Profile, currentKg = p.weightKg, today = new Date()): { weeks: number; date: Date; remainingKg: number } | undefined {
  if (p.goalWeightKg === undefined || p.goal === 'recomp' || goalWeightConflict({ ...p, weightKg: currentKg })) return undefined;
  const remainingKg = p.goalWeightKg - currentKg;
  const perWeek = Math.abs(targetWeeklyChangeKg({ ...p, weightKg: currentKg }));
  if (!perWeek) return { weeks: 0, date: today, remainingKg };
  const weeks = Math.ceil(Math.abs(remainingKg) / perWeek);
  const date = new Date(today.getTime() + weeks * 7 * 86_400_000);
  return { weeks, date, remainingKg };
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
  bulk: { label: 'Ganho de massa magra', description: 'Superávit calculado pelo ritmo de ganho escolhido (o recomendado depende do seu nível)' },
  recomp: { label: 'Recomposição', description: 'Calorias de manutenção' },
  cut: { label: 'Definição', description: 'Déficit calculado pelo ritmo de perda escolhido, com proteína alta' },
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
 * Superávit/déficit diário a partir do ritmo alvo (7700 kcal por kg).
 * Sem ritmo escolhido, fica na faixa recomendada (bulk: +5 a 15%; definição: -10 a -25%).
 * Com ritmo escolhido, respeita a escolha até o teto de segurança (bulk +20%, definição -30%).
 * No peso alvo, vira manutenção.
 */
export function energyDelta(p: Profile, tdee: number): number {
  if (goalReached(p)) return 0;
  const raw = (targetWeeklyChangeKg(p) * KCAL_PER_KG) / 7;
  const chosen = p.weeklyRatePct !== undefined && p.weeklyRatePct > 0;
  if (p.goal === 'bulk') return chosen ? Math.min(raw, tdee * 0.2) : Math.min(Math.max(raw, tdee * 0.05), tdee * 0.15);
  if (p.goal === 'cut') return chosen ? Math.max(raw, -tdee * 0.3) : Math.max(Math.min(raw, -tdee * 0.1), -tdee * 0.25);
  return 0;
}

export function computeTargets(p: Profile, adaptiveTdee?: number, today = new Date()): Targets {
  const tdee = adaptiveTdee ?? formulaTdee(p, today);
  // Ajustes antigos de check-in só valem sobre a fórmula: o gasto adaptativo já é o valor real.
  const kcal = tdee + energyDelta(p, tdee) + (adaptiveTdee === undefined ? (p.kcalAdjustment ?? 0) : 0);
  const protein = p.proteinPerKg * p.weightKg;
  // Gordura: fração do estilo de dieta (padrão 25%), nunca abaixo de 0,6 g/kg (saúde hormonal).
  const fatPct = DIET_STYLES[p.dietStyle ?? 'balanced'].fatPct;
  const fat = Math.max((kcal * fatPct) / 9, 0.6 * p.weightKg);
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

const fmtKg = (kg: number) => kg.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const fmtPct = (pct: number) => pct.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

/** Explica cada número da meta em linguagem simples. */
export function explainTargets(p: Profile, t: Targets, today = new Date()): string[] {
  const adj = t.tdeeSource === 'formula' ? (p.kcalAdjustment ?? 0) : 0;
  const delta = t.kcal - t.tdee - adj;
  const lines = [
    `Gasto diário estimado: ${t.tdee} kcal (${t.tdeeSource === 'adaptive' ? 'calculado pelo seu peso e pelo que você comeu' : `taxa basal ${Math.round(bmr(p, today))} kcal × fator de atividade ${ACTIVITY_FACTORS[p.activity].factor}`}).`,
  ];
  const rate = fmtPct(weeklyRatePct(p));
  const grams = Math.abs(targetWeeklyChangeKg(p) * 1000).toFixed(0);
  const target = p.goalWeightKg !== undefined ? ` até ${fmtKg(p.goalWeightKg)} kg` : '';
  if (goalReached(p)) {
    lines.push(`Você chegou ao peso alvo de ${fmtKg(p.goalWeightKg!)} kg: calorias de manutenção. Defina uma meta nova no perfil quando quiser.`);
  } else if (p.goal === 'bulk') {
    lines.push(`Superávit de ${Math.round(delta)} kcal para ganhar ${grams} g por semana (${rate}% do peso)${target}, ritmo que favorece massa magra.`);
    if (weeklyRatePct(p) > recommendedWeeklyRatePct('bulk', p.trainingLevel) * 1.5)
      lines.push('Esse ritmo está acima do recomendado para o seu nível: parte do ganho tende a ser gordura.');
  } else if (p.goal === 'cut') {
    lines.push(`Déficit de ${Math.round(-delta)} kcal para perder cerca de ${grams} g por semana (${rate}% do peso)${target}.`);
  } else {
    lines.push('Calorias de manutenção: o treino e a proteína alta fazem a recomposição.');
  }
  if (adj) lines.push(`Ajuste dos check-ins semanais: ${adj > 0 ? '+' : ''}${adj} kcal.`);
  lines.push(`Proteína: ${p.proteinPerKg} g × ${p.weightKg} kg = ${t.protein} g (faixa com melhor evidência para hipertrofia: 1,6–2,2 g/kg).`);
  const style = DIET_STYLES[p.dietStyle ?? 'balanced'];
  lines.push(`Gordura: ${t.fat} g, cerca de ${Math.round(style.fatPct * 100)}% das calorias (dieta ${style.label.toLowerCase()}) e pelo menos 0,6 g/kg para a saúde hormonal.`);
  lines.push(`Carboidrato: o restante, ${t.carbs} g, combustível para o treino.`);
  return lines;
}
