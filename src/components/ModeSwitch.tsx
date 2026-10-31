// O app tem dois modos: Dieta (Hoje, Alimentos, Progresso, Perfil) e Treino
// (Início, Treino, Perfil, no layout do Hevy). O seletor fica no cabeçalho das abas.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useAppStore } from '../store/useAppStore';
import { colors } from './ui';

export type AppMode = 'dieta' | 'treino';

export function useAppMode(): AppMode {
  return useAppStore((s) => s.settings.appMode ?? 'dieta');
}

export function switchMode(mode: AppMode) {
  useAppStore.getState().updateSettings({ appMode: mode });
  router.replace(mode === 'treino' ? '/home' : '/');
}

export function ModeSwitch({ compact }: { compact?: boolean } = {}) {
  const mode = useAppMode();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.cardAlt, borderRadius: 999, padding: 3, marginRight: compact ? 0 : 12 }} accessibilityRole="tablist">
      {(
        [
          ['dieta', 'Dieta', 'nutrition-outline'],
          ['treino', 'Treino', 'barbell-outline'],
        ] as const
      ).map(([m, label, icon]) => {
        const on = mode === m;
        return (
          <Pressable
            key={m}
            onPress={() => !on && switchMode(m)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`Modo ${label}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: compact ? 7 : 5, paddingHorizontal: compact ? 12 : 10, borderRadius: 999, backgroundColor: on ? colors.primary : 'transparent' }}
          >
            <Ionicons name={icon} size={compact ? 18 : 14} color={on ? colors.onPrimary : colors.muted} />
            {compact ? null : <Text style={{ color: on ? colors.onPrimary : colors.muted, fontWeight: '700', fontSize: 13 }}>{label}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}
