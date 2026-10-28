import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { Button, Card, colors, Field, Muted, styles, Title } from '../components/ui';
import { isValidGtin, Meal } from '../domain/foods';
import { fetchOffProduct } from '../domain/openFoodFacts';
import { findSharedByBarcode, sharedToFood } from '../services/sharedFoods';
import { findFoodByBarcode, useAllFoods, useAppStore } from '../store/useAppStore';

export default function ScanScreen() {
  const { meal, date } = useLocalSearchParams<{ meal?: Meal; date?: string }>();
  const addFood = useAppStore((s) => s.addFood);
  const [permission, requestPermission] = useCameraPermissions();
  const foods = useAllFoods();
  const [status, setStatus] = useState<string | null>(null);
  const [manual, setManual] = useState('');
  const busy = useRef(false);

  const handleCode = async (raw: string) => {
    const code = raw.replace(/\D/g, '');
    if (busy.current || !code) return;
    busy.current = true;
    const mealParam = { ...(meal ? { meal } : {}), ...(date ? { date } : {}) };
    try {
      // 1) Já cadastrado neste aparelho
      const local = findFoodByBarcode(foods, code);
      if (local) {
        router.replace({ pathname: '/food/[id]', params: { id: local.id, ...mealParam } });
        return;
      }
      setStatus('Procurando o produto…');
      // 2) Base compartilhada pelos usuários do app (rótulos brasileiros lidos por foto)
      const shared = await findSharedByBarcode(code).catch(() => undefined);
      if (shared && shared.status !== 'rejected') {
        const food = addFood(sharedToFood(shared));
        router.replace({ pathname: '/food/[id]', params: { id: food.id, ...mealParam } });
        return;
      }
      // 3) Base aberta Open Food Facts (você revisa antes de salvar)
      const draft = await fetchOffProduct(code).catch(() => undefined);
      if (draft) {
        router.replace({ pathname: '/food/new', params: { barcode: code, draft: JSON.stringify(draft), ...mealParam } });
        return;
      }
      // 4) Produto novo: fotografe a tabela nutricional e o app preenche tudo
      router.replace({ pathname: '/food/new', params: { barcode: code, ocr: '1', ...mealParam } });
    } finally {
      busy.current = false;
      setStatus(null);
    }
  };

  const onScanned = (r: BarcodeScanningResult) => {
    if (isValidGtin(r.data)) handleCode(r.data);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {!permission ? null : permission.granted ? (
        <View style={{ height: 320, borderRadius: 14, overflow: 'hidden', backgroundColor: '#000' }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
            onBarcodeScanned={status ? undefined : onScanned}
          />
        </View>
      ) : (
        <Card>
          <Title>Permitir câmera</Title>
          <Muted style={{ marginBottom: 12 }}>A câmera é usada para ler o código de barras das embalagens.</Muted>
          <Button title="Permitir" onPress={requestPermission} />
        </Card>
      )}

      {status ? (
        <View style={[styles.row, { alignItems: 'center' }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ color: colors.text }}>{status}</Text>
        </View>
      ) : (
        <Muted>Aponte para o código de barras da embalagem.</Muted>
      )}

      <Card>
        <Title>Digitar o código</Title>
        <Field label="Código de barras (EAN)" keyboardType="number-pad" value={manual} onChangeText={setManual} placeholder="7891234567890" />
        <Button
          title="Buscar"
          onPress={() => handleCode(manual)}
          disabled={!isValidGtin(manual.replace(/\D/g, ''))}
        />
      </Card>
    </ScrollView>
  );
}
