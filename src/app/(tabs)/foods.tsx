import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

import { ActionTile, ListCard, ListRow } from '../../components/diet';
import { Badge, Button, Card, colors, LinkText, Muted, styles, useTheme } from '../../components/ui';
import { Food, Meal, MEALS, recentFoodIds, searchFoods, todayIso } from '../../domain/foods';
import { decodeRecipe } from '../../domain/recipes';
import { useAllFoods, useAppStore } from '../../store/useAppStore';

const SOURCE_LABEL: Record<Food['source'], string> = {
  taco: 'TACO',
  label: 'Rótulo',
  openfoodfacts: 'Open Food Facts',
  manual: 'Manual',
  recipe: 'Receita',
  shared: 'Comunidade',
  ai: 'IA',
};

type Segment = 'all' | 'favorites' | 'recent' | 'recipes' | 'supplements' | 'dishes' | 'meals';

const SEGMENTS: { value: Segment; label: string }[] = [
  { value: 'recent', label: 'Recentes' },
  { value: 'favorites', label: 'Favoritos' },
  { value: 'meals', label: 'Refeições' },
  { value: 'recipes', label: 'Receitas' },
  { value: 'all', label: 'Todos' },
  { value: 'supplements', label: 'Suplementos' },
  { value: 'dishes', label: 'Pratos típicos' },
];

export default function FoodsScreen() {
  useTheme();
  const params = useLocalSearchParams<{ meal?: Meal; date?: string }>();
  const meal = params.meal;
  const date = params.date ?? todayIso();
  const foods = useAllFoods();
  const favorites = useAppStore((s) => s.favorites);
  const entries = useAppStore((s) => s.entries);
  const savedMeals = useAppStore((s) => s.savedMeals);
  const addEntries = useAppStore((s) => s.addEntries);
  const deleteSavedMeal = useAppStore((s) => s.deleteSavedMeal);
  const saveRecipe = useAppStore((s) => s.saveRecipe);
  const addFood = useAppStore((s) => s.addFood);
  const [query, setQuery] = useState('');
  // Quem já registrou algo começa pelos recentes; quem está começando, pela base toda.
  const [segment, setSegment] = useState<Segment>(() => (useAppStore.getState().entries.length ? 'recent' : 'all'));
  const [importCode, setImportCode] = useState('');
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const list = useMemo(() => {
    let base = Object.values(foods).filter((f) => !f.archived);
    if (segment === 'favorites') base = favorites.map((id) => foods[id]).filter(Boolean);
    // Digitar a partir de Recentes busca na base toda.
    if (segment === 'recent' && !query) base = recentFoodIds(entries, meal, 30).map((id) => foods[id]).filter(Boolean);
    if (segment === 'recipes') base = base.filter((f) => f.kind === 'recipe');
    if (segment === 'supplements') base = base.filter((f) => f.kind === 'supplement');
    if (segment === 'dishes') base = base.filter((f) => f.kind === 'dish');
    if (segment === 'recent' && !query) return base.filter((f) => !f.archived);
    // Alimentos cadastrados por você aparecem primeiro.
    base = [...base].sort((a, b) =>
      a.source === 'taco' && b.source !== 'taco' ? 1 : b.source === 'taco' && a.source !== 'taco' ? -1 : a.name.localeCompare(b.name, 'pt-BR'),
    );
    return searchFoods(base, query);
  }, [foods, query, segment, favorites, entries, meal]);

  const importRecipe = () => {
    const data = decodeRecipe(importCode);
    if (!data) {
      setImportMsg('Código inválido. Ele começa com MFBR1:');
      return;
    }
    // Cada ingrediente vira um alimento seu, com os valores de quem compartilhou.
    const ingredients = data.items.map((i) => {
      const existing = Object.values(foods).find((f) => f.name === i.name);
      const food = existing ?? addFood({ name: i.name, source: 'manual', per100g: i.per100g });
      return { foodId: food.id, grams: i.grams };
    });
    const recipe = saveRecipe({ name: data.name, portions: data.portions, cookedWeightGrams: data.cooked, ingredients });
    setImportCode('');
    setImportMsg(null);
    router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } });
  };

  const mealLabel = MEALS.find((x) => x.key === meal)?.label;
  const ctx = { ...(meal ? { meal } : {}), date };
  const header = (
    <View style={{ gap: 12, marginBottom: 12 }}>
      {mealLabel ? (
        <View style={[styles.soft, { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 }]}>
          <Ionicons name="restaurant-outline" size={16} color={colors.primary} />
          <Text style={{ color: colors.text, fontWeight: '600' }}>
            Adicionando em {mealLabel}
            <Text style={{ color: colors.muted, fontWeight: '400' }}> · {date === todayIso() ? 'hoje' : date.split('-').reverse().slice(0, 2).join('/')}</Text>
          </Text>
        </View>
      ) : null}
      <View style={[styles.inputRow, { paddingLeft: 12 }]}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar: frango, arroz, whey, aipim, código…"
          placeholderTextColor={colors.muted}
          style={styles.input}
          autoCorrect={false}
        />
        {query ? (
          <Pressable accessibilityLabel="Limpar busca" onPress={() => setQuery('')} hitSlop={8} style={{ paddingRight: 12 }}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ActionTile icon="barcode-outline" label="Código" onPress={() => router.push({ pathname: '/scan', params: ctx })} />
        <ActionTile icon="document-text-outline" label="Foto da tabela" onPress={() => router.push({ pathname: '/food/new', params: { ocr: '1', ...ctx } })} />
        <ActionTile icon="create-outline" label="Manual" onPress={() => router.push({ pathname: '/food/new', params: ctx })} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {SEGMENTS.map((s) => (
          <Pressable
            key={s.value}
            onPress={() => setSegment(s.value)}
            style={[styles.chip, segment === s.value && styles.chipActive]}
            accessibilityState={{ selected: segment === s.value }}
          >
            <Text style={[styles.chipText, segment === s.value && styles.chipTextActive]}>{s.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {segment === 'recipes' ? (
        <Card>
          <Button title="Nova receita ou marmita" onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: 'new' } })} />
          <Muted style={{ marginTop: 12, marginBottom: 6, fontSize: 13 }}>Recebeu uma receita de alguém? Cole o código:</Muted>
          <View style={styles.inputRow}>
            <TextInput
              value={importCode}
              onChangeText={setImportCode}
              placeholder="Colar código de receita (MFBR1:…)"
              placeholderTextColor={colors.muted}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {importCode ? (
            <View style={{ marginTop: 8 }}>
              <Button title="Importar receita" variant="secondary" onPress={importRecipe} />
            </View>
          ) : null}
          {importMsg ? <Muted style={{ color: colors.danger, marginTop: 6 }}>{importMsg}</Muted> : null}
        </Card>
      ) : null}
    </View>
  );

  if (segment === 'meals') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {header}
        {savedMeals.length === 0 ? (
          <Muted>Nenhuma refeição salva. No Hoje, toque em ⋯ numa refeição registrada e escolha “Salvar como refeição”.</Muted>
        ) : (
          <ListCard>
            {savedMeals.map((m, i) => {
              const target = meal ?? MEALS[0].key;
              return (
                <ListRow
                  key={m.id}
                  first={i === 0}
                  icon="bookmark-outline"
                  title={m.name}
                  subtitle={m.items.map((x) => foods[x.foodId]?.name ?? '?').join(', ')}
                  right={
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <LinkText
                        onPress={() => {
                          addEntries(m.items.map((x) => ({ ...x, date, meal: target })));
                          router.navigate('/diario');
                        }}
                      >
                        + {MEALS.find((x) => x.key === target)?.label}
                      </LinkText>
                      <Pressable onPress={() => deleteSavedMeal(m.id)} hitSlop={6}>
                        <Text style={{ color: colors.muted, fontSize: 13 }}>Excluir</Text>
                      </Pressable>
                    </View>
                  }
                />
              );
            })}
          </ListCard>
        )}
      </ScrollView>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={list}
        keyExtractor={(f) => f.id}
        ListHeaderComponent={header}
        contentContainerStyle={[styles.content, { gap: 0 }]}
        initialNumToRender={20}
        ListEmptyComponent={
          <View style={{ gap: 12 }}>
            <Muted>
              {segment === 'favorites'
                ? 'Nenhum favorito ainda. Toque na estrela ao abrir um alimento.'
                : segment === 'recent'
                  ? 'Você ainda não registrou nada.'
                  : `Nenhum alimento encontrado${query ? ` para “${query}”` : ''}.`}
            </Muted>
            {segment === 'all' || query ? <Button title="Cadastrar manualmente" variant="secondary" onPress={() => router.push({ pathname: '/food/new', params: ctx })} /> : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() =>
              item.kind === 'recipe' && segment === 'recipes'
                ? router.push({ pathname: '/recipe/[id]', params: { id: item.id.replace(/^recipe-/, '') } })
                : router.push({ pathname: '/food/[id]', params: { id: item.id, ...ctx } })
            }
            style={({ pressed }) => [
              styles.card,
              {
                paddingVertical: 11,
                borderRadius: 0,
                borderTopWidth: index ? 1 : 0,
                borderTopColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              },
              index === 0 && { borderTopLeftRadius: styles.card.borderRadius, borderTopRightRadius: styles.card.borderRadius },
              index === list.length - 1 && { borderBottomLeftRadius: styles.card.borderRadius, borderBottomRightRadius: styles.card.borderRadius },
              pressed && { opacity: 0.7 },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: colors.text, fontSize: 15 }} numberOfLines={2}>
                {favorites.includes(item.id) ? <Text style={{ color: colors.carbs }}>★ </Text> : null}
                {item.name}
                {item.brand ? <Text style={{ color: colors.muted, fontWeight: '400' }}> · {item.brand}</Text> : null}
              </Text>
              <Text style={[styles.macroValue, { fontSize: 13, marginTop: 2 }]}>
                {Math.round(item.per100g.kcal ?? 0)} kcal · P {item.per100g.protein ?? 0} · C {item.per100g.carbs ?? 0} · G {item.per100g.fat ?? 0}
                <Text style={{ fontSize: 12 }}> /100 g · {SOURCE_LABEL[item.source]}</Text>
              </Text>
              {item.highIn?.length ? (
                <View style={{ marginTop: 4 }}>
                  <Badge text={`Alto em ${item.highIn.length} item(ns)`} tone="warn" />
                </View>
              ) : null}
            </View>
            <Ionicons name="add-circle" size={26} color={colors.primary} />
          </Pressable>
        )}
      />
    </View>
  );
}
