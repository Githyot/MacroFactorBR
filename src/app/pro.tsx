import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button, Card, colors, Muted, styles, Title, ToggleRow } from '../components/ui';
import { PRO_FEATURES, PRO_PRICES, ProFeature } from '../domain/pro';
import { usePro } from '../hooks/usePro';
import { config } from '../services/config';
import { buy, getPlans, purchasesAvailable, restore } from '../services/purchases';
import { useAppStore } from '../store/useAppStore';

type Plan = Awaited<ReturnType<typeof getPlans>>[number];

export default function ProScreen() {
  const isPro = usePro();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (purchasesAvailable()) getPlans().then(setPlans).catch(() => setPlans([]));
  }, []);

  const purchase = async (p: Plan) => {
    try {
      const ok = await buy(p.pkg as never);
      updateSettings({ proActive: ok });
      setMsg(ok ? 'Bem-vindo ao Pro!' : 'Compra não concluída.');
    } catch {
      setMsg('Compra cancelada.');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'MacroFactorBR Pro' }} />
      <Card>
        <Title>Sempre grátis</Title>
        <Muted>Diário, scanner de código de barras, leitura da tabela nutricional, metas de proteína, base TACO completa e sem anúncios.</Muted>
      </Card>
      <Card style={{ borderColor: colors.primary, borderWidth: 2 }}>
        <Title>Pro</Title>
        {(Object.keys(PRO_FEATURES) as ProFeature[]).map((k) => (
          <Text key={k} style={{ color: colors.text, marginBottom: 6 }}>
            ✓ {PRO_FEATURES[k]}
          </Text>
        ))}
        <Text style={[styles.macroLabel, { marginTop: 8 }]}>
          {PRO_PRICES.monthly} ou {PRO_PRICES.yearly}
        </Text>
      </Card>

      {!config.paywallEnabled ? (
        <Card>
          <Muted>Durante o beta, todos os recursos Pro estão liberados de graça.</Muted>
        </Card>
      ) : isPro && settings.proActive ? (
        <Card>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>Sua assinatura Pro está ativa.</Text>
        </Card>
      ) : purchasesAvailable() ? (
        <View style={{ gap: 8 }}>
          {plans.map((p) => (
            <Button key={p.id} title={`${p.title} · ${p.price}`} onPress={() => purchase(p)} />
          ))}
          {plans.length === 0 ? <Muted>Carregando planos…</Muted> : null}
          <Button
            title="Restaurar compra"
            variant="secondary"
            onPress={async () => {
              const ok = await restore().catch(() => false);
              updateSettings({ proActive: ok });
              setMsg(ok ? 'Assinatura restaurada.' : 'Nenhuma assinatura encontrada.');
            }}
          />
        </View>
      ) : (
        <Card>
          <Muted style={{ marginBottom: 8 }}>Assinaturas estão disponíveis no app para Android e iOS.</Muted>
          <ToggleRow label="Modo de teste do Pro" value={Boolean(settings.proOverride)} onChange={(v) => updateSettings({ proOverride: v })} />
        </Card>
      )}
      {msg ? <Muted style={{ color: colors.primary }}>{msg}</Muted> : null}
    </ScrollView>
  );
}
