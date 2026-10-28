import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Badge, Button, Card, colors, LinkText, Muted, styles } from '../../components/ui';
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
  { value: 'all', label: 'Todos' },
  { value: 'favorites', label: 'Favoritos' },
  { value: 'recent', label: 'Recentes' },
  { value: 'recipes', label: 'Receitas' },
  { value: 'supplements', label: 'Suplementos' },
  { value: 'dishes', label: 'Pratos típicos' },
  { value: 'meals', label: 'Refeições salvas' },
];

export default function FoodsScreen() {
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
  const [segment, setSegment] = useState<Segment>('all');
  const [importCode, setImportCode] = useState('');
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const list = useMemo(() => {
    let base = Object.values(foods);
    if (segment === 'favorites') base = favorites.map((id) => foods[id]).filter(Boolean);
    if (segment === 'recent') base = recentFoodIds(entries, meal, 30).map((id) => foods[id]).filter(Boolean);
    if (segment === 'recipes') base = base.filter((f) => f.kind === 'recipe');
    if (segment === 'supplements') base = base.filter((f) => f.kind === 'supplement');
    if (segment === 'dishes') base = base.filter((f) => f.kind === 'dish');
    if (segment === 'recent' && !query) return base;
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

  const header = (
    <View style={{ gap: 12 }}>
      <View style={styles.inputRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar: frango, arroz, whey, aipim, código…"
          placeholderTextColor={colors.muted}
          style={styles.input}
          autoCorrect={false}
        />
      </View>
      <View style={styles.row}>
        <View style={{ flex: 1, minWidth: 120 }}>
          <Button title="Escanear código" onPress={() => router.push({ pathname: '/scan', params: { ...(meal ? { meal } : {}), date } })} />
        </View>
        <View style={{ flex: 1, minWidth: 120 }}>
          <Button
            title="Foto da tabela"
            variant="secondary"
            onPress={() => router.push({ pathname: '/food/new', params: { ocr: '1', ...(meal ? { meal } : {}), date } })}
          />
        </View>
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
          <View style={[styles.inputRow, { marginTop: 12 }]}>
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
          <Muted>Nenhuma refeição salva. Na tela Hoje, toque em “Salvar refeição” embaixo de uma refeição registrada.</Muted>
        ) : (
          savedMeals.map((m) => {
            const target = meal ?? MEALS[0].key;
            return (
              <Card key={m.id}>
                <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 4 }}>{m.name}</Text>
                <Muted style={{ marginBottom: 8 }}>{m.items.map((i) => foods[i.foodId]?.name ?? '?').join(', ')}</Muted>
                <View style={styles.rowBetween}>
                  <LinkText
                    onPress={() => {
                      addEntries(m.items.map((i) => ({ ...i, date, meal: target })));
                      router.navigate('/');
                    }}
                  >
                    Adicionar em {MEALS.find((x) => x.key === target)?.label}
                  </LinkText>
                  <LinkText onPress={() => deleteSavedMeal(m.id)}>Excluir</LinkText>
                </View>
              </Card>
            );
          })
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
        contentContainerStyle={[styles.content, { gap: 8 }]}
        initialNumToRender={20}
        ListEmptyComponent={
          <View style={{ gap: 12 }}>
            <Muted>
              {segment === 'favorites'
                ? 'Nenhum favorito ainda. Toque na estrela ao abrir um alimento.'
                : segment === 'recent'
                  ? 'Você ainda não registrou nada.'
                  : 'Nenhum alimento encontrado.'}
            </Muted>
            {segment === 'all' ? <Button title="Cadastrar manualmente" variant="secondary" onPress={() => router.push('/food/new')} /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              item.kind === 'recipe' && segment === 'recipes'
                ? router.push({ pathname: '/recipe/[id]', params: { id: item.id.replace(/^recipe-/, '') } })
                : router.push({ pathname: '/food/[id]', params: { id: item.id, ...(meal ? { meal } : {}), date } })
            }
            style={({ pressed }) => [styles.card, { paddingVertical: 12 }, pressed && { opacity: 0.7 }]}
          >
            <View style={styles.rowBetween}>
              <Text style={{ flex: 1, fontWeight: '600', color: colors.text }}>
                {favorites.includes(item.id) ? '★ ' : ''}
                {item.name}
                {item.brand ? <Text style={{ color: colors.muted, fontWeight: '400' }}> · {item.brand}</Text> : null}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>{SOURCE_LABEL[item.source]}</Text>
            </View>
            <Text style={styles.macroValue}>
              100 g: {Math.round(item.per100g.kcal ?? 0)} kcal · P {item.per100g.protein ?? 0} g · C {item.per100g.carbs ?? 0} g · G{' '}
              {item.per100g.fat ?? 0} g
            </Text>
            {item.highIn?.length ? (
              <View style={[styles.row, { gap: 6, marginTop: 6 }]}>
                <Badge text={`Alto em ${item.highIn.length} item(ns)`} tone="warn" />
              </View>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}
