// Calendário de treinos: dias treinados marcados, sequência de semanas e
// atalho para o relatório de cada mês.

import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { MonthCalendar } from '../../components/MonthCalendar';
import { Button, colors, Muted, styles, useTheme } from '../../components/ui';
import { todayIso } from '../../domain/foods';
import { monthName, prevMonth, trainedDays } from '../../domain/workout/stats';
import { weekStreak } from '../../domain/workout/training';
import { useAppStore } from '../../store/useAppStore';

export default function CalendarScreen() {
  useTheme();
  const workouts = useAppStore((s) => s.workouts);
  const today = todayIso();
  const days = useMemo(() => trainedDays(workouts), [workouts]);
  const streak = weekStreak(workouts, today);
  const [count, setCount] = useState(3);
  const months: string[] = [];
  for (let m = today.slice(0, 7), i = 0; i < count; i++, m = prevMonth(m)) months.push(m);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <Text style={{ fontSize: 40 }}>🔥</Text>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>
          {streak} {streak === 1 ? 'semana seguida' : 'semanas seguidas'}
        </Text>
        <Muted>Semanas com pelo menos um treino. A semana atual só quebra a sequência quando acabar.</Muted>
      </View>
      {months.map((m) => {
        const n = [...days].filter((d) => d.startsWith(m)).length;
        return (
          <View key={m} style={[styles.card, { gap: 8 }]}>
            <View style={styles.rowBetween}>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700' }}>
                {monthName(m).charAt(0).toUpperCase() + monthName(m).slice(1)} de {m.slice(0, 4)}
              </Text>
              <Text style={styles.muted}>
                {n} {n === 1 ? 'dia de treino' : 'dias de treino'}
              </Text>
            </View>
            <MonthCalendar month={m} days={days} today={today} />
            {n > 0 ? (
              <Pressable onPress={() => router.push({ pathname: '/training/report', params: { month: m } })}>
                <Text style={{ color: colors.primary, fontWeight: '600', textAlign: 'center' }}>Ver relatório do mês</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
      <Button title="Mostrar meses anteriores" variant="secondary" onPress={() => setCount(count + 3)} />
    </ScrollView>
  );
}
