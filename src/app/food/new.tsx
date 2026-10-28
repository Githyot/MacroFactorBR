import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, Text, View } from 'react-native';

import { Button, Card, colors, Field, Muted, parseInput, styles, Title } from '../../components/ui';
import { FoodSource, Meal } from '../../domain/foods';
import { parseNutritionLabel } from '../../domain/labelParser';
import { NUTRIENTS, NutrientKey, Nutrients } from '../../domain/nutrients';
import { FoodDraft } from '../../domain/openFoodFacts';
import { recognizeText } from '../../services/ocr';
import { useAppStore } from '../../store/useAppStore';

function toText(n: Nutrients): Partial<Record<NutrientKey, string>> {
  return Object.fromEntries(Object.entries(n).map(([k, v]) => [k, String(v).replace('.', ',')]));
}

function readDraft(raw?: string): FoodDraft | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as FoodDraft;
  } catch {
    return undefined;
  }
}

export default function NewFoodScreen() {
  const params = useLocalSearchParams<{ barcode?: string; draft?: string; ocr?: string; meal?: Meal }>();
  const addFood = useAppStore((s) => s.addFood);
  const [draft] = useState(() => readDraft(params.draft));

  const [name, setName] = useState(draft?.name ?? '');
  const [brand, setBrand] = useState(draft?.brand ?? '');
  const [barcode, setBarcode] = useState(params.barcode ?? draft?.barcode ?? '');
  const [servingGrams, setServingGrams] = useState(draft?.servingGrams ? String(draft.servingGrams) : '');
  const [servingDescription, setServingDescription] = useState(draft?.servingDescription ?? '');
  const [values, setValues] = useState<Partial<Record<NutrientKey, string>>>(draft ? toText(draft.per100g) : {});
  const [source, setSource] = useState<FoodSource>(draft ? 'openfoodfacts' : 'manual');
  const [showMicros, setShowMicros] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrMessages, setOcrMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const readLabel = async (from: 'camera' | 'library') => {
    setError(null);
    let result: ImagePicker.ImagePickerResult;
    if (from === 'camera' && Platform.OS !== 'web') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setError('Sem permissão de câmera.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 1 });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 1 });
    }
    if (result.canceled || !result.assets[0]) return;

    setOcrBusy(true);
    try {
      const text = await recognizeText(result.assets[0].uri);
      const parsed = parseNutritionLabel(text);
      if (parsed.found.length === 0) {
        setError('Não consegui ler a tabela. Tente uma foto mais próxima, reta e com boa luz.');
        return;
      }
      setValues((old) => ({ ...old, ...toText(parsed.per100g) }));
      if (parsed.serving) {
        setServingGrams(String(parsed.serving.amount));
        if (parsed.serving.description) setServingDescription(parsed.serving.description);
      }
      setSource('label');
      setShowMicros(parsed.found.some((k) => NUTRIENTS.find((n) => n.key === k)?.group === 'micro'));
      setOcrMessages([`Li ${parsed.found.length} nutrientes da tabela. Confira os números antes de salvar.`, ...parsed.warnings]);
    } catch (e) {
      setError(
        Platform.OS === 'web'
          ? 'Falha ao ler a imagem.'
          : 'O leitor de tabela precisa da versão instalada do app (development build). No Expo Go, digite os valores.',
      );
      console.warn(e);
    } finally {
      setOcrBusy(false);
    }
  };

  const per100g: Nutrients = Object.fromEntries(
    Object.entries(values)
      .map(([k, v]) => [k, parseInput(v ?? '')])
      .filter(([, v]) => v !== undefined),
  );
  const canSave = name.trim().length > 0 && per100g.kcal !== undefined && per100g.protein !== undefined;

  const save = () => {
    const food = addFood({
      name: name.trim(),
      brand: brand.trim() || undefined,
      barcode: barcode.replace(/\D/g, '') || undefined,
      source,
      per100g,
      servingGrams: parseInput(servingGrams),
      servingDescription: servingDescription.trim() || undefined,
    });
    router.replace({ pathname: '/food/[id]', params: { id: food.id, ...(params.meal ? { meal: params.meal } : {}) } });
  };

  const visible = NUTRIENTS.filter((n) => showMicros || n.group !== 'micro');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card style={params.ocr ? { borderColor: colors.primary, borderWidth: 2 } : undefined}>
        <Title>Foto da tabela nutricional</Title>
        <Muted style={{ marginBottom: 12 }}>
          {params.barcode && !draft
            ? `Código ${params.barcode} ainda não está na base. Fotografe a tabela e o app preenche os valores e liga ao código de barras.`
            : 'Fotografe a tabela da embalagem e o app preenche os valores por 100 g.'}
        </Muted>
        {ocrBusy ? (
          <View style={[styles.row, { alignItems: 'center' }]}>
            <ActivityIndicator color={colors.primary} />
            <Text>Lendo a tabela…</Text>
          </View>
        ) : (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Button title={Platform.OS === 'web' ? 'Enviar foto' : 'Tirar foto'} onPress={() => readLabel('camera')} />
            </View>
            {Platform.OS !== 'web' ? (
              <View style={{ flex: 1 }}>
                <Button title="Da galeria" variant="secondary" onPress={() => readLabel('library')} />
              </View>
            ) : null}
          </View>
        )}
        {ocrMessages.length > 0 ? (
          <View style={[styles.warning, { marginTop: 12 }]}>
            {ocrMessages.map((m) => (
              <Text key={m} style={styles.warningText}>
                • {m}
              </Text>
            ))}
          </View>
        ) : null}
        {error ? <Text style={{ color: colors.danger, marginTop: 12 }}>{error}</Text> : null}
      </Card>

      {draft ? (
        <View style={styles.warning}>
          <Text style={styles.warningText}>Encontrei este produto na Open Food Facts. Revise os valores (ou fotografe a tabela) e salve.</Text>
        </View>
      ) : null}

      <Card>
        <Title>Produto</Title>
        <Field label="Nome" value={name} onChangeText={setName} placeholder="Ex.: Whey Protein Baunilha" />
        <Field label="Marca" value={brand} onChangeText={setBrand} />
        <Field label="Código de barras" keyboardType="number-pad" value={barcode} onChangeText={setBarcode} />
        <View style={styles.row}>
          <Field label="Porção" suffix="g" keyboardType="decimal-pad" value={servingGrams} onChangeText={setServingGrams} />
          <Field label="Medida caseira" value={servingDescription} onChangeText={setServingDescription} placeholder="1 scoop" />
        </View>
      </Card>

      <Card>
        <Title>Valores por 100 g</Title>
        <View style={styles.row}>
          {visible.map((n) => (
            <Field
              key={n.key}
              label={n.label}
              suffix={n.unit}
              keyboardType="decimal-pad"
              value={values[n.key] ?? ''}
              onChangeText={(t) => setValues((v) => ({ ...v, [n.key]: t }))}
            />
          ))}
        </View>
        <Button title={showMicros ? 'Ocultar micronutrientes' : 'Mostrar micronutrientes'} variant="secondary" onPress={() => setShowMicros((s) => !s)} />
      </Card>

      <Button title="Salvar alimento" onPress={save} disabled={!canSave} />
      {!canSave ? <Muted>Preencha pelo menos nome, calorias e proteína.</Muted> : null}
    </ScrollView>
  );
}
