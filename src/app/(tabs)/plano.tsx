// Aba Plano do modo Dieta: o que se planeja e acompanha por semana (metas, check-in,
// cardápio e suplementação) num lugar só, fora da rolagem do Hoje.

import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { ListCard, ListRow, Pill, Section } from '../../components/diet';
import { SupplementChecklist } from '../../components/SupplementChecklist';
import { Button, Card, colors, Muted, styles, Title, useTheme } from '../../components/ui';
import { isCheckInDue } from '../../domain/checkin';
import { todayIso } from '../../domain/foods';
import { hasFeature } from '../../domain/pro';
import { GOALS } from '../../domain/targets';
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
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
    </ScrollView>
  );
}
