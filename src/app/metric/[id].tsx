// Tela de uma métrica do Painel: média e diferença no período, gráfico grande,
// escolha do período (1S a Tudo), legenda e uma explicação curta.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ComponentProps, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { fmtNum, fmtRange, InfoCard, LegendCard, PillTabs, StatHeader, TREND_COLOR, TrendChart } from '../../components/dash';
import { colors, styles, useTheme } from '../../components/ui';
import { trendWeights } from '../../domain/adaptiveTdee';
import { average, bucket, dailyMacros, difference, expenditureSeries, Range, RANGES, rangeDates } from '../../domain/dashboard';
import { dayTotals, DiaryEntry, todayIso } from '../../domain/foods';
import { dayTargets } from '../../domain/targets';
import { useTargets } from '../../hooks/useTargets';
import { useAllFoods, useAppStore } from '../../store/useAppStore';

type MetricId = 'calorias' | 'proteina' | 'gordura' | 'carboidratos' | 'peso' | 'tendencia' | 'gasto' | 'gordura-corporal';
type IconName = ComponentProps<typeof Ionicons>['name'];

type Def = {
  title: string;
  unit: string;
  kind: 'bar' | 'line';
  decimals: number;
  color: () => string;
  info: { icon: IconName; title: string; text: string };
  legend: string;
};

const DEFS: Record<MetricId, Def> = {
  calorias: {
    title: 'Calorias',
    unit: 'kcal',
    kind: 'bar',
    decimals: 0,
    color: () => colors.kcal,
    legend: 'Consumo',
    info: { icon: 'flame-outline', title: 'Sobre as calorias', text: 'Calorias medem a energia que o corpo tira da comida. Para ganhar massa magra, fique perto da meta todos os dias: o app ajusta a meta conforme seu peso de tendência muda.' },
  },
  proteina: {
    title: 'Proteína',
    unit: 'g',
    kind: 'bar',
    decimals: 0,
    color: () => colors.protein,
    legend: 'Consumo',
    info: { icon: 'barbell-outline', title: 'Proteína e hipertrofia', text: 'A proteína dá a matéria-prima para construir músculo. Bater a meta todo dia, dividida em 4 ou 5 refeições, importa mais do que acertar um dia perfeito.' },
  },
  gordura: {
    title: 'Gordura',
    unit: 'g',
    kind: 'bar',
    decimals: 0,
    color: () => colors.fat,
    legend: 'Consumo',
    info: { icon: 'water-outline', title: 'Sobre a gordura', text: 'A gordura da dieta participa da produção de hormônios e da absorção de vitaminas. A meta nunca fica abaixo de 0,6 g por kg de peso.' },
  },
  carboidratos: {
    title: 'Carboidratos',
    unit: 'g',
    kind: 'bar',
    decimals: 0,
    color: () => colors.carbs,
    legend: 'Consumo',
    info: { icon: 'nutrition-outline', title: 'Sobre os carboidratos', text: 'Carboidrato é o combustível do treino pesado. Ele completa as calorias depois que proteína e gordura estão garantidas.' },
  },
  peso: {
    title: 'Peso na balança',
    unit: 'kg',
    kind: 'line',
    decimals: 1,
    color: () => colors.carbs,
    legend: 'Peso na balança',
    info: { icon: 'scale-outline', title: 'Peso na balança', text: 'Pese-se de manhã, em jejum e depois do banheiro. Aqui você vê as pesagens ao longo do tempo; para registrar ou corrigir uma, toque em +.' },
  },
  tendencia: {
    title: 'Tendência de peso',
    unit: 'kg',
    kind: 'line',
    decimals: 1,
    color: () => TREND_COLOR,
    legend: 'Pesagens',
    info: { icon: 'bulb-outline', title: 'O que é a tendência?', text: 'O peso da balança oscila com água, sal e intestino. A tendência suaviza esse ruído e mostra para onde seu peso está indo de verdade.' },
  },
  gasto: {
    title: 'Gasto energético',
    unit: 'kcal',
    kind: 'line',
    decimals: 0,
    color: () => colors.protein,
    legend: 'Gasto estimado',
    info: { icon: 'key-outline', title: 'A base das suas metas', text: 'O gasto é estimado pelo que você comeu e por como sua tendência de peso mudou. Ele aparece depois de 10 dias registrados e 5 pesagens, e as metas passam a usar esse valor.' },
  },
  'gordura-corporal': {
    title: '% de gordura',
    unit: '%',
    kind: 'line',
    decimals: 1,
    color: () => colors.carbs,
    legend: '% de gordura',
    info: { icon: 'body-outline', title: 'Acompanhando o progresso', text: 'Fotos e medidas mostram mudanças que a balança não vê. Registre o % de gordura em Progresso › Medidas, sempre do mesmo jeito.' },
  },
};

export default function MetricScreen() {
  useTheme();
  const { id } = useLocalSearchParams<{ id: MetricId }>();
  const def = DEFS[id] ?? DEFS.calorias;
  const today = todayIso();
  const [range, setRange] = useState<Range>('1S');
  const data = useTargets();
  const foods = useAllFoods();
  const entries = useAppStore((s) => s.entries);
  const weights = useAppStore((s) => s.weights);
  const measurements = useAppStore((s) => s.measurements);
  const trainingDays = useAppStore((s) => s.trainingDays);

  const first = [entries[0]?.date, weights[0]?.date, measurements[0]?.date].filter(Boolean).sort()[0];
  const dates = useMemo(() => rangeDates(range, today, first), [range, today, first]);

  const series = useMemo(() => {
    const macroKey = ({ calorias: 'kcal', proteina: 'protein', gordura: 'fat', carboidratos: 'carbs' } as const)[id as 'calorias'];
    if (macroKey) {
      const days = dailyMacros(entries, foods, dates);
      const values = days.map((d) => (d.logged ? d[macroKey] : undefined));
      const target = data
        ? dates.map((d) => {
            const dt = dayTargets(data.targets, data.profile, trainingDays[d] ?? false);
            return { kcal: dt.kcal, protein: data.targets.protein, fat: data.targets.fat, carbs: dt.carbs }[macroKey];
          })
        : undefined;
      return { values, target };
    }
    if (id === 'peso' || id === 'tendencia') {
      const byDate = Object.fromEntries(weights.map((w) => [w.date, w.kg]));
      const values = dates.map((d) => byDate[d]);
      if (id === 'peso') return { values };
      const trend = trendWeights(weights);
      const line = dates.map((d) => [...trend].reverse().find((t) => t.date <= d)?.kg);
      return { values, line };
    }
    if (id === 'gasto') {
      const byDate: Record<string, DiaryEntry[]> = {};
      for (const e of entries) (byDate[e.date] ??= []).push(e);
      const intake = Object.fromEntries(Object.entries(byDate).map(([d, list]) => [d, dayTotals(list, foods).kcal ?? 0]));
      return { values: expenditureSeries(weights, intake, dates) };
    }
    const byDate = Object.fromEntries(measurements.filter((m) => m.bodyFatPct !== undefined).map((m) => [m.date, m.bodyFatPct!]));
    return { values: dates.map((d) => byDate[d]) };
  }, [id, dates, entries, foods, weights, measurements, data, trainingDays]);

  // Períodos longos viram médias semanais para as barras não ficarem finas demais.
  const size = dates.length > 120 ? 7 : 1;
  const chart = bucket(dates, series.values, size);
  const chartLine = series.line ? bucket(dates, series.line, size).values : undefined;
  const chartTarget = series.target ? bucket(dates, series.target, size).values : undefined;
  const headline = id === 'tendencia' ? series.line! : series.values;
  const avg = average(headline);
  const diff = difference(headline);
  const fmt = (v: number | undefined) => (v === undefined ? '–' : fmtNum(v, def.decimals));
  const signed = (v: number | undefined) => (v === undefined ? '–' : `${v > 0 ? '+' : ''}${fmtNum(v, def.decimals)}`);
  const showDiff = def.kind === 'line';
  const color = def.color();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Stack.Screen
        options={{
          title: def.title,
          headerTitleAlign: 'center',
          headerRight:
            id === 'peso' || id === 'gordura-corporal'
              ? () => (
                  <Pressable
                    onPress={() => router.push({ pathname: '/progress', params: id === 'peso' ? {} : { tab: 'medidas' } })}
                    hitSlop={10}
                    accessibilityLabel="Registrar"
                    style={{ paddingHorizontal: 12 }}
                  >
                    <Ionicons name="add" size={28} color={colors.text} />
                  </Pressable>
                )
              : undefined,
        }}
      />
      <View style={{ backgroundColor: colors.card, paddingBottom: 18 }}>
        <StatHeader
          items={[{ label: 'Média', value: fmt(avg), unit: def.unit }, ...(showDiff ? [{ label: 'Diferença', value: signed(diff), unit: def.unit }] : [])]}
          range={fmtRange(dates[0], dates[dates.length - 1])}
        />
        <View style={{ marginTop: 16 }}>
          {chart.values.some((v) => v !== undefined) ? (
            <TrendChart
              dates={chart.dates}
              values={chart.values}
              line={chartLine ? { values: chartLine, color } : undefined}
              target={chartTarget}
              color={color}
              kind={def.kind}
              format={(v) => fmtNum(v)}
            />
          ) : (
            <View style={{ height: 300, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
              <Ionicons name="analytics-outline" size={36} color={colors.muted} />
              <Text style={[styles.muted, { textAlign: 'center', marginTop: 8, fontSize: 15 }]}>
                {id === 'gasto' ? 'O gasto aparece depois de 10 dias registrados e 5 pesagens.' : 'Nada registrado neste período ainda.'}
              </Text>
            </View>
          )}
        </View>
        <PillTabs options={RANGES.map((r) => ({ value: r.value, label: r.label }))} value={range} onChange={setRange} style={{ marginHorizontal: 16, marginTop: 14 }} />
      </View>
      <View style={{ padding: 16, gap: 16, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <LegendCard
          items={[
            { color, label: def.legend, shape: def.kind === 'bar' ? 'bar' : 'dot' },
            ...(series.target ? [{ color: colors.muted, label: 'Meta', shape: 'line' as const }] : []),
            ...(series.line ? [{ color, label: 'Tendência', shape: 'line' as const }] : []),
          ]}
        />
        <InfoCard icon={def.info.icon} title={def.info.title} text={def.info.text} color={color} />
        {size > 1 ? <Text style={[styles.muted, { textAlign: 'center', fontSize: 13 }]}>Em períodos longos, cada ponto é a média da semana.</Text> : null}
      </View>
    </ScrollView>
  );
}
