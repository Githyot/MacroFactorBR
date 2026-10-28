import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button, Card, Chips, colors, Muted, ProgressBar, styles } from '../components/ui';
import { addDays, dayTotals, todayIso } from '../domain/foods';
import { microStatus, microTargets, suggestFoodsFor } from '../domain/micros';
import { formatAmount, NUTRIENT_BY_KEY, Nutrients, scaleNutrients } from '../domain/nutrients';
import { hasFeature } from '../domain/pro';
import { ageFromBirthDate } from '../domain/targets';
import { usePro } from '../hooks/usePro';
import { useAllFoods, useAppStore } from '../store/useAppStore';

export default function MicrosScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const date = params.date ?? todayIso();
  const profile = useAppStore((s) => s.profile);
  const entries = useAppStore((s) => s.entries);
  const foods = useAllFoods();
  const isPro = usePro();
  const [range, setRange] = useState<'day' | 'week'>('day');

  const status = useMemo(() => {
    if (!profile) return [];
    let totals: Nutrients;
    if (range === 'day') {
      totals = dayTotals(
        entries.filter((e) => e.date === date),
        foods,
      );
    } else {
      // Média dos dias com registro nos últimos 7 dias.
      const from = addDays(date, -6);
      const week = entries.filter((e) => e.date >= from && e.date <= date);
      const days = new Set(week.map((e) => e.date)).size || 1;
      totals = scaleNutrients(dayTotals(week, foods), 100 / days);
    }
    return microStatus(totals, microTargets(profile.sex, ageFromBirthDate(profile.birthDate)));
  }, [profile, entries, foods, date, range]);

  const foodList = useMemo(() => Object.values(foods), [foods]);
  const showSuggestions = hasFeature(isPro, 'microsFull');

  if (!profile) {
    return (
      <View style={styles.content}>
        <Muted>Configure seu perfil primeiro.</Muted>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Micronutrientes' }} />
      <Chips
        options={[
          { value: 'day', label: 'Dia' },
          { value: 'week', label: 'Média de 7 dias' },
        ]}
        value={range}
        onChange={setRange}
      />
      <Muted>
        Alvos para {profile.sex === 'male' ? 'homens' : 'mulheres'} de {ageFromBirthDate(profile.birthDate)} anos (DRIs). Valores da TACO e dos
        rótulos; alimentos sem dado do micronutriente contam como zero.
      </Muted>
      {status.map((m) => {
        const info = NUTRIENT_BY_KEY[m.key];
        const lacking = m.kind === 'min' && !m.ok;
        const suggestions = lacking && showSuggestions ? suggestFoodsFor(m.key, foodList, 3) : [];
        return (
          <Card key={m.key}>
            <View style={styles.rowBetween}>
              <Text style={styles.macroLabel}>{info.label}</Text>
              <Text style={[styles.macroValue, !m.ok && { color: m.kind === 'max' ? colors.danger : colors.warn }]}>
                {formatAmount(m.value, info.unit)} / {m.kind === 'max' ? 'máx. ' : ''}
                {formatAmount(m.target, info.unit)}
              </Text>
            </View>
            <ProgressBar value={m.value} target={m.target} color={m.kind === 'max' ? (m.ok ? colors.muted : colors.danger) : m.ok ? colors.primary : colors.carbs} />
            {suggestions.length > 0 ? (
              <View style={{ marginTop: 8 }}>
                <Muted>Boas fontes:</Muted>
                {suggestions.map((s) => (
                  <Text
                    key={s.food.id}
                    style={{ color: colors.primary, marginTop: 2 }}
                    onPress={() => router.push({ pathname: '/food/[id]', params: { id: s.food.id, date } })}
                  >
                    • {s.food.name}: {formatAmount(s.amount, info.unit)} em {s.portionLabel} ({Math.round(s.kcal)} kcal)
                  </Text>
                ))}
              </View>
            ) : null}
          </Card>
        );
      })}
      {!showSuggestions ? <Button title="Ver sugestões de alimentos (Pro)" variant="secondary" onPress={() => router.push('/pro')} /> : null}
    </ScrollView>
  );
}
