// Painel do modo Dieta: a semana de nutrição no topo e, embaixo, cartões que levam
// ao gráfico de cada métrica (gasto, peso, hábitos, corpo e macros do dia).

import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { CardGrid, DotGrid, fmtNum, MetricCard, MiniLine, MiniTargetBar, PillTabs, RoundButton, ScreenHeader, SectionHeader, TREND_COLOR, WeekDay, WeeklyNutrition } from '../../components/dash';
import { ListCard, ListRow } from '../../components/diet';
import { switchMode } from '../../components/ModeSwitch';
import { Button, colors, styles, useTheme } from '../../components/ui';
import { trendWeights } from '../../domain/adaptiveTdee';
import { isCheckInDue } from '../../domain/checkin';
import { dailyMacros, datesBetween, expenditureSeries, weekOf } from '../../domain/dashboard';
import { addDays, dayTotals, DiaryEntry, todayIso } from '../../domain/foods';
import { dayTargets } from '../../domain/targets';
import { useTargets } from '../../hooks/useTargets';
import { useAllFoods, useAppStore, useHydrated } from '../../store/useAppStore';

export default function DashboardScreen() {
  useTheme();
  const hydrated = useHydrated();
  const today = todayIso();
  const data = useTargets();
  const foods = useAllFoods();
  const entries = useAppStore((s) => s.entries);
  const weights = useAppStore((s) => s.weights);
  const measurements = useAppStore((s) => s.measurements);
  const trainingDays = useAppStore((s) => s.trainingDays);
  const checkIns = useAppStore((s) => s.checkIns);
  const [selected, setSelected] = useState(today);
  const [mode, setMode] = useState<'consumed' | 'remaining'>('consumed');

  const intakeByDate = useMemo(() => {
    const byDate: Record<string, DiaryEntry[]> = {};
    for (const e of entries) (byDate[e.date] ??= []).push(e);
    return Object.fromEntries(Object.entries(byDate).map(([d, list]) => [d, dayTotals(list, foods).kcal ?? 0]));
  }, [entries, foods]);

  const last7 = datesBetween(addDays(today, -6), today);
  const last30 = datesBetween(addDays(today, -29), today);
  const expenditure = useMemo(() => expenditureSeries(weights, intakeByDate, datesBetween(addDays(today, -6), today)), [weights, intakeByDate, today]);

  if (!hydrated) return null;

  const header = <ScreenHeader title="Painel" right={<RoundButton icon="options-outline" label="Metas e perfil" onPress={() => router.navigate('/profile')} />} />;

  if (!data) {
    return (
      <ScrollView style={styles.screen}>
        {header}
        <View style={{ padding: 16 }}>
          <View style={[styles.card, { gap: 12 }]}>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>Bem-vindo ao MacroFactorBR</Text>
            <Text style={[styles.muted, { fontSize: 15 }]}>
              Cadastre seu peso, altura, nível de treino e objetivo para calcular suas metas de calorias e proteína para ganho de massa magra.
            </Text>
            <Button title="Configurar meu perfil" onPress={() => router.push('/profile')} />
          </View>
        </View>
      </ScrollView>
    );
  }

  const { targets, profile, adaptive } = data;
  const week = weekOf(today);
  const macros = dailyMacros(entries, foods, week);
  const days: WeekDay[] = macros.map((m) => {
    const dt = dayTargets(targets, profile, trainingDays[m.date] ?? false);
    return { ...m, target: { kcal: dt.kcal, protein: targets.protein, fat: targets.fat, carbs: dt.carbs } };
  });
  const todayM = days.find((d) => d.date === today) ?? days[days.length - 1];

  const trend = trendWeights(weights);
  const trendLast7 = last7.map((d) => [...trend].reverse().find((t) => t.date <= d)?.kg);
  const lastTrend = trend[trend.length - 1]?.kg;
  const lastWeights = weights.slice(-7);
  const fat = measurements.filter((m) => m.bodyFatPct !== undefined).slice(-7);
  const weighed = new Set(weights.map((w) => w.date));
  const logged = new Set(entries.map((e) => e.date));
  const thisWeek = (set: Set<string>) => week.filter((d) => d <= today && set.has(d)).length;
  const lastExp = [...expenditure].reverse().find((v) => v !== undefined);
  const firstWeight = weights[0]?.date;
  const checkInDue =
    isCheckInDue(checkIns[checkIns.length - 1]?.date, today) && (adaptive.status === 'ok' || (!!firstWeight && firstWeight <= addDays(today, -7)));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ backgroundColor: colors.card, paddingBottom: 18 }}>
        {header}
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', paddingHorizontal: 16, marginTop: 10, marginBottom: 14 }}>Nutrição da semana</Text>
        <WeeklyNutrition days={days} selected={selected} onSelect={setSelected} mode={mode} />
        <View style={{ alignItems: 'center', marginTop: 14 }}>
          <PillTabs
            options={[
              { value: 'consumed', label: 'Consumido' },
              { value: 'remaining', label: 'Restante' },
            ]}
            value={mode}
            onChange={setMode}
            style={{ width: 260 }}
          />
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        {checkInDue ? (
          <ListCard style={{ marginTop: 16 }}>
            <ListRow first icon="calendar" title="Check-in semanal disponível" subtitle="Veja como foi a semana e ajuste as metas" onPress={() => router.push('/checkin')} />
          </ListCard>
        ) : null}

        <SectionHeader title="Análises" onSeeAll={() => router.push('/progress')} />
        <CardGrid>
          <MetricCard title="Gasto" subtitle="Energético, 7 dias" value={lastExp ? fmtNum(lastExp) : fmtNum(targets.tdee)} unit="kcal" onPress={() => router.push('/metric/gasto')}>
            <MiniLine values={expenditure.some((v) => v !== undefined) ? expenditure : [targets.tdee]} color={colors.protein} />
          </MetricCard>
          <MetricCard title="Tendência" subtitle="Peso, 7 dias" value={lastTrend ? fmtNum(lastTrend, 1) : '–'} unit="kg" onPress={() => router.push('/metric/tendencia')}>
            <MiniLine values={trendLast7} color={TREND_COLOR} />
          </MetricCard>
        </CardGrid>

        <SectionHeader title="Hábitos" />
        <CardGrid>
          <MetricCard title="Pesagem" subtitle="Últimos 30 dias" value={`${thisWeek(weighed)}/7`} unit="na semana" onPress={() => router.push('/habit/pesagem')}>
            <DotGrid days={last30.map((d) => weighed.has(d))} color={colors.carbs} />
          </MetricCard>
          <MetricCard title="Registro" subtitle="Últimos 30 dias" value={`${thisWeek(logged)}/7`} unit="na semana" onPress={() => router.push('/habit/registro')}>
            <DotGrid days={last30.map((d) => logged.has(d))} color={colors.kcal} />
          </MetricCard>
        </CardGrid>

        <SectionHeader title="Corpo" onSeeAll={() => router.push({ pathname: '/progress', params: { tab: 'medidas' } })} />
        <CardGrid>
          <MetricCard title="Peso na balança" subtitle="Últimas 7 pesagens" value={lastWeights.length ? fmtNum(lastWeights[lastWeights.length - 1].kg, 1) : '–'} unit="kg" onPress={() => router.push('/metric/peso')}>
            <MiniLine values={lastWeights.map((w) => w.kg)} color={colors.carbs} />
          </MetricCard>
          <MetricCard title="% de gordura" subtitle="Últimas 7 medidas" value={fat.length ? fmtNum(fat[fat.length - 1].bodyFatPct!, 1) : '–'} unit="%" onPress={() => router.push('/metric/gordura-corporal')}>
            <MiniLine values={fat.map((m) => m.bodyFatPct)} color={colors.carbs} />
          </MetricCard>
        </CardGrid>

        <SectionHeader title="Nutrição" onSeeAll={() => router.push({ pathname: '/micros', params: { date: today } })} />
        <CardGrid>
          <MetricCard title="Calorias" subtitle="Hoje" value={fmtNum(todayM.kcal)} unit="kcal" onPress={() => router.push('/metric/calorias')}>
            <MiniTargetBar value={todayM.kcal} target={todayM.target.kcal} color={colors.kcal} />
          </MetricCard>
          <MetricCard title="Proteína" subtitle="Hoje" value={fmtNum(todayM.protein, 1)} unit="g" onPress={() => router.push('/metric/proteina')}>
            <MiniTargetBar value={todayM.protein} target={todayM.target.protein} color={colors.protein} />
          </MetricCard>
          <MetricCard title="Gordura" subtitle="Hoje" value={fmtNum(todayM.fat, 1)} unit="g" onPress={() => router.push('/metric/gordura')}>
            <MiniTargetBar value={todayM.fat} target={todayM.target.fat} color={colors.fat} />
          </MetricCard>
          <MetricCard title="Carboidratos" subtitle="Hoje" value={fmtNum(todayM.carbs, 1)} unit="g" onPress={() => router.push('/metric/carboidratos')}>
            <MiniTargetBar value={todayM.carbs} target={todayM.target.carbs} color={colors.carbs} />
          </MetricCard>
        </CardGrid>

        <SectionHeader title="Mais" />
        <ListCard>
          <ListRow first icon="leaf-outline" title="Micronutrientes" subtitle="Vitaminas, minerais e fibra" onPress={() => router.push({ pathname: '/micros', params: { date: today } })} />
          <ListRow icon="body-outline" title="Progresso" subtitle="Pesagens, medidas, fotos e relatório" onPress={() => router.push('/progress')} />
          <ListRow icon="restaurant-outline" title="Cardápio da semana" subtitle="Refeições que batem suas metas" onPress={() => router.push('/plan')} />
          <ListRow icon="barbell-outline" title="Modo Treino" subtitle="Rotinas, registro e estatísticas" onPress={() => switchMode('treino')} />
        </ListCard>
      </View>
    </ScrollView>
  );
}
