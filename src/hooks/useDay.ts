import { useMemo } from 'react';

import { dayTotals, DiaryEntry, MEALS, mealTotals } from '../domain/foods';
import { microCoverage, microStatus, microTargets } from '../domain/micros';
import { proteinBySource, supplementNutrients, upperLimitWarnings } from '../domain/supplements';
import { ageFromBirthDate, dayTargets } from '../domain/targets';
import { useAllFoods, useAppStore } from '../store/useAppStore';
import { useTargets } from './useTargets';

/** Tudo que a tela de um dia precisa: entradas, totais, metas do dia (treino/descanso) e micros. */
export function useDay(date: string) {
  const data = useTargets();
  const foods = useAllFoods();
  const allEntries = useAppStore((s) => s.entries);
  const trainingDays = useAppStore((s) => s.trainingDays);
  const supplements = useAppStore((s) => s.supplements);
  const supplementLog = useAppStore((s) => s.supplementLog);

  return useMemo(() => {
    const entries: DiaryEntry[] = allEntries.filter((e) => e.date === date);
    const totals = dayTotals(entries, foods);
    const byMeal = mealTotals(entries, foods);
    const proteinSplit = proteinBySource(entries, foods);
    const supp = supplementNutrients(supplements, supplementLog[date]);
    const limitWarnings = upperLimitWarnings(totals, supp);
    if (!data) return { entries, totals, byMeal, foods, data: undefined, proteinSplit, limitWarnings };
    const { profile, targets } = data;
    const isTrainingDay = trainingDays[date] ?? false;
    const day = dayTargets(targets, profile, isTrainingDay);
    const micros = microStatus(totals, microTargets(profile.sex, ageFromBirthDate(profile.birthDate)), microCoverage(entries, foods), supp);
    const mealProtein = MEALS.map((m) => byMeal[m.key].protein ?? 0);
    return { entries, totals, byMeal, foods, data, day, micros, isTrainingDay, mealProtein, proteinSplit, limitWarnings };
  }, [allEntries, date, foods, data, trainingDays, supplements, supplementLog]);
}
