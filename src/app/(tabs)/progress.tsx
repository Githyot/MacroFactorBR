import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Card, colors, Field, Muted, parseInput, styles, Title } from '../../components/ui';
import { MIN_LOGGED_DAYS, MIN_WEIGH_INS, trendWeights } from '../../domain/adaptiveTdee';
import { todayIso } from '../../domain/foods';
import { useTargets } from '../../hooks/useTargets';
import { useAppStore } from '../../store/useAppStore';

function fmt(kg: number) {
  return kg.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function TrendChart({ points }: { points: { date: string; kg: number; trend: number }[] }) {
  if (points.length < 2) return null;
  const all = points.flatMap((p) => [p.kg, p.trend]);
  const min = Math.min(...all) - 0.3;
  const max = Math.max(...all) + 0.3;
  const h = 120;
  const y = (kg: number) => h - ((kg - min) / (max - min)) * h;
  return (
    <View style={{ height: h, flexDirection: 'row', alignItems: 'stretch', gap: 2, marginVertical: 8 }}>
      {points.map((p) => (
        <View key={p.date} style={{ flex: 1, position: 'relative' }}>
          <View style={{ position: 'absolute', top: y(p.kg) - 3, left: '50%', marginLeft: -3, width: 6, height: 6, borderRadius: 3, backgroundColor: '#B7C4BD' }} />
          <View style={{ position: 'absolute', top: y(p.trend) - 2, left: 0, right: 0, height: 4, borderRadius: 2, backgroundColor: colors.primary }} />
        </View>
      ))}
    </View>
  );
}

export default function ProgressScreen() {
  const weights = useAppStore((s) => s.weights);
  const logWeight = useAppStore((s) => s.logWeight);
  const removeWeight = useAppStore((s) => s.removeWeight);
  const data = useTargets();
  const today = todayIso();
  const todayEntry = weights.find((w) => w.date === today);
  const [input, setInput] = useState(todayEntry ? fmt(todayEntry.kg) : '');

  const trend = trendWeights(weights);
  const points = weights.slice(-30).map((w) => ({ ...w, trend: trend.find((t) => t.date === w.date)!.kg }));
  const adaptive = data?.adaptive;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card>
        <Title>Pesagem de hoje</Title>
        <Muted style={{ marginBottom: 8 }}>Pese-se de manhã, em jejum, depois de ir ao banheiro. O app usa a tendência, então oscilações diárias não atrapalham.</Muted>
        <Field label="Peso" suffix="kg" keyboardType="decimal-pad" value={input} onChangeText={setInput} />
        <Button
          title={todayEntry ? 'Atualizar' : 'Registrar'}
          onPress={() => {
            const kg = parseInput(input);
            if (kg && kg > 20 && kg < 400) logWeight(today, kg);
          }}
        />
      </Card>

      <Card>
        <Title>Tendência</Title>
        {points.length < 2 ? (
          <Muted>Registre pelo menos duas pesagens para ver o gráfico.</Muted>
        ) : (
          <>
            <TrendChart points={points} />
            <Muted>Pontos: pesagens. Linha verde: peso de tendência ({fmt(points[points.length - 1].trend)} kg).</Muted>
          </>
        )}
      </Card>

      <Card>
        <Title>Gasto energético adaptativo</Title>
        {!adaptive ? (
          <Muted>Configure o perfil primeiro.</Muted>
        ) : adaptive.status === 'ok' ? (
          <>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{adaptive.tdee} kcal/dia</Text>
            <Muted>
              Média consumida {adaptive.avgIntake} kcal, peso {adaptive.weeklyChangeKg >= 0 ? 'subindo' : 'caindo'}{' '}
              {fmt(Math.abs(adaptive.weeklyChangeKg))} kg/semana. Suas metas já usam esse valor.
            </Muted>
            {data.profile.goal === 'bulk' && adaptive.weeklyChangeKg > data.profile.weightKg * 0.005 ? (
              <Text style={{ color: colors.warn, marginTop: 8 }}>
                Ganho acima de 0,5% do peso por semana: parte disso tende a ser gordura.
              </Text>
            ) : null}
          </>
        ) : (
          <Muted>
            Juntando dados: {adaptive.loggedDays}/{MIN_LOGGED_DAYS} dias com refeições registradas e {adaptive.weighIns}/{MIN_WEIGH_INS} pesagens nas últimas 4 semanas. Até lá, as metas usam a fórmula.
          </Muted>
        )}
      </Card>

      <Card>
        <Title>Histórico</Title>
        {weights.length === 0 ? <Muted>Nenhuma pesagem ainda.</Muted> : null}
        {[...weights].reverse().slice(0, 30).map((w) => (
          <View key={w.date} style={[styles.rowBetween, { paddingVertical: 4 }]}>
            <Text style={{ color: colors.text }}>{w.date.split('-').reverse().join('/')}</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Text style={styles.macroValue}>{fmt(w.kg)} kg</Text>
              <Pressable accessibilityLabel="Remover pesagem" onPress={() => removeWeight(w.date)} hitSlop={8}>
                <Text style={{ color: colors.danger }}>✕</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}
