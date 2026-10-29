// Perfil do modo Treino (layout do Hevy): total de treinos, gráfico semanal de
// duração, volume ou repetições, atalhos do painel e o histórico em cartões.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { BarChart } from '../../components/charts';
import { ActionSheet, DashButton, Pills, SectionLabel, WorkoutCard } from '../../components/training';
import { Button, colors, Muted, styles, useTheme } from '../../components/ui';
import { todayIso } from '../../domain/foods';
import { fmtCompact, fmtDuration, fmtNumber, Metric, metricValue, monthName, prevMonth, recordsCount, weeklyTotals } from '../../domain/workout/stats';
import { useAllExercises, useAppStore } from '../../store/useAppStore';

const RANGES = [
  { weeks: 13, label: 'Últimos 3 meses' },
  { weeks: 26, label: 'Últimos 6 meses' },
  { weeks: 52, label: 'Último ano' },
];

const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const dayLabel = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS_SHORT[Number(iso.slice(5, 7)) - 1]}`;

export default function AthleteProfile() {
  useTheme();
  const workouts = useAppStore((s) => s.workouts);
  const name = useAppStore((s) => s.profile?.name);
  const exercises = useAllExercises();
  const [metric, setMetric] = useState<Extract<Metric, 'duration' | 'volume' | 'reps'>>('duration');
  const [range, setRange] = useState(0);
  const [pickRange, setPickRange] = useState(false);
  const [limit, setLimit] = useState(10);
  const today = todayIso();

  const done = useMemo(() => workouts.filter((w) => w.endedAt), [workouts]);
  const weeks = useMemo(() => weeklyTotals(done, RANGES[range].weeks, today), [done, range, today]);
  const values = weeks.map((w) => metricValue(w, metric));
  const thisWeek = values[values.length - 1] ?? 0;
  const headline =
    metric === 'duration' ? fmtDuration(thisWeek) : metric === 'volume' ? `${fmtNumber(Math.round(thisWeek))} kg` : `${fmtNumber(thisWeek)} reps`;
  const format = (v: number) => (metric === 'duration' ? `${fmtNumber(v / 60, 1)} h` : metric === 'volume' ? `${fmtCompact(v)}` : fmtNumber(v));
  const lastMonth = prevMonth(today.slice(0, 7));
  const feed = [...done].reverse();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.onPrimarySoft, fontSize: 30, fontWeight: '800' }}>{(name ?? 'V').slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>{name ?? 'Você'}</Text>
          <Muted>Treinos</Muted>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>{fmtNumber(done.length)}</Text>
        </View>
        <Pressable onPress={() => router.push('/profile')} hitSlop={8} accessibilityLabel="Configurações e dados pessoais">
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={[styles.rowBetween, { marginTop: 8 }]}>
        <Text style={{ color: colors.text, fontSize: 17 }}>
          <Text style={{ fontWeight: '800' }}>{headline}</Text> esta semana
        </Text>
        <Pressable onPress={() => setPickRange(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>{RANGES[range].label}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.primary} />
        </Pressable>
      </View>
      <BarChart values={values} labels={weeks.map((w) => dayLabel(w.weekStart))} format={format} />
      <Pills
        options={[
          { value: 'duration', label: 'Duração' },
          { value: 'volume', label: 'Volume' },
          { value: 'reps', label: 'Repetições' },
        ]}
        value={metric}
        onChange={setMetric}
      />

      <SectionLabel>Painel</SectionLabel>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <DashButton icon="stats-chart-outline" label="Estatísticas" onPress={() => router.push('/training/stats')} />
        <DashButton icon="barbell-outline" label="Exercícios" onPress={() => router.push('/training/exercises')} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <DashButton icon="body-outline" label="Medidas" onPress={() => router.push({ pathname: '/progress', params: { tab: 'medidas' } })} />
        <DashButton icon="calendar-outline" label="Calendário" onPress={() => router.push('/training/calendar')} />
      </View>
      <Button title={`Relatório de ${monthName(lastMonth)}`} variant="secondary" onPress={() => router.push({ pathname: '/training/report', params: { month: lastMonth } })} />

      <SectionLabel>Treinos</SectionLabel>
      {feed.length === 0 ? <Muted>Os treinos que você terminar aparecem aqui.</Muted> : null}
      {feed.slice(0, limit).map((w) => (
        <WorkoutCard key={w.id} w={w} exercises={exercises} records={recordsCount(w, workouts)} todayIso={today} userName={name} />
      ))}
      {feed.length > limit ? <Button title="Ver mais treinos" variant="secondary" onPress={() => setLimit(limit + 10)} /> : null}

      <ActionSheet
        visible={pickRange}
        onClose={() => setPickRange(false)}
        options={RANGES.map((r, i) => ({ label: r.label, icon: 'calendar-outline', selected: i === range, onPress: () => setRange(i) }))}
      />
    </ScrollView>
  );
}
