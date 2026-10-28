import { Link, router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Card, colors, MacroRow, Muted, ProgressBar, styles, Title } from '../../components/ui';
import { dayTotals, entryNutrients, MEALS, mealTotals, todayIso } from '../../domain/foods';
import { DAILY_REFERENCE, formatAmount, NUTRIENT_BY_KEY, NutrientKey, UPPER_LIMIT_KEYS } from '../../domain/nutrients';
import { proteinPerMealRange } from '../../domain/targets';
import { useTargets } from '../../hooks/useTargets';
import { useAllFoods, useAppStore, useHydrated } from '../../store/useAppStore';

const MICROS: NutrientKey[] = ['fiber', 'sodium', 'calcium', 'iron', 'potassium', 'magnesium', 'zinc', 'vitaminA', 'vitaminC', 'vitaminD', 'vitaminB12'];

export default function TodayScreen() {
  const hydrated = useHydrated();
  const data = useTargets();
  const foods = useAllFoods();
  const date = todayIso();
  const allEntries = useAppStore((s) => s.entries);
  const removeEntry = useAppStore((s) => s.removeEntry);
  const entries = allEntries.filter((e) => e.date === date);

  if (!hydrated) return null;

  if (!data) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Card>
          <Title>Bem-vindo ao MacroFactorBR</Title>
          <Muted style={{ marginBottom: 16 }}>
            Cadastre seu peso, altura e objetivo para calcular suas metas de calorias e proteína para ganho de massa magra.
          </Muted>
          <Button title="Configurar meu perfil" onPress={() => router.push('/profile')} />
        </Card>
      </ScrollView>
    );
  }

  const { targets, profile } = data;
  const totals = dayTotals(entries, foods);
  const byMeal = mealTotals(entries, foods);
  const [mealMin] = proteinPerMealRange(profile.weightKg);
  const proteinLeft = Math.max(0, targets.protein - (totals.protein ?? 0));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <View style={styles.rowBetween}>
          <Title>Proteína</Title>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.protein }}>
            {Math.round(totals.protein ?? 0)}
            <Text style={{ fontSize: 16, color: colors.muted }}> / {targets.protein} g</Text>
          </Text>
        </View>
        <ProgressBar value={totals.protein ?? 0} target={targets.protein} color={colors.protein} />
        <Muted style={{ marginTop: 8 }}>
          {proteinLeft > 0
            ? `Faltam ${Math.round(proteinLeft)} g. Meta por refeição: ~${targets.proteinPerMeal} g (${profile.proteinPerKg} g/kg).`
            : 'Meta de proteína batida hoje. 💪'}
        </Muted>
      </Card>

      <Card>
        <MacroRow label="Calorias" value={totals.kcal ?? 0} target={targets.kcal} unit="kcal" color={colors.kcal} />
        <MacroRow label="Carboidratos" value={totals.carbs ?? 0} target={targets.carbs} unit="g" color={colors.carbs} />
        <MacroRow label="Gorduras" value={totals.fat ?? 0} target={targets.fat} unit="g" color={colors.fat} />
        <Muted>
          Gasto estimado: {targets.tdee} kcal ({targets.tdeeSource === 'adaptive' ? 'adaptativo, pelos seus dados' : 'fórmula, até juntar 2 semanas de dados'})
        </Muted>
      </Card>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Button title="Escanear código" onPress={() => router.push('/scan')} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Buscar alimento" variant="secondary" onPress={() => router.push('/foods')} />
        </View>
      </View>

      {MEALS.map((meal) => {
        const list = entries.filter((e) => e.meal === meal.key);
        const p = byMeal[meal.key].protein ?? 0;
        return (
          <Card key={meal.key}>
            <View style={styles.rowBetween}>
              <Title>{meal.label}</Title>
              <Link href={{ pathname: '/foods', params: { meal: meal.key } }} style={{ color: colors.primary, fontWeight: '600' }}>
                + Adicionar
              </Link>
            </View>
            {list.length === 0 ? (
              <Muted>Nada registrado.</Muted>
            ) : (
              <>
                {list.map((e) => {
                  const food = foods[e.foodId];
                  const n = entryNutrients(e, food);
                  return (
                    <View key={e.id} style={[styles.rowBetween, { paddingVertical: 6 }]}>
                      <Text style={{ flex: 1, color: colors.text }}>
                        {food?.name ?? 'Alimento removido'} · {e.grams} g
                      </Text>
                      <Text style={styles.macroValue}>
                        {Math.round(n.kcal ?? 0)} kcal · {Math.round(n.protein ?? 0)} g P
                      </Text>
                      <Pressable accessibilityLabel="Remover" onPress={() => removeEntry(e.id)} hitSlop={8} style={{ paddingLeft: 12 }}>
                        <Text style={{ color: colors.danger, fontSize: 16 }}>✕</Text>
                      </Pressable>
                    </View>
                  );
                })}
                <Muted style={{ marginTop: 4, color: p >= mealMin ? colors.primary : colors.warn }}>
                  {Math.round(p)} g de proteína{p < mealMin ? ` (abaixo de ${mealMin} g, o mínimo para estimular a síntese muscular)` : ''}
                </Muted>
              </>
            )}
          </Card>
        );
      })}

      <Card>
        <Title>Micronutrientes</Title>
        {MICROS.map((key) => {
          const info = NUTRIENT_BY_KEY[key];
          const ref = DAILY_REFERENCE[key] ?? 0;
          const value = totals[key] ?? 0;
          const isLimit = UPPER_LIMIT_KEYS.includes(key);
          const over = isLimit && value > ref;
          return (
            <View key={key} style={{ marginBottom: 10 }}>
              <View style={styles.rowBetween}>
                <Text style={{ color: colors.text }}>
                  {info.label}
                  {isLimit ? ' (limite)' : ''}
                </Text>
                <Text style={[styles.macroValue, over && { color: colors.danger }]}>
                  {formatAmount(value, info.unit)} · {ref ? Math.round((value / ref) * 100) : 0}% VD
                </Text>
              </View>
              <ProgressBar value={value} target={ref} color={over ? colors.danger : '#3B7EA1'} />
            </View>
          );
        })}
        <Muted style={{ fontSize: 12 }}>%VD com base nos valores de referência da ANVISA (IN 75/2020).</Muted>
      </Card>
    </ScrollView>
  );
}
