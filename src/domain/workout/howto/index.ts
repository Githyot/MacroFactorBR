// "Como executar" de cada exercício: ajuste do aparelho, posição, movimento,
// amplitude e erros comuns, mais uma linha de intensidade conforme o tipo.

import { Exercise } from '../exercises';
import { ARMS } from './arms';
import { CORE } from './core';
import { LOWER } from './lower';
import { UPPER } from './upper';

export const HOW_TO: Record<string, string[]> = { ...UPPER, ...ARMS, ...LOWER, ...CORE };

// Exercícios livres pesados em que errar perto da falha é arriscado.
const HEAVY_FREE = /^(agachamento-(livre|frontal|pausado|box|sumo-barra|bulgaro-barra)|levantamento-terra|stiff$|terra-romeno$|good-morning|rack-pull|remada-(curvada|pendlay)|supino-(reto|inclinado|declinado)-barra|supino-declinado$|supino-fechado$|desenvolvimento-(barra|nuca|sentado-barra)|clean|thruster|snatch|turkish|afundo-barra|passada-andando)/;

/** Linha de intensidade: o quanto chegar perto da falha neste exercício. */
export function intensityTip(ex: Exercise): string | undefined {
  if (ex.primary === 'cardio' || ex.kind === 'duration') return undefined;
  if (HEAVY_FREE.test(ex.id)) return '**Intensidade:** pare 1–2 repetições antes da falha. A técnica vem antes da carga.';
  const machine = ex.equipment === 'maquina' || ex.equipment === 'articulada' || ex.equipment === 'polia' || ex.equipment === 'smith';
  const isolation = ex.secondary.length === 0;
  if (machine || isolation) return '**Intensidade:** a última série pode ir até a falha (sem perder a forma).';
  return '**Intensidade:** termine as séries com 1–3 repetições "no tanque"; a última pode chegar perto da falha.';
}

const GENERIC = [
  'Faça uma série leve de aproximação antes das séries válidas.',
  'Movimento controlado: desça em 2–3 s e suba firme, sem dar tranco.',
  'Use a **amplitude completa** que conseguir sem dor e sem perder a postura.',
  'Se a técnica quebrar, diminua a carga.',
];

/** Dicas do exercício; exercícios criados por você recebem orientações gerais. */
export function howTo(ex: Exercise): { steps: string[]; intensity?: string; generic: boolean } {
  const steps = HOW_TO[ex.id];
  return { steps: steps ?? GENERIC, intensity: intensityTip(ex), generic: !steps };
}

/** Quebra "texto **negrito** texto" em pedaços para desenhar o negrito. */
export function boldParts(s: string): { text: string; bold: boolean }[] {
  return s
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((t) => (t.startsWith('**') && t.endsWith('**') ? { text: t.slice(2, -2), bold: true } : { text: t, bold: false }));
}
