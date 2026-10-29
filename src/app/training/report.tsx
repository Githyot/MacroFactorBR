// Relatório mensal (como o "Monthly Report" do Hevy): treinos do mês contra os
// meses anteriores, resumo, calendário, distribuição muscular, principais
// exercícios e recordes, com botão para compartilhar.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';

import { BarChart, HBar, Legend, RadarChart } from '../../components/charts';
import { MonthCalendar } from '../../components/MonthCalendar';
import { ExerciseRow, Pills, SectionLabel, StatGrid } from '../../components/training';
import { Button, colors, Muted, styles, useTheme } from '../../components/ui';
import { todayIso } from '../../domain/foods';
import { Muscle, MUSCLE_LABEL } from '../../domain/workout/exercises';
import { fmtCompact, fmtDuration, fmtNumber, GROUP_LABEL, Metric, metricValue, monthlyReport, monthName, prevMonth, RADAR_ORDER } from '../../domain/workout/stats';
import { NewRecord } from '../../domain/workout/training';
import { useAllExercises, useAppStore } from '../../store/useAppStore';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const kg = (n: number) => `${fmtNumber(n, 2)} kg`;

function recordText(r: NewRecord): string {
  if (r.kind === 'repetições') return `Repetições: ${r.value}`;
  if (r.kind === 'volume') return `Volume numa série: ${fmtNumber(Math.round(r.value))} kg`;
  return `${r.kind === '1RM' ? '1RM' : 'Carga'}: ${kg(r.value)}`;
}

function nextMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

export default function MonthlyReportScreen() {
  useTheme();
  const params = useLocalSearchParams<{ month?: string }>();
  const workouts = useAppStore((s) => s.workouts);
  const name = useAppStore((s) => s.profile?.name);
  const exercises = useAllExercises();
  const today = todayIso();
  const month = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : prevMonth(today.slice(0, 7));
  const [metric, setMetric] = useState<Extract<Metric, 'workouts' | 'duration' | 'volume' | 'sets'>>('workouts');
  const [more, setMore] = useState({ muscles: false, top: false, records: false });
  const r = useMemo(() => monthlyReport(workouts, exercises, month), [workouts, exercises, month]);

  const title = `${cap(monthName(month))} de ${month.slice(0, 4)}`;
  const delta = r.totals.workouts - r.previous.workouts;
  const muscles = (Object.entries(r.perMuscle) as [Muscle, number][]).filter(([m]) => m !== 'cardio').sort((a, b) => b[1] - a[1]);
  const maxMuscle = muscles[0]?.[1] ?? 1;
  const byExercise = Object.entries(
    r.records.reduce<Record<string, NewRecord[]>>((acc, x) => ({ ...acc, [x.exerciseId]: [...(acc[x.exerciseId] ?? []), x] }), {}),
  ).map(([id, list]) => {
    // Fica o melhor valor de cada tipo de recorde no mês.
    const best: Record<string, NewRecord> = {};
    for (const x of list) if (!best[x.kind] || x.value > best[x.kind].value) best[x.kind] = x;
    return { id, list: Object.values(best) };
  });
  const format = (v: number) => (metric === 'duration' ? `${fmtNumber(v / 60, 0)} h` : metric === 'volume' ? fmtCompact(v) : fmtNumber(v));

  const share = () =>
    Share.share({
      message:
        `Meu ${monthName(month)} no MacroFactorBR 💪\n` +
        `${r.totals.workouts} treinos · ${fmtDuration(r.totals.durationMin)} · ${fmtNumber(Math.round(r.totals.volume))} kg · ${r.totals.sets} séries\n` +
        `${r.records.length} recordes · sequência de ${r.streakWeeks} semanas`,
    }).catch(() => {});

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: `Relatório de ${monthName(month)}` }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 }]}>
        <View style={styles.rowBetween}>
          <Pressable onPress={() => router.setParams({ month: prevMonth(month) })} hitSlop={10} accessibilityLabel="Mês anterior">
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>{title}</Text>
          <Pressable onPress={() => month < today.slice(0, 7) && router.setParams({ month: nextMonth(month) })} hitSlop={10} accessibilityLabel="Próximo mês">
            <Ionicons name="chevron-forward" size={22} color={month < today.slice(0, 7) ? colors.primary : colors.border} />
          </Pressable>
        </View>
        <Text style={{ color: colors.text, fontSize: 17 }}>
          {r.totals.workouts} {r.totals.workouts === 1 ? 'treino' : 'treinos'}{' '}
          {delta ? <Text style={{ color: delta > 0 ? colors.primary : colors.muted }}>{delta > 0 ? `↑ ${delta}` : `↓ ${-delta}`}</Text> : null}
        </Text>
        <BarChart values={r.history.map((h) => metricValue(h.totals, metric))} labels={r.history.map((h) => monthName(h.month, true).slice(0, 1).toUpperCase())} format={format} highlight={11} />
        <Pills
          options={[
            { value: 'workouts', label: 'Treinos' },
            { value: 'duration', label: 'Duração' },
            { value: 'volume', label: 'Volume' },
            { value: 'sets', label: 'Séries' },
          ]}
          value={metric}
          onChange={setMetric}
        />

        <SectionLabel>Resumo</SectionLabel>
        <StatGrid now={r.totals} before={r.previous} />

        <SectionLabel>Dias de treino</SectionLabel>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 36 }}>🔥</Text>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>
            Sequência de {r.streakWeeks} {r.streakWeeks === 1 ? 'semana' : 'semanas'}
          </Text>
        </View>
        <MonthCalendar month={month} days={new Set(r.days)} />

        <SectionLabel>Distribuição muscular</SectionLabel>
        <RadarChart axes={RADAR_ORDER.map((g) => GROUP_LABEL[g])} current={RADAR_ORDER.map((g) => r.groups[g])} previous={RADAR_ORDER.map((g) => r.previousGroups[g])} />
        <Legend
          items={[
            { color: colors.muted, label: `${cap(monthName(prevMonth(month)))}` },
            { color: colors.primary, label: cap(monthName(month)) },
          ]}
        />

        <SectionLabel right={<Text style={styles.muted}>Séries</Text>}>Principais grupos musculares</SectionLabel>
        {muscles.length === 0 ? <Muted>Sem séries neste mês.</Muted> : null}
        {(more.muscles ? muscles : muscles.slice(0, 6)).map(([m, n]) => (
          <HBar key={m} label={MUSCLE_LABEL[m]} value={n} max={maxMuscle} />
        ))}
        {muscles.length > 6 && !more.muscles ? (
          <Pressable onPress={() => setMore({ ...more, muscles: true })}>
            <Text style={[styles.muted, { textAlign: 'center' }]}>Ver mais {muscles.length - 6}</Text>
          </Pressable>
        ) : null}

        <SectionLabel>Principais exercícios</SectionLabel>
        {(more.top ? r.top : r.top.slice(0, 3)).map(({ exerciseId, times }) =>
          exercises[exerciseId] ? <ExerciseRow key={exerciseId} ex={exercises[exerciseId]} subtitle={`${times} ${times === 1 ? 'vez' : 'vezes'}`} /> : null,
        )}
        {r.top.length > 3 && !more.top ? (
          <Pressable onPress={() => setMore({ ...more, top: true })}>
            <Text style={[styles.muted, { textAlign: 'center' }]}>Ver mais {r.top.length - 3}</Text>
          </Pressable>
        ) : null}

        <SectionLabel>Recordes pessoais</SectionLabel>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 36 }}>🏅</Text>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
            {r.records.length} {r.records.length === 1 ? 'recorde novo' : 'recordes novos'}
          </Text>
        </View>
        {(more.records ? byExercise : byExercise.slice(0, 3)).map(({ id, list }) =>
          exercises[id] ? (
            <ExerciseRow
              key={id}
              ex={exercises[id]}
              subtitle={list.map((x) => `🏅 ${recordText(x)}`).join('\n')}
            />
          ) : null,
        )}
        {byExercise.length > 3 && !more.records ? (
          <Pressable onPress={() => setMore({ ...more, records: true })}>
            <Text style={[styles.muted, { textAlign: 'center' }]}>Ver mais {byExercise.length - 3}</Text>
          </Pressable>
        ) : null}

        {r.totals.workouts > 0 ? (
          <View style={[styles.card, { marginTop: 8 }]}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>Parabéns pelo mês{name ? `, ${name}` : ''}! 👏</Text>
            <Muted>Comemore suas conquistas e motive outras pessoas compartilhando sua evolução.</Muted>
          </View>
        ) : null}
      </ScrollView>
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16, maxWidth: 688, alignSelf: 'center', width: '100%' }}>
        <Button title="Compartilhar" onPress={share} />
      </View>
    </View>
  );
}
