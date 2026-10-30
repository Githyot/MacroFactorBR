import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ActionTile, Collapsible, dayLabel, IconButton, ListCard, ListRow, MacroLine, Pill, Ring, Section, WeekStrip } from '../../components/diet';
import { switchMode } from '../../components/ModeSwitch';
import { ActionSheet } from '../../components/training';
import { Button, Card, colors, Muted, styles, Title, useTheme } from '../../components/ui';
import { isCheckInDue } from '../../domain/checkin';
import { dailyTips } from '../../domain/coach';
import { addDays, DiaryEntry, entryNutrients, Meal, MEALS, todayIso } from '../../domain/foods';
import { LEUCINE_PER_MEAL_TARGET } from '../../domain/protein';
import { scheduledDoses } from '../../domain/supplements';
import { proteinPerMealRange } from '../../domain/targets';
import { useDay } from '../../hooks/useDay';
import { useAppStore, useHydrated } from '../../store/useAppStore';

const fmt1 = (n: number) => n.toFixed(1).replace('.', ',');

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
  const allEntries = useAppStore((s) => s.entries);
  const supplements = useAppStore((s) => s.supplements);
  const supplementLog = useAppStore((s) => s.supplementLog);
  const [flash, setFlash] = useState<string | null>(null);
  const [menu, setMenu] = useState<Meal | null>(null);

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
  const kcal = totals.kcal ?? 0;
  const kcalLeft = Math.round(kcalTarget - kcal);
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
  const knownMicros = day.micros!.filter((m) => m.known);
  const okMicros = knownMicros.filter((m) => m.ok).length;
  const scheduled = Object.values(supplements).map((s) => ({ s, doses: scheduledDoses(s, date) })).filter((x) => x.doses > 0);
  const dosesTotal = scheduled.reduce((n, x) => n + x.doses, 0);
  const dosesDone = scheduled.reduce((n, x) => n + Math.min(x.doses, supplementLog[date]?.[x.s.id] ?? 0), 0);
  const loggedDays = new Set(allEntries.map((e) => e.date));

  const notify = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  };
  const addTo = (meal?: Meal) => router.push({ pathname: '/foods', params: { ...(meal ? { meal } : {}), date } });
  const menuMeal = MEALS.find((m) => m.key === menu);
  const menuList = entries.filter((e) => e.meal === menu);
  const yesterdayOf = (meal: Meal) => allEntries.filter((e) => e.date === addDays(date, -1) && e.meal === meal).length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <WeekStrip date={date} onChange={setDate} marked={(d) => loggedDays.has(d)} />

      {showCheckIn ? (
        <ListCard style={{ borderColor: colors.primary, borderWidth: 1 }}>
          <ListRow first icon="calendar-outline" iconColor={colors.primary} title="Check-in semanal disponível" subtitle="Veja a semana e ajuste as metas" onPress={() => router.push('/checkin')} />
        </ListCard>
      ) : null}

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <Ring value={kcal} target={kcalTarget} color={colors.primary} size={124} stroke={11}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] }}>{Math.abs(kcalLeft)}</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>{kcalLeft >= 0 ? 'kcal restantes' : 'kcal acima'}</Text>
          </Ring>
          <View style={{ flex: 1, gap: 12 }}>
            <MacroLine label="Proteína" value={totals.protein ?? 0} target={targets.protein} unit="g" color={colors.protein} strong />
            <MacroLine label="Carboidratos" value={totals.carbs ?? 0} target={carbsTarget} unit="g" color={colors.carbs} />
            <MacroLine label="Gorduras" value={totals.fat ?? 0} target={targets.fat} unit="g" color={colors.fat} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 14 }}>
          <Text style={[styles.muted, { fontSize: 13, flex: 1, minWidth: 160 }]}>
            {Math.round(kcal)} de {kcalTarget} kcal ·{' '}
            {proteinLeft > 0 ? `faltam ${Math.round(proteinLeft)} g de proteína` : 'proteína batida 💪'}
          </Text>
          {profile.carbCycling ? (
            <Pressable onPress={() => setTrainingDay(date, !day.isTrainingDay)} accessibilityRole="switch" accessibilityState={{ checked: day.isTrainingDay }}>
              <Pill text={day.isTrainingDay ? 'Dia de treino' : 'Dia de descanso'} tone={day.isTrainingDay ? 'good' : 'neutral'} icon={day.isTrainingDay ? 'barbell' : 'bed-outline'} />
            </Pressable>
          ) : null}
        </View>
        {day.proteinSplit.supplement > 0 ? (
          <View style={{ marginTop: 10 }}>
            <View style={{ flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: colors.track }}>
              <View style={{ flex: day.proteinSplit.food, backgroundColor: colors.protein }} />
              <View style={{ flex: day.proteinSplit.supplement, backgroundColor: colors.carbs }} />
            </View>
            <Text style={[styles.muted, { fontSize: 12, marginTop: 4 }]}>
              Proteína: comida {Math.round(day.proteinSplit.food)} g · suplementos {Math.round(day.proteinSplit.supplement)} g ({Math.round(day.proteinSplit.supplementPct * 100)}%)
            </Text>
          </View>
        ) : null}
      </Card>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ActionTile icon="search" label="Buscar" primary onPress={() => addTo()} />
        <ActionTile icon="barcode-outline" label="Código" onPress={() => router.push({ pathname: '/scan', params: { date } })} />
        <ActionTile icon="mic-outline" label="Texto/voz" onPress={() => router.push({ pathname: '/quick-add', params: { date } })} />
        <ActionTile icon="camera-outline" label="Foto (IA)" onPress={() => router.push({ pathname: '/quick-add', params: { date, mode: 'photo' } })} />
      </View>

      {flash ? (
        <View style={[styles.warning, { backgroundColor: colors.primarySoft }]}>
          <Text style={{ color: colors.onPrimarySoft }}>{flash}</Text>
        </View>
      ) : null}

      <Section title="Refeições" />
      {MEALS.map((meal) => {
        const list = entries.filter((e) => e.meal === meal.key);
        const t = byMeal[meal.key];
        const p = t.protein ?? 0;
        const leu = t.leucine ?? 0;
        const yesterdayCount = yesterdayOf(meal.key);
        return (
          <View key={meal.key} style={[styles.card, { paddingVertical: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable style={{ flex: 1 }} onPress={() => setMenu(meal.key)} accessibilityLabel={`Opções de ${meal.label}`}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{meal.label}</Text>
                {list.length > 0 ? (
                  <Text style={[styles.muted, { fontSize: 13 }]}>
                    {Math.round(t.kcal ?? 0)} kcal · {Math.round(p)} g proteína
                  </Text>
                ) : null}
              </Pressable>
              {list.length > 0 || yesterdayCount > 0 ? <IconButton icon="ellipsis-horizontal" label={`Opções de ${meal.label}`} onPress={() => setMenu(meal.key)} /> : null}
              <IconButton icon="add" label={`Adicionar em ${meal.label}`} filled onPress={() => addTo(meal.key)} />
            </View>
            {list.length === 0 && yesterdayCount > 0 ? (
              <Pressable onPress={() => notify(`${copyMeal(addDays(date, -1), date, meal.key)} itens copiados de ontem.`)} hitSlop={6} style={{ marginTop: 6 }}>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Copiar de ontem ({yesterdayCount})</Text>
              </Pressable>
            ) : null}
            {list.length > 0 ? (
              <View style={{ marginTop: 8 }}>
                {list.map((e) => (
                  <EntryRow key={e.id} entry={e} foods={foods} meal={meal.key} date={date} onRemove={() => removeEntry(e.id)} />
                ))}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  <Pill
                    tone={p >= mealMin ? 'good' : 'warn'}
                    icon={p >= mealMin ? 'checkmark-circle' : 'alert-circle'}
                    text={p >= mealMin ? `Proteína ok (${Math.round(p)}/${targets.proteinPerMeal} g)` : `Proteína baixa: ${Math.round(p)} g, mín. ${mealMin} g`}
                  />
                  {leu < LEUCINE_PER_MEAL_TARGET ? <Pill tone="neutral" text={`Leucina ${fmt1(leu)} g (ideal 2,5)`} /> : null}
                </View>
              </View>
            ) : null}
          </View>
        );
      })}

      <Section title="Mais do dia" />
      <ListCard>
        <ListRow
          first
          icon="leaf-outline"
          title="Micronutrientes"
          subtitle={knownMicros.length ? `${okMicros} de ${knownMicros.length} alvos atingidos` : 'Registre refeições para ver'}
          onPress={() => router.push({ pathname: '/micros', params: { date } })}
        />
        <ListRow
          icon="medkit-outline"
          title="Suplementação"
          subtitle={dosesTotal ? `${dosesDone} de ${dosesTotal} doses marcadas` : Object.keys(supplements).length ? 'Nada programado para este dia' : 'Monte seu protocolo'}
          right={dosesTotal && dosesDone >= dosesTotal ? <Pill tone="good" icon="checkmark-circle" text="Ok" /> : undefined}
          onPress={() => router.navigate('/plano')}
        />
        <ListRow icon="restaurant-outline" title="Cardápio da semana" subtitle="Refeições prontas que batem suas metas" onPress={() => router.push('/plan')} />
        <ListRow icon="barbell-outline" title="Ir para o modo Treino" subtitle={day.isTrainingDay ? 'Dia de treino registrado' : 'Registrar o treino de hoje'} onPress={() => switchMode('treino')} />
      </ListCard>
      {day.limitWarnings.length ? (
        <View style={styles.warning}>
          <Text style={styles.warningText}>Alguma dose de hoje passa do limite seguro. Confira em Plano › Suplementação.</Text>
        </View>
      ) : null}

      {tips.length > 0 ? (
        <Collapsible title="Dicas do coach" icon="bulb-outline" summary={`${tips.length}`}>
          {tips.map((t) => (
            <Text key={t} style={{ color: colors.text, marginBottom: 6, lineHeight: 20 }}>
              • {t}
            </Text>
          ))}
        </Collapsible>
      ) : null}

      <ActionSheet
        visible={menu !== null}
        title={menuMeal?.label}
        onClose={() => setMenu(null)}
        options={[
          { label: 'Adicionar alimento', icon: 'add-circle-outline', onPress: () => addTo(menu!) },
          ...(menu && yesterdayOf(menu) > 0
            ? [{ label: `Copiar de ontem (${yesterdayOf(menu)})`, icon: 'copy-outline' as const, onPress: () => notify(`${copyMeal(addDays(date, -1), date, menu)} itens copiados de ontem.`) }]
            : []),
          ...(menuList.length && menuMeal
            ? [
                {
                  label: 'Salvar como refeição',
                  icon: 'bookmark-outline' as const,
                  onPress: () => {
                    saveMeal(`${menuMeal.label} de ${dayLabel(date).toLowerCase()}`, menuList.map((e) => ({ foodId: e.foodId, grams: e.grams, note: e.note })));
                    notify('Refeição salva. Use de novo em Alimentos › Refeições.');
                  },
                },
                { label: 'Limpar refeição', icon: 'trash-outline' as const, danger: true, onPress: () => menuList.forEach((e) => removeEntry(e.id)) },
              ]
            : []),
        ]}
      />
    </ScrollView>
  );
}

function EntryRow({ entry, foods, meal, date, onRemove }: { entry: DiaryEntry; foods: ReturnType<typeof useDay>['foods']; meal: Meal; date: string; onRemove: () => void }) {
  const food = foods[entry.foodId];
  const n = entryNutrients(entry, food);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 }}>
      <Pressable style={{ flex: 1 }} onPress={() => food && router.push({ pathname: '/food/[id]', params: { id: food.id, meal, date } })}>
        <Text style={{ color: colors.text, fontSize: 15 }} numberOfLines={1}>
          {food?.name ?? 'Alimento removido'}
        </Text>
        <Text style={[styles.muted, { fontSize: 13 }]}>
          {entry.note ?? `${entry.grams} g`} · {Math.round(n.protein ?? 0)} g P
        </Text>
      </Pressable>
      <Text style={{ color: colors.text, fontSize: 14, fontVariant: ['tabular-nums'] }}>{Math.round(n.kcal ?? 0)} kcal</Text>
      <Pressable accessibilityLabel="Remover" onPress={onRemove} hitSlop={8}>
        <Text style={{ color: colors.muted, fontSize: 15 }}>✕</Text>
      </Pressable>
    </View>
  );
}
