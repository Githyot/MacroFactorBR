import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button, Card, colors, LinkText, Muted, styles, Title } from '../../components/ui';
import { PROTEIN_PER_MEAL_PER_KG } from '../../domain/targets';
import {
  completedSets,
  detectNewRecords,
  estimateKcal,
  SET_TYPE_LABEL,
  workoutDurationMin,
  workoutVolume,
} from '../../domain/workout/training';
import { useAllExercises, useAppStore } from '../../store/useAppStore';

const kgText = (n: number) => `${String(Math.round(n * 10) / 10).replace('.', ',')} kg`;

export default function WorkoutDetail() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const workouts = useAppStore((s) => s.workouts);
  const profile = useAppStore((s) => s.profile);
  const deleteWorkout = useAppStore((s) => s.deleteWorkout);
  const saveRoutine = useAppStore((s) => s.saveRoutine);
  const exercises = useAllExercises();
  const w = workouts.find((x) => x.id === id);
  const records = useMemo(() => (w ? detectNewRecords(w, workouts) : []), [w, workouts]);
  const [saved, setSaved] = useState(false);

  if (!w) {
    return (
      <View style={styles.content}>
        <Muted>Treino não encontrado.</Muted>
      </View>
    );
  }

  const minutes = workoutDurationMin(w);
  const proteinMeal = profile ? Math.round(profile.weightKg * PROTEIN_PER_MEAL_PER_KG) : undefined;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: fresh ? 'Treino concluído' : w.name }} />
      {fresh ? (
        <Card style={{ borderColor: colors.primary, borderWidth: 2 }}>
          <Title>Mandou bem! 💪</Title>
          <Text style={{ color: colors.text }}>
            {w.name} concluído. Hoje ficou marcado como dia de treino na dieta
            {profile?.carbCycling ? ', com mais carboidrato nas metas' : ''}.
          </Text>
          {proteinMeal ? (
            <Muted style={{ marginTop: 6 }}>
              Na próxima refeição, busque ~{proteinMeal} g de proteína (0,4 g/kg) para aproveitar o estímulo do treino.
            </Muted>
          ) : null}
          <View style={{ marginTop: 10 }}>
            <Button title="Registrar refeição pós-treino" onPress={() => router.replace('/foods')} />
          </View>
        </Card>
      ) : null}

      <Card>
        <View style={styles.row}>
          {[
            ['Duração', `${minutes} min`],
            ['Volume', `${Math.round(workoutVolume(w)).toLocaleString('pt-BR')} kg`],
            ['Séries', String(completedSets(w))],
          ].map(([label, value]) => (
            <View key={label} style={{ flex: 1, minWidth: 90 }}>
              <Muted>{label}</Muted>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{value}</Text>
            </View>
          ))}
        </View>
        {profile ? (
          <Muted style={{ marginTop: 8 }}>
            Gasto estimado: ~{estimateKcal(minutes, profile.weightKg)} kcal. Não é somado à meta: o gasto adaptativo já considera seus treinos.
          </Muted>
        ) : null}
        <Muted style={{ marginTop: 4 }}>{new Date(w.startedAt).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</Muted>
      </Card>

      {records.length > 0 ? (
        <Card>
          <Title>🏆 Recordes</Title>
          {records.map((r, i) => (
            <Text key={i} style={{ color: colors.text, marginBottom: 4 }}>
              {exercises[r.exerciseId]?.name}: {r.kind === 'repetições' ? `${r.value} reps` : r.kind === 'volume' ? `${Math.round(r.value)} kg numa série` : kgText(r.value)}
              {r.kind === '1RM' ? ' de 1RM estimado' : r.kind === 'carga' ? ' de carga' : ''}
              <Text style={styles.muted}>
                {' '}
                (antes {r.kind === 'repetições' ? r.previous : r.kind === 'volume' ? `${Math.round(r.previous)} kg` : kgText(r.previous)})
              </Text>
            </Text>
          ))}
        </Card>
      ) : null}

      {w.exercises.map((e, i) => {
        const ex = exercises[e.exerciseId];
        return (
          <Card key={`${e.exerciseId}-${i}`}>
            <LinkText onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: e.exerciseId } })}>{ex?.name ?? '?'}</LinkText>
            {e.sets.map((s, j) => (
              <View key={j} style={[styles.rowBetween, { paddingVertical: 2 }]}>
                <Text style={styles.muted}>{s.type === 'normal' ? `Série ${j + 1}` : SET_TYPE_LABEL[s.type]}</Text>
                <Text style={{ color: colors.text, fontVariant: ['tabular-nums'] }}>
                  {ex?.kind === 'duration'
                    ? `${Math.round((s.durationSec ?? 0) / 60)} min`
                    : ex?.kind === 'weight_reps'
                      ? `${String(s.weightKg ?? 0).replace('.', ',')} kg × ${s.reps}`
                      : `${s.reps} reps`}
                  {s.rpe ? ` @ RPE ${String(s.rpe).replace('.', ',')}` : ''}
                </Text>
              </View>
            ))}
          </Card>
        );
      })}

      {!w.routineId ? (
        <Button
          title={saved ? 'Rotina salva' : 'Salvar como rotina'}
          variant="secondary"
          disabled={saved}
          onPress={() => {
            saveRoutine({
              name: w.name,
              exercises: w.exercises.map((e) => ({
                exerciseId: e.exerciseId,
                sets: e.sets.filter((s) => s.type !== 'warmup').length || 1,
                repRange: e.repRange ?? [8, 12],
                restSec: e.restSec,
              })),
            });
            setSaved(true);
          }}
        />
      ) : null}
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <LinkText
          onPress={() => {
            deleteWorkout(w.id);
            router.back();
          }}
        >
          Excluir treino
        </LinkText>
      </View>
    </ScrollView>
  );
}
