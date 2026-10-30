// Estatísticas: mapa do corpo dos últimos 7 dias e atalhos para as análises avançadas.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ComponentProps, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { BodyMap } from '../../components/BodyMap';
import { SectionLabel } from '../../components/training';
import { colors, Muted, styles, useTheme } from '../../components/ui';
import { addDays, todayIso } from '../../domain/foods';
import { prevMonth, monthName, trainedDays } from '../../domain/workout/stats';
import { setsPerMuscle } from '../../domain/workout/training';
import { useAllExercises, useAppStore } from '../../store/useAppStore';

const WEEKDAY = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function Row({ icon, title, subtitle, href }: { icon: ComponentProps<typeof Ionicons>['name']; title: string; subtitle: string; href: Parameters<typeof router.push>[0] }) {
  return (
    <Pressable
      onPress={() => router.push(href)}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, opacity: pressed ? 0.6 : 1 })}
    >
      <Ionicons name={icon} size={24} color={colors.text} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 16 }}>{title}</Text>
        <Text style={styles.muted}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function StatsScreen() {
  useTheme();
  const workouts = useAppStore((s) => s.workouts);
  const exercises = useAllExercises();
  const today = todayIso();
  const from = addDays(today, -6);
  const sets = useMemo(() => setsPerMuscle(workouts, exercises, from, today), [workouts, exercises, from, today]);
  const days = useMemo(() => trainedDays(workouts), [workouts]);
  const lastMonth = prevMonth(today.slice(0, 7));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>Corpo nos últimos 7 dias</Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: 7 }, (_, i) => addDays(from, i)).map((d) => {
          const on = days.has(d);
          return (
            <View key={d} style={[styles.soft, { flex: 1, alignItems: 'center', paddingVertical: 8 }]}>
              <Text style={[styles.muted, { fontSize: 12 }]}>{WEEKDAY[new Date(`${d}T12:00:00`).getDay()]}</Text>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  marginTop: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? colors.primary : 'transparent',
                }}
              >
                <Text style={{ color: on ? colors.onPrimary : colors.text, fontWeight: d === today ? '800' : '500' }}>{Number(d.slice(8))}</Text>
              </View>
            </View>
          );
        })}
      </View>
      <BodyMap sets={sets} height={260} />
      {Object.keys(sets).length === 0 ? <Muted style={{ textAlign: 'center' }}>Nenhum músculo treinado nos últimos 7 dias.</Muted> : null}

      <SectionLabel>Estatísticas avançadas</SectionLabel>
      <View>
        <Row icon="analytics-outline" title="Séries por grupo muscular" subtitle="Quantas séries você fez para cada músculo" href="/training/muscle-sets" />
        <Row icon="aperture-outline" title="Distribuição muscular (gráfico)" subtitle="Compare a distribuição atual com a anterior" href="/training/distribution" />
        <Row icon="body-outline" title="Distribuição muscular (corpo)" subtitle="Mapa do corpo com os músculos trabalhados por semana" href="/training/body" />
        <Row icon="barbell-outline" title="Principais exercícios" subtitle="Os exercícios que você mais fez" href="/training/top-exercises" />
        <Row icon="calendar-outline" title="Calendário" subtitle="Dias de treino e sequência de semanas" href="/training/calendar" />
        <Row icon="document-text-outline" title="Relatório mensal" subtitle={`Resumo de ${monthName(lastMonth)} com recordes`} href={{ pathname: '/training/report', params: { month: lastMonth } }} />
      </View>
    </ScrollView>
  );
}
