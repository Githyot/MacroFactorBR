// Peças compartilhadas pelas telas do modo Treino (layout no estilo Hevy).

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ComponentProps, ReactNode, useState } from 'react';
import { Modal, Pressable, Share, Text, View } from 'react-native';

import { Exercise } from '../domain/workout/exercises';
import { fmtDuration, fmtNumber, PERIOD_LABEL, Period, relativeDay, Totals } from '../domain/workout/stats';
import { completedSets, Workout, workoutDurationMin, workoutVolume } from '../domain/workout/training';
import { ExerciseAnimation } from './ExerciseAnimation';
import { colors, styles } from './ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type SheetOption = { label: string; icon: IconName; onPress: () => void; danger?: boolean; selected?: boolean };

/** Menu que sobe de baixo, como as folhas de ações do Hevy. */
export function ActionSheet({ visible, title, options, onClose }: { visible: boolean; title?: string; options: SheetOption[]; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={onClose} accessibilityLabel="Fechar menu" />
      <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 32 }}>
        <View style={{ maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 12 }} />
          {title ? <Text style={{ color: colors.text, textAlign: 'center', fontWeight: '700', marginBottom: 12 }}>{title}</Text> : null}
          <View style={[styles.card, { padding: 0 }]}>
            {options.map((o, i) => (
              <Pressable
                key={o.label}
                onPress={() => {
                  onClose();
                  o.onPress();
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 15,
                  paddingHorizontal: 16,
                  borderTopWidth: i ? 1 : 0,
                  borderTopColor: colors.border,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Ionicons name={o.icon} size={20} color={o.danger ? colors.danger : colors.text} />
                <Text style={{ flex: 1, fontSize: 16, color: o.danger ? colors.danger : colors.text }}>{o.label}</Text>
                {o.selected ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : null}
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Botão "Últimos 30 dias ▾" que abre a escolha do período. */
export function PeriodPicker({ value, onChange, options }: { value: Period; onChange: (p: Period) => void; options: Period[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={[styles.soft, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 }]}>
        <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>{PERIOD_LABEL[value]}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.text} />
      </Pressable>
      <ActionSheet
        visible={open}
        onClose={() => setOpen(false)}
        options={options.map((p) => ({ label: PERIOD_LABEL[p], icon: 'calendar-outline', selected: p === value, onPress: () => onChange(p) }))}
      />
    </>
  );
}

/** Pílulas de escolha única (Duração / Volume / Reps). */
export function Pills<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityState={{ selected: on }}
            style={{ paddingVertical: 7, paddingHorizontal: 16, borderRadius: 999, backgroundColor: on ? colors.primary : colors.cardAlt }}
          >
            <Text style={{ color: on ? colors.onPrimary : colors.text, fontWeight: on ? '700' : '500' }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Número grande com a variação em relação ao período anterior (↑ 4 / ↓ 7). */
export function StatTile({ label, value, delta, format }: { label: string; value: number; delta?: number; format: (v: number) => string }) {
  const up = (delta ?? 0) >= 0;
  return (
    <View style={[styles.card, { flex: 1, minWidth: 140 }]}>
      <Text style={{ color: colors.text, fontSize: 15 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 2 }}>{format(value)}</Text>
      {delta !== undefined && delta !== 0 ? (
        <Text style={{ color: up ? colors.primary : colors.muted, fontSize: 13, marginTop: 2 }}>
          {up ? '↑' : '↓'} {format(Math.abs(delta))}
        </Text>
      ) : null}
    </View>
  );
}

export function StatGrid({ now, before }: { now: Totals; before?: Totals }) {
  const d = (k: keyof Totals) => (before ? now[k] - before[k] : undefined);
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <StatTile label="Treinos" value={now.workouts} delta={d('workouts')} format={(v) => fmtNumber(v)} />
        <StatTile label="Duração" value={now.durationMin} delta={d('durationMin')} format={fmtDuration} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <StatTile label="Volume" value={now.volume} delta={d('volume')} format={(v) => `${fmtNumber(Math.round(v))} kg`} />
        <StatTile label="Séries" value={now.sets} delta={d('sets')} format={(v) => fmtNumber(v)} />
      </View>
    </View>
  );
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={[styles.rowBetween, { marginTop: 6 }]}>
      <Text style={{ color: colors.muted, fontSize: 15 }}>{children}</Text>
      {right}
    </View>
  );
}

/** Linha de exercício com miniatura (listas de principais exercícios, recordes…). */
export function ExerciseRow({ ex, subtitle, onPress, right }: { ex: Exercise; subtitle?: ReactNode; onPress?: () => void; right?: ReactNode }) {
  return (
    <Pressable
      onPress={onPress ?? (() => router.push({ pathname: '/exercise/[id]', params: { id: ex.id } }))}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, opacity: pressed ? 0.6 : 1 })}
    >
      <ExerciseAnimation exerciseId={ex.id} size={52} animate={false} round />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 16 }}>{ex.name}</Text>
        {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
      </View>
      {right ?? <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
    </Pressable>
  );
}

export function shareWorkout(w: Workout, exercises: Record<string, Exercise>) {
  const lines = w.exercises
    .filter((e) => e.sets.some((s) => s.done))
    .map((e) => `• ${e.sets.filter((s) => s.done).length}× ${exercises[e.exerciseId]?.name ?? 'Exercício'}`);
  Share.share({
    message: `${w.name} 💪\n${fmtDuration(workoutDurationMin(w))} · ${fmtNumber(Math.round(workoutVolume(w)))} kg · ${completedSets(w)} séries\n${lines.join('\n')}\n\nRegistrado no MacroFactorBR`,
  }).catch(() => {});
}

/** Cartão do treino no feed (Início e Perfil), como no Hevy. */
export function WorkoutCard({
  w,
  exercises,
  records,
  todayIso,
  userName,
}: {
  w: Workout;
  exercises: Record<string, Exercise>;
  records: number;
  todayIso: string;
  userName?: string;
}) {
  const done = w.exercises.filter((e) => e.sets.some((s) => s.done));
  const shown = done.slice(0, 3);
  return (
    <View style={styles.card}>
      <Pressable onPress={() => router.push({ pathname: '/training/[id]', params: { id: w.id } })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.onPrimarySoft, fontWeight: '800', fontSize: 16 }}>{(userName ?? 'V').slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{userName ?? 'Você'}</Text>
            <Text style={styles.muted}>{relativeDay(w.startedAt, todayIso)}</Text>
          </View>
        </View>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>{w.name}</Text>
        <View style={{ flexDirection: 'row', gap: 28, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View>
            <Text style={[styles.muted, { fontSize: 12 }]}>Tempo</Text>
            <Text style={{ color: colors.text, fontSize: 16 }}>{fmtDuration(workoutDurationMin(w))}</Text>
          </View>
          <View>
            <Text style={[styles.muted, { fontSize: 12 }]}>Volume</Text>
            <Text style={{ color: colors.text, fontSize: 16 }}>{fmtNumber(Math.round(workoutVolume(w)))} kg</Text>
          </View>
          {records > 0 ? (
            <View>
              <Text style={[styles.muted, { fontSize: 12 }]}>Recordes</Text>
              <Text style={{ color: colors.text, fontSize: 16 }}>🏅 {records}</Text>
            </View>
          ) : null}
        </View>
        {shown.map((e, i) => (
          <View key={`${e.exerciseId}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 10 }}>
            <ExerciseAnimation exerciseId={e.exerciseId} size={40} animate={false} round />
            <Text style={{ color: colors.text, fontSize: 15, flex: 1 }}>
              {e.sets.filter((s) => s.done).length} séries · {exercises[e.exerciseId]?.name ?? 'Exercício'}
            </Text>
          </View>
        ))}
        {done.length > shown.length ? (
          <Text style={[styles.muted, { textAlign: 'center', marginTop: 10 }]}>
            Ver mais {done.length - shown.length} {done.length - shown.length === 1 ? 'exercício' : 'exercícios'}
          </Text>
        ) : null}
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 24, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Pressable onPress={() => shareWorkout(w, exercises)} hitSlop={8} accessibilityLabel="Compartilhar treino" style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Ionicons name="share-outline" size={20} color={colors.text} />
          <Text style={{ color: colors.text }}>Compartilhar</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Botão quadrado do painel (Estatísticas, Exercícios, Medidas, Calendário). */
export function DashButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.soft, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 14, opacity: pressed ? 0.6 : 1 }]}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: '500' }}>{label}</Text>
    </Pressable>
  );
}
