import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { ComponentProps, useEffect, useRef } from 'react';
import { ColorValue, Pressable, View } from 'react-native';

import { ScreenHeader } from '../../components/dash';
import { ModeSwitch, useAppMode } from '../../components/ModeSwitch';
import { useHeaderOptions } from '../../components/navTheme';
import { colors, isGlass, useTheme } from '../../components/ui';
import { useHydrated } from '../../store/useAppStore';


type IconName = ComponentProps<typeof Ionicons>['name'];

const icon = (name: IconName, focusedName: IconName = name) =>
  function TabIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
    return <Ionicons name={focused ? focusedName : name} color={typeof color === 'number' ? undefined : (color ?? undefined)} size={size} />;
  };

/** Botão redondo preto no meio da barra: abre a tela de adicionar alimento. */
function AddButton({ onPress }: { onPress?: (e: never) => void }) {
  return (
    <Pressable onPress={onPress as never} accessibilityRole="button" accessibilityLabel="Adicionar alimento" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="add" size={30} color={colors.onPrimary} />
      </View>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { def } = useTheme();
  const { background, ...header } = useHeaderOptions();
  const glass = isGlass();
  const mode = useAppMode();
  const hydrated = useHydrated();
  const pathname = usePathname();
  const opened = useRef(false);
  // Abre direto no modo em que o app foi deixado.
  useEffect(() => {
    if (!hydrated || opened.current) return;
    opened.current = true;
    if (mode === 'treino' && pathname === '/') router.replace('/home');
  }, [hydrated, mode, pathname]);
  const diet = mode === 'dieta';
  // href: null esconde a aba do outro modo sem desmontar as rotas.
  const only = (show: boolean) => (show ? {} : { href: null });
  // No modo Dieta o cabeçalho é o título grande da própria tela.
  const bigHeader = { header: ({ options }: { options: { title?: string } }) => <ScreenHeader title={options.title ?? ''} /> };
  return (
    <Tabs
      screenOptions={{
        ...header,
        tabBarActiveTintColor: diet ? colors.text : colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.bar,
          borderTopColor: colors.border,
          borderTopWidth: def.shape.headerBorder || diet ? 1 : 0,
          ...(glass ? { backdropFilter: 'blur(20px) saturate(180%)' } : {}),
        },
        tabBarLabelStyle: def.webFont ? { fontFamily: def.webFont } : undefined,
        sceneStyle: { backgroundColor: background },
        headerRight: () => <ModeSwitch />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Painel', headerShown: false, tabBarIcon: icon('grid-outline', 'grid'), ...only(diet) }} />
      <Tabs.Screen name="diario" options={{ title: 'Diário', ...bigHeader, tabBarIcon: icon('nutrition-outline', 'nutrition'), ...only(diet) }} />
      <Tabs.Screen
        name="foods"
        // href e tabBarButton não podem andar juntos: no modo Treino a aba só some.
        options={{ title: 'Adicionar', ...bigHeader, ...(diet ? { tabBarButton: (p) => <AddButton onPress={p.onPress as never} /> } : { href: null }) }}
      />
      <Tabs.Screen name="plano" options={{ title: 'Estratégia', ...bigHeader, tabBarIcon: icon('compass-outline', 'compass'), ...only(diet) }} />
      <Tabs.Screen name="profile" options={{ title: diet ? 'Perfil' : 'Configurações', ...(diet ? bigHeader : {}), tabBarIcon: icon('person-outline', 'person'), ...only(diet) }} />
      <Tabs.Screen name="home" options={{ title: 'Início', tabBarIcon: icon('home-outline', 'home'), ...only(!diet) }} />
      <Tabs.Screen name="workout" options={{ title: 'Treino', tabBarIcon: icon('barbell-outline', 'barbell'), ...only(!diet) }} />
      <Tabs.Screen name="athlete" options={{ title: 'Perfil', tabBarIcon: icon('person-outline', 'person'), ...only(!diet) }} />
    </Tabs>
  );
}
