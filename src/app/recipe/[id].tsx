import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';

import { Button, Card, colors, Field, LinkText, Muted, parseInput, styles, Title } from '../../components/ui';
import { searchFoods } from '../../domain/foods';
import { scaleNutrients } from '../../domain/nutrients';
import { encodeRecipe, RecipeIngredient, recipeFinalWeight, recipeTotals } from '../../domain/recipes';
import { useAllFoods, useAppStore } from '../../store/useAppStore';

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const existing = useAppStore((s) => (id && id !== 'new' ? s.recipes[id] : undefined));
  const saveRecipe = useAppStore((s) => s.saveRecipe);
  const deleteRecipe = useAppStore((s) => s.deleteRecipe);
  const foods = useAllFoods();

  const [name, setName] = useState(existing?.name ?? '');
  const [portions, setPortions] = useState(String(existing?.portions ?? 5));
  const [cooked, setCooked] = useState(existing?.cookedWeightGrams ? String(existing.cookedWeightGrams) : '');
  const [items, setItems] = useState<RecipeIngredient[]>(existing?.ingredients ?? []);
  const [query, setQuery] = useState('');
  const [code, setCode] = useState<string | null>(null);

  // Ingredientes não podem ser outras receitas (evita ciclos).
  const results = useMemo(
    () => (query.trim().length < 2 ? [] : searchFoods(Object.values(foods).filter((f) => f.kind !== 'recipe'), query).slice(0, 6)),
    [foods, query],
  );

  const draft = {
    id: existing?.id ?? 'draft',
    name: name.trim() || 'Receita',
    ingredients: items.filter((i) => i.grams > 0),
    portions: Math.max(1, Math.round(parseInput(portions) ?? 1)),
    cookedWeightGrams: parseInput(cooked),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  const total = recipeTotals(draft, foods);
  const perPortion = scaleNutrients(total, 100 / draft.portions);
  const portionGrams = recipeFinalWeight(draft) / draft.portions;

  const save = () => {
    const saved = saveRecipe({ ...draft, id: existing?.id });
    router.replace({ pathname: '/food/[id]', params: { id: `recipe-${saved.id}` } });
  };

  const share = async () => {
    const c = encodeRecipe(draft, foods);
    setCode(c);
    try {
      await Share.share({ message: `Receita "${draft.name}" no MacroFactorBR. Cole em Alimentos > Receitas:\n${c}` });
    } catch {
      // Sem compartilhamento nativo: o código fica na tela para copiar.
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: existing ? 'Editar receita' : 'Nova receita' }} />
      <Card>
        <Field label="Nome" value={name} onChangeText={setName} placeholder="Ex.: Marmita frango com batata-doce" />
        <View style={styles.row}>
          <Field label="Porções (marmitas)" keyboardType="number-pad" value={portions} onChangeText={setPortions} />
          <Field label="Peso pronto (opcional)" suffix="g" keyboardType="decimal-pad" value={cooked} onChangeText={setCooked} />
        </View>
        <Muted>Pese os ingredientes crus e, se puder, a panela pronta sem a panela: a água que evapora muda os valores por grama.</Muted>
      </Card>

      <Card>
        <Title>Ingredientes</Title>
        {items.length === 0 ? <Muted style={{ marginBottom: 8 }}>Busque e adicione os ingredientes abaixo.</Muted> : null}
        {items.map((it, idx) => (
          <View key={`${it.foodId}-${idx}`} style={[styles.rowBetween, { gap: 8, marginBottom: 6 }]}>
            <Text style={{ flex: 1, color: colors.text }} numberOfLines={2}>
              {foods[it.foodId]?.name ?? 'Alimento removido'}
            </Text>
            <View style={[styles.inputRow, { width: 110 }]}>
              <TextInput
                value={String(it.grams)}
                onChangeText={(t) => setItems(items.map((x, i) => (i === idx ? { ...x, grams: parseInput(t) ?? 0 } : x)))}
                keyboardType="decimal-pad"
                style={styles.input}
              />
              <Text style={styles.suffix}>g</Text>
            </View>
            <Pressable onPress={() => setItems(items.filter((_, i) => i !== idx))} hitSlop={8} accessibilityLabel="Remover ingrediente">
              <Text style={{ color: colors.danger, fontSize: 16 }}>✕</Text>
            </Pressable>
          </View>
        ))}
        <View style={[styles.inputRow, { marginTop: 8 }]}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Adicionar ingrediente: peito de frango cru…"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCorrect={false}
          />
        </View>
        {results.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => {
              setItems([...items, { foodId: f.id, grams: 100 }]);
              setQuery('');
            }}
            style={{ paddingVertical: 8 }}
          >
            <Text style={{ color: colors.primary }}>+ {f.name}</Text>
          </Pressable>
        ))}
      </Card>

      <Card>
        <Title>Por marmita (~{Math.round(portionGrams)} g)</Title>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.protein }}>{Math.round(perPortion.protein ?? 0)} g proteína</Text>
        <Muted>
          {Math.round(perPortion.kcal ?? 0)} kcal · C {Math.round(perPortion.carbs ?? 0)} g · G {Math.round(perPortion.fat ?? 0)} g
        </Muted>
        <Muted style={{ marginTop: 6 }}>
          Receita inteira: {Math.round(total.kcal ?? 0)} kcal · {Math.round(total.protein ?? 0)} g de proteína
        </Muted>
      </Card>

      <Button title="Salvar receita" onPress={save} disabled={draft.ingredients.length === 0 || !name.trim()} />
      {draft.ingredients.length > 0 ? <Button title="Compartilhar código" variant="secondary" onPress={share} /> : null}
      {code ? (
        <Card>
          <Muted style={{ marginBottom: 6 }}>Envie este código para um amigo colar em Alimentos › Receitas:</Muted>
          <Text selectable style={{ color: colors.text, fontFamily: 'monospace', fontSize: 12 }}>
            {code}
          </Text>
        </Card>
      ) : null}
      {existing ? (
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <LinkText
            onPress={() => {
              deleteRecipe(existing.id);
              router.back();
            }}
          >
            Excluir receita
          </LinkText>
        </View>
      ) : null}
    </ScrollView>
  );
}
