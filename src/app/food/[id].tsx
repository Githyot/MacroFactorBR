import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button, Card, Chips, colors, Field, Muted, parseInput, styles, Title } from '../../components/ui';
import { Meal, MEALS, proteinPerReal, todayIso } from '../../domain/foods';
import { formatAmount, NUTRIENTS, scaleNutrients } from '../../domain/nutrients';
import { useAllFoods, useAppStore } from '../../store/useAppStore';

function defaultMeal(): Meal {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 18) return 'snack';
  if (h < 22) return 'dinner';
  return 'supper';
}

export default function FoodDetailScreen() {
  const params = useLocalSearchParams<{ id: string; meal?: Meal }>();
  const foods = useAllFoods();
  const addEntry = useAppStore((s) => s.addEntry);
  const deleteFood = useAppStore((s) => s.deleteFood);
  const food = foods[params.id];

  const [grams, setGrams] = useState(String(food?.servingGrams ?? 100));
  const [meal, setMeal] = useState<Meal>(params.meal ?? defaultMeal());
  const [price, setPrice] = useState('');
  const [packageGrams, setPackageGrams] = useState('');

  if (!food) {
    return (
      <View style={styles.content}>
        <Muted>Alimento não encontrado.</Muted>
      </View>
    );
  }

  const g = parseInput(grams) ?? 0;
  const n = scaleNutrients(food.per100g, g);
  const ppr = proteinPerReal(food.per100g, parseInput(packageGrams) ?? 0, parseInput(price) ?? 0);

  const add = () => {
    if (g <= 0) return;
    addEntry({ date: todayIso(), meal, foodId: food.id, grams: g });
    router.dismissTo('/');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: food.name }} />
      <Card>
        <Title>{food.name}</Title>
        {food.brand ? <Muted>{food.brand}</Muted> : null}
        {food.barcode ? <Muted>Código: {food.barcode}</Muted> : null}

        <View style={{ height: 12 }} />
        <Field label="Quantidade" suffix="g" keyboardType="decimal-pad" value={grams} onChangeText={setGrams} />
        {food.servingGrams ? (
          <Chips
            options={[0.5, 1, 2, 3].map((m) => ({ value: String(food.servingGrams! * m), label: `${m === 0.5 ? '½' : m}× ${food.servingDescription ?? 'porção'} (${Math.round(food.servingGrams! * m)} g)` }))}
            value={grams}
            onChange={setGrams}
          />
        ) : null}
        <Chips options={MEALS.map((m) => ({ value: m.key, label: m.label }))} value={meal} onChange={setMeal} />

        <View style={[styles.rowBetween, { marginBottom: 12 }]}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.protein }}>{Math.round(n.protein ?? 0)} g proteína</Text>
          <Text style={styles.macroValue}>{Math.round(n.kcal ?? 0)} kcal</Text>
        </View>
        <Button title="Adicionar ao diário" onPress={add} disabled={g <= 0} />
      </Card>

      <Card>
        <Title>Nesta quantidade</Title>
        {NUTRIENTS.filter((info) => food.per100g[info.key] !== undefined).map((info) => (
          <View key={info.key} style={[styles.rowBetween, { paddingVertical: 3 }]}>
            <Text style={{ color: colors.text }}>{info.label}</Text>
            <Text style={styles.macroValue}>{formatAmount(n[info.key], info.unit)}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Title>Proteína por real</Title>
        <Muted style={{ marginBottom: 8 }}>Compare custo-benefício entre marcas de whey, carnes e ovos.</Muted>
        <View style={styles.row}>
          <Field label="Preço" suffix="R$" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
          <Field label="Peso da embalagem" suffix="g" keyboardType="decimal-pad" value={packageGrams} onChangeText={setPackageGrams} />
        </View>
        {ppr > 0 ? <Text style={styles.macroLabel}>{ppr.toFixed(1).replace('.', ',')} g de proteína por R$ 1</Text> : null}
      </Card>

      {food.source !== 'taco' ? (
        <Button
          title="Excluir alimento"
          variant="danger"
          onPress={() => {
            deleteFood(food.id);
            router.back();
          }}
        />
      ) : null}
    </ScrollView>
  );
}
