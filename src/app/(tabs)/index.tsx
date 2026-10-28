import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Badge, Button, Card, colors, LinkText, MacroRow, Muted, NavRow, ProgressBar, styles, Title, ToggleRow, useTheme } from '../../components/ui';
import { SupplementChecklist } from '../../components/SupplementChecklist';
import { isCheckInDue } from '../../domain/checkin';
import { dailyTips } from '../../domain/coach';
import { addDays, entryNutrients, MEALS, todayIso } from '../../domain/foods';
import { formatAmount, NUTRIENT_BY_KEY } from '../../domain/nutrients';
import { LEUCINE_PER_MEAL_TARGET } from '../../domain/protein';
import { proteinPerMealRange } from '../../domain/targets';
import { useDay } from '../../hooks/useDay';
import { useAppStore, useHydrated } from '../../store/useAppStore';

function dayLabel(date: string): string {
  const today = todayIso();
  if (date === today) return 'Hoje';
  if (date === addDays(today, -1)) return 'Ontem';
  return date.split('-').reverse().slice(0, 2).join('/');
}

export default function TodayScreen() {
  useTheme();
  const hydrated = useHydrated();
  const [date, setDate] = useState(todayIso());
  const day = useDay(date);
  const removeEntry = useAppStore((s) => s.removeEntry);
  const copyMeal = useAppStore((s) => s.copyMeal);
  const saveMeal = useAppStore((s) => s.saveMeal);
  const setTrainingDay = useAppStore((s) => s.setTrainingDay);
  const checkIns = useAppStore((s) => s.checkIns);
  const weights = useAppStore((s) => s.weights);
  const [flash, setFlash] = useState<string | null>(null);

  if (!hydrated) return null;

  if (!day.data) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Card>
          <Title>Bem-vindo ao MacroFactorBR</Title>
          <Muted style={{ marginBottom: 16 }}>
            Cadastre seu peso, altura, nível de treino e objetivo para calcular suas metas de calorias e proteína para ganho de massa magra.
          </Muted>
          <Button title="Configurar meu perfil" onPress={() => router.push('/profile')} />
        </Card>
      </ScrollView>
    );
  }

  const { targets, profile, adaptive } = day.data;
  const { totals, byMeal, entries, foods } = day;
  const kcalTarget = day.day!.kcal;
  const carbsTarget = day.day!.carbs;
  const [mealMin] = proteinPerMealRange(profile.weightKg);
  const proteinLeft = Math.max(0, targets.protein - (totals.protein ?? 0));
  const lastCheckIn = checkIns[checkIns.length - 1]?.date;
  // Primeiro check-in só depois de uma semana de pesagens; os seguintes, a cada 7 dias.
  const firstWeight = weights[0]?.date;
  const showCheckIn =
    date === todayIso() && isCheckInDue(lastCheckIn, date) && (adaptive.status === 'ok' || (!!firstWeight && firstWeight <= addDays(date, -7)));
  const tips = dailyTips({
    totals,
    targets,
    mealProtein: day.mealProtein!,
    proteinPerMealMin: mealMin,
    micros: day.micros!,
    hour: date === todayIso() ? new Date().getHours() : 23,
  });
  const isTrainingDay = day.isTrainingDay;
  const lackingMicros = day.micros!.filter((m) => m.known && !m.ok).length;

  const notify = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.rowBetween}>
        <LinkText onPress={() => setDate(addDays(date, -1))}>‹ Anterior</LinkText>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{dayLabel(date)}</Text>
        {date < todayIso() ? <LinkText onPress={() => setDate(addDays(date, 1))}>Próximo ›</LinkText> : <View style={{ width: 70 }} />}
      </View>

      {showCheckIn ? (
        <Card style={{ borderColor: colors.primary, borderWidth: 2 }}>
          <Title>Check-in semanal disponível</Title>
          <Muted style={{ marginBottom: 10 }}>Veja como foi a semana e se as metas precisam de ajuste.</Muted>
          <Button title="Fazer check-in" onPress={() => router.push('/checkin')} />
        </Card>
      ) : null}

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
            : 'Meta de proteína batida. 💪'}
        </Muted>
        {day.proteinSplit.supplement > 0 ? (
          <View style={{ marginTop: 10 }}>
            <View style={{ flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: colors.track }}>
              <View style={{ flex: day.proteinSplit.food, backgroundColor: colors.protein }} />
              <View style={{ flex: day.proteinSplit.supplement, backgroundColor: colors.carbs }} />
            </View>
            <Muted style={{ marginTop: 4 }}>
              Comida {Math.round(day.proteinSplit.food)} g · Suplementos {Math.round(day.proteinSplit.supplement)} g ({Math.round(day.proteinSplit.supplementPct * 100)}%)
            </Muted>
          </View>
        ) : null}
      </Card>

      <Card>
        <MacroRow label="Calorias" value={totals.kcal ?? 0} target={kcalTarget} unit="kcal" color={colors.kcal} />
        <MacroRow label="Carboidratos" value={totals.carbs ?? 0} target={carbsTarget} unit="g" color={colors.carbs} />
        <MacroRow label="Gorduras" value={totals.fat ?? 0} target={targets.fat} unit="g" color={colors.fat} />
        {profile.carbCycling ? (
          <ToggleRow
            label="Dia de treino"
            hint={day.isTrainingDay ? 'Mais carboidrato hoje' : 'Dia de descanso: menos carboidrato'}
            value={day.isTrainingDay!}
            onChange={(v) => setTrainingDay(date, v)}
          />
        ) : null}
        <Muted>
          Gasto estimado: {targets.tdee} kcal ({targets.tdeeSource === 'adaptive' ? 'adaptativo, pelos seus dados' : 'fórmula, até juntar 2 semanas de dados'})
        </Muted>
      </Card>

      <View style={styles.row}>
        <View style={{ flex: 1, minWidth: 140 }}>
          <Button title="Escanear código" onPress={() => router.push('/scan')} />
        </View>
        <View style={{ flex: 1, minWidth: 140 }}>
          <Button title="Buscar alimento" variant="secondary" onPress={() => router.push('/foods')} />
        </View>
      </View>
      <View style={styles.row}>
        <View style={{ flex: 1, minWidth: 140 }}>
          <Button title="Texto ou voz" variant="secondary" onPress={() => router.push({ pathname: '/quick-add', params: { date } })} />
        </View>
        <View style={{ flex: 1, minWidth: 140 }}>
          <Button title="Foto do prato (IA)" variant="secondary" onPress={() => router.push({ pathname: '/quick-add', params: { date, mode: 'photo' } })} />
        </View>
      </View>

      {flash ? (
        <View style={[styles.warning, { backgroundColor: colors.primarySoft }]}>
          <Text style={{ color: colors.primary }}>{flash}</Text>
        </View>
      ) : null}

      {tips.length > 0 ? (
        <Card>
          <Title>Dicas do coach</Title>
          {tips.map((t) => (
            <Text key={t} style={{ color: colors.text, marginBottom: 6 }}>
              • {t}
            </Text>
          ))}
        </Card>
      ) : null}

      {MEALS.map((meal) => {
        const list = entries.filter((e) => e.meal === meal.key);
        const p = byMeal[meal.key].protein ?? 0;
        const leu = byMeal[meal.key].leucine ?? 0;
        const yesterdayCount = useAppStore.getState().entries.filter((e) => e.date === addDays(date, -1) && e.meal === meal.key).length;
        return (
          <Card key={meal.key}>
            <View style={styles.rowBetween}>
              <Title>{meal.label}</Title>
              <Link href={{ pathname: '/foods', params: { meal: meal.key, date } }} style={{ color: colors.primary, fontWeight: '600' }}>
                + Adicionar
              </Link>
            </View>
            {list.length === 0 ? (
              <View style={[styles.rowBetween, { flexWrap: 'wrap', gap: 8 }]}>
                <Muted>Nada registrado.</Muted>
                {yesterdayCount > 0 ? (
                  <LinkText onPress={() => notify(`${copyMeal(addDays(date, -1), date, meal.key)} itens copiados de ontem.`)}>
                    Copiar de ontem ({yesterdayCount})
                  </LinkText>
                ) : null}
              </View>
            ) : (
              <>
                {list.map((e) => {
                  const food = foods[e.foodId];
                  const n = entryNutrients(e, food);
                  return (
                    <View key={e.id} style={[styles.rowBetween, { paddingVertical: 6 }]}>
                      <Pressable style={{ flex: 1 }} onPress={() => food && router.push({ pathname: '/food/[id]', params: { id: food.id, meal: meal.key, date } })}>
                        <Text style={{ color: colors.text }}>{food?.name ?? 'Alimento removido'}</Text>
                        <Text style={styles.muted}>{e.note ?? `${e.grams} g`}</Text>
                      </Pressable>
                      <Text style={styles.macroValue}>
                        {Math.round(n.kcal ?? 0)} kcal · {Math.round(n.protein ?? 0)} g P
                      </Text>
                      <Pressable accessibilityLabel="Remover" onPress={() => removeEntry(e.id)} hitSlop={8} style={{ paddingLeft: 12 }}>
                        <Text style={{ color: colors.danger, fontSize: 16 }}>✕</Text>
                      </Pressable>
                    </View>
                  );
                })}
                <View style={{ marginTop: 6 }}>
                  <ProgressBar value={p} target={targets.proteinPerMeal} color={p >= mealMin ? colors.protein : colors.carbs} />
                </View>
                <Muted style={{ marginTop: 4, color: p >= mealMin ? colors.primary : colors.warn }}>
                  {Math.round(p)} / {targets.proteinPerMeal} g de proteína · leucina {leu.toFixed(1).replace('.', ',')} g
                  {leu < LEUCINE_PER_MEAL_TARGET ? ` (ideal ≥ 2,5 g)` : ''}
                  {p < mealMin ? ` · abaixo de ${mealMin} g, o mínimo para estimular a síntese muscular` : ''}
                </Muted>
                <View style={[styles.row, { marginTop: 6 }]}>
                  <LinkText
                    onPress={() => {
                      saveMeal(`${meal.label} de ${dayLabel(date).toLowerCase()}`, list.map((e) => ({ foodId: e.foodId, grams: e.grams, note: e.note })));
                      notify('Refeição salva. Use de novo em Alimentos > Refeições salvas.');
                    }}
                  >
                    Salvar refeição
                  </LinkText>
                </View>
              </>
            )}
          </Card>
        );
      })}

      <Card>
        <View style={styles.rowBetween}>
          <Title>Micronutrientes</Title>
          <Link href={{ pathname: '/micros', params: { date } }} style={{ color: colors.primary, fontWeight: '600' }}>
            Ver painel ›
          </Link>
        </View>
        <View style={[styles.row, { gap: 6 }]}>
          {day.micros!.map((m) => (
            <Badge
              key={m.key}
              text={`${NUTRIENT_BY_KEY[m.key].label} ${m.known ? `${Math.round(m.pct * 100)}%` : 'sem dados'}`}
              tone={!m.known ? 'neutral' : m.kind === 'max' ? (m.ok ? 'neutral' : 'danger') : m.ok ? 'good' : m.pct >= 0.5 ? 'warn' : 'neutral'}
            />
          ))}
        </View>
        <Muted style={{ marginTop: 8 }}>
          {lackingMicros === 0 ? 'Todos os alvos atingidos.' : `${lackingMicros} alvo(s) ainda abertos. Fibra: ${formatAmount(totals.fiber, 'g')}.`}
        </Muted>
      </Card>

      <Card>
        <NavRow href="/plan" title="Cardápio da semana" subtitle="Refeições prontas que batem suas metas e lista de compras" />
        <NavRow href="/workout" title="Treino" subtitle={isTrainingDay ? 'Dia de treino registrado' : 'Registrar o treino de hoje'} />
      </Card>

      <Card>
        <SupplementChecklist date={date} warnings={day.limitWarnings} />
      </Card>
    </ScrollView>
  );
}
