// Distribuição no corpo: semana a semana, mapa do corpo e séries por músculo.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { BodyMap } from '../../components/BodyMap';
import { colors, styles, useTheme } from '../../components/ui';
import { addDays, todayIso } from '../../domain/foods';
import { Muscle, MUSCLE_LABEL } from '../../domain/workout/exercises';
import { monthName, trainedDays } from '../../domain/workout/stats';
import { setsPerMuscle } from '../../domain/workout/training';
import { useAllExercises, useAppStore } from '../../store/useAppStore';

const WEEKDAY = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** Domingo da semana (o calendário do Hevy vai de domingo a sábado). */
function sunday(iso: string): string {
  return addDays(iso, -new Date(`${iso}T12:00:00`).getDay());
}

export default function BodyDistributionScreen() {
  useTheme();
  const workouts = useAppStore((s) => s.workouts);
  const exercises = useAllExercises();
  const today = todayIso();
  const [start, setStart] = useState(sunday(today));
  const end = addDays(start, 6);
  const sets = useMemo(() => setsPerMuscle(workouts, exercises, start, end), [workouts, exercises, start, end]);
  const days = useMemo(() => trainedDays(workouts), [workouts]);
  const cardio = useMemo(
    () =>
      workouts
        .filter((w) => w.startedAt.slice(0, 10) >= start && w.startedAt.slice(0, 10) <= end)
        .reduce((n, w) => n + w.exercises.filter((e) => exercises[e.exerciseId]?.primary === 'cardio').reduce((k, e) => k + e.sets.filter((s) => s.done).length, 0), 0),
    [workouts, exercises, start, end],
  );
  const total = Object.values(sets).reduce((a, b) => a + (b ?? 0), 0);
  const rows = (Object.keys(MUSCLE_LABEL) as Muscle[])
    .filter((m) => m !== 'cardio')
    .sort((a, b) => MUSCLE_LABEL[a].localeCompare(MUSCLE_LABEL[b], 'pt-BR'));
  const range = `${Number(start.slice(8))}${start.slice(5, 7) !== end.slice(5, 7) ? ` de ${monthName(start.slice(0, 7))}` : ''} – ${Number(end.slice(8))} de ${monthName(end.slice(0, 7))} de ${end.slice(0, 4)}`;
  const fmt = (n: number) => String(Math.round(n * 2) / 2).replace('.', ',');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.rowBetween}>
        <Pressable onPress={() => setStart(addDays(start, -7))} hitSlop={10} accessibilityLabel="Semana anterior">
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{range}</Text>
        <Pressable onPress={() => start < sunday(today) && setStart(addDays(start, 7))} hitSlop={10} accessibilityLabel="Próxima semana">
          <Ionicons name="chevron-forward" size={22} color={start < sunday(today) ? colors.primary : colors.border} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: 7 }, (_, i) => addDays(start, i)).map((d, i) => {
          const on = days.has(d);
          return (
            <View key={d} style={[styles.soft, { flex: 1, alignItems: 'center', paddingVertical: 8 }]}>
              <Text style={[styles.muted, { fontSize: 12 }]}>{WEEKDAY[i]}</Text>
              <View style={{ width: 30, height: 30, borderRadius: 15, marginTop: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.primary : 'transparent' }}>
                <Text style={{ color: on ? colors.onPrimary : colors.text, fontWeight: d === today ? '800' : '500' }}>{Number(d.slice(8))}</Text>
              </View>
            </View>
          );
        })}
      </View>
      <BodyMap sets={sets} height={260} />
      <View style={[styles.soft, { flexDirection: 'row', justifyContent: 'space-between', padding: 10 }]}>
        <Text style={styles.muted}>Músculo</Text>
        <Text style={styles.muted}>Séries</Text>
      </View>
      {[{ label: 'Total', n: total + cardio }, ...rows.map((m) => ({ label: MUSCLE_LABEL[m], n: sets[m] ?? 0 })), { label: 'Cardio', n: cardio }]
        .sort((a, b) => (a.label === 'Total' ? -1 : b.label === 'Total' ? 1 : a.label.localeCompare(b.label, 'pt-BR')))
        .map((r) => (
          <View key={r.label} style={[styles.rowBetween, { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 0 }]}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: r.label === 'Total' ? '700' : '400' }}>{r.label}</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontVariant: ['tabular-nums'] }}>{fmt(r.n)}</Text>
          </View>
        ))}
    </ScrollView>
  );
}
