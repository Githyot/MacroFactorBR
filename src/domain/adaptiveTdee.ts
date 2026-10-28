// Gasto energético adaptativo: estima o TDEE real a partir do que a pessoa comeu
// e de como o peso de tendência mudou, em vez de confiar só na fórmula.

export type WeightEntry = { date: string; kg: number }; // date: AAAA-MM-DD

const KCAL_PER_KG = 7700;
const DAY_MS = 86_400_000;

export const MIN_LOGGED_DAYS = 10;
export const MIN_WEIGH_INS = 5;
export const WINDOW_DAYS = 28;

function dayIndex(date: string): number {
  return Math.round(new Date(`${date}T00:00:00Z`).getTime() / DAY_MS);
}

/**
 * Peso de tendência por média móvel exponencial (suaviza água, sal, intestino).
 * Dias sem pesagem herdam a tendência anterior.
 */
export function trendWeights(entries: WeightEntry[], alpha = 0.1): WeightEntry[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const out: WeightEntry[] = [];
  let trend: number | undefined;
  for (const e of sorted) {
    trend = trend === undefined ? e.kg : trend + alpha * (e.kg - trend);
    out.push({ date: e.date, kg: trend });
  }
  return out;
}

/** Inclinação (kg/dia) por regressão linear. */
function slope(points: { x: number; y: number }[]): number {
  const n = points.length;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export type AdaptiveResult =
  | { status: 'ok'; tdee: number; weeklyChangeKg: number; avgIntake: number; loggedDays: number }
  | { status: 'insufficient'; loggedDays: number; weighIns: number };

/**
 * @param weights pesagens
 * @param intakeByDate kcal consumidas por dia (apenas dias registrados)
 * @param today data de referência (AAAA-MM-DD)
 */
export function estimateAdaptiveTdee(
  weights: WeightEntry[],
  intakeByDate: Record<string, number>,
  today: string,
): AdaptiveResult {
  const end = dayIndex(today);
  const start = end - WINDOW_DAYS + 1;
  const inWindow = (d: string) => {
    const i = dayIndex(d);
    return i >= start && i <= end;
  };

  // Dias com menos de 800 kcal provavelmente estão incompletos.
  const intakes = Object.entries(intakeByDate).filter(([d, k]) => inWindow(d) && k >= 800);
  const windowWeights = weights.filter((w) => inWindow(w.date));
  if (intakes.length < MIN_LOGGED_DAYS || windowWeights.length < MIN_WEIGH_INS) {
    return { status: 'insufficient', loggedDays: intakes.length, weighIns: windowWeights.length };
  }

  // A tendência usa todo o histórico para não começar "fria" no início da janela.
  const trend = trendWeights(weights).filter((w) => inWindow(w.date));
  const kgPerDay = slope(trend.map((w) => ({ x: dayIndex(w.date), y: w.kg })));
  const avgIntake = intakes.reduce((s, [, k]) => s + k, 0) / intakes.length;
  const tdee = avgIntake - kgPerDay * KCAL_PER_KG;

  return {
    status: 'ok',
    tdee: Math.round(tdee),
    weeklyChangeKg: kgPerDay * 7,
    avgIntake: Math.round(avgIntake),
    loggedDays: intakes.length,
  };
}
