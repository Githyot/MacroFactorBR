import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button, Card, colors, Muted, styles, Title } from '../components/ui';
import { runCheckIn } from '../domain/checkin';
import { explainCheckIn } from '../domain/coach';
import { todayIso } from '../domain/foods';
import { GOALS } from '../domain/targets';
import { useTargets } from '../hooks/useTargets';
import { ai } from '../services/ai';
import { hasBackend } from '../services/config';
import { useAppStore } from '../store/useAppStore';

const fmtG = (kg: number) => `${kg > 0 ? '+' : ''}${Math.round(kg * 1000)} g`;

export default function CheckInScreen() {
  const data = useTargets();
  const applyCheckIn = useAppStore((s) => s.applyCheckIn);
  const history = useAppStore((s) => s.checkIns);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const previousKcal = [...history].reverse().find((c) => c.kcalTarget !== undefined)?.kcalTarget;
  const result = useMemo(
    () => (data ? runCheckIn(data.profile, data.adaptive, todayIso(), data.targets.kcal, previousKcal) : undefined),
    [data, previousKcal],
  );
  if (!data || !result) {
    return (
      <View style={styles.content}>
        <Muted>Configure seu perfil primeiro.</Muted>
      </View>
    );
  }

  const askCoach = async () => {
    setAiBusy(true);
    try {
      const res = await ai.coach({
        goal: data.profile.goal,
        trainingLevel: data.profile.trainingLevel,
        weightKg: data.profile.weightKg,
        checkIn: result,
        targets: data.targets,
        recent: history.slice(-4),
      });
      setAiText(res.message);
    } catch (e) {
      setAiText(e instanceof Error ? e.message : 'Coach indisponível agora.');
    } finally {
      setAiBusy(false);
    }
  };

  const confirm = () => {
    applyCheckIn(result);
    router.back();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Check-in semanal' }} />
      <Card>
        <Title>Objetivo: {GOALS[data.profile.goal].label}</Title>
        {result.verdict !== 'insufficient' ? (
          <View style={[styles.row, { marginBottom: 10 }]}>
            <View style={{ flex: 1 }}>
              <Muted>Ritmo real</Muted>
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>{fmtG(result.weeklyChangeKg)}/sem</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Muted>Alvo</Muted>
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.primary }}>{fmtG(result.targetWeeklyChangeKg)}/sem</Text>
            </View>
          </View>
        ) : null}
        <Text style={{ color: colors.text, lineHeight: 21 }}>{explainCheckIn(result)}</Text>
        {result.dirtyBulk ? (
          <View style={[styles.warning, { marginTop: 10 }]}>
            <Text style={styles.warningText}>Ganho rápido demais: boa parte tende a ser gordura. O ajuste reduz as calorias.</Text>
          </View>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.macroLabel}>
          Meta de hoje: {data.targets.kcal} kcal · {data.targets.protein} g de proteína
        </Text>
        <Muted>
          {data.targets.tdeeSource === 'adaptive'
            ? `Calculada com o seu gasto real (${data.targets.tdee} kcal). Ela se ajusta sozinha conforme o peso responde.`
            : 'Ainda pela fórmula. Com 2 semanas de pesagens e refeições, passa a usar o seu gasto real.'}
        </Muted>
      </Card>

      <Button title="Concluir check-in" onPress={confirm} />
      {hasBackend ? <Button title={aiBusy ? 'Pensando…' : 'Pedir análise do coach (IA)'} variant="secondary" onPress={askCoach} disabled={aiBusy} /> : null}
      {aiText ? (
        <Card>
          <Title>Coach</Title>
          <Text style={{ color: colors.text, lineHeight: 21 }}>{aiText}</Text>
        </Card>
      ) : null}

      {history.length > 0 ? (
        <Card>
          <Title>Histórico</Title>
          {history
            .slice()
            .reverse()
            .slice(0, 8)
            .map((c) => (
              <View key={c.date} style={[styles.rowBetween, { paddingVertical: 4 }]}>
                <Text style={{ color: colors.text }}>{c.date.split('-').reverse().join('/')}</Text>
                <Text style={styles.macroValue}>
                  {c.verdict === 'insufficient' ? 'sem dados' : `${fmtG(c.weeklyChangeKg)}/sem`} ·{' '}
                  {c.kcalTarget ? `${c.kcalTarget} kcal` : c.adjustmentKcal === 0 ? 'manteve' : `${c.adjustmentKcal > 0 ? '+' : ''}${c.adjustmentKcal} kcal`}
                </Text>
              </View>
            ))}
        </Card>
      ) : null}
    </ScrollView>
  );
}
