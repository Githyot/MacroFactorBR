import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { colors } from '../components/ui';
import { initPurchases, isProActive } from '../services/purchases';
import { currentUserId, supabase } from '../services/supabase';
import { pullAndMerge, startAutoSync } from '../services/sync';
import { useAppStore, useHydrated } from '../store/useAppStore';

/** Depois de carregar os dados locais: sincroniza com a conta (se houver) e confere a assinatura. */
function useBackgroundServices() {
  const hydrated = useHydrated();
  useEffect(() => {
    if (!hydrated) return;
    let stopSync: (() => void) | undefined;
    const startForSession = async () => {
      const userId = await currentUserId();
      await initPurchases(userId).catch(() => {});
      isProActive()
        .then((active) => {
          if (active !== Boolean(useAppStore.getState().settings.proActive)) useAppStore.getState().updateSettings({ proActive: active });
        })
        .catch(() => {});
      if (!userId) return;
      await pullAndMerge().catch((e) => console.warn('sync', e));
      stopSync ??= startAutoSync();
    };
    startForSession();
    const sub = supabase?.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') startForSession();
      if (event === 'SIGNED_OUT') {
        stopSync?.();
        stopSync = undefined;
      }
    });
    return () => {
      stopSync?.();
      sub?.data.subscription.unsubscribe();
    };
  }, [hydrated]);
}

export default function RootLayout() {
  useBackgroundServices();
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
          headerBackTitle: 'Voltar',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ title: 'Escanear código de barras', presentation: 'modal' }} />
        <Stack.Screen name="food/new" options={{ title: 'Novo alimento' }} />
        <Stack.Screen name="food/[id]" options={{ title: 'Adicionar ao diário' }} />
        <Stack.Screen name="recipe/[id]" options={{ title: 'Receita' }} />
        <Stack.Screen name="quick-add" options={{ title: 'Registro rápido' }} />
        <Stack.Screen name="checkin" options={{ title: 'Check-in semanal' }} />
        <Stack.Screen name="micros" options={{ title: 'Micronutrientes' }} />
        <Stack.Screen name="account" options={{ title: 'Conta e dados' }} />
        <Stack.Screen name="pro" options={{ title: 'MacroFactorBR Pro', presentation: 'modal' }} />
      </Stack>
    </>
  );
}
