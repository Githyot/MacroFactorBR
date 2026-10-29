// Execução do exercício em loop: alterna os 2 quadros (posição inicial e final)
// com uma transição suave, como um GIF. Miniaturas mostram só o primeiro quadro.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Animated, Easing, Image, View } from 'react-native';

import { exerciseFrames } from '../domain/workout/media';
import { colors } from './ui';

export function ExerciseAnimation({ exerciseId, size, animate = true, round = false }: { exerciseId: string; size: number; animate?: boolean; round?: boolean }) {
  const frames = exerciseFrames(exerciseId);
  const [fade] = useState(() => new Animated.Value(0));
  const [failed, setFailed] = useState(false);

  const first = frames?.[0];
  useEffect(() => {
    if (!animate || !first) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(fade, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(500),
        Animated.timing(fade, { toValue: 0, duration: 450, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, first, fade]);

  // As imagens têm fundo branco: o quadro fica branco também no tema escuro.
  const box = { width: size, height: size, borderRadius: round ? size / 2 : Math.min(16, size / 6), overflow: 'hidden' as const, backgroundColor: '#fff' };

  if (!frames || failed) {
    return (
      <View style={[box, { backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="barbell-outline" size={size * 0.5} color={colors.muted} />
      </View>
    );
  }

  const img = { width: size, height: size, position: 'absolute' as const };
  return (
    <View style={box} accessibilityRole="image" accessibilityLabel="Demonstração do exercício">
      <Image source={{ uri: frames[0] }} style={img} resizeMode="contain" onError={() => setFailed(true)} />
      {animate ? <Animated.Image source={{ uri: frames[1] }} style={[img, { opacity: fade }]} resizeMode="contain" /> : null}
    </View>
  );
}
