import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BreakdownRow, fmtNum, soft } from '../../components/dash';
import { Ring } from '../../components/diet';
import { Badge, Button, Card, Chips, colors, Field, isGlass, LinkText, Muted, parseInput, styles, Title, ToggleRow, useTheme } from '../../components/ui';
import { rawFromCooked, yieldFor } from '../../domain/cooking';
import { costPer30gProtein, defaultMeal, Meal, MEALS, proteinPerReal, todayIso } from '../../domain/foods';
import { computeHighIn, HIGH_IN_LABEL } from '../../domain/labelFront';
import { measuresFor } from '../../domain/measures';
import { microTargets } from '../../domain/micros';
import { NUTRIENT_BY_KEY, NutrientKey, scaleNutrients } from '../../domain/nutrients';
import { LEUCINE_PER_MEAL_TARGET, leucineIn, PROTEIN_SOURCES, proteinSource, qualityAdjustedProtein } from '../../domain/protein';
import { ageFromBirthDate, dayTargets } from '../../domain/targets';
import { useTargets } from '../../hooks/useTargets';
import { reportSharedFood } from '../../services/sharedFoods';
import { useAllFoods, useAppStore } from '../../store/useAppStore';

const fmt = (n: number, d = 1) => n.toFixed(d).replace('.', ',');

export default function FoodDetailScreen() {
  useTheme();
  const params = useLocalSearchParams<{ id: string; meal?: Meal; date?: string }>();
  const foods = useAllFoods();
  const addEntry = useAppStore((s) => s.addEntry);
  const deleteFood = useAppStore((s) => s.deleteFood);
  const updateFood = useAppStore((s) => s.updateFood);
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const prices = useAppStore((s) => s.prices);
  const setPrice = useAppStore((s) => s.setPrice);
  const food = foods[params.id];
  const saved = food ? prices[food.id] : undefined;
  const data = useTargets();
  const trainingDays = useAppStore((s) => s.trainingDays);
  const insets = useSafeAreaInsets();

  const [amount, setAmount] = useState(String(food?.servingGrams ?? 100));
  const [measureLabel, setMeasureLabel] = useState<string | null>(null);
  const [cooked, setCooked] = useState(false);
  const [meal, setMeal] = useState<Meal>(params.meal ?? defaultMeal());
  const [price, setPriceText] = useState(saved ? String(saved.priceBrl).replace('.', ',') : '');
  const [packageGrams, setPackageGrams] = useState(saved ? String(saved.packageGrams) : '');
  const [newMeasure, setNewMeasure] = useState({ label: '', grams: '' });
  const [reported, setReported] = useState<string | null>(null);

  if (!food) {
    return (
      <View style={styles.content}>
        <Muted>Alimento não encontrado.</Muted>
      </View>
    );
  }

  const measures = measuresFor(food);
  const measure = measures.find((m) => m.label === measureLabel);
  const factor = yieldFor(food);
  const qty = parseInput(amount) ?? 0;
  // Peso como foi servido (medida × quantidade, ou gramas digitadas).
  const servedGrams = measure ? measure.grams * qty : qty;
  // O diário guarda o peso na forma cadastrada (cru, se o alimento é cru).
  const g = cooked && factor ? rawFromCooked(servedGrams, factor) : servedGrams;
  const n = scaleNutrients(food.per100g, g);
  const pkg = parseInput(packageGrams) ?? 0;
  const brl = parseInput(price) ?? 0;
  const ppr = proteinPerReal(food.per100g, pkg, brl);
  const cost30 = costPer30gProtein(food.per100g, pkg, brl);
  const source = PROTEIN_SOURCES[proteinSource(food)];
  const highIn = food.highIn?.length ? food.highIn : computeHighIn(food.per100g, food.liquid);
  const isFav = favorites.includes(food.id);
  const editable = Boolean(useAppStore.getState().customFoods[food.id]);

  const note = measure
    ? `${fmt(qty, qty % 1 ? 1 : 0)} ${measure.label}${cooked ? ' (cozido)' : ''}`
    : cooked && factor
      ? `${Math.round(servedGrams)} g cozido`
      : undefined;

  const add = () => {
    if (g <= 0) return;
    if (pkg > 0 && brl > 0) setPrice(food.id, { priceBrl: brl, packageGrams: pkg });
    addEntry({ date: params.date ?? todayIso(), meal, foodId: food.id, grams: Math.round(g * 10) / 10, note });
    router.dismissTo('/diario');
  };

  // Metas do dia para o "impacto nas metas" e as barras de nutrientes.
  const date = params.date ?? todayIso();
  const dt = data ? dayTargets(data.targets, data.profile, trainingDays[date] ?? false) : undefined;
  const goals = data && dt ? { kcal: dt.kcal, protein: data.targets.protein, fat: data.targets.fat, carbs: dt.carbs } : undefined;
  const micro = data ? Object.fromEntries(microTargets(data.profile.sex, ageFromBirthDate(data.profile.birthDate)).map((t) => [t.key, t])) : {};
  const macroKcal = (n.protein ?? 0) * 4 + (n.fat ?? 0) * 9 + (n.carbs ?? 0) * 4;
  const share = (k: number) => (macroKcal > 0 ? Math.round((k / macroKcal) * 100) : 0);
  const has = (k: NutrientKey) => food.per100g[k] !== undefined;
  const row = (k: NutrientKey, color: string, target?: number, kind: 'min' | 'max' = 'min', label = NUTRIENT_BY_KEY[k].label) =>
    has(k) ? <BreakdownRow key={k} label={label} value={n[k] ?? 0} target={target} unit={NUTRIENT_BY_KEY[k].unit} color={color} kind={kind} /> : null;
  const kcalGoal = goals?.kcal ?? 0;
  const MICRO_KEYS: NutrientKey[] = ['sodium', 'potassium', 'calcium', 'iron', 'magnesium', 'zinc', 'vitaminA', 'vitaminC', 'vitaminD', 'vitaminB12'];
  const unitLabel = measure ? measure.label : cooked ? 'g cozido' : 'g';

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 110 + insets.bottom }} keyboardShouldPersistTaps="handled">
        <Stack.Screen
          options={{
            title: 'Alimento',
            headerRight: () => (
              <Pressable onPress={() => toggleFavorite(food.id)} hitSlop={10} accessibilityLabel={isFav ? 'Remover dos favoritos' : 'Favoritar'} style={{ paddingHorizontal: 12 }}>
                <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={24} color={isFav ? colors.protein : colors.text} />
              </Pressable>
            ),
          }}
        />
        <View style={{ backgroundColor: colors.card, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 }}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>{food.name}</Text>
          {food.brand || food.barcode ? (
            <Muted style={{ marginTop: 2 }}>{[food.brand, food.barcode ? `Código ${food.barcode}` : ''].filter(Boolean).join(' · ')}</Muted>
          ) : null}
          {highIn.length ? (
            <View style={[styles.row, { gap: 6, marginTop: 8 }]}>
              {highIn.map((h) => (
                <Badge key={h} text={`ALTO EM ${HIGH_IN_LABEL[h].toUpperCase()}`} tone="danger" />
              ))}
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 18 }}>
            <View style={{ flex: 1.15 }}>
              <Text style={{ color: colors.text, fontSize: 44, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -1 }}>{Math.round(n.kcal ?? 0)}</Text>
              <Text style={{ color: colors.muted, fontSize: 16 }}>Calorias</Text>
            </View>
            {(
              [
                ['Proteína', n.protein ?? 0, 4, colors.protein],
                ['Gordura', n.fat ?? 0, 9, colors.fat],
                ['Carbo', n.carbs ?? 0, 4, colors.carbs],
              ] as const
            ).map(([label, grams, k, color]) => (
              <View key={label} style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ backgroundColor: soft(color, 0.4), borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 6 }}>
                  <Text style={{ color: colors.text, fontSize: 14, fontVariant: ['tabular-nums'] }}>{share(grams * k)}%</Text>
                </View>
                <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{fmtNum(grams, grams < 100 ? 1 : 0)}</Text>
                <Text style={{ color: colors.muted, fontSize: 15 }}>{label}</Text>
              </View>
            ))}
          </View>

          {goals ? (
            <>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 26, marginBottom: 14 }}>Impacto nas metas</Text>
              <View style={{ flexDirection: 'row' }}>
                {(
                  [
                    ['Calorias', n.kcal ?? 0, goals.kcal, colors.kcal],
                    ['Proteína', n.protein ?? 0, goals.protein, colors.protein],
                    ['Gordura', n.fat ?? 0, goals.fat, colors.fat],
                    ['Carbo', n.carbs ?? 0, goals.carbs, colors.carbs],
                  ] as const
                ).map(([label, v, t, color]) => (
                  <View key={label} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                    <Ring value={v} target={t} color={color} size={64} stroke={5}>
                      <Text style={{ color: colors.text, fontSize: 16, fontVariant: ['tabular-nums'] }}>{t > 0 ? Math.round((v / t) * 100) : 0}%</Text>
                    </Ring>
                    <Text style={{ color: colors.muted, fontSize: 14 }}>{label}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.content}>
          <Card>
            <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 }}>Medida</Text>
            <Chips
              options={[{ value: '', label: 'gramas' }, ...measures.map((m) => ({ value: m.label, label: `${m.label} (${Math.round(m.grams)} g)` }))]}
              value={measureLabel ?? ''}
              onChange={(v) => {
                setMeasureLabel(v || null);
                setAmount(v ? '1' : String(food.servingGrams ?? 100));
              }}
            />
            {factor ? (
              <ToggleRow
                label="Pesei cozido"
                hint={`Cadastrado cru. Rende ${fmt(factor)}× ao cozinhar${cooked && g > 0 ? `: equivale a ${Math.round(g)} g cru` : ''}.`}
                value={cooked}
                onChange={setCooked}
              />
            ) : null}
            <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10, marginTop: 6 }}>Refeição</Text>
            <Chips options={MEALS.map((m) => ({ value: m.key, label: m.label }))} value={meal} onChange={setMeal} />
          </Card>

          <Card>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Proteína</Text>
            {row('protein', colors.protein, goals?.protein, 'min', 'Proteína')}
            {(food.per100g.protein ?? 0) > 3 ? (
              <>
                <BreakdownRow label="Leucina" value={leucineIn(food, g)} target={LEUCINE_PER_MEAL_TARGET} unit="g" color={colors.protein} fmt={(v) => fmtNum(v, 1)} />
                <Muted style={{ fontSize: 13 }}>
                  Fonte: {source.label}. Meta de leucina por refeição: 2,5 g. Proteína ajustada pela qualidade (DIAAS): {Math.round(qualityAdjustedProtein(food, g))} g.
                </Muted>
              </>
            ) : null}
          </Card>

          <Card>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Carboidratos</Text>
            {row('carbs', colors.carbs, goals?.carbs, 'min', 'Carboidratos')}
            {row('fiber', colors.carbs, micro.fiber?.target, 'min', 'Fibra')}
            {row('sugars', colors.carbs, undefined, 'min', 'Açúcares')}
            {row('addedSugars', colors.carbs, kcalGoal ? (kcalGoal * 0.1) / 4 : undefined, 'max', 'Açúcares adicionados')}
          </Card>

          <Card>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Gorduras</Text>
            {row('fat', colors.fat, goals?.fat, 'min', 'Gordura')}
            {row('saturatedFat', colors.fat, kcalGoal ? (kcalGoal * 0.1) / 9 : undefined, 'max', 'Saturada')}
            {row('transFat', colors.fat, undefined, 'max', 'Trans')}
            {row('cholesterol', colors.fat, undefined, 'max', 'Colesterol')}
          </Card>

          {MICRO_KEYS.some(has) ? (
            <Card>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Vitaminas e minerais</Text>
              {MICRO_KEYS.map((k) => row(k, k === 'sodium' ? colors.danger : colors.kcal, micro[k]?.target, micro[k]?.kind ?? 'min'))}
            </Card>
          ) : null}

          {food.source === 'shared' && food.sharedId ? (
            <Card>
              <Title>Base da comunidade</Title>
              <Muted style={{ marginBottom: 10 }}>
                {food.sharedStatus === 'verified'
                  ? 'Conferido por outros usuários.'
                  : 'Enviado por outro usuário e ainda não conferido. Compare com a tabela da sua embalagem.'}
              </Muted>
              {reported ? (
                <Muted style={{ color: colors.primary }}>{reported}</Muted>
              ) : (
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Está certo"
                      variant="secondary"
                      onPress={() => reportSharedFood(food.sharedId!, true).then(() => setReported('Obrigado por conferir!'))}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Tem erro"
                      variant="secondary"
                      onPress={() => reportSharedFood(food.sharedId!, false).then(() => setReported('Obrigado! Corrija os valores lendo a tabela de novo.'))}
                    />
                  </View>
                </View>
              )}
            </Card>
          ) : null}

          <Card>
            <Title>Custo da proteína</Title>
            <Muted style={{ marginBottom: 8 }}>Compare marcas de whey, carnes e ovos. O preço fica salvo neste alimento.</Muted>
            <View style={styles.row}>
              <Field label="Preço" suffix="R$" keyboardType="decimal-pad" value={price} onChangeText={setPriceText} />
              <Field label="Peso da embalagem" suffix="g" keyboardType="decimal-pad" value={packageGrams} onChangeText={setPackageGrams} />
            </View>
            {ppr > 0 ? (
              <>
                <Text style={styles.macroLabel}>{fmt(ppr)} g de proteína por R$ 1</Text>
                {cost30 ? <Muted>R$ {fmt(cost30, 2)} por 30 g de proteína</Muted> : null}
                <View style={{ marginTop: 8 }}>
                  <LinkText onPress={() => setPrice(food.id, { priceBrl: brl, packageGrams: pkg })}>Salvar preço</LinkText>
                </View>
              </>
            ) : null}
          </Card>

          {editable ? (
            <Card>
              <Title>Medida caseira</Title>
              <Muted style={{ marginBottom: 8 }}>Ex.: “pote” de 170 g, “fatia” de 25 g.</Muted>
              <View style={styles.row}>
                <Field label="Nome" value={newMeasure.label} onChangeText={(label) => setNewMeasure({ ...newMeasure, label })} />
                <Field label="Peso" suffix="g" keyboardType="decimal-pad" value={newMeasure.grams} onChangeText={(grams) => setNewMeasure({ ...newMeasure, grams })} />
              </View>
              <Button
                title="Adicionar medida"
                variant="secondary"
                disabled={!newMeasure.label || !parseInput(newMeasure.grams)}
                onPress={() => {
                  const custom = foods[food.id];
                  updateFood({ ...custom, measures: [...(custom.measures ?? []), { label: newMeasure.label.trim(), grams: parseInput(newMeasure.grams)! }] });
                  setNewMeasure({ label: '', grams: '' });
                }}
              />
            </Card>
          ) : null}

          {editable ? (
            <Button
              title="Excluir alimento"
              variant="danger"
              onPress={() => {
                deleteFood(food.id);
                router.back();
              }}
            />
          ) : null}
        </View>
      </ScrollView>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: 'row',
          gap: 10,
          padding: 12,
          paddingBottom: 12 + insets.bottom,
          backgroundColor: colors.card,
          ...(isGlass() ? ({ backdropFilter: 'blur(24px) saturate(180%)' } as object) : {}),
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: 12, paddingHorizontal: 14 }}>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            selectTextOnFocus
            accessibilityLabel="Quantidade"
            style={{ flex: 1, minWidth: 0, color: colors.text, fontSize: 20, paddingVertical: 12, fontVariant: ['tabular-nums'] }}
          />
          <Text numberOfLines={1} style={{ color: colors.text, fontSize: 16, maxWidth: 130 }}>
            {unitLabel}
            {measure ? <Text style={{ color: colors.muted }}> · {Math.round(servedGrams)} g</Text> : null}
          </Text>
        </View>
        <Pressable
          onPress={add}
          disabled={g <= 0}
          accessibilityRole="button"
          style={({ pressed }) => ({ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 26, justifyContent: 'center', opacity: pressed || g <= 0 ? 0.6 : 1 })}
        >
          <Text style={{ color: colors.onPrimary, fontSize: 17, fontWeight: '700' }}>Adicionar</Text>
        </Pressable>
      </View>
    </View>
  );
}
