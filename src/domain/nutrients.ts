// Nutrientes acompanhados pelo app. Todos os valores de alimentos são guardados por 100 g (ou 100 ml).

export type NutrientKey =
  | 'kcal'
  | 'protein'
  | 'carbs'
  | 'sugars'
  | 'addedSugars'
  | 'fat'
  | 'saturatedFat'
  | 'transFat'
  | 'fiber'
  | 'sodium'
  | 'calcium'
  | 'iron'
  | 'potassium'
  | 'magnesium'
  | 'zinc'
  | 'vitaminA'
  | 'vitaminC'
  | 'vitaminD'
  | 'vitaminB12'
  | 'cholesterol';

export type Nutrients = Partial<Record<NutrientKey, number>>;

export type NutrientInfo = {
  key: NutrientKey;
  label: string;
  unit: 'kcal' | 'g' | 'mg' | 'µg';
  group: 'energia' | 'macro' | 'micro';
};

export const NUTRIENTS: NutrientInfo[] = [
  { key: 'kcal', label: 'Valor energético', unit: 'kcal', group: 'energia' },
  { key: 'protein', label: 'Proteínas', unit: 'g', group: 'macro' },
  { key: 'carbs', label: 'Carboidratos', unit: 'g', group: 'macro' },
  { key: 'sugars', label: 'Açúcares totais', unit: 'g', group: 'macro' },
  { key: 'addedSugars', label: 'Açúcares adicionados', unit: 'g', group: 'macro' },
  { key: 'fat', label: 'Gorduras totais', unit: 'g', group: 'macro' },
  { key: 'saturatedFat', label: 'Gorduras saturadas', unit: 'g', group: 'macro' },
  { key: 'transFat', label: 'Gorduras trans', unit: 'g', group: 'macro' },
  { key: 'fiber', label: 'Fibra alimentar', unit: 'g', group: 'macro' },
  { key: 'sodium', label: 'Sódio', unit: 'mg', group: 'micro' },
  { key: 'calcium', label: 'Cálcio', unit: 'mg', group: 'micro' },
  { key: 'iron', label: 'Ferro', unit: 'mg', group: 'micro' },
  { key: 'potassium', label: 'Potássio', unit: 'mg', group: 'micro' },
  { key: 'magnesium', label: 'Magnésio', unit: 'mg', group: 'micro' },
  { key: 'zinc', label: 'Zinco', unit: 'mg', group: 'micro' },
  { key: 'vitaminA', label: 'Vitamina A', unit: 'µg', group: 'micro' },
  { key: 'vitaminC', label: 'Vitamina C', unit: 'mg', group: 'micro' },
  { key: 'vitaminD', label: 'Vitamina D', unit: 'µg', group: 'micro' },
  { key: 'vitaminB12', label: 'Vitamina B12', unit: 'µg', group: 'micro' },
  { key: 'cholesterol', label: 'Colesterol', unit: 'mg', group: 'micro' },
];

export const NUTRIENT_BY_KEY = Object.fromEntries(NUTRIENTS.map((n) => [n.key, n])) as Record<
  NutrientKey,
  NutrientInfo
>;

// Valores diários de referência para adultos (ANVISA, IN 75/2020, Anexo II).
// Sódio é um limite máximo, não uma meta a atingir.
export const DAILY_REFERENCE: Nutrients = {
  fiber: 25,
  sodium: 2000,
  calcium: 1000,
  iron: 14,
  potassium: 3500,
  magnesium: 420,
  zinc: 11,
  vitaminA: 800,
  vitaminC: 100,
  vitaminD: 15,
  vitaminB12: 2.4,
};

export const UPPER_LIMIT_KEYS: NutrientKey[] = ['sodium', 'addedSugars', 'saturatedFat', 'transFat'];

/** Escala nutrientes por 100 g para a quantidade consumida. */
export function scaleNutrients(per100g: Nutrients, grams: number): Nutrients {
  const out: Nutrients = {};
  const factor = grams / 100;
  for (const [key, value] of Object.entries(per100g) as [NutrientKey, number][]) {
    if (typeof value === 'number' && Number.isFinite(value)) out[key] = value * factor;
  }
  return out;
}

export function sumNutrients(list: Nutrients[]): Nutrients {
  const out: Nutrients = {};
  for (const n of list) {
    for (const [key, value] of Object.entries(n) as [NutrientKey, number][]) {
      if (typeof value === 'number' && Number.isFinite(value)) out[key] = (out[key] ?? 0) + value;
    }
  }
  return out;
}

/** Energia estimada pelos fatores de Atwater, usada quando o rótulo não traz kcal. */
export function atwaterKcal(n: Nutrients): number {
  return (n.protein ?? 0) * 4 + (n.carbs ?? 0) * 4 + (n.fat ?? 0) * 9;
}

export function formatAmount(value: number | undefined, unit: string): string {
  if (value === undefined || !Number.isFinite(value)) return '–';
  const digits = value >= 100 || unit === 'kcal' ? 0 : value >= 10 ? 1 : value >= 1 ? 1 : 2;
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: digits })} ${unit}`;
}
