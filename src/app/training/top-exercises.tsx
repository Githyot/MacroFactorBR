// Principais exercícios do período (quantas vezes cada um entrou num treino).

import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';

import { ExerciseRow, PeriodPicker } from '../../components/training';
import { Muted, styles, useTheme } from '../../components/ui';
import { todayIso } from '../../domain/foods';
import { Period, periodRange, topExercises } from '../../domain/workout/stats';
import { useAllExercises, useAppStore } from '../../store/useAppStore';

export default function TopExercisesScreen() {
  useTheme();
  const workouts = useAppStore((s) => s.workouts);
  const exercises = useAllExercises();
  const [period, setPeriod] = useState<Period>('30d');
  const { from, to } = periodRange(period, todayIso(), workouts);
  const list = useMemo(() => topExercises(workouts, from, to), [workouts, from, to]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PeriodPicker value={period} onChange={setPeriod} options={['30d', '3m', '1a', 'tudo']} />
      {list.length === 0 ? <Muted>Nenhum treino no período.</Muted> : null}
      {list.map(({ exerciseId, times }) => {
        const ex = exercises[exerciseId];
        return ex ? <ExerciseRow key={exerciseId} ex={ex} subtitle={`${times} ${times === 1 ? 'vez' : 'vezes'}`} /> : null;
      })}
    </ScrollView>
  );
}
