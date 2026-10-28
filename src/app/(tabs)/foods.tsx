import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { Button, colors, Muted, styles } from '../../components/ui';
import { Food, Meal, searchFoods } from '../../domain/foods';
import { useAllFoods } from '../../store/useAppStore';

const SOURCE_LABEL: Record<Food['source'], string> = {
  taco: 'TACO',
  label: 'Rótulo',
  openfoodfacts: 'Open Food Facts',
  manual: 'Manual',
};

export default function FoodsScreen() {
  const { meal } = useLocalSearchParams<{ meal?: Meal }>();
  const foods = useAllFoods();
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    // Alimentos cadastrados por você aparecem primeiro.
    const all = Object.values(foods).sort((a, b) =>
      a.source === 'taco' && b.source !== 'taco' ? 1 : b.source === 'taco' && a.source !== 'taco' ? -1 : a.name.localeCompare(b.name, 'pt-BR'),
    );
    return searchFoods(all, query);
  }, [foods, query]);

  return (
    <View style={styles.screen}>
      <View style={[styles.content, { paddingBottom: 0 }]}>
        <View style={styles.inputRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar: frango, arroz, whey, código de barras…"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCorrect={false}
          />
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Button title="Escanear código" onPress={() => router.push({ pathname: '/scan', params: meal ? { meal } : {} })} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Foto da tabela" variant="secondary" onPress={() => router.push({ pathname: '/food/new', params: { ocr: '1', ...(meal ? { meal } : {}) } })} />
          </View>
        </View>
      </View>
      <FlatList
        data={list}
        keyExtractor={(f) => f.id}
        contentContainerStyle={[styles.content, { gap: 8 }]}
        ListEmptyComponent={
          <View style={{ gap: 12 }}>
            <Muted>Nenhum alimento encontrado.</Muted>
            <Button title="Cadastrar manualmente" variant="secondary" onPress={() => router.push('/food/new')} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/food/[id]', params: { id: item.id, ...(meal ? { meal } : {}) } })}
            style={({ pressed }) => [styles.card, { paddingVertical: 12 }, pressed && { opacity: 0.7 }]}
          >
            <View style={styles.rowBetween}>
              <Text style={{ flex: 1, fontWeight: '600', color: colors.text }}>
                {item.name}
                {item.brand ? <Text style={{ color: colors.muted, fontWeight: '400' }}> · {item.brand}</Text> : null}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>{SOURCE_LABEL[item.source]}</Text>
            </View>
            <Text style={styles.macroValue}>
              100 g: {Math.round(item.per100g.kcal ?? 0)} kcal · P {item.per100g.protein ?? 0} g · C {item.per100g.carbs ?? 0} g · G{' '}
              {item.per100g.fat ?? 0} g
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
