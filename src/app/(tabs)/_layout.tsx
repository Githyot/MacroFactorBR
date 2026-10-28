import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import { ComponentProps } from 'react';
import { ColorValue } from 'react-native';

import { colors } from '../../components/ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

const icon = (name: IconName) =>
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={typeof color === 'number' ? undefined : (color ?? undefined)} size={size} />;
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        sceneStyle: { backgroundColor: colors.bg },
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
