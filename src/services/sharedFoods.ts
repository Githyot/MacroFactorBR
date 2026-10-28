// Base compartilhada: rótulos lidos por um usuário ajudam todos (com moderação por confirmações).

import { Food } from '../domain/foods';
import { Nutrients } from '../domain/nutrients';
import { supabase } from './supabase';

export type SharedFood = {
  id: string;
  barcode: string;
  name: string;
  brand: string | null;
  per100g: Nutrients;
  serving_grams: number | null;
  serving_description: string | null;
  liquid: boolean;
  status: 'pending' | 'verified' | 'rejected';
  confirmations: number;
  created_by: string | null;
};

export async function findSharedByBarcode(barcode: string): Promise<SharedFood | undefined> {
  if (!supabase) return undefined;
  const { data } = await supabase
    .from('shared_foods')
    .select('*')
    .eq('barcode', barcode)
    .order('status', { ascending: false }) // verified antes de pending
    .order('confirmations', { ascending: false })
    .limit(1);
  return (data?.[0] as SharedFood | undefined) ?? undefined;
}

export function sharedToFood(s: SharedFood): Omit<Food, 'id' | 'createdAt'> {
  return {
    name: s.name,
    brand: s.brand ?? undefined,
    barcode: s.barcode,
    source: 'shared',
    sharedId: s.id,
    sharedStatus: s.status,
    per100g: s.per100g,
    servingGrams: s.serving_grams ?? undefined,
    servingDescription: s.serving_description ?? undefined,
    liquid: s.liquid,
  };
}

export async function publishFood(food: Food): Promise<void> {
  if (!supabase || !food.barcode) return;
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return;
  await supabase.from('shared_foods').insert({
    barcode: food.barcode,
    name: food.name,
    brand: food.brand ?? null,
    per100g: food.per100g,
    serving_grams: food.servingGrams ?? null,
    serving_description: food.servingDescription ?? null,
    liquid: food.liquid ?? false,
    created_by: userId,
  });
}

/** O usuário confere o rótulo de um alimento pendente: confirma ou aponta erro. */
export async function reportSharedFood(foodId: string, agrees: boolean): Promise<void> {
  if (!supabase) return;
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return;
  await supabase.from('food_reports').insert({ food_id: foodId, user_id: userId, agrees });
}
