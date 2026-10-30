// Calendário de um hábito do Painel (pesagem ou registro alimentar): valor de hoje,
// sequência de dias e o mês em círculos.

import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { CircleCalendar, fmtNum, LegendCard, StatHeader } from '../../components/dash';
import { colors, styles, useTheme } from '../../components/ui';
import { streak } from '../../domain/dashboard';
import { dayTotals, todayIso } from '../../domain/foods';
import { useAllFoods, useAppStore } from '../../store/useAppStore';

export default function HabitScreen() {
  useTheme();
  const { id } = useLocalSearchParams<{ id: 'pesagem' | 'registro' }>();
  const weighIn = id === 'pesagem';
  const today = todayIso();
  const [month, setMonth] = useState(today.slice(0, 7));
  const weights = useAppStore((s) => s.weights);
  const entries = useAppStore((s) => s.entries);
  const foods = useAllFoods();

  const tracked = useMemo(() => new Set(weighIn ? weights.map((w) => w.date) : entries.map((e) => e.date)), [weighIn, weights, entries]);
  const todayValue = weighIn
    ? weights.find((w) => w.date === today)?.kg
    : tracked.has(today)
      ? dayTotals(
          entries.filter((e) => e.date === today),
          foods,
        ).kcal
      : undefined;
  const days = streak((d) => tracked.has(d), today);
  const color = weighIn ? colors.carbs : colors.kcal;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Stack.Screen options={{ title: weighIn ? 'Pesagem' : 'Registro alimentar', headerTitleAlign: 'center' }} />
      <View style={{ backgroundColor: colors.card, paddingBottom: 20, gap: 18 }}>
        <StatHeader
          items={[
            { label: 'Hoje', value: todayValue === undefined ? '–' : fmtNum(todayValue, weighIn ? 1 : 0), unit: weighIn ? 'kg' : 'kcal' },
            { label: 'Sequência', value: String(days), unit: days === 1 ? 'dia' : 'dias' },
          ]}
        />
        <CircleCalendar month={month} onMonth={setMonth} tracked={(d) => tracked.has(d)} color={color} />
      </View>
      <View style={{ padding: 16, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <LegendCard
          items={[
            { color, label: 'Registrado', shape: 'dot' },
            { color: colors.border, label: 'Sem registro', shape: 'dot' },
          ]}
        />
      </View>
    </ScrollView>
  );
}
