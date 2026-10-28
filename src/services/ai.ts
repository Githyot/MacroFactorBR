// Chamadas à IA (Claude) pela função do Supabase. A chave da Anthropic nunca fica no app.

import { supabase } from './supabase';

export type AiItem = {
  name: string;
  searchQuery: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: 'alta' | 'media' | 'baixa';
};

export class AiUnavailableError extends Error {}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new AiUnavailableError('Configure o Supabase para usar a IA (veja o README).');
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new AiUnavailableError('Entre na sua conta (aba Perfil) para usar a IA.');
  const { data, error } = await supabase.functions.invoke('ai', { body });
  if (error) {
    // A função devolve { error } com a mensagem amigável.
    const ctx = (error as { context?: Response }).context;
    const msg = ctx ? ((await ctx.json().catch(() => ({}))) as { error?: string }).error : undefined;
    throw new Error(msg ?? error.message);
  }
  return data as T;
}

export const ai = {
  mealPhoto: (imageBase64: string, mediaType: string, hint?: string) =>
    call<{ items: AiItem[]; notes: string }>({ action: 'photo', imageBase64, mediaType, hint }),
  parseText: (text: string) => call<{ items: AiItem[]; notes: string }>({ action: 'parse', text }),
  structureLabel: (text: string) =>
    call<{ servingGrams: number | null; servingDescription: string | null; liquid: boolean; per100g: Record<string, number | null> }>({
      action: 'label',
      text,
    }),
  coach: (context: unknown) => call<{ message: string }>({ action: 'coach', context }),
};
