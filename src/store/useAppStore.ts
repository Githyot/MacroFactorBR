// Estado do app salvo no próprio aparelho (funciona offline em Android, iOS e web).
// Com login, o mesmo estado é sincronizado com o Supabase (src/services/sync.ts).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo, useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ColorMode, ThemeId } from '../components/themes';

import { TACO_FOODS } from '../data/taco';
import { WeightEntry } from '../domain/adaptiveTdee';
import { CheckIn } from '../domain/checkin';
import { DiaryEntry, Food, Meal, todayIso } from '../domain/foods';
import { leucinePer100g } from '../domain/protein';
import { Recipe, recipeToFood } from '../domain/recipes';
import { Profile } from '../domain/targets';
import { Exercise, EXERCISES } from '../domain/workout/exercises';
import { Program } from '../domain/workout/programs';
import { Routine, Workout } from '../domain/workout/training';

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export type BodyMeasurement = {
  date: string;
  waistCm?: number;
  chestCm?: number;
  neckCm?: number;
  shouldersCm?: number;
  /** Braço e coxa: o campo sem lado é o esquerdo (compatível com registros antigos). */
  armCm?: number;
  armRightCm?: number;
  forearmCm?: number;
  thighCm?: number;
  thighRightCm?: number;
  calfCm?: number;
  hipCm?: number;
  bodyFatPct?: number;
};

export type ProgressPhoto = { id: string; date: string; uri: string; pose?: 'frente' | 'lado' | 'costas' };
export type SavedMeal = { id: string; name: string; items: { foodId: string; grams: number; note?: string }[] };
export type Price = { priceBrl: number; packageGrams: number };

export type Settings = {
  /** Data do aceite de uso de dados de saúde (LGPD). */
  consentAt?: string;
  /** Pro de teste enquanto o pagamento não está configurado. */
  proOverride?: boolean;
  /** Assinatura ativa confirmada pela loja ou pelo servidor. */
  proActive?: boolean;
  healthSync?: boolean;
  lastSyncAt?: string;
  /** Visual do app (estilo de cada sistema) e modo claro/escuro. */
  themeId?: ThemeId;
  colorMode?: ColorMode;
};

/** Dados que vão para o aparelho e para a nuvem. */
export type PersistedState = {
  profile?: Profile;
  customFoods: Record<string, Food>;
  entries: DiaryEntry[];
  weights: WeightEntry[];
  recipes: Record<string, Recipe>;
  favorites: string[];
  savedMeals: SavedMeal[];
  trainingDays: Record<string, boolean>;
  habits: Record<string, { creatine?: boolean }>;
  checkIns: CheckIn[];
  measurements: BodyMeasurement[];
  photos: ProgressPhoto[];
  prices: Record<string, Price>;
  aiUsage: Record<string, number>;
  workouts: Workout[];
  routines: Record<string, Routine>;
  customExercises: Record<string, Exercise>;
  /** Treino em andamento: salvo para não se perder se o app fechar. */
  activeWorkout?: Workout;
  settings: Settings;
  updatedAt: string;
};

type Actions = {
  saveProfile: (p: Profile) => void;
  addFood: (f: Omit<Food, 'id' | 'createdAt'>) => Food;
  updateFood: (f: Food) => void;
  deleteFood: (id: string) => void;
  addEntry: (e: { date: string; meal: Meal; foodId: string; grams: number; note?: string }) => void;
  addEntries: (list: { date: string; meal: Meal; foodId: string; grams: number; note?: string }[]) => void;
  removeEntry: (id: string) => void;
  copyMeal: (fromDate: string, toDate: string, meal: Meal) => number;
  logWeight: (date: string, kg: number) => void;
  removeWeight: (date: string) => void;
  saveRecipe: (r: Omit<Recipe, 'id' | 'createdAt'> & { id?: string }) => Recipe;
  deleteRecipe: (id: string) => void;
  toggleFavorite: (foodId: string) => void;
  saveMeal: (name: string, items: SavedMeal['items']) => void;
  deleteSavedMeal: (id: string) => void;
  setTrainingDay: (date: string, value: boolean) => void;
  setHabit: (date: string, habit: 'creatine', value: boolean) => void;
  applyCheckIn: (c: CheckIn) => void;
  saveMeasurement: (m: BodyMeasurement) => void;
  addPhoto: (p: Omit<ProgressPhoto, 'id'>) => void;
  removePhoto: (id: string) => void;
  setPrice: (foodId: string, price: Price | undefined) => void;
  countAiUse: (date: string) => void;
  updateSettings: (s: Partial<Settings>) => void;
  startWorkout: (w: Workout) => void;
  updateActiveWorkout: (fn: (w: Workout) => Workout) => void;
  finishWorkout: () => Workout | undefined;
  discardWorkout: () => void;
  deleteWorkout: (id: string) => void;
  saveRoutine: (r: Omit<Routine, 'id' | 'createdAt'> & { id?: string }) => Routine;
  deleteRoutine: (id: string) => void;
  addProgram: (p: Program) => void;
  addCustomExercise: (e: Omit<Exercise, 'id' | 'custom'>) => Exercise;
  replaceAll: (s: PersistedState) => void;
  resetAll: () => void;
};

const EMPTY: PersistedState = {
  profile: undefined,
  customFoods: {},
  entries: [],
  weights: [],
  recipes: {},
  favorites: [],
  savedMeals: [],
  trainingDays: {},
  habits: {},
  checkIns: [],
  measurements: [],
  photos: [],
  prices: {},
  aiUsage: {},
  workouts: [],
  routines: {},
  customExercises: {},
  activeWorkout: undefined,
  settings: {},
  updatedAt: new Date(0).toISOString(),
};

export const useAppStore = create<PersistedState & Actions>()(
  persist(
    (rawSet, get) => {
      // Toda alteração marca a hora, usada para resolver conflitos na sincronização.
      const set = (partial: Partial<PersistedState>) => rawSet({ ...partial, updatedAt: new Date().toISOString() });
      return {
        ...EMPTY,

        saveProfile: (profile) => set({ profile }),

        addFood: (f) => {
          const food: Food = { ...f, id: newId(), createdAt: new Date().toISOString() };
          set({ customFoods: { ...get().customFoods, [food.id]: food } });
          return food;
        },
        updateFood: (food) => set({ customFoods: { ...get().customFoods, [food.id]: food } }),
        // Alimento já usado no diário ou numa receita é arquivado, não apagado:
        // assim o histórico, o gasto adaptativo e as receitas não mudam.
        deleteFood: (id) => {
          const { customFoods, entries, recipes, savedMeals } = get();
          const inUse =
            entries.some((e) => e.foodId === id) ||
            Object.values(recipes).some((r) => r.ingredients.some((i) => i.foodId === id)) ||
            savedMeals.some((m) => m.items.some((i) => i.foodId === id));
          const favorites = get().favorites.filter((f) => f !== id);
          if (inUse && customFoods[id]) {
            set({ customFoods: { ...customFoods, [id]: { ...customFoods[id], archived: true } }, favorites });
            return;
          }
          const { [id]: _removed, ...rest } = customFoods;
          set({ customFoods: rest, favorites });
        },

        addEntry: (e) => set({ entries: [...get().entries, { ...e, id: newId() }] }),
        addEntries: (list) => set({ entries: [...get().entries, ...list.map((e) => ({ ...e, id: newId() }))] }),
        removeEntry: (id) => set({ entries: get().entries.filter((e) => e.id !== id) }),
        copyMeal: (fromDate, toDate, meal) => {
          const source = get().entries.filter((e) => e.date === fromDate && e.meal === meal);
          set({ entries: [...get().entries, ...source.map((e) => ({ ...e, id: newId(), date: toDate }))] });
          return source.length;
        },

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

        saveRecipe: (r) => {
          const recipe: Recipe = { ...r, id: r.id ?? newId(), createdAt: get().recipes[r.id ?? '']?.createdAt ?? new Date().toISOString() };
          set({ recipes: { ...get().recipes, [recipe.id]: recipe } });
          return recipe;
        },
        deleteRecipe: (id) => {
          const { recipes, entries, savedMeals } = get();
          const foodId = `recipe-${id}`;
          const inUse = entries.some((e) => e.foodId === foodId) || savedMeals.some((m) => m.items.some((i) => i.foodId === foodId));
          const favorites = get().favorites.filter((f) => f !== foodId);
          if (inUse && recipes[id]) {
            set({ recipes: { ...recipes, [id]: { ...recipes[id], archived: true } }, favorites });
            return;
          }
          const { [id]: _removed, ...rest } = recipes;
          set({ recipes: rest, favorites });
        },

        toggleFavorite: (foodId) => {
          const favs = get().favorites;
          set({ favorites: favs.includes(foodId) ? favs.filter((f) => f !== foodId) : [...favs, foodId] });
        },
        saveMeal: (name, items) => set({ savedMeals: [...get().savedMeals, { id: newId(), name, items }] }),
        deleteSavedMeal: (id) => set({ savedMeals: get().savedMeals.filter((m) => m.id !== id) }),

        setTrainingDay: (date, value) => set({ trainingDays: { ...get().trainingDays, [date]: value } }),
        setHabit: (date, habit, value) => set({ habits: { ...get().habits, [date]: { ...get().habits[date], [habit]: value } } }),

        // O check-in só registra a semana: a meta já acompanha o gasto adaptativo.
        applyCheckIn: (c) => set({ checkIns: [...get().checkIns, c] }),

        saveMeasurement: (m) => {
          const list = get().measurements.filter((x) => x.date !== m.date);
          list.push(m);
          list.sort((a, b) => a.date.localeCompare(b.date));
          const profile = get().profile;
          set({
            measurements: list,
            profile: profile && m.bodyFatPct ? { ...profile, bodyFatPct: m.bodyFatPct } : profile,
          });
        },
        addPhoto: (p) => set({ photos: [...get().photos, { ...p, id: newId() }] }),
        removePhoto: (id) => set({ photos: get().photos.filter((p) => p.id !== id) }),

        setPrice: (foodId, price) => {
          const { [foodId]: _old, ...rest } = get().prices;
          set({ prices: price ? { ...rest, [foodId]: price } : rest });
        },
        countAiUse: (date) => set({ aiUsage: { ...get().aiUsage, [date]: (get().aiUsage[date] ?? 0) + 1 } }),
        updateSettings: (s) => set({ settings: { ...get().settings, ...s } }),

        startWorkout: (w) => set({ activeWorkout: w }),
        updateActiveWorkout: (fn) => {
          const w = get().activeWorkout;
          if (w) set({ activeWorkout: fn(w) });
        },
        finishWorkout: () => {
          const w = get().activeWorkout;
          if (!w) return undefined;
          // Só ficam as séries concluídas; exercícios sem nenhuma série feita saem.
          const exercises = w.exercises
            .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) }))
            .filter((e) => e.sets.length > 0);
          const done: Workout = { ...w, exercises, endedAt: new Date().toISOString() };
          // O dia do treino vira "dia de treino" na dieta (ciclo de carboidrato).
          const day = todayIso(new Date(w.startedAt));
          set({
            workouts: [...get().workouts, done].sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
            activeWorkout: undefined,
            trainingDays: { ...get().trainingDays, [day]: true },
          });
          return done;
        },
        discardWorkout: () => set({ activeWorkout: undefined }),
        deleteWorkout: (id) => set({ workouts: get().workouts.filter((w) => w.id !== id) }),
        saveRoutine: (r) => {
          const routine: Routine = { ...r, id: r.id ?? newId(), createdAt: get().routines[r.id ?? '']?.createdAt ?? new Date().toISOString() };
          set({ routines: { ...get().routines, [routine.id]: routine } });
          return routine;
        },
        deleteRoutine: (id) => {
          const { [id]: _removed, ...rest } = get().routines;
          set({ routines: rest });
        },
        addProgram: (p) => {
          const created = new Date().toISOString();
          const add = Object.fromEntries(
            p.routines.map((r) => {
              const id = newId();
              return [id, { id, name: r.name, folder: p.name, exercises: r.exercises.map((e) => ({ ...e })), createdAt: created }];
            }),
          );
          set({ routines: { ...get().routines, ...add } });
        },
        addCustomExercise: (e) => {
          const ex: Exercise = { ...e, id: `custom-${newId()}`, custom: true };
          set({ customExercises: { ...get().customExercises, [ex.id]: ex } });
          return ex;
        },

        replaceAll: (s) => rawSet({ ...EMPTY, ...s }),
        resetAll: () => rawSet({ ...EMPTY, updatedAt: new Date().toISOString() }),
      };
    },
    {
      name: 'macrofactorbr-v1',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => pickPersisted(s),
      // v1 só tinha perfil, alimentos, diário e pesos; v2 não tinha treinos.
      migrate: (persisted) => ({ ...EMPTY, ...(persisted as Partial<PersistedState>) }),
    },
  ),
);

export function pickPersisted(s: PersistedState): PersistedState {
  return {
    profile: s.profile,
    customFoods: s.customFoods,
    entries: s.entries,
    weights: s.weights,
    recipes: s.recipes,
    favorites: s.favorites,
    savedMeals: s.savedMeals,
    trainingDays: s.trainingDays,
    habits: s.habits,
    checkIns: s.checkIns,
    measurements: s.measurements,
    photos: s.photos,
    prices: s.prices,
    aiUsage: s.aiUsage,
    workouts: s.workouts,
    routines: s.routines,
    customExercises: s.customExercises,
    activeWorkout: s.activeWorkout,
    settings: s.settings,
    updatedAt: s.updatedAt,
  };
}

const TACO_BY_ID: Record<string, Food> = Object.fromEntries(TACO_FOODS.map((f) => [f.id, f]));

/** Base completa: TACO + suplementos + alimentos cadastrados + receitas/marmitas. */
export function useAllFoods(): Record<string, Food> {
  const custom = useAppStore((s) => s.customFoods);
  const recipes = useAppStore((s) => s.recipes);
  return useMemo(() => {
    const all: Record<string, Food> = { ...TACO_BY_ID };
    for (const f of Object.values(custom)) all[f.id] = { ...f, per100g: { ...f.per100g, leucine: leucinePer100g(f) } };
    // Receitas dependem dos ingredientes já carregados acima.
    for (const r of Object.values(recipes)) {
      const food = recipeToFood(r, all);
      all[food.id] = food;
    }
    return all;
  }, [custom, recipes]);
}

export function findFoodByBarcode(foods: Record<string, Food>, barcode: string): Food | undefined {
  return Object.values(foods).find((f) => f.barcode === barcode && !f.archived);
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useAppStore.persist.onFinishHydration(cb),
    () => useAppStore.persist.hasHydrated(),
    () => false,
  );
}

const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

/** Biblioteca completa: exercícios do app + os que você criou. */
export function useAllExercises(): Record<string, Exercise> {
  const custom = useAppStore((s) => s.customExercises);
  return useMemo(() => ({ ...EXERCISE_BY_ID, ...custom }), [custom]);
}
