import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Badge, Button, Card, Chips, colors, Field, LinkText, Muted, parseInput, styles, Title, ToggleRow, useTheme } from '../../components/ui';
import { rawFromCooked, yieldFor } from '../../domain/cooking';
import { costPer30gProtein, defaultMeal, Meal, MEALS, proteinPerReal, todayIso } from '../../domain/foods';
import { computeHighIn, HIGH_IN_LABEL } from '../../domain/labelFront';
import { measuresFor } from '../../domain/measures';
import { formatAmount, NUTRIENTS, scaleNutrients } from '../../domain/nutrients';
import { leucineIn, PROTEIN_SOURCES, proteinSource, qualityAdjustedProtein } from '../../domain/protein';
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
    router.dismissTo('/');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: food.name,
          headerRight: () => (
            <Pressable onPress={() => toggleFavorite(food.id)} hitSlop={10} accessibilityLabel={isFav ? 'Remover dos favoritos' : 'Favoritar'}>
              <Text style={{ fontSize: 22, color: isFav ? colors.carbs : colors.muted, paddingHorizontal: 12 }}>{isFav ? '★' : '☆'}</Text>
            </Pressable>
          ),
        }}
      />
      <Card>
        <Title>{food.name}</Title>
        {food.brand ? <Muted>{food.brand}</Muted> : null}
        {food.barcode ? <Muted>Código: {food.barcode}</Muted> : null}
        {highIn.length ? (
          <View style={[styles.row, { gap: 6, marginTop: 8 }]}>
            {highIn.map((h) => (
              <Badge key={h} text={`ALTO EM ${HIGH_IN_LABEL[h].toUpperCase()}`} tone="danger" />
            ))}
          </View>
        ) : null}

        <View style={{ height: 12 }} />
        <Chips
          options={[{ value: '', label: 'gramas' }, ...measures.map((m) => ({ value: m.label, label: `${m.label} (${Math.round(m.grams)} g)` }))]}
          value={measureLabel ?? ''}
          onChange={(v) => {
            setMeasureLabel(v || null);
            setAmount(v ? '1' : String(food.servingGrams ?? 100));
          }}
        />
        <Field
          label={measure ? `Quantidade de ${measure.label}` : cooked ? 'Peso cozido' : 'Quantidade'}
          suffix={measure ? '×' : 'g'}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        {factor ? (
          <ToggleRow
            label="Pesei cozido"
            hint={`Cadastrado cru. Rende ${fmt(factor)}× ao cozinhar${cooked && g > 0 ? `: equivale a ${Math.round(g)} g cru` : ''}.`}
            value={cooked}
            onChange={setCooked}
          />
        ) : null}
        <Chips options={MEALS.map((m) => ({ value: m.key, label: m.label }))} value={meal} onChange={setMeal} />

        <View style={[styles.rowBetween, { marginBottom: 12 }]}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.protein }}>{Math.round(n.protein ?? 0)} g proteína</Text>
          <Text style={styles.macroValue}>{Math.round(n.kcal ?? 0)} kcal</Text>
        </View>
        <Button title="Adicionar ao diário" onPress={add} disabled={g <= 0} />
      </Card>

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

      {(food.per100g.protein ?? 0) > 3 ? (
        <Card>
          <Title>Qualidade da proteína</Title>
          <Text style={{ color: colors.text }}>Fonte: {source.label}</Text>
          <Muted>
            Leucina nesta quantidade: {fmt(leucineIn(food, g))} g (meta por refeição ≥ 2,5 g). Proteína ajustada pela qualidade (DIAAS):{' '}
            {Math.round(qualityAdjustedProtein(food, g))} g.
          </Muted>
        </Card>
      ) : null}

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
    </ScrollView>
  );
}
