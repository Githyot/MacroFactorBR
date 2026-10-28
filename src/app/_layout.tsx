import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '../components/ui';

export default function RootLayout() {
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
      </Stack>
    </>
  );
}
