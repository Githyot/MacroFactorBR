// Início do modo Treino: feed com o resumo de cada treino, como no Hevy.

import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { WorkoutCard } from '../../components/training';
import { Button, Card, colors, Muted, styles, Title, useTheme } from '../../components/ui';
import { todayIso } from '../../domain/foods';
import { fmtDuration, fmtNumber, recordsCount, totals, inRange, weekStart } from '../../domain/workout/stats';
import { completedSets, weekStreak, workoutDurationMin } from '../../domain/workout/training';
import { newId, useAllExercises, useAppStore } from '../../store/useAppStore';

const PAGE = 15;

export default function TrainingHome() {
  useTheme();
  const workouts = useAppStore((s) => s.workouts);
  const active = useAppStore((s) => s.activeWorkout);
  const name = useAppStore((s) => s.profile?.name);
  const startWorkout = useAppStore((s) => s.startWorkout);
  const exercises = useAllExercises();
  const [limit, setLimit] = useState(PAGE);
  const today = todayIso();

  const feed = useMemo(() => [...workouts].filter((w) => w.endedAt).reverse(), [workouts]);
  const week = totals(inRange(workouts, weekStart(today), today));
  const streak = weekStreak(workouts, today);

  const header = (
    <View style={{ gap: 12, marginBottom: 12 }}>
      {active ? (
        <Card style={{ borderColor: colors.primary, borderWidth: 2 }}>
          <Title>Treino em andamento</Title>
          <Muted style={{ marginBottom: 10 }}>
            {active.name} · {workoutDurationMin(active)} min · {completedSets(active)} séries feitas
          </Muted>
          <Button title="Voltar ao treino" onPress={() => router.push('/training/active')} />
        </Card>
      ) : null}
      <Card>
        <View style={styles.row}>
          {[
            ['Esta semana', `${week.workouts} ${week.workouts === 1 ? 'treino' : 'treinos'}`],
            ['Tempo', fmtDuration(week.durationMin)],
            ['Sequência', `🔥 ${streak} ${streak === 1 ? 'semana' : 'semanas'}`],
          ].map(([label, value]) => (
            <View key={label} style={{ flex: 1, minWidth: 90 }}>
              <Muted>{label}</Muted>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{value}</Text>
            </View>
          ))}
        </View>
      </Card>
      {feed.length === 0 ? (
        <Card>
          <Title>Seu feed de treinos</Title>
          <Muted style={{ marginBottom: 12 }}>Cada treino que você terminar aparece aqui com tempo, volume, recordes e exercícios.</Muted>
          <Button
            title="Começar treino"
            onPress={() => {
              if (!active) startWorkout({ id: newId(), name: 'Treino livre', startedAt: new Date().toISOString(), exercises: [] });
              router.push('/training/active');
            }}
          />
        </Card>
      ) : null}
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={[styles.content, { gap: 12 }]}
      data={feed.slice(0, limit)}
      keyExtractor={(w) => w.id}
      ListHeaderComponent={header}
      onEndReached={() => setLimit((l) => (l < feed.length ? l + PAGE : l))}
      renderItem={({ item }) => <WorkoutCard w={item} exercises={exercises} records={recordsCount(item, workouts)} todayIso={today} userName={name} />}
      ListFooterComponent={feed.length > 0 ? <Muted style={{ textAlign: 'center', marginTop: 8 }}>{fmtNumber(feed.length)} treinos no total</Muted> : undefined}
    />
  );
}
