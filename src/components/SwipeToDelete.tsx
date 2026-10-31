// Linha que apaga ao deslizar para a esquerda (como no Hevy): o fundo vermelho
// com a lixeira aparece por baixo e, passando do limite, a linha sai e é apagada.
// Usa PanResponder do próprio React Native para funcionar no celular, web e desktop.

import Ionicons from '@expo/vector-icons/Ionicons';
import { ReactNode, useEffect, useState } from 'react';
import { Animated, PanResponder, Text, View } from 'react-native';

import { colors } from './ui';

const THRESHOLD = 90;

export function SwipeToDelete({
  children,
  onDelete,
  label,
}: {
  children: ReactNode;
  onDelete: () => void;
  label: string;
}) {
  const [x] = useState(() => new Animated.Value(0));
  const [width, setWidth] = useState(360);
  const [leaving, setLeaving] = useState(false);
  // Passou do limite: a linha sai pela esquerda e só então é apagada.
  useEffect(() => {
    if (!leaving) return;
    Animated.timing(x, { toValue: -width, duration: 160, useNativeDriver: false }).start(({ finished }) => {
      if (!finished) return;
      x.setValue(0);
      setLeaving(false);
      onDelete();
    });
  }, [leaving, width, x, onDelete]);
  const [pan] = useState(() =>
    PanResponder.create({
      // Só assume o gesto quando o movimento é claramente horizontal, para não brigar com a rolagem.
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => x.setValue(Math.min(0, g.dx)),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -THRESHOLD || g.vx < -0.8) {
          setLeaving(true);
        } else {
          Animated.spring(x, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 6,
          }).start();
        }
      },
      onPanResponderTerminate: () =>
        Animated.spring(x, { toValue: 0, useNativeDriver: false }).start(),
    }),
  );

  const reveal = x.interpolate({
    inputRange: [-THRESHOLD, -20, 0],
    outputRange: [1, 0.4, 0],
    extrapolate: 'clamp',
  });

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ borderRadius: 8, overflow: 'hidden' }}
      accessible={false}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.danger,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 6,
          paddingRight: 16,
          opacity: reveal,
        }}
      >
        <Ionicons name='trash-outline' size={18} color='#fff' />
        <Text style={{ color: '#fff', fontWeight: '700' }}>Apagar</Text>
      </Animated.View>
      <Animated.View
        {...pan.panHandlers}
        style={{ transform: [{ translateX: x }] }}
        accessibilityActions={[{ name: 'delete', label }]}
        onAccessibilityAction={(e) =>
          e.nativeEvent.actionName === 'delete' && onDelete()
        }
      >
        {children}
      </Animated.View>
    </View>
  );
}
