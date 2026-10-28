import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Card, colors, LinkText, Muted, ProgressBar, styles, Title } from '../../components/ui';
import { addDays, todayIso } from '../../domain/foods';
import { Muscle, MUSCLE_LABEL } from '../../domain/workout/exercises';
import { PROGRAMS } from '../../domain/workout/programs';
import {
  completedSets,
  setsPerMuscle,
  weekStreak,
  WEEKLY_SETS_RANGE,
  workoutDurationMin,
  workoutFromRoutine,
  workoutVolume,
} from '../../domain/workout/training';
import { newId, useAllExercises, useAppStore } from '../../store/useAppStore';

const LEVEL_LABEL = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' };
const fmtKg = (kg: number) => Math.round(kg).toLocaleString('pt-BR');

export default function WorkoutTab() {
  const active = useAppStore((s) => s.activeWorkout);
  const workouts = useAppStore((s) => s.workouts);
  const routines = useAppStore((s) => s.routines);
  const startWorkout = useAppStore((s) => s.startWorkout);
  const addProgram = useAppStore((s) => s.addProgram);
  const exercises = useAllExercises();
  const [showPrograms, setShowPrograms] = useState(false);

  const today = todayIso();
  const weekFrom = addDays(today, -6);
  const perMuscle = useMemo(() => setsPerMuscle(workouts, exercises, weekFrom, today), [workouts, exercises, weekFrom, today]);
  const thisWeek = workouts.filter((w) => w.startedAt.slice(0, 10) >= weekFrom);
  const streak = weekStreak(workouts, today);
  const routineList = Object.values(routines).sort((a, b) => (a.folder ?? '').localeCompare(b.folder ?? '') || a.createdAt.localeCompare(b.createdAt));
  const folders = [...new Set(routineList.map((r) => r.folder ?? 'Minhas rotinas'))];

  const startEmpty = () => {
    if (!active) startWorkout({ id: newId(), name: 'Treino livre', startedAt: new Date().toISOString(), exercises: [] });
    router.push('/training/active');
  };
  const startRoutine = (id: string) => {
    if (!active) startWorkout(workoutFromRoutine(routines[id], workouts, newId()));
    router.push('/training/active');
  };

  const muscles = (Object.keys(MUSCLE_LABEL) as Muscle[]).filter((m) => m !== 'cardio' && m !== 'antebraco' && m !== 'lombar');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {active ? (
        <Card style={{ borderColor: colors.primary, borderWidth: 2 }}>
          <Title>Treino em andamento</Title>
          <Muted style={{ marginBottom: 10 }}>
            {active.name} · {workoutDurationMin(active)} min · {completedSets(active)} séries feitas
          </Muted>
          <Button title="Voltar ao treino" onPress={() => router.push('/training/active')} />
        </Card>
      ) : (
        <Button title="Começar treino livre" onPress={startEmpty} />
      )}

      <Card>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Muted>Treinos em 7 dias</Muted>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{thisWeek.length}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Muted>Sequência</Muted>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>
              {streak} {streak === 1 ? 'semana' : 'semanas'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Muted>Volume em 7 dias</Muted>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{fmtKg(thisWeek.reduce((s, w) => s + workoutVolume(w), 0))} kg</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Title>Séries por músculo (7 dias)</Title>
        <Muted style={{ marginBottom: 8 }}>
          Para hipertrofia, a faixa com melhor evidência é de {WEEKLY_SETS_RANGE[0]} a {WEEKLY_SETS_RANGE[1]} séries por músculo na semana. Exercícios
          compostos contam meia série para os músculos auxiliares.
        </Muted>
        {muscles.map((m) => {
          const n = perMuscle[m] ?? 0;
          const color = n >= WEEKLY_SETS_RANGE[0] ? (n > WEEKLY_SETS_RANGE[1] ? colors.carbs : colors.primary) : colors.muted;
          return (
            <View key={m} style={{ marginBottom: 6 }}>
              <View style={styles.rowBetween}>
                <Text style={{ color: colors.text }}>{MUSCLE_LABEL[m]}</Text>
                <Text style={styles.macroValue}>{String(Math.round(n * 2) / 2).replace('.', ',')}</Text>
              </View>
              <ProgressBar value={n} target={WEEKLY_SETS_RANGE[1]} color={color} />
            </View>
          );
        })}
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <Title>Rotinas</Title>
          <LinkText onPress={() => router.push({ pathname: '/routine/[id]', params: { id: 'new' } })}>+ Nova</LinkText>
        </View>
        {routineList.length === 0 ? <Muted style={{ marginBottom: 8 }}>Crie uma rotina ou adicione um programa pronto abaixo.</Muted> : null}
        {folders.map((folder) => (
          <View key={folder} style={{ marginBottom: 8 }}>
            <Text style={[styles.fieldLabel, { marginTop: 4 }]}>{folder}</Text>
            {routineList
              .filter((r) => (r.folder ?? 'Minhas rotinas') === folder)
              .map((r) => (
                <View key={r.id} style={[styles.rowBetween, { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <Pressable style={{ flex: 1 }} onPress={() => router.push({ pathname: '/routine/[id]', params: { id: r.id } })}>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>{r.name}</Text>
                    <Text style={styles.muted} numberOfLines={1}>
                      {r.exercises.map((e) => exercises[e.exerciseId]?.name ?? '?').join(', ')}
                    </Text>
                  </Pressable>
                  <LinkText onPress={() => startRoutine(r.id)}>Iniciar</LinkText>
                </View>
              ))}
          </View>
        ))}
        <LinkText onPress={() => setShowPrograms(!showPrograms)}>{showPrograms ? 'Esconder programas prontos' : 'Ver programas prontos'}</LinkText>
        {showPrograms
          ? PROGRAMS.map((p) => (
              <View key={p.id} style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>
                  {p.name} · {p.daysPerWeek}x/semana · {LEVEL_LABEL[p.level]}
                </Text>
                <Muted style={{ marginBottom: 6 }}>{p.description}</Muted>
                <LinkText
                  onPress={() => {
                    addProgram(p);
                    setShowPrograms(false);
                  }}
                >
                  Adicionar {p.routines.length} rotinas
                </LinkText>
              </View>
            ))
          : null}
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <Title>Histórico</Title>
          <LinkText onPress={() => router.push('/training/exercises')}>Exercícios</LinkText>
        </View>
        {workouts.length === 0 ? <Muted>Nenhum treino ainda.</Muted> : null}
        {[...workouts]
          .reverse()
          .slice(0, 20)
          .map((w) => (
            <Pressable
              key={w.id}
              onPress={() => router.push({ pathname: '/training/[id]', params: { id: w.id } })}
              style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              <View style={styles.rowBetween}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{w.name}</Text>
                <Text style={styles.macroValue}>{new Date(w.startedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</Text>
              </View>
              <Text style={styles.muted}>
                {workoutDurationMin(w)} min · {completedSets(w)} séries · {fmtKg(workoutVolume(w))} kg
              </Text>
            </Pressable>
          ))}
      </Card>
    </ScrollView>
  );
}
