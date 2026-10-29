// Distribuição muscular: radar dos 6 grupos no período atual × anterior,
// e o resumo do período com a variação.

import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';

import { Legend, RadarChart } from '../../components/charts';
import { PeriodPicker, StatGrid } from '../../components/training';
import { colors, Muted, styles, useTheme } from '../../components/ui';
import { todayIso } from '../../domain/foods';
import { GROUP_LABEL, groupSets, inRange, Period, periodRange, RADAR_ORDER, totals } from '../../domain/workout/stats';
import { setsPerMuscle } from '../../domain/workout/training';
import { useAllExercises, useAppStore } from '../../store/useAppStore';

export default function DistributionScreen() {
  useTheme();
  const workouts = useAppStore((s) => s.workouts);
  const exercises = useAllExercises();
  const [period, setPeriod] = useState<Period>('30d');
  const r = periodRange(period, todayIso(), workouts);

  const data = useMemo(() => {
    const now = groupSets(setsPerMuscle(workouts, exercises, r.from, r.to));
    const before = groupSets(setsPerMuscle(workouts, exercises, r.prevFrom, r.prevTo));
    return { now, before, t: totals(inRange(workouts, r.from, r.to)), tb: totals(inRange(workouts, r.prevFrom, r.prevTo)) };
  }, [workouts, exercises, r.from, r.to, r.prevFrom, r.prevTo]);

  const hasPrev = period !== 'tudo';
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PeriodPicker value={period} onChange={setPeriod} options={['30d', '3m', '1a', 'tudo']} />
      <RadarChart
        axes={RADAR_ORDER.map((g) => GROUP_LABEL[g])}
        current={RADAR_ORDER.map((g) => data.now[g])}
        previous={hasPrev ? RADAR_ORDER.map((g) => data.before[g]) : undefined}
        size={300}
      />
      <Legend
        items={[
          { color: colors.primary, label: 'Atual' },
          ...(hasPrev ? [{ color: colors.muted, label: 'Anterior' }] : []),
        ]}
      />
      <StatGrid now={data.t} before={hasPrev ? data.tb : undefined} />
      <Muted>Cada eixo soma as séries dos músculos do grupo (Braços = bíceps, tríceps e antebraço; Core = abdômen e lombar; Pernas = quadríceps, posteriores, glúteos e panturrilha).</Muted>
    </ScrollView>
  );
}
