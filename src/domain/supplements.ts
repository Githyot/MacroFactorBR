// Suplementação: de onde vem a proteína (comida × suplemento) e o protocolo diário de
// suplementos, vitaminas e medicamentos, com as doses marcadas a cada dia.
// Vitaminas e minerais tomados entram no painel de micronutrientes.

import { DiaryEntry, Food, normalizeSearch } from './foods';
import { NutrientKey, Nutrients } from './nutrients';

export type SupplementKind = 'suplemento' | 'vitamina' | 'medicamento';
export type DoseUnit = 'g' | 'mg' | 'mcg' | 'UI' | 'cápsula' | 'comprimido' | 'gota' | 'ml';

export const KIND_LABEL: Record<SupplementKind, string> = {
  suplemento: 'Suplemento',
  vitamina: 'Vitamina ou mineral',
  medicamento: 'Medicamento',
};

export const DOSE_UNITS: DoseUnit[] = ['g', 'mg', 'mcg', 'UI', 'cápsula', 'comprimido', 'gota', 'ml'];

export type Supplement = {
  id: string;
  name: string;
  kind: SupplementKind;
  /** Quantidade por dose, na unidade escolhida (ex.: 5 g, 2000 UI, 1 comprimido). */
  dose: number;
  unit: DoseUnit;
  timesPerDay: number;
  /** Horários de cada dose ("08:00"), só para exibir. */
  times?: string[];
  /** Dias da semana (0 = domingo). Vazio ou ausente = todos os dias. */
  weekdays?: number[];
  /** Micronutrientes por dose, para somar ao painel (ex.: multivitamínico). */
  nutrients?: Nutrients;
  note?: string;
  /** Removido do protocolo, mas mantido para o histórico. */
  archived?: boolean;
  createdAt: string;
};

/** Doses tomadas por dia: data → id do suplemento → quantas doses. */
export type SupplementLog = Record<string, Record<string, number>>;

export type SupplementPreset = Omit<Supplement, 'id' | 'createdAt'> & { presetId: string; why: string };

// Valores de referência comuns no Brasil. O usuário ajusta pelo rótulo do produto.
export const SUPPLEMENT_PRESETS: SupplementPreset[] = [
  {
    presetId: 'creatina',
    name: 'Creatina monohidratada',
    kind: 'suplemento',
    dose: 5,
    unit: 'g',
    timesPerDay: 1,
    why: '3–5 g todo dia, em qualquer horário, inclusive nos dias sem treino. É o suplemento com mais evidência para força e massa magra.',
  },
  {
    presetId: 'cafeina',
    name: 'Cafeína',
    kind: 'suplemento',
    dose: 200,
    unit: 'mg',
    timesPerDay: 1,
    times: ['30 min antes do treino'],
    why: '3–6 mg/kg cerca de 30–60 min antes do treino melhora o desempenho. Evite nas 6–8 h antes de dormir.',
  },
  {
    presetId: 'multivitaminico',
    name: 'Multivitamínico',
    kind: 'vitamina',
    dose: 1,
    unit: 'comprimido',
    timesPerDay: 1,
    nutrients: { vitaminA: 400, vitaminC: 45, vitaminD: 10, vitaminB12: 2.4, zinc: 7, iron: 8, magnesium: 50, calcium: 160 },
    why: 'Cobre lacunas de uma dieta restrita. A composição é a média do mercado; ajuste pelo rótulo do seu.',
  },
  {
    presetId: 'vitamina-d',
    name: 'Vitamina D3',
    kind: 'vitamina',
    dose: 2000,
    unit: 'UI',
    timesPerDay: 1,
    nutrients: { vitaminD: 50 },
    why: 'Útil para quem toma pouco sol. 2000 UI = 50 µg. O ideal é ajustar a dose pelo exame de sangue (25-OH vitamina D).',
  },
  {
    presetId: 'omega-3',
    name: 'Ômega 3 (EPA + DHA)',
    kind: 'suplemento',
    dose: 1,
    unit: 'g',
    timesPerDay: 2,
    why: 'Para quem come pouco peixe. Tome junto com uma refeição.',
  },
  {
    presetId: 'b12',
    name: 'Vitamina B12',
    kind: 'vitamina',
    dose: 1000,
    unit: 'mcg',
    timesPerDay: 1,
    weekdays: [1, 4],
    nutrients: { vitaminB12: 1000 },
    why: 'Essencial para vegetarianos e veganos. Doses altas 2x por semana funcionam porque a absorção é limitada.',
  },
  {
    presetId: 'magnesio',
    name: 'Magnésio (dimalato ou glicinato)',
    kind: 'vitamina',
    dose: 200,
    unit: 'mg',
    timesPerDay: 1,
    nutrients: { magnesium: 200 },
    why: 'Pode ajudar quem come poucas castanhas, folhas e grãos integrais. Acima de 350 mg/dia em suplemento pode causar diarreia.',
  },
  {
    presetId: 'zinco',
    name: 'Zinco',
    kind: 'vitamina',
    dose: 15,
    unit: 'mg',
    timesPerDay: 1,
    nutrients: { zinc: 15 },
    why: 'Só se a dieta tiver pouca carne, ovos ou leguminosas. Não passe de 40 mg/dia somando tudo.',
  },
  {
    presetId: 'vitamina-c',
    name: 'Vitamina C',
    kind: 'vitamina',
    dose: 500,
    unit: 'mg',
    timesPerDay: 1,
    nutrients: { vitaminC: 500 },
    why: 'Fácil de obter na comida (laranja, acerola, goiaba). Suplementar raramente é necessário.',
  },
  {
    presetId: 'calcio',
    name: 'Cálcio',
    kind: 'vitamina',
    dose: 500,
    unit: 'mg',
    timesPerDay: 1,
    nutrients: { calcium: 500 },
    why: 'Para quem consome pouco leite e derivados. Prefira dividir em doses de até 500 mg.',
  },
  {
    presetId: 'ferro',
    name: 'Ferro',
    kind: 'medicamento',
    dose: 40,
    unit: 'mg',
    timesPerDay: 1,
    nutrients: { iron: 40 },
    why: 'Só com exame e indicação médica: excesso de ferro faz mal.',
  },
];

/** Limites superiores de ingestão (UL, adultos), somando comida e suplemento. */
export const UPPER_LIMITS: Partial<Record<NutrientKey, number>> = {
  vitaminA: 3000,
  vitaminC: 2000,
  vitaminD: 100,
  zinc: 40,
  iron: 45,
  calcium: 2500,
};
/** O limite do magnésio vale só para o que vem de suplemento. */
const MAGNESIUM_SUPPLEMENT_UL = 350;

export function scheduledDoses(s: Supplement, date: string): number {
  if (s.archived) return 0;
  if (s.weekdays && s.weekdays.length > 0) {
    const weekday = new Date(`${date}T12:00:00`).getDay();
    if (!s.weekdays.includes(weekday)) return 0;
  }
  return s.timesPerDay;
}

/** Micronutrientes das doses marcadas no dia. */
export function supplementNutrients(supplements: Record<string, Supplement>, taken: Record<string, number> | undefined): Nutrients {
  const out: Nutrients = {};
  for (const [id, count] of Object.entries(taken ?? {})) {
    const s = supplements[id];
    if (!s?.nutrients || count <= 0) continue;
    for (const [k, v] of Object.entries(s.nutrients) as [NutrientKey, number][]) out[k] = (out[k] ?? 0) + v * count;
  }
  return out;
}

export type UpperLimitWarning = { key: NutrientKey; total: number; limit: number; fromSupplements: number };

/** Nutrientes que passaram do limite seguro somando comida e suplementos. */
export function upperLimitWarnings(food: Nutrients, supp: Nutrients): UpperLimitWarning[] {
  const out: UpperLimitWarning[] = [];
  for (const [k, limit] of Object.entries(UPPER_LIMITS) as [NutrientKey, number][]) {
    const fromSupplements = supp[k] ?? 0;
    const total = (food[k] ?? 0) + fromSupplements;
    // Só avisa quando o suplemento contribui: comida sozinha raramente passa do limite.
    if (fromSupplements > 0 && total > limit) out.push({ key: k, total, limit, fromSupplements });
  }
  const mg = supp.magnesium ?? 0;
  if (mg > MAGNESIUM_SUPPLEMENT_UL) out.push({ key: 'magnesium', total: mg, limit: MAGNESIUM_SUPPLEMENT_UL, fromSupplements: mg });
  return out;
}

const SUPPLEMENT_NAME = /\b(whey|albumina|caseina|hipercalorico|mass|protein|proteina (isolada|concentrada|hidrolisada|em po|vegana|vegetal|de soja|de ervilha))\b/;

/** Pó de proteína, hipercalórico etc. Alimentos cadastrados pelo rótulo entram pelo nome. */
export function isSupplementFood(f: Food): boolean {
  if (f.kind === 'supplement') return true;
  if (f.kind === 'recipe' || f.kind === 'dish' || f.source === 'taco') return false;
  return SUPPLEMENT_NAME.test(normalizeSearch(f.name));
}

export type ProteinSplit = { food: number; supplement: number; supplementPct: number };

export function proteinBySource(entries: DiaryEntry[], foods: Record<string, Food>): ProteinSplit {
  let food = 0;
  let supplement = 0;
  for (const e of entries) {
    const f = foods[e.foodId];
    if (!f) continue;
    const p = ((f.per100g.protein ?? 0) * e.grams) / 100;
    if (isSupplementFood(f)) supplement += p;
    else food += p;
  }
  const total = food + supplement;
  return { food, supplement, supplementPct: total > 0 ? supplement / total : 0 };
}

/** Fração das doses programadas que foram marcadas nas datas dadas. */
export function adherence(supplements: Record<string, Supplement>, log: SupplementLog, dates: string[]): number | undefined {
  let planned = 0;
  let done = 0;
  for (const d of dates) {
    for (const s of Object.values(supplements)) {
      const n = scheduledDoses(s, d);
      planned += n;
      done += Math.min(n, log[d]?.[s.id] ?? 0);
    }
  }
  return planned > 0 ? done / planned : undefined;
}

export function formatDose(s: Pick<Supplement, 'dose' | 'unit'>): string {
  const n = s.dose.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  if (s.unit === 'cápsula' || s.unit === 'comprimido' || s.unit === 'gota') return `${n} ${s.unit}${s.dose === 1 ? '' : 's'}`;
  return `${n} ${s.unit}`;
}

type WithSupplements = { habits?: Record<string, { creatine?: boolean }>; supplements: Record<string, Supplement>; supplementLog: SupplementLog };

/** A antiga caixinha "Creatina" vira um item do protocolo, com os mesmos dias marcados. */
export function migrateHabits<T extends WithSupplements>(s: T): T {
  const days = Object.entries(s.habits ?? {}).filter(([, h]) => h.creatine);
  if (days.length === 0 || s.supplements.creatina) return { ...s, habits: {} };
  const creatina: Supplement = { id: 'creatina', name: 'Creatina monohidratada', kind: 'suplemento', dose: 5, unit: 'g', timesPerDay: 1, createdAt: new Date().toISOString() };
  const log: SupplementLog = { ...s.supplementLog };
  for (const [date] of days) log[date] = { ...log[date], creatina: 1 };
  return { ...s, habits: {}, supplements: { ...s.supplements, creatina }, supplementLog: log };
}

export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
