// Estado do app salvo no próprio aparelho (funciona offline em Android, iOS e web).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { TACO_FOODS } from '../data/taco';
import { WeightEntry } from '../domain/adaptiveTdee';
import { DiaryEntry, Food, Meal } from '../domain/foods';
import { Profile } from '../domain/targets';

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type AppState = {
  profile?: Profile;
  customFoods: Record<string, Food>;
  entries: DiaryEntry[];
  weights: WeightEntry[];

  saveProfile: (p: Profile) => void;
  addFood: (f: Omit<Food, 'id' | 'createdAt'>) => Food;
  updateFood: (f: Food) => void;
  deleteFood: (id: string) => void;
  addEntry: (e: { date: string; meal: Meal; foodId: string; grams: number }) => void;
  removeEntry: (id: string) => void;
  logWeight: (date: string, kg: number) => void;
  removeWeight: (date: string) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: undefined,
      customFoods: {},
      entries: [],
      weights: [],

      saveProfile: (profile) => set({ profile }),

      addFood: (f) => {
        const food: Food = { ...f, id: newId(), createdAt: new Date().toISOString() };
        set({ customFoods: { ...get().customFoods, [food.id]: food } });
        return food;
      },
      updateFood: (food) => set({ customFoods: { ...get().customFoods, [food.id]: food } }),
      deleteFood: (id) => {
        const { [id]: _removed, ...rest } = get().customFoods;
        set({ customFoods: rest });
      },

      addEntry: (e) => set({ entries: [...get().entries, { ...e, id: newId() }] }),
      removeEntry: (id) => set({ entries: get().entries.filter((e) => e.id !== id) }),

      logWeight: (date, kg) => {
        const weights = get().weights.filter((w) => w.date !== date);
        weights.push({ date, kg });
        weights.sort((a, b) => a.date.localeCompare(b.date));
        const profile = get().profile;
        // A pesagem mais recente atualiza o perfil, e com ele as metas de proteína.
        const latest = weights[weights.length - 1];
        set({ weights, profile: profile && latest ? { ...profile, weightKg: latest.kg } : profile });
      },
      removeWeight: (date) => set({ weights: get().weights.filter((w) => w.date !== date) }),
    }),
    {
      name: 'macrofactorbr-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ profile, customFoods, entries, weights }) => ({ profile, customFoods, entries, weights }),
    },
  ),
);

const TACO_BY_ID: Record<string, Food> = Object.fromEntries(TACO_FOODS.map((f) => [f.id, f]));

/** Base completa: TACO + alimentos cadastrados (rótulo, código de barras ou manual). */
export function useAllFoods(): Record<string, Food> {
  const custom = useAppStore((s) => s.customFoods);
  return useMemo(() => ({ ...TACO_BY_ID, ...custom }), [custom]);
}

export function findFoodByBarcode(foods: Record<string, Food>, barcode: string): Food | undefined {
  return Object.values(foods).find((f) => f.barcode === barcode);
}

export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(useAppStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAppStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}
