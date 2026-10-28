// Registro rápido: texto livre, voz ou foto do prato (IA).
// O texto é interpretado no aparelho; a IA só entra quando algo não foi reconhecido ou na foto.

import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Badge, Button, Card, Chips, colors, Muted, parseInput, styles, Title } from '../components/ui';
import { defaultMeal, Food, Meal, MEALS, searchFoods, todayIso } from '../domain/foods';
import { parseFreeText, resolveItems } from '../domain/freeText';
import { scaleNutrients } from '../domain/nutrients';
import { FREE_AI_PHOTOS_PER_DAY } from '../domain/pro';
import { usePro } from '../hooks/usePro';
import { ai, AiItem, AiUnavailableError } from '../services/ai';
import { listen, speechSupported } from '../services/speech';
import { useAllFoods, useAppStore } from '../store/useAppStore';

type Item = {
  key: string;
  text: string;
  foodId?: string;
  grams: number;
  note?: string;
  /** Item da IA sem alimento correspondente na base: vira alimento próprio ao salvar. */
  ai?: AiItem;
};

let seq = 0;
const key = () => `i${++seq}`;

/** Usa o alimento da base quando a IA acerta o nome; senão guarda os valores estimados. */
function fromAi(items: AiItem[], foods: Food[]): Item[] {
  return items.map((it) => {
    const match = searchFoods(foods, it.searchQuery)[0];
    return match
      ? { key: key(), text: it.name, foodId: match.id, grams: Math.round(it.grams), note: `${Math.round(it.grams)} g (estimado)` }
      : { key: key(), text: it.name, grams: Math.round(it.grams), ai: it, note: `${Math.round(it.grams)} g (estimado)` };
  });
}

export default function QuickAddScreen() {
  const params = useLocalSearchParams<{ date?: string; mode?: 'text' | 'photo'; meal?: Meal }>();
  const date = params.date ?? todayIso();
  const foods = useAllFoods();
  const foodList = Object.values(foods);
  const addEntries = useAppStore((s) => s.addEntries);
  const addFood = useAppStore((s) => s.addFood);
  const aiUsage = useAppStore((s) => s.aiUsage);
  const countAiUse = useAppStore((s) => s.countAiUse);
  const isPro = usePro();

  const [mode, setMode] = useState<'text' | 'photo'>(params.mode ?? 'text');
  const [text, setText] = useState('');
  const [meal, setMeal] = useState<Meal>(params.meal ?? defaultMeal());
  const [items, setItems] = useState<Item[]>([]);
  const [unresolved, setUnresolved] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stopRef = useRef<() => void>(() => {});
  useEffect(() => () => stopRef.current(), []);

  const usedToday = aiUsage[todayIso()] ?? 0;
  const photosLeft = isPro ? Infinity : Math.max(0, FREE_AI_PHOTOS_PER_DAY - usedToday);

  const interpret = () => {
    setError(null);
    const resolved = resolveItems(parseFreeText(text), foodList);
    const ok = resolved.filter((r) => r.food && r.grams);
    setItems((old) => [...old, ...ok.map((r) => ({ key: key(), text: r.text, foodId: r.food!.id, grams: r.grams!, note: r.note }))]);
    setUnresolved(resolved.filter((r) => !r.food || !r.grams).map((r) => r.text));
    setText('');
  };

  const askAi = async (input: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await ai.parseText(input);
      setItems((old) => [...old, ...fromAi(res.items, foodList)]);
      setUnresolved([]);
      if (res.notes) setNotes(res.notes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha na IA.');
    } finally {
      setBusy(false);
    }
  };

  const toggleMic = () => {
    if (listening) {
      stopRef.current();
      setListening(false);
      return;
    }
    setListening(true);
    stopRef.current = listen(
      (t) => setText(t),
      () => setListening(false),
    );
  };

  const takePhoto = async (from: 'camera' | 'library') => {
    setError(null);
    if (photosLeft <= 0) {
      setError(`Você usou as ${FREE_AI_PHOTOS_PER_DAY} fotos grátis de hoje. Assine o Pro para fotos ilimitadas.`);
      return;
    }
    let result: ImagePicker.ImagePickerResult;
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', quality: 0.4, base64: true };
    if (from === 'camera' && Platform.OS !== 'web') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setError('Sem permissão de câmera.');
        return;
      }
      result = await ImagePicker.launchCameraAsync(opts);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(opts);
    }
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset?.base64) return;
    setPhotoUri(asset.uri);
    setBusy(true);
    try {
      const res = await ai.mealPhoto(asset.base64, asset.mimeType ?? 'image/jpeg', text || undefined);
      countAiUse(todayIso());
      setItems(fromAi(res.items, foodList));
      setNotes(res.notes || null);
    } catch (e) {
      setError(e instanceof AiUnavailableError || e instanceof Error ? e.message : 'Falha na IA.');
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    const list = items
      .filter((i) => i.grams > 0)
      .map((i) => {
        let foodId = i.foodId;
        if (!foodId && i.ai) {
          const g = Math.max(1, i.ai.grams);
          const f = addFood({
            name: `${i.ai.name} (estimativa IA)`,
            source: 'ai',
            per100g: {
              kcal: (i.ai.kcal / g) * 100,
              protein: (i.ai.protein / g) * 100,
              carbs: (i.ai.carbs / g) * 100,
              fat: (i.ai.fat / g) * 100,
            },
          });
          foodId = f.id;
        }
        return foodId ? { date, meal, foodId, grams: i.grams, note: i.note } : undefined;
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
    addEntries(list);
    router.dismissTo('/');
  };

  const nutrientsOf = (i: Item) => {
    if (i.foodId && foods[i.foodId]) return scaleNutrients(foods[i.foodId].per100g, i.grams);
    if (i.ai) {
      const f = i.grams / Math.max(1, i.ai.grams);
      return { kcal: i.ai.kcal * f, protein: i.ai.protein * f };
    }
    return {};
  };
  const totalP = items.reduce((s, i) => s + (nutrientsOf(i).protein ?? 0), 0);
  const totalK = items.reduce((s, i) => s + (nutrientsOf(i).kcal ?? 0), 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: mode === 'photo' ? 'Foto do prato' : 'Registro rápido' }} />
      <Chips
        options={[
          { value: 'text', label: 'Texto ou voz' },
          { value: 'photo', label: 'Foto do prato (IA)' },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === 'text' ? (
        <Card>
          <Muted style={{ marginBottom: 8 }}>Escreva ou fale o que comeu, como numa mensagem.</Muted>
          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="2 ovos, 150 g de arroz cozido e 1 concha de feijão"
              placeholderTextColor={colors.muted}
              style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
              multiline
            />
          </View>
          <View style={[styles.row, { marginTop: 10 }]}>
            <View style={{ flex: 1 }}>
              <Button title="Interpretar" onPress={interpret} disabled={!text.trim()} />
            </View>
            {speechSupported() ? (
              <View style={{ flex: 1 }}>
                <Button title={listening ? 'Parar' : '🎤 Falar'} variant="secondary" onPress={toggleMic} />
              </View>
            ) : null}
          </View>
          {!speechSupported() ? <Muted style={{ marginTop: 8 }}>Dica: use o microfone do teclado para ditar.</Muted> : null}
        </Card>
      ) : (
        <Card>
          <Muted style={{ marginBottom: 8 }}>
            A IA estima os alimentos e as porções pela foto. Confira e ajuste os pesos antes de salvar.{' '}
            {isPro ? 'Fotos ilimitadas (Pro).' : `${photosLeft} de ${FREE_AI_PHOTOS_PER_DAY} fotos grátis hoje.`}
          </Muted>
          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Dica opcional: marmita de frango com arroz integral"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </View>
          <View style={[styles.row, { marginTop: 10 }]}>
            {Platform.OS !== 'web' ? (
              <View style={{ flex: 1 }}>
                <Button title="Tirar foto" onPress={() => takePhoto('camera')} disabled={busy} />
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Button title="Escolher da galeria" variant="secondary" onPress={() => takePhoto('library')} disabled={busy} />
            </View>
          </View>
          {photoUri ? <Image source={{ uri: photoUri }} style={{ width: '100%', height: 200, borderRadius: 10, marginTop: 10 }} resizeMode="cover" /> : null}
          {!isPro && photosLeft <= 0 ? (
            <View style={{ marginTop: 10 }}>
              <Button title="Conhecer o Pro" variant="secondary" onPress={() => router.push('/pro')} />
            </View>
          ) : null}
        </Card>
      )}

      {busy ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? (
        <View style={styles.warning}>
          <Text style={styles.warningText}>{error}</Text>
        </View>
      ) : null}

      {unresolved.length > 0 ? (
        <Card>
          <Title>Não reconheci</Title>
          {unresolved.map((u) => (
            <Text key={u} style={{ color: colors.text }}>
              • {u}
            </Text>
          ))}
          <View style={[styles.row, { marginTop: 10 }]}>
            <View style={{ flex: 1 }}>
              <Button title="Perguntar à IA" variant="secondary" onPress={() => askAi(unresolved.join(', '))} disabled={busy} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Buscar manualmente" variant="secondary" onPress={() => router.push({ pathname: '/foods', params: { meal, date } })} />
            </View>
          </View>
        </Card>
      ) : null}

      {items.length > 0 ? (
        <Card>
          <Title>Conferir antes de salvar</Title>
          {items.map((i) => {
            const n = nutrientsOf(i);
            return (
              <View key={i.key} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View style={styles.rowBetween}>
                  <Text style={{ flex: 1, color: colors.text, fontWeight: '600' }}>{i.foodId ? foods[i.foodId]?.name : i.text}</Text>
                  {i.ai ? <Badge text={`IA · confiança ${i.ai.confidence}`} tone="warn" /> : null}
                </View>
                <Muted>“{i.text}”</Muted>
                <View style={[styles.rowBetween, { marginTop: 6 }]}>
                  <View style={[styles.inputRow, { width: 120 }]}>
                    <TextInput
                      value={String(i.grams)}
                      onChangeText={(t) => setItems(items.map((x) => (x.key === i.key ? { ...x, grams: parseInput(t) ?? 0, note: undefined } : x)))}
                      keyboardType="decimal-pad"
                      style={styles.input}
                    />
                    <Text style={styles.suffix}>g</Text>
                  </View>
                  <Text style={[styles.macroValue, { flex: 1, textAlign: 'right', marginHorizontal: 12 }]}>
                    {Math.round(n.kcal ?? 0)} kcal · {Math.round(n.protein ?? 0)} g P
                  </Text>
                  <Pressable onPress={() => setItems(items.filter((x) => x.key !== i.key))} hitSlop={8} accessibilityLabel="Remover">
                    <Text style={{ color: colors.danger, fontSize: 16 }}>✕</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
          {notes ? <Muted style={{ marginTop: 8 }}>{notes}</Muted> : null}
          <Text style={[styles.macroLabel, { marginTop: 10 }]}>
            Total: {Math.round(totalK)} kcal · {Math.round(totalP)} g de proteína
          </Text>
          <View style={{ height: 10 }} />
          <Chips options={MEALS.map((m) => ({ value: m.key, label: m.label }))} value={meal} onChange={setMeal} />
          <Button title={`Salvar ${items.length} item(ns)`} onPress={save} />
        </Card>
      ) : null}
    </ScrollView>
  );
}
