// Botão ⓘ e a folha "Como executar" com a animação e as dicas do exercício.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Exercise, EQUIPMENT_LABEL, MUSCLE_LABEL } from '../domain/workout/exercises';
import { boldParts, howTo } from '../domain/workout/howto';
import { ExerciseAnimation } from './ExerciseAnimation';
import { colors, styles } from './ui';

function Rich({ text }: { text: string }) {
  return (
    <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22, flex: 1 }}>
      {boldParts(text).map((p, i) => (
        <Text key={i} style={p.bold ? { fontWeight: '700' } : undefined}>
          {p.text}
        </Text>
      ))}
    </Text>
  );
}

/** Lista de dicas (usada na folha e no cartão da tela do exercício). */
export function HowToList({ ex }: { ex: Exercise }) {
  const { steps, intensity, generic } = howTo(ex);
  return (
    <View style={{ gap: 8 }}>
      {generic ? <Text style={styles.muted}>Exercício criado por você: orientações gerais.</Text> : null}
      {[...steps, ...(intensity ? [intensity] : [])].map((s, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={{ color: colors.primary, fontSize: 15, lineHeight: 22 }}>•</Text>
          <Rich text={s} />
        </View>
      ))}
    </View>
  );
}

export function HowToSheet({ ex, visible, onClose }: { ex: Exercise; visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={onClose} accessibilityLabel="Fechar" />
      <View style={{ maxHeight: '88%', backgroundColor: colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border }} />
          <View style={[styles.rowBetween, { alignItems: 'flex-start' }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{ex.name}</Text>
              <Text style={styles.muted}>
                {MUSCLE_LABEL[ex.primary]}
                {ex.secondary.length ? ` · ${ex.secondary.map((m) => MUSCLE_LABEL[m]).join(', ')}` : ''} · {EQUIPMENT_LABEL[ex.equipment]}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Fechar">
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <View style={{ alignItems: 'center' }}>
            <ExerciseAnimation exerciseId={ex.id} size={200} />
          </View>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700' }}>Como executar</Text>
          <HowToList ex={ex} />
        </ScrollView>
      </View>
    </Modal>
  );
}

/** Botão ⓘ que abre a folha "Como executar". */
export function InfoButton({ ex, size = 22 }: { ex: Exercise; size?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} hitSlop={10} accessibilityLabel={`Como executar ${ex.name}`}>
        <Ionicons name="information-circle-outline" size={size} color={colors.primary} />
      </Pressable>
      {open ? <HowToSheet ex={ex} visible onClose={() => setOpen(false)} /> : null}
    </>
  );
}
