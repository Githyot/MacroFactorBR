import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Card, colors, Field, Muted, parseInput, styles, Title, useTheme } from '../../components/ui';
import { EQUIPMENT_LABEL, MUSCLE_LABEL } from '../../domain/workout/exercises';
import { estimate1RM, isWorkingSet, personalRecords, platesPerSide, previousSets, suggestNext } from '../../domain/workout/training';
import { useAllExercises, useAppStore } from '../../store/useAppStore';

const kg = (n: number) => `${String(Math.round(n * 10) / 10).replace('.', ',')} kg`;

export default function ExerciseDetail() {
  useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercises = useAllExercises();
  const workouts = useAppStore((s) => s.workouts);
  const ex = exercises[id];
  const [plateTarget, setPlateTarget] = useState('');

  const sessions = useMemo(
    () =>
      workouts
        .map((w) => ({ w, e: w.exercises.find((x) => x.exerciseId === id) }))
        .filter((x): x is { w: typeof x.w; e: NonNullable<typeof x.e> } => Boolean(x.e))
        .map(({ w, e }) => {
          const work = e.sets.filter(isWorkingSet);
          return {
            id: w.id,
            date: w.startedAt.slice(0, 10),
            sets: work,
            best1RM: Math.max(0, ...work.map((s) => estimate1RM(s.weightKg ?? 0, s.reps ?? 0))),
          };
        }),
    [workouts, id],
  );

  if (!ex) {
    return (
      <View style={styles.content}>
        <Muted>Exercício não encontrado.</Muted>
      </View>
    );
  }

  const pr = personalRecords(workouts, id);
  const suggestion = ex.kind === 'weight_reps' ? suggestNext(ex, previousSets(workouts, id)) : undefined;
  const chart = sessions.slice(-16);
  const maxRM = Math.max(1, ...chart.map((s) => s.best1RM));
  const minRM = Math.min(...chart.map((s) => s.best1RM).filter((v) => v > 0), maxRM);
  const target = parseInput(plateTarget);
  const plates = target ? platesPerSide(target) : undefined;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: ex.name }} />
      <Card>
        <Title>{ex.name}</Title>
        <Muted>
          {MUSCLE_LABEL[ex.primary]}
          {ex.secondary.length ? ` (auxiliares: ${ex.secondary.map((m) => MUSCLE_LABEL[m]).join(', ')})` : ''} · {EQUIPMENT_LABEL[ex.equipment]}
        </Muted>
        {suggestion ? <Text style={{ color: colors.primary, marginTop: 8 }}>💡 Próximo treino: {suggestion.reason}</Text> : null}
      </Card>

      {ex.kind === 'weight_reps' ? (
        <Card>
          <Title>Recordes</Title>
          {sessions.length === 0 ? (
            <Muted>Faça o exercício num treino para registrar suas marcas.</Muted>
          ) : (
            <>
              <View style={styles.row}>
                {[
                  ['Maior carga', kg(pr.heaviestKg)],
                  ['1RM estimado', kg(pr.best1RM)],
                  ['Melhor série', `${Math.round(pr.bestSetVolume)} kg`],
                ].map(([label, value]) => (
                  <View key={label} style={{ flex: 1, minWidth: 90 }}>
                    <Muted>{label}</Muted>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{value}</Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>MELHOR CARGA POR REPETIÇÕES</Text>
              <View style={[styles.row, { gap: 6 }]}>
                {Object.entries(pr.byReps)
                  .sort((a, b) => Number(a[0]) - Number(b[0]))
                  .map(([reps, w]) => (
                    <View key={reps} style={{ backgroundColor: colors.cardAlt, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ color: colors.text, fontSize: 13 }}>
                        {reps}× {kg(w)}
                      </Text>
                    </View>
                  ))}
              </View>
            </>
          )}
        </Card>
      ) : null}

      {chart.length >= 2 ? (
        <Card>
          <Title>Evolução do 1RM estimado</Title>
          <View style={{ height: 120, flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
            {chart.map((s) => {
              // Escala a partir de um pouco abaixo do mínimo para a variação aparecer.
              const floor = minRM * 0.9;
              const h = s.best1RM > 0 ? 12 + ((s.best1RM - floor) / Math.max(1, maxRM - floor)) * 100 : 4;
              return <View key={s.id} style={{ flex: 1, height: h, borderRadius: 4, backgroundColor: s.best1RM === maxRM ? colors.primary : colors.primarySoft }} />;
            })}
          </View>
          <Muted style={{ marginTop: 6 }}>
            {kg(chart[0].best1RM)} → {kg(chart[chart.length - 1].best1RM)} em {chart.length} treinos
          </Muted>
        </Card>
      ) : null}

      {ex.equipment === 'barra' || ex.equipment === 'smith' ? (
        <Card>
          <Title>Calculadora de anilhas</Title>
          <Field label="Carga total (barra de 20 kg)" suffix="kg" keyboardType="decimal-pad" value={plateTarget} onChangeText={setPlateTarget} />
          {plates ? (
            <Text style={{ color: colors.text }}>
              {plates.plates.length ? `Em cada lado: ${plates.plates.map((p) => String(p).replace('.', ',')).join(' + ')} kg` : 'Só a barra.'}
              {plates.remainderKg ? ` (sobram ${String(plates.remainderKg).replace('.', ',')} kg sem anilha)` : ''}
            </Text>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <Title>Histórico</Title>
        {sessions.length === 0 ? <Muted>Nenhum registro ainda.</Muted> : null}
        {[...sessions]
          .reverse()
          .slice(0, 15)
          .map((s) => (
            <View key={s.id} style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{s.date.split('-').reverse().join('/')}</Text>
              <Text style={styles.muted}>
                {s.sets
                  .map((x) => (ex.kind === 'duration' ? `${Math.round((x.durationSec ?? 0) / 60)} min` : ex.kind === 'weight_reps' ? `${String(x.weightKg ?? 0).replace('.', ',')}×${x.reps}` : `${x.reps} reps`))
                  .join(' · ')}
              </Text>
            </View>
          ))}
      </Card>
    </ScrollView>
  );
}
