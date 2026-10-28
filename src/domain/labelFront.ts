// Frente da embalagem: selos "ALTO EM" (lupa da RDC 429/2020) e sugestão de nome.

import { Nutrients } from './nutrients';
import { normalize } from './labelParser';

export type HighIn = 'addedSugars' | 'saturatedFat' | 'sodium';

export const HIGH_IN_LABEL: Record<HighIn, string> = {
  addedSugars: 'açúcar adicionado',
  saturatedFat: 'gordura saturada',
  sodium: 'sódio',
};

// Limites da IN 75/2020, Anexo XV, por 100 g (sólidos) ou 100 ml (líquidos).
const LIMITS: Record<HighIn, { solid: number; liquid: number }> = {
  addedSugars: { solid: 15, liquid: 7.5 },
  saturatedFat: { solid: 6, liquid: 3 },
  sodium: { solid: 600, liquid: 300 },
};

/** Calcula os selos pelos valores da tabela, mesmo quando a foto da frente não foi tirada. */
export function computeHighIn(per100g: Nutrients, liquid = false): HighIn[] {
  return (Object.keys(LIMITS) as HighIn[]).filter((k) => {
    const v = per100g[k];
    return v !== undefined && v >= LIMITS[k][liquid ? 'liquid' : 'solid'];
  });
}

/** Lê os selos impressos na frente ("ALTO EM AÇÚCAR ADICIONADO", "ALTO EM SÓDIO"). */
export function parseHighInStamp(rawText: string): HighIn[] {
  const t = normalize(rawText).replace(/\s+/g, ' ');
  if (!/alto\s*em/.test(t)) return [];
  const out: HighIn[] = [];
  if (/acucar(es)?\s*adicionad/.test(t)) out.push('addedSugars');
  if (/gordura(s)?\s*saturad/.test(t)) out.push('saturatedFat');
  if (/sodio/.test(t)) out.push('sodium');
  return out;
}

const NOISE = /alto\s*em|acucar|gordura|sodio|peso liquido|conteudo|ingredientes|contem|gluten|lactose|validade|lote|fabricado|www|\.com|kcal|\d+\s*(g|kg|ml|l)\b|informacao nutricional|sac\b|industria brasileira/;

/**
 * Sugere nome e marca a partir do texto da frente. Usa as linhas mais "de título":
 * sem números de peso, sem avisos legais.
 */
export function guessNameFromFront(rawText: string): { name?: string; brand?: string } {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 3 && l.length <= 40)
    .filter((l) => !NOISE.test(normalize(l)))
    .filter((l) => /[a-zA-ZÀ-ú]{3,}/.test(l));
  if (lines.length === 0) return {};
  // Marca costuma vir em caixa alta e curta; o nome do produto é a linha seguinte mais longa.
  const brand = lines.find((l) => l === l.toUpperCase() && l.length <= 20);
  const name = lines.filter((l) => l !== brand).sort((a, b) => b.length - a.length)[0] ?? brand;
  const title = (s?: string) => s?.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
  return { name: title(name), brand: brand && brand !== name ? title(brand) : undefined };
}
