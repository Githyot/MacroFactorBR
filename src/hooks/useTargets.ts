import { useMemo } from 'react';

import { estimateAdaptiveTdee } from '../domain/adaptiveTdee';
import { dayTotals, todayIso } from '../domain/foods';
import { computeTargets } from '../domain/targets';
import { useAllFoods, useAppStore } from '../store/useAppStore';

/** Metas do dia: usa o gasto adaptativo quando já há dados suficientes, senão a fórmula. */
export function useTargets() {
  const profile = useAppStore((s) => s.profile);
  const entries = useAppStore((s) => s.entries);
  const weights = useAppStore((s) => s.weights);
  const foods = useAllFoods();

  return useMemo(() => {
    if (!profile) return undefined;
    const byDate: Record<string, typeof entries> = {};
    for (const e of entries) (byDate[e.date] ??= []).push(e);
    const intakeByDate = Object.fromEntries(
      Object.entries(byDate).map(([date, list]) => [date, dayTotals(list, foods).kcal ?? 0]),
    );
    const adaptive = estimateAdaptiveTdee(weights, intakeByDate, todayIso());
    const targets = computeTargets(profile, adaptive.status === 'ok' ? adaptive.tdee : undefined);
    return { targets, adaptive, profile };
  }, [profile, entries, weights, foods]);
}
