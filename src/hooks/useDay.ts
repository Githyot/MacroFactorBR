import { useMemo } from 'react';

import { dayTotals, DiaryEntry, MEALS, mealTotals } from '../domain/foods';
import { microStatus, microTargets } from '../domain/micros';
import { ageFromBirthDate, dayTargets } from '../domain/targets';
import { useAllFoods, useAppStore } from '../store/useAppStore';
import { useTargets } from './useTargets';

/** Tudo que a tela de um dia precisa: entradas, totais, metas do dia (treino/descanso) e micros. */
export function useDay(date: string) {
  const data = useTargets();
  const foods = useAllFoods();
  const allEntries = useAppStore((s) => s.entries);
  const trainingDays = useAppStore((s) => s.trainingDays);

  return useMemo(() => {
    const entries: DiaryEntry[] = allEntries.filter((e) => e.date === date);
    const totals = dayTotals(entries, foods);
    const byMeal = mealTotals(entries, foods);
    if (!data) return { entries, totals, byMeal, foods, data: undefined };
    const { profile, targets } = data;
    const isTrainingDay = trainingDays[date] ?? false;
    const day = dayTargets(targets, profile, isTrainingDay);
    const micros = microStatus(totals, microTargets(profile.sex, ageFromBirthDate(profile.birthDate)));
    const mealProtein = MEALS.map((m) => byMeal[m.key].protein ?? 0);
    return { entries, totals, byMeal, foods, data, day, micros, isTrainingDay, mealProtein };
  }, [allEntries, date, foods, data, trainingDays]);
}
