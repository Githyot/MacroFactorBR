// Aba Plano do modo Dieta: o que se planeja e acompanha por semana (metas, check-in,
// cardápio e suplementação) num lugar só, fora da rolagem do Hoje.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { soft, WEEK_LETTERS } from '../../components/dash';
import { ListCard, ListRow, Pill, Ring, Section } from '../../components/diet';
import { SupplementChecklist } from '../../components/SupplementChecklist';
import { Button, Card, colors, Muted, styles, Title, useTheme } from '../../components/ui';
import { isCheckInDue } from '../../domain/checkin';
import { weekOf } from '../../domain/dashboard';
import { todayIso } from '../../domain/foods';
import { hasFeature } from '../../domain/pro';
import { dayTargets, GOALS } from '../../domain/targets';
import { useDay } from '../../hooks/useDay';
import { usePro } from '../../hooks/usePro';
import { useAppStore, useHydrated } from '../../store/useAppStore';

const daysBetween = (a: string, b: string) => Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86_400_000);

export default function PlanHubScreen() {
  useTheme();
  const hydrated = useHydrated();
  const today = todayIso();
  const day = useDay(today);
  const checkIns = useAppStore((s) => s.checkIns);
  const trainingDays = useAppStore((s) => s.trainingDays);
  const isPro = usePro();

  if (!hydrated) return null;
  if (!day.data) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Card>
          <Title>Seu plano</Title>
          <Muted style={{ marginBottom: 16 }}>Configure o perfil para calcular as metas, liberar o check-in semanal e gerar o cardápio.</Muted>
          <Button title="Configurar meu perfil" onPress={() => router.push('/profile')} />
        </Card>
      </ScrollView>
    );
  }

  const { targets, profile } = day.data;
  const last = checkIns[checkIns.length - 1];
  const due = isCheckInDue(last?.date, today);
  const nextIn = last ? Math.max(0, 7 - daysBetween(last.date, today)) : 0;
  const goal = GOALS[profile.goal]?.label ?? '';

  const week = weekOf(today).map((d) => ({ date: d, ...dayTargets(targets, profile, trainingDays[d] ?? false) }));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ backgroundColor: colors.card, alignItems: 'center', paddingTop: 12, paddingBottom: 22 }}>
        <Pressable onPress={() => router.push('/checkin')} accessibilityRole="button" accessibilityLabel="Abrir check-in semanal">
          <Ring value={due ? 7 : 7 - nextIn} target={7} color={due ? colors.carbs : colors.track} size={210} stroke={10}>
            <Text style={{ color: colors.text, fontSize: 34, fontWeight: '900', textTransform: 'uppercase' }}>{due ? 'Hoje' : `${nextIn} ${nextIn === 1 ? 'dia' : 'dias'}`}</Text>
            <Text style={{ color: colors.muted, fontSize: 16 }}>{due ? 'check-in disponível' : 'até o check-in'}</Text>
          </Ring>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 28, marginTop: 20 }}>
          {(
            [
              ['radio-button-on', 'Objetivo', colors.carbs, () => router.navigate('/profile')],
              ['calendar', 'Check-in', colors.text, () => router.push('/checkin')],
            ] as const
          ).map(([icon, label, color, onPress]) => (
            <Pressable key={label} onPress={onPress} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name={icon} size={24} color={color} />
              <Text style={{ color: colors.text, fontSize: 18 }}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 6 }}>Programa da semana</Text>
        <View style={styles.card}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>{goal}</Text>
          <Text style={[styles.muted, { marginBottom: 12 }]}>
            {profile.carbCycling ? 'Mais carboidrato nos dias de treino' : 'Mesmas metas todos os dias'} · {profile.proteinPerKg} g/kg de proteína
          </Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {week.map((d, i) => {
              const on = d.date === today;
              return (
                <View key={d.date} style={{ flex: 1, alignItems: 'center', gap: 4, padding: 2, borderRadius: 10, borderWidth: 2, borderColor: on ? colors.text : 'transparent' }}>
                  <Text style={{ color: on ? colors.text : colors.muted, fontWeight: on ? '800' : '500' }}>{WEEK_LETTERS[i]}</Text>
                  <View style={{ alignSelf: 'stretch', backgroundColor: soft(colors.kcal, 0.35), borderRadius: 999, paddingVertical: 4, alignItems: 'center' }}>
                    <Text numberOfLines={1} ellipsizeMode="clip" style={{ color: colors.text, fontSize: 11, letterSpacing: -0.3, fontVariant: ['tabular-nums'] }}>
                      {d.kcal}
                    </Text>
                  </View>
                  {(
                    [
                      [targets.protein, 'P', colors.protein],
                      [targets.fat, 'G', colors.fat],
                      [d.carbs, 'C', colors.carbs],
                    ] as const
                  ).map(([v, letter, color]) => (
                    <View key={letter} style={{ alignSelf: 'stretch', height: 52, borderRadius: 4, backgroundColor: soft(color, 0.45), alignItems: 'center', justifyContent: 'center' }}>
                      <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.text, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                        {Math.round(v)}
                      </Text>
                      <Text style={{ color: colors.text, fontSize: 11, opacity: 0.7 }}>{letter}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        </View>

        <Section title="Metas diárias" />
        <ListCard>
          <View style={{ flexDirection: 'row', paddingVertical: 14 }}>
            {[
              ['Calorias', `${day.day!.kcal}`, 'kcal', colors.text],
              ['Proteína', `${targets.protein}`, 'g', colors.protein],
              ['Carbo', `${day.day!.carbs}`, 'g', colors.carbs],
              ['Gordura', `${targets.fat}`, 'g', colors.fat],
            ].map(([label, value, unit, color], i) => (
              <View key={label} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i ? 1 : 0, borderLeftColor: colors.border }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color, fontVariant: ['tabular-nums'] }}>{value}</Text>
                <Text style={[styles.muted, { fontSize: 12 }]}>
                  {label} ({unit})
                </Text>
              </View>
            ))}
          </View>
          <ListRow
            icon="options-outline"
            title="Objetivo e metas"
            subtitle={`${goal} · ${profile.proteinPerKg} g/kg de proteína · ${profile.mealsPerDay} refeições`}
            onPress={() => router.navigate('/profile')}
          />
        </ListCard>

        <Section title="Semana" />
        <ListCard>
          <ListRow
            first
            icon="calendar-outline"
            iconColor={due ? colors.primary : undefined}
            title="Check-in semanal"
            subtitle={
              due
                ? 'Disponível agora: veja a semana e ajuste as metas'
                : `Próximo em ${nextIn} ${nextIn === 1 ? 'dia' : 'dias'}${last ? ` · último em ${last.date.split('-').reverse().slice(0, 2).join('/')}` : ''}`
            }
            right={due ? <Pill tone="good" text="Novo" /> : undefined}
            onPress={() => router.push('/checkin')}
          />
          <ListRow
            icon="restaurant-outline"
            title="Cardápio da semana"
            subtitle="Refeições brasileiras que batem suas metas e lista de compras"
            right={hasFeature(isPro, 'mealPlan') ? undefined : <Pill tone="neutral" icon="lock-closed" text="Pro" />}
            onPress={() => router.push('/plan')}
          />
          <ListRow
            icon="pie-chart-outline"
            title="Micronutrientes"
            subtitle="Vitaminas, minerais e fibra do dia"
            onPress={() => router.push({ pathname: '/micros', params: { date: today } })}
          />
        </ListCard>

        <Section title="Suplementação de hoje" right={<Text onPress={() => router.push('/supplements')} style={{ color: colors.primary, fontWeight: '600' }}>Gerenciar</Text>} />
        <Card>
          <SupplementChecklist date={today} warnings={day.limitWarnings} compact />
        </Card>
        {last && !due ? <Muted style={{ fontSize: 12, textAlign: 'center' }}>Último check-in: {last.message}</Muted> : null}
      </View>
    </ScrollView>
  );
}
