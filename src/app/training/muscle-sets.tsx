// Séries por grupo muscular ao longo do tempo (linhas por semana ou mês),
// com a lista de músculos para ligar e desligar no gráfico.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { LineChart } from '../../components/charts';
import { ActionSheet, PeriodPicker } from '../../components/training';
import { colors, Muted, styles, useTheme } from '../../components/ui';
import { todayIso } from '../../domain/foods';
import { Muscle, MUSCLE_LABEL } from '../../domain/workout/exercises';
import { muscleSetsSeries, Period, periodRange } from '../../domain/workout/stats';
import { setsPerMuscle, WEEKLY_SETS_RANGE } from '../../domain/workout/training';
import { useAllExercises, useAppStore } from '../../store/useAppStore';

// Cores distintas por músculo, legíveis no claro e no escuro.
const PALETTE = ['#3b82f6', '#f59e0b', '#8b5cf6', '#f97316', '#06b6d4', '#ef4444', '#22c55e', '#ec4899', '#84cc16', '#a16207', '#14b8a6', '#6366f1', '#e11d48'];
const MUSCLES = (Object.keys(MUSCLE_LABEL) as Muscle[]).filter((m) => m !== 'cardio');
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default function MuscleSetsScreen() {
  useTheme();
  const workouts = useAppStore((s) => s.workouts);
  const exercises = useAllExercises();
  const [period, setPeriod] = useState<Period>('30d');
  const [step, setStep] = useState<'week' | 'month'>('week');
  const [pickStep, setPickStep] = useState(false);
  const [hidden, setHidden] = useState<Set<Muscle>>(new Set());
  const today = todayIso();
  const { from, to } = periodRange(period, today, workouts);

  const series = useMemo(() => muscleSetsSeries(workouts, exercises, from, to, step), [workouts, exercises, from, to, step]);
  const total = useMemo(() => setsPerMuscle(workouts, exercises, from, to), [workouts, exercises, from, to]);
  const list = MUSCLES.map((m, i) => ({ m, color: PALETTE[i % PALETTE.length], n: total[m] ?? 0 })).sort((a, b) => b.n - a.n);
  const labels = series.map((s) => (step === 'week' ? `${Number(s.start.slice(8))} ${MONTHS_SHORT[Number(s.start.slice(5, 7)) - 1]}` : MONTHS_SHORT[Number(s.start.slice(5, 7)) - 1]));
  const fmtDate = (iso: string) => iso.split('-').reverse().slice(0, 2).join('/');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <PeriodPicker value={period} onChange={setPeriod} options={['30d', '3m', '1a', 'tudo']} />
        </View>
        <Pressable onPress={() => setPickStep(true)} style={[styles.soft, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}>
          <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>{step === 'week' ? 'Semana' : 'Mês'}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.text} />
        </Pressable>
      </View>

      <LineChart series={list.filter((x) => x.n > 0 && !hidden.has(x.m)).map((x) => ({ color: x.color, values: series.map((s) => s.sets[x.m] ?? 0) }))} labels={labels} />

      <View style={[styles.soft, { flexDirection: 'row', justifyContent: 'space-between', padding: 10 }]}>
        <Text style={styles.muted}>Músculo</Text>
        <Text style={styles.muted}>
          Séries: {fmtDate(from)} – {fmtDate(to)}
        </Text>
      </View>
      {list.map(({ m, color, n }) => {
        const off = hidden.has(m);
        return (
          <Pressable
            key={m}
            onPress={() => {
              const next = new Set(hidden);
              if (off) next.delete(m);
              else next.add(m);
              setHidden(next);
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}
          >
            <View style={{ width: 20, height: 20, borderRadius: 5, backgroundColor: off ? 'transparent' : color, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
              {off ? null : <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={{ color: colors.text, flex: 1, fontSize: 16 }}>{MUSCLE_LABEL[m]}</Text>
            <Text style={{ color: colors.text, fontVariant: ['tabular-nums'], fontSize: 16 }}>{String(Math.round(n * 2) / 2).replace('.', ',')}</Text>
          </Pressable>
        );
      })}
      <Muted>
        Para hipertrofia, a faixa com melhor evidência é de {WEEKLY_SETS_RANGE[0]} a {WEEKLY_SETS_RANGE[1]} séries por músculo na semana. Exercícios compostos
        contam meia série para os músculos auxiliares.
      </Muted>

      <ActionSheet
        visible={pickStep}
        onClose={() => setPickStep(false)}
        options={[
          { label: 'Semana', icon: 'calendar-outline', selected: step === 'week', onPress: () => setStep('week') },
          { label: 'Mês', icon: 'calendar-outline', selected: step === 'month', onPress: () => setStep('month') },
        ]}
      />
    </ScrollView>
  );
}
