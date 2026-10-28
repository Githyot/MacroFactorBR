// IA do MacroFactorBR (Claude): estrutura o texto lido de uma tabela nutricional,
// estima um prato por foto, entende refeições em texto livre e explica o check-in semanal.
// A chave da Anthropic fica só aqui no servidor (secret ANTHROPIC_API_KEY).

import Anthropic from 'npm:@anthropic-ai/sdk@1.3.0';
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

import { corsHeaders, json } from '../_shared/cors.ts';

const MODEL = 'claude-opus-5-5';
const FREE_PHOTOS_PER_DAY = 3;

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

const NUTRIENT_PROPS = {
  kcal: { type: ['number', 'null'] },
  protein: { type: ['number', 'null'] },
  carbs: { type: ['number', 'null'] },
  sugars: { type: ['number', 'null'] },
  addedSugars: { type: ['number', 'null'] },
  fat: { type: ['number', 'null'] },
  saturatedFat: { type: ['number', 'null'] },
  transFat: { type: ['number', 'null'] },
  fiber: { type: ['number', 'null'] },
  sodium: { type: ['number', 'null'], description: 'mg' },
};

const LABEL_SCHEMA = {
  type: 'object',
  properties: {
    servingGrams: { type: ['number', 'null'] },
    servingDescription: { type: ['string', 'null'] },
    liquid: { type: 'boolean' },
    per100g: { type: 'object', properties: NUTRIENT_PROPS, required: Object.keys(NUTRIENT_PROPS), additionalProperties: false },
  },
  required: ['servingGrams', 'servingDescription', 'liquid', 'per100g'],
  additionalProperties: false,
};

const ITEMS_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nome do alimento em português, como na Tabela TACO (ex.: "Arroz, tipo 1, cozido")' },
          searchQuery: { type: 'string', description: 'Termos curtos para buscar na base TACO (ex.: "arroz cozido")' },
          grams: { type: 'number' },
          kcal: { type: 'number' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          fat: { type: 'number' },
          confidence: { type: 'string', enum: ['alta', 'media', 'baixa'] },
        },
        required: ['name', 'searchQuery', 'grams', 'kcal', 'protein', 'carbs', 'fat', 'confidence'],
        additionalProperties: false,
      },
    },
    notes: { type: 'string' },
  },
  required: ['items', 'notes'],
  additionalProperties: false,
};

const COACH_SCHEMA = {
  type: 'object',
  properties: { message: { type: 'string' } },
  required: ['message'],
  additionalProperties: false,
};

type Content = Anthropic.Beta.BetaContentBlockParam[];

async function ask<T>(system: string, content: Content, schema: Record<string, unknown>, effort: 'low' | 'medium'): Promise<T> {
  const response = await anthropic.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // Se o modelo recusar por política, a API refaz a chamada no modelo de reserva.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system,
    output_config: { effort, format: { type: 'json_schema', schema } },
    messages: [{ role: 'user', content }],
  });
  if (response.stop_reason === 'refusal') throw new HttpError(422, 'A IA não conseguiu processar este pedido.');
  if (response.stop_reason === 'max_tokens') throw new HttpError(502, 'Resposta da IA incompleta.');
  const text = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')?.text;
  if (!text) throw new HttpError(502, 'Resposta da IA vazia.');
  return JSON.parse(text) as T;
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const SYSTEM_BASE =
  'Você é o motor de nutrição do MacroFactorBR, um app brasileiro de dieta para musculação. ' +
  'Use unidades brasileiras (g, mg, kcal) e nomes de alimentos como na Tabela TACO. ' +
  'Nunca invente valores que não dá para estimar: prefira null quando um campo não aparece no texto.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return json({ error: 'Faça login para usar a IA.' }, 401);
    const userId = auth.user.id;

    const body = await req.json();
    const action = body.action as string;

    if (action === 'label') {
      const text = String(body.text ?? '').slice(0, 8000);
      const result = await ask(
        `${SYSTEM_BASE} Converta o texto de OCR de uma tabela nutricional brasileira (RDC 429/2020 ou RDC 360/2003) em valores por 100 g (ou 100 ml). ` +
          'Se a tabela só tiver valores por porção, converta para 100 g usando a porção. O OCR pode trocar vírgulas, O e 0.',
        [{ type: 'text', text }],
        LABEL_SCHEMA,
        'low',
      );
      return json(result);
    }

    if (action === 'photo') {
      // Cota do plano grátis: fotos por dia.
      const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      const { data: profile } = await admin.from('profiles').select('is_pro').eq('id', userId).single();
      const today = new Date().toISOString().slice(0, 10);
      const { data: usage } = await admin.from('ai_usage').select('count').eq('user_id', userId).eq('day', today).eq('kind', 'photo').maybeSingle();
      const used = usage?.count ?? 0;
      if (!profile?.is_pro && used >= FREE_PHOTOS_PER_DAY) {
        return json({ error: `Limite de ${FREE_PHOTOS_PER_DAY} fotos por dia no plano grátis.` }, 429);
      }
      const mediaType = ['image/jpeg', 'image/png', 'image/webp'].includes(body.mediaType) ? body.mediaType : 'image/jpeg';
      const result = await ask(
        `${SYSTEM_BASE} Identifique cada alimento do prato na foto e estime o peso em gramas pela proporção do prato (prato raso ~24 cm). ` +
          'Pratos brasileiros comuns: arroz, feijão, carne, frango, farofa, salada, ovo. Estime kcal e macros de cada item. ' +
          'Seja conservador e marque a confiança.',
        [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: String(body.imageBase64 ?? '') } },
          { type: 'text', text: String(body.hint ?? 'Estime os alimentos deste prato.') },
        ],
        ITEMS_SCHEMA,
        'medium',
      );
      await admin.from('ai_usage').upsert({ user_id: userId, day: today, kind: 'photo', count: used + 1 });
      return json(result);
    }

    if (action === 'parse') {
      const text = String(body.text ?? '').slice(0, 2000);
      const result = await ask(
        `${SYSTEM_BASE} O usuário descreveu o que comeu em texto livre ou ditado por voz. Separe cada alimento, converta medidas caseiras ` +
          '(concha de feijão ~86 g, colher de sopa de arroz ~25 g, ovo ~50 g, pão francês ~50 g, scoop ~30 g) em gramas e estime kcal e macros.',
        [{ type: 'text', text }],
        ITEMS_SCHEMA,
        'low',
      );
      return json(result);
    }

    if (action === 'coach') {
      const result = await ask<{ message: string }>(
        `${SYSTEM_BASE} Você é um coach de nutrição para hipertrofia. Explique o check-in semanal em até 120 palavras, em português simples, ` +
          'sem culpa e sem prescrever remédios. Diga o que o número significa e uma ação prática para a semana com comida brasileira.',
        [{ type: 'text', text: JSON.stringify(body.context ?? {}).slice(0, 4000) }],
        COACH_SCHEMA,
        'low',
      );
      return json(result);
    }

    return json({ error: 'Ação desconhecida' }, 400);
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'IA ocupada, tente de novo em instantes.' }, 429);
    if (e instanceof Anthropic.APIError) return json({ error: `Erro da IA (${e.status}).` }, 502);
    console.error(e);
    return json({ error: 'Erro inesperado.' }, 500);
  }
});
