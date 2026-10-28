import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button, Card, Chips, colors, LinkText, Muted, styles, Title } from '../../components/ui';
import { addDays, MEALS, todayIso } from '../../domain/foods';
import { generateDay, shoppingList } from '../../domain/mealPlan';
import { hasFeature } from '../../domain/pro';
import { usePro } from '../../hooks/usePro';
import { useTargets } from '../../hooks/useTargets';
import { useAllFoods, useAppStore } from '../../store/useAppStore';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const mealLabel = Object.fromEntries(MEALS.map((m) => [m.key, m.label]));

export default function PlanScreen() {
  const data = useTargets();
  const foods = useAllFoods();
  const addEntries = useAppStore((s) => s.addEntries);
  const isPro = usePro();
  const [offset, setOffset] = useState(0);
  const [view, setView] = useState<'week' | 'shopping'>('week');
  const [selected, setSelected] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);

  const week = useMemo(
    () => (data ? Array.from({ length: 7 }, (_, d) => generateDay(data.targets, data.profile.mealsPerDay, foods, d + offset)) : []),
    [data, foods, offset],
  );
  const shopping = useMemo(() => shoppingList(week, foods), [week, foods]);

  if (!data) {
    return (
      <View style={styles.content}>
        <Muted>Configure seu perfil para gerar o cardápio.</Muted>
      </View>
    );
  }
  if (!hasFeature(isPro, 'mealPlan')) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Card>
          <Title>Cardápio automático</Title>
          <Muted style={{ marginBottom: 12 }}>Uma semana de refeições brasileiras que batem suas metas, com lista de compras. Recurso Pro.</Muted>
          <Button title="Conhecer o Pro" onPress={() => router.push('/pro')} />
        </Card>
      </ScrollView>
    );
  }

  const today = todayIso();
  const dayDate = addDays(today, selected);
  const day = week[selected];

  const addDay = () => {
    addEntries(day.meals.flatMap((m) => m.items.map((i) => ({ date: dayDate, meal: m.meal, foodId: i.foodId, grams: i.grams }))));
    setFlash(`Cardápio adicionado ao diário de ${selected === 0 ? 'hoje' : dayDate.split('-').reverse().slice(0, 2).join('/')}.`);
    setTimeout(() => setFlash(null), 3000);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Chips
        options={[
          { value: 'week', label: 'Cardápio da semana' },
          { value: 'shopping', label: 'Lista de compras' },
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'week' ? (
        <>
          <Muted>
            Feito com arroz, feijão, frango, ovos e outros básicos, ajustado para {data.targets.protein} g de proteína e {data.targets.kcal} kcal.
          </Muted>
          <Chips
            options={week.map((_, i) => {
              const d = new Date(`${addDays(today, i)}T12:00:00`);
              return { value: String(i), label: i === 0 ? 'Hoje' : WEEKDAYS[d.getDay()] };
            })}
            value={String(selected)}
            onChange={(v) => setSelected(Number(v))}
          />
          <Card>
            <Text style={[styles.macroLabel, { marginBottom: 4 }]}>
              {Math.round(day.totals.kcal ?? 0)} kcal · {Math.round(day.totals.protein ?? 0)} g P · {Math.round(day.totals.carbs ?? 0)} g C ·{' '}
              {Math.round(day.totals.fat ?? 0)} g G
            </Text>
          </Card>
          {day.meals.map((m) => (
            <Card key={m.meal}>
              <View style={styles.rowBetween}>
                <Title>{mealLabel[m.meal]}</Title>
                <Text style={styles.macroValue}>{Math.round(m.totals.protein ?? 0)} g P</Text>
              </View>
              {m.items.map((i) => (
                <View key={i.foodId} style={[styles.rowBetween, { paddingVertical: 3 }]}>
                  <Text style={{ color: colors.text, flex: 1 }}>{i.label}</Text>
                  <Text style={styles.macroValue}>{i.grams} g</Text>
                </View>
              ))}
            </Card>
          ))}
          {flash ? (
            <View style={[styles.warning, { backgroundColor: colors.primarySoft }]}>
              <Text style={{ color: colors.primary }}>{flash}</Text>
            </View>
          ) : null}
          <Button title="Adicionar este dia ao diário" onPress={addDay} />
          <View style={{ alignItems: 'center' }}>
            <LinkText onPress={() => setOffset(offset + 7)}>Gerar outra semana</LinkText>
          </View>
        </>
      ) : (
        <Card>
          <Title>Para os 7 dias</Title>
          <Muted style={{ marginBottom: 8 }}>Quantidades cruas, já convertidas pelo rendimento do cozimento.</Muted>
          {shopping.map((s) => (
            <View key={s.name} style={[styles.rowBetween, { paddingVertical: 4 }]}>
              <Text style={{ color: colors.text, flex: 1 }}>{s.name}</Text>
              <Text style={styles.macroValue}>
                {String(s.amount).replace('.', ',')} {s.unit}
              </Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}
