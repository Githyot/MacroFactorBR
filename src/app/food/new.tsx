import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, Text, View } from 'react-native';

import { Badge, Button, Card, colors, Field, Muted, parseInput, styles, Title, ToggleRow, useTheme } from '../../components/ui';
import { FoodSource, Meal } from '../../domain/foods';
import { computeHighIn, guessNameFromFront, HIGH_IN_LABEL, HighIn, parseHighInStamp } from '../../domain/labelFront';
import { parseNutritionLabel } from '../../domain/labelParser';
import { NUTRIENTS, NutrientKey, Nutrients } from '../../domain/nutrients';
import { FoodDraft } from '../../domain/openFoodFacts';
import { ai } from '../../services/ai';
import { hasBackend } from '../../services/config';
import { recognizeText } from '../../services/ocr';
import { publishFood } from '../../services/sharedFoods';
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
  useTheme();
  const params = useLocalSearchParams<{ barcode?: string; draft?: string; ocr?: string; meal?: Meal; date?: string }>();
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
  const [liquid, setLiquid] = useState(false);
  const [stampHighIn, setStampHighIn] = useState<HighIn[]>([]);
  const [share, setShare] = useState(true);

  const pickImage = async (from: 'camera' | 'library'): Promise<string | undefined> => {
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
    return result.canceled ? undefined : result.assets[0]?.uri;
  };

  /** Frente da embalagem: sugere nome/marca e lê os selos "ALTO EM". */
  const readFront = async (from: 'camera' | 'library') => {
    setError(null);
    const uri = await pickImage(from);
    if (!uri) return;
    setOcrBusy(true);
    try {
      const text = await recognizeText(uri);
      const guess = guessNameFromFront(text);
      if (guess.name && !name) setName(guess.name);
      if (guess.brand && !brand) setBrand(guess.brand);
      const stamps = parseHighInStamp(text);
      setStampHighIn(stamps);
      setOcrMessages([
        guess.name ? `Nome sugerido: ${guess.name}. Corrija se precisar.` : 'Não achei o nome na foto; digite abaixo.',
        ...(stamps.length ? [`Selos lidos: alto em ${stamps.map((h) => HIGH_IN_LABEL[h]).join(', ')}.`] : []),
      ]);
    } catch (e) {
      setError(Platform.OS === 'web' ? 'Falha ao ler a imagem.' : 'A leitura por foto precisa da versão instalada do app (development build).');
      console.warn(e);
    } finally {
      setOcrBusy(false);
    }
  };

  const readLabel = async (from: 'camera' | 'library') => {
    setError(null);
    const uri = await pickImage(from);
    if (!uri) return;

    setOcrBusy(true);
    try {
      const text = await recognizeText(uri);
      let parsed = parseNutritionLabel(text);
      // Leitura fraca: a IA organiza o texto que o OCR extraiu (só com conta e servidor configurados).
      if (parsed.found.length < 3 && hasBackend) {
        const structured = await ai.structureLabel(text).catch(() => undefined);
        if (structured) {
          const per100g = Object.fromEntries(Object.entries(structured.per100g).filter(([, v]) => v !== null)) as Nutrients;
          parsed = {
            ...parsed,
            per100g,
            found: Object.keys(per100g) as NutrientKey[],
            serving: structured.servingGrams
              ? { amount: structured.servingGrams, unit: structured.liquid ? 'ml' : 'g', description: structured.servingDescription ?? undefined } : parsed.serving,
            warnings: [...parsed.warnings, 'Valores organizados pela IA a partir da foto.'],
          };
          setLiquid(structured.liquid);
        }
      }
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

  const highIn = stampHighIn.length ? stampHighIn : computeHighIn(per100g, liquid);

  const save = () => {
    const food = addFood({
      liquid,
      highIn: highIn.length ? highIn : undefined,
      name: name.trim(),
      brand: brand.trim() || undefined,
      barcode: barcode.replace(/\D/g, '') || undefined,
      source,
      per100g,
      servingGrams: parseInput(servingGrams),
      servingDescription: servingDescription.trim() || undefined,
    });
    // Rótulo lido com código de barras ajuda os outros usuários (fica pendente até ser conferido).
    if (share && food.barcode && (source === 'label' || source === 'manual')) publishFood(food).catch(() => {});
    router.replace({
      pathname: '/food/[id]',
      params: { id: food.id, ...(params.meal ? { meal: params.meal } : {}), ...(params.date ? { date: params.date } : {}) },
    });
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
        {!ocrBusy ? (
          <View style={{ marginTop: 10 }}>
            <Button title="Foto da frente (nome e selos)" variant="secondary" onPress={() => readFront(Platform.OS === 'web' ? 'library' : 'camera')} />
          </View>
        ) : null}
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
        <View style={{ height: 12 }} />
        <ToggleRow label="É bebida (valores por 100 ml)" value={liquid} onChange={setLiquid} />
        {highIn.length ? (
          <View style={[styles.row, { gap: 6 }]}>
            {highIn.map((h) => (
              <Badge key={h} text={`ALTO EM ${HIGH_IN_LABEL[h].toUpperCase()}`} tone="danger" />
            ))}
          </View>
        ) : null}
      </Card>

      {hasBackend && barcode ? (
        <Card>
          <ToggleRow
            label="Compartilhar com a comunidade"
            hint="Outros usuários que escanearem este código recebem os valores. Fica marcado como não conferido até 2 pessoas confirmarem."
            value={share}
            onChange={setShare}
          />
        </Card>
      ) : null}

      <Button title="Salvar alimento" onPress={save} disabled={!canSave} />
      {!canSave ? <Muted>Preencha pelo menos nome, calorias e proteína.</Muted> : null}
    </ScrollView>
  );
}
