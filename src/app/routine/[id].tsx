import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button, Card, colors, LinkText, Muted, parseInput, styles } from '../../components/ui';
import { RoutineExercise, workoutFromRoutine } from '../../domain/workout/training';
import { newId, useAllExercises, useAppStore } from '../../store/useAppStore';

function Small({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[styles.fieldLabel, { marginBottom: 2 }]}>{label}</Text>
      <TextInput
        defaultValue={String(value)}
        keyboardType="number-pad"
        selectTextOnFocus
        onChangeText={(t) => {
          const n = parseInput(t);
          if (n !== undefined) onChange(Math.round(n));
        }}
        style={{ width: 52, textAlign: 'center', paddingVertical: 6, borderRadius: 8, backgroundColor: '#EEF2F0', color: colors.text, fontSize: 15 }}
      />
    </View>
  );
}

export default function RoutineEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const routine = useAppStore((s) => (id ? s.routines[id] : undefined));
  const saveRoutine = useAppStore((s) => s.saveRoutine);
  const deleteRoutine = useAppStore((s) => s.deleteRoutine);
  const active = useAppStore((s) => s.activeWorkout);
  const startWorkout = useAppStore((s) => s.startWorkout);
  const workouts = useAppStore((s) => s.workouts);
  const exercises = useAllExercises();

  // "new" cria a rotina na hora para a biblioteca poder adicionar exercícios nela.
  useEffect(() => {
    if (id === 'new') {
      const r = saveRoutine({ name: 'Nova rotina', exercises: [] });
      router.replace({ pathname: '/routine/[id]', params: { id: r.id } });
    }
  }, [id, saveRoutine]);

  if (!routine) {
    return (
      <View style={styles.content}>
        <Muted>{id === 'new' ? 'Criando…' : 'Rotina não encontrada.'}</Muted>
      </View>
    );
  }

  const setEx = (i: number, patch: Partial<RoutineExercise>) =>
    saveRoutine({ ...routine, exercises: routine.exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  const move = (i: number, d: -1 | 1) => {
    const list = [...routine.exercises];
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    saveRoutine({ ...routine, exercises: list });
  };
  const totalSets = routine.exercises.reduce((s, e) => s + e.sets, 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Rotina' }} />
      <View style={styles.inputRow}>
        <TextInput
          defaultValue={routine.name}
          onChangeText={(name) => saveRoutine({ ...routine, name })}
          style={[styles.input, { fontWeight: '700', fontSize: 18 }]}
          placeholder="Nome da rotina"
        />
      </View>
      <Muted>
        {routine.exercises.length} exercícios · {totalSets} séries · ~{Math.round(totalSets * 2.5)} min
      </Muted>

      {routine.exercises.map((e, i) => (
        <Card key={`${e.exerciseId}-${i}`}>
          <View style={styles.rowBetween}>
            <Text style={{ flex: 1, color: colors.text, fontWeight: '700' }}>{exercises[e.exerciseId]?.name ?? '?'}</Text>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <Pressable onPress={() => move(i, -1)} hitSlop={6} accessibilityLabel="Subir">
                <Text style={{ color: colors.muted, fontSize: 16 }}>↑</Text>
              </Pressable>
              <Pressable onPress={() => move(i, 1)} hitSlop={6} accessibilityLabel="Descer">
                <Text style={{ color: colors.muted, fontSize: 16 }}>↓</Text>
              </Pressable>
              <Pressable onPress={() => saveRoutine({ ...routine, exercises: routine.exercises.filter((_, j) => j !== i) })} hitSlop={6} accessibilityLabel="Remover">
                <Text style={{ color: colors.danger, fontSize: 16 }}>✕</Text>
              </Pressable>
            </View>
          </View>
          <View style={[styles.row, { marginTop: 6 }]}>
            <Small label="Séries" value={e.sets} onChange={(sets) => setEx(i, { sets: Math.max(1, sets) })} />
            <Small label="Reps mín." value={e.repRange[0]} onChange={(lo) => setEx(i, { repRange: [lo, Math.max(lo, e.repRange[1])] })} />
            <Small label="Reps máx." value={e.repRange[1]} onChange={(hi) => setEx(i, { repRange: [Math.min(e.repRange[0], hi), hi] })} />
            <Small label="Descanso (s)" value={e.restSec} onChange={(restSec) => setEx(i, { restSec })} />
          </View>
        </Card>
      ))}

      <Button title="+ Adicionar exercício" variant="secondary" onPress={() => router.push({ pathname: '/training/exercises', params: { pick: 'routine', routine: routine.id } })} />
      {routine.exercises.length > 0 ? (
        <Button
          title={active ? 'Voltar ao treino em andamento' : 'Iniciar esta rotina'}
          onPress={() => {
            if (!active) startWorkout(workoutFromRoutine(routine, workouts, newId()));
            router.push('/training/active');
          }}
        />
      ) : null}
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <LinkText
          onPress={() => {
            deleteRoutine(routine.id);
            router.back();
          }}
        >
          Excluir rotina
        </LinkText>
      </View>
    </ScrollView>
  );
}
