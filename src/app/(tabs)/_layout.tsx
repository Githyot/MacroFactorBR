import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import { ComponentProps } from 'react';
import { ColorValue } from 'react-native';

import { useHeaderOptions } from '../../components/navTheme';
import { colors, isGlass, useTheme } from '../../components/ui';


type IconName = ComponentProps<typeof Ionicons>['name'];

const icon = (name: IconName) =>
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={typeof color === 'number' ? undefined : (color ?? undefined)} size={size} />;
  };

export default function TabsLayout() {
  const { def } = useTheme();
  const { background, ...header } = useHeaderOptions();
  const glass = isGlass();
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
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Hoje', tabBarIcon: icon('today-outline') }} />
      <Tabs.Screen name="foods" options={{ title: 'Alimentos', tabBarIcon: icon('nutrition-outline') }} />
      <Tabs.Screen name="workout" options={{ title: 'Treino', tabBarIcon: icon('barbell-outline') }} />
      <Tabs.Screen name="progress" options={{ title: 'Progresso', tabBarIcon: icon('trending-up-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: icon('person-outline') }} />
    </Tabs>
  );
}
