import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { ComponentProps, useEffect, useRef } from 'react';
import { ColorValue } from 'react-native';

import { ModeSwitch, useAppMode } from '../../components/ModeSwitch';
import { useHeaderOptions } from '../../components/navTheme';
import { colors, isGlass, useTheme } from '../../components/ui';
import { useHydrated } from '../../store/useAppStore';


type IconName = ComponentProps<typeof Ionicons>['name'];

const icon = (name: IconName) =>
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={typeof color === 'number' ? undefined : (color ?? undefined)} size={size} />;
  };

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
  return (
    <Tabs
      screenOptions={{
        ...header,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.bar,
          borderTopColor: colors.border,
          borderTopWidth: def.shape.headerBorder ? 1 : 0,
          ...(glass ? { backdropFilter: 'blur(20px) saturate(180%)' } : {}),
        },
        tabBarLabelStyle: def.webFont ? { fontFamily: def.webFont } : undefined,
        sceneStyle: { backgroundColor: background },
        headerRight: () => <ModeSwitch />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Hoje', tabBarIcon: icon('today-outline'), ...only(diet) }} />
      <Tabs.Screen name="foods" options={{ title: 'Alimentos', tabBarIcon: icon('nutrition-outline'), ...only(diet) }} />
      <Tabs.Screen name="plano" options={{ title: 'Plano', tabBarIcon: icon('calendar-outline'), ...only(diet) }} />
      <Tabs.Screen name="progress" options={{ title: 'Progresso', tabBarIcon: icon('trending-up-outline'), ...only(diet) }} />
      <Tabs.Screen name="profile" options={{ title: diet ? 'Perfil' : 'Configurações', tabBarIcon: icon('person-outline'), ...only(diet) }} />
      <Tabs.Screen name="home" options={{ title: 'Início', tabBarIcon: icon('home-outline'), ...only(!diet) }} />
      <Tabs.Screen name="workout" options={{ title: 'Treino', tabBarIcon: icon('barbell-outline'), ...only(!diet) }} />
      <Tabs.Screen name="athlete" options={{ title: 'Perfil', tabBarIcon: icon('person-outline'), ...only(!diet) }} />
    </Tabs>
  );
}
