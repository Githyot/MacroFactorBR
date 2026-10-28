// Treino ao vivo: séries com carga e repetições, coluna "Anterior", timer de descanso,
// sugestão de progressão e recordes ao terminar.

import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, Vibration, View } from 'react-native';

import { Button, Card, colors, LinkText, Muted, parseInput, styles, useTheme } from '../../components/ui';
import { Exercise } from '../../domain/workout/exercises';
import {
  completedSets,
  previousSets,
  SetType,
  suggestNext,
  WorkoutExercise,
  WorkoutSet,
  workoutVolume,
} from '../../domain/workout/training';
import { useAllExercises, useAppStore } from '../../store/useAppStore';

const REST_OPTIONS = [0, 60, 90, 120, 150, 180, 240];
const TYPE_ORDER: SetType[] = ['normal', 'warmup', 'failure', 'drop'];
const TYPE_TAG: Record<SetType, string> = { normal: '', warmup: 'A', failure: 'F', drop: 'D' };

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.max(0, Math.floor(sec % 60))).padStart(2, '0')}`;
const num = (n?: number) => (n === undefined ? '' : String(n).replace('.', ','));

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function NumInput({ value, placeholder, onChange, width = 64 }: { value?: number; placeholder?: string; onChange: (v?: number) => void; width?: number }) {
  // Texto local para permitir digitar "82," antes do decimal.
  const [text, setText] = useState(num(value));
  const [seen, setSeen] = useState(value);
  // Valor mudou por fora (ex.: ✓ preencheu a sugestão): atualiza o texto.
  if (value !== seen) {
    setSeen(value);
    if (parseInput(text) !== value) setText(num(value));
  }
  return (
    <TextInput
      value={text}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      keyboardType="decimal-pad"
      selectTextOnFocus
      onChangeText={(t) => {
        setText(t);
        onChange(parseInput(t));
      }}
      style={{
        width,
        textAlign: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: colors.cardAlt,
        color: colors.text,
        fontSize: 16,
        fontVariant: ['tabular-nums'],
      }}
    />
  );
}

function ExerciseBlock({
  ex,
  item,
  index,
  prev,
  showRpe,
  onChange,
  onRemove,
  onDone,
}: {
  ex: Exercise;
  item: WorkoutExercise;
  index: number;
  prev: WorkoutSet[];
  showRpe: boolean;
  onChange: (fn: (e: WorkoutExercise) => WorkoutExercise) => void;
  onRemove: () => void;
  onDone: (restSec: number) => void;
}) {
  const suggestion = ex.kind === 'weight_reps' ? suggestNext(ex, prev, item.repRange) : undefined;
  const isDuration = ex.kind === 'duration';
  const usesWeight = ex.kind === 'weight_reps';
  let normalCount = 0;

  const setAt = (i: number, patch: Partial<WorkoutSet>) => onChange((e) => ({ ...e, sets: e.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

  return (
    <Card>
      <View style={styles.rowBetween}>
        <Pressable style={{ flex: 1 }} onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: ex.id } })}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>{ex.name}</Text>
        </Pressable>
        <LinkText onPress={onRemove}>Remover</LinkText>
      </View>
      <View style={[styles.row, { marginBottom: 6 }]}>
        <Pressable
          onPress={() => onChange((e) => ({ ...e, restSec: REST_OPTIONS[(REST_OPTIONS.indexOf(e.restSec) + 1) % REST_OPTIONS.length] ?? 90 }))}
          hitSlop={6}
        >
          <Text style={styles.muted}>⏱ Descanso: {item.restSec ? mmss(item.restSec) : 'desligado'}</Text>
        </Pressable>
        {item.repRange ? (
          <Text style={styles.muted}>
            Alvo: {item.repRange[0]}–{item.repRange[1]} reps
          </Text>
        ) : null}
      </View>
      {suggestion ? <Muted style={{ marginBottom: 8, color: colors.primary }}>💡 {suggestion.reason}</Muted> : null}

      <View style={[styles.rowBetween, { marginBottom: 4 }]}>
        <Text style={[styles.fieldLabel, { width: 40 }]}>SÉRIE</Text>
        <Text style={[styles.fieldLabel, { flex: 1 }]}>ANTERIOR</Text>
        {usesWeight ? <Text style={[styles.fieldLabel, { width: 64, textAlign: 'center' }]}>KG</Text> : null}
        <Text style={[styles.fieldLabel, { width: 64, textAlign: 'center' }]}>{isDuration ? 'MIN' : 'REPS'}</Text>
        {showRpe ? <Text style={[styles.fieldLabel, { width: 44, textAlign: 'center' }]}>RPE</Text> : null}
        <View style={{ width: 40 }} />
      </View>
      {item.sets.map((s, i) => {
        if (s.type !== 'warmup') normalCount++;
        const label = s.type === 'normal' ? String(normalCount) : TYPE_TAG[s.type];
        const p = prev.filter((x) => x.type !== 'warmup')[s.type === 'warmup' ? -1 : normalCount - 1];
        // Sem histórico, a série acima neste treino serve de sugestão.
        const above = item.sets.slice(0, i).reverse().find((x) => x.type === s.type && (x.weightKg !== undefined || x.reps !== undefined));
        const hintKg = suggestion?.weightKg ?? p?.weightKg ?? above?.weightKg;
        const hintReps = s.type === 'warmup' ? (above?.reps ?? 10) : (suggestion?.reps ?? p?.reps ?? above?.reps ?? item.repRange?.[0] ?? 10);
        const prevText = p ? (isDuration ? `${Math.round((p.durationSec ?? 0) / 60)} min` : usesWeight ? `${num(p.weightKg)} kg × ${p.reps}` : `${p.reps} reps`) : '–';
        return (
          <View
            key={i}
            style={[styles.rowBetween, { gap: 6, paddingVertical: 3, borderRadius: 8, backgroundColor: s.done ? colors.primarySoft : 'transparent' }]}
          >
            <Pressable
              onPress={() => setAt(i, { type: TYPE_ORDER[(TYPE_ORDER.indexOf(s.type) + 1) % TYPE_ORDER.length] })}
              onLongPress={() => onChange((e) => ({ ...e, sets: e.sets.filter((_, j) => j !== i) }))}
              style={{ width: 40, alignItems: 'center' }}
              accessibilityLabel={`Série ${label}. Toque para mudar o tipo, segure para apagar.`}
            >
              <Text style={{ fontWeight: '700', color: s.type === 'warmup' ? colors.carbs : s.type === 'normal' ? colors.text : colors.danger }}>{label}</Text>
            </Pressable>
            <Text style={[styles.muted, { flex: 1, fontSize: 13 }]} numberOfLines={1}>
              {prevText}
            </Text>
            {usesWeight ? (
              <NumInput value={s.weightKg} placeholder={num(hintKg) || '0'} onChange={(v) => setAt(i, { weightKg: v })} />
            ) : null}
            {isDuration ? (
              <NumInput
                value={s.durationSec !== undefined ? Math.round(s.durationSec / 6) / 10 : undefined}
                placeholder={p?.durationSec ? num(Math.round(p.durationSec / 60)) : '0'}
                onChange={(v) => setAt(i, { durationSec: v !== undefined ? Math.round(v * 60) : undefined })}
              />
            ) : (
              <NumInput
                value={s.reps}
                placeholder={String(hintReps)}
                onChange={(v) => setAt(i, { reps: v !== undefined ? Math.round(v) : undefined })}
              />
            )}
            {showRpe ? <NumInput width={44} value={s.rpe} placeholder="–" onChange={(v) => setAt(i, { rpe: v })} /> : null}
            <Pressable
              onPress={() => {
                const done = !s.done;
                // Campo vazio usa o valor sugerido mostrado em cinza.
                const patch: Partial<WorkoutSet> = { done };
                if (done) {
                  if (usesWeight && s.weightKg === undefined) patch.weightKg = hintKg ?? 0;
                  if (!isDuration && s.reps === undefined) patch.reps = hintReps;
                  if (isDuration && s.durationSec === undefined) patch.durationSec = p?.durationSec ?? 60;
                }
                setAt(i, patch);
                if (done && s.type !== 'warmup') onDone(item.restSec);
              }}
              style={{
                width: 40,
                height: 36,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: s.done ? colors.primary : colors.cardAlt,
              }}
              accessibilityLabel={s.done ? 'Desmarcar série' : 'Concluir série'}
            >
              <Text style={{ color: s.done ? colors.onPrimary : colors.muted, fontWeight: '800' }}>✓</Text>
            </Pressable>
          </View>
        );
      })}
      <Pressable
        onPress={() =>
          onChange((e) => {
            const last = e.sets[e.sets.length - 1];
            return { ...e, sets: [...e.sets, { type: 'normal', weightKg: last?.weightKg, done: false }] };
          })
        }
        style={{ marginTop: 8, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.cardAlt, alignItems: 'center' }}
      >
        <Text style={{ color: colors.text, fontWeight: '600' }}>+ Adicionar série</Text>
      </Pressable>
      {index === 0 ? <Muted style={{ marginTop: 6, fontSize: 12 }}>Toque no número da série para marcar aquecimento (A), falha (F) ou drop (D). Segure para apagar.</Muted> : null}
    </Card>
  );
}

export default function ActiveWorkoutScreen() {
  useTheme();
  const active = useAppStore((s) => s.activeWorkout);
  const history = useAppStore((s) => s.workouts);
  const update = useAppStore((s) => s.updateActiveWorkout);
  const finish = useAppStore((s) => s.finishWorkout);
  const discard = useAppStore((s) => s.discardWorkout);
  const exercises = useAllExercises();
  const now = useNow();
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [showRpe, setShowRpe] = useState(false);
  const [confirm, setConfirm] = useState<'discard' | 'finish' | null>(null);

  const prevById = useMemo(() => {
    const out: Record<string, WorkoutSet[]> = {};
    for (const e of active?.exercises ?? []) out[e.exerciseId] = previousSets(history, e.exerciseId, active?.startedAt);
    return out;
  }, [active?.exercises, active?.startedAt, history]);

  const restLeft = restEndsAt ? Math.max(0, Math.ceil((restEndsAt - now) / 1000)) : 0;
  useEffect(() => {
    if (!restEndsAt) return;
    const t = setTimeout(() => {
      Vibration.vibrate([0, 400, 200, 400]);
      setRestEndsAt(null);
    }, Math.max(0, restEndsAt - Date.now()));
    return () => clearTimeout(t);
  }, [restEndsAt]);

  if (!active) {
    return (
      <View style={styles.content}>
        <Stack.Screen options={{ title: 'Treino' }} />
        <Muted>Nenhum treino em andamento.</Muted>
        <View style={{ height: 12 }} />
        <Button title="Voltar" onPress={() => router.back()} />
      </View>
    );
  }

  const elapsed = Math.max(0, Math.floor((now - new Date(active.startedAt).getTime()) / 1000));
  const doneSets = completedSets(active);

  const doFinish = () => {
    const w = finish();
    if (w && w.exercises.length > 0) router.replace({ pathname: '/training/[id]', params: { id: w.id, fresh: '1' } });
    else router.back();
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: mmss(elapsed), headerRight: () => <LinkText onPress={() => setConfirm('finish')}>Terminar  </LinkText> }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: restEndsAt ? 120 : 48 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.inputRow}>
          <TextInput value={active.name} onChangeText={(name) => update((w) => ({ ...w, name }))} style={[styles.input, { fontWeight: '700' }]} />
        </View>
        <View style={styles.row}>
          <Muted>Duração {mmss(elapsed)}</Muted>
          <Muted>Volume {Math.round(workoutVolume(active)).toLocaleString('pt-BR')} kg</Muted>
          <Muted>Séries {doneSets}</Muted>
          <LinkText onPress={() => setShowRpe(!showRpe)}>{showRpe ? 'Ocultar RPE' : 'Mostrar RPE'}</LinkText>
        </View>


        {active.exercises.length === 0 ? <Muted>Adicione o primeiro exercício para começar.</Muted> : null}
        {active.exercises.map((item, idx) => {
          const ex = exercises[item.exerciseId];
          if (!ex) return null;
          return (
            <ExerciseBlock
              key={`${item.exerciseId}-${idx}`}
              ex={ex}
              item={item}
              index={idx}
              prev={prevById[item.exerciseId] ?? []}
              showRpe={showRpe}
              onChange={(fn) => update((w) => ({ ...w, exercises: w.exercises.map((e, j) => (j === idx ? fn(e) : e)) }))}
              onRemove={() => update((w) => ({ ...w, exercises: w.exercises.filter((_, j) => j !== idx) }))}
              onDone={(sec) => setRestEndsAt(sec > 0 ? Date.now() + sec * 1000 : null)}
            />
          );
        })}

        <Button title="+ Adicionar exercício" variant="secondary" onPress={() => router.push({ pathname: '/training/exercises', params: { pick: 'active' } })} />
        <Button title="Terminar treino" onPress={() => setConfirm('finish')} />
        <View style={{ alignItems: 'center' }}>
          <LinkText onPress={() => setConfirm('discard')}>Descartar treino</LinkText>
        </View>
      </ScrollView>

      <Modal visible={confirm !== null} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 16 }}>
          <Card style={{ maxWidth: 480, width: '100%', alignSelf: 'center' }}>
            <Text style={{ color: colors.text, marginBottom: 10 }}>
              {confirm === 'discard'
                ? 'Descartar este treino? Nada será salvo.'
                : doneSets === 0
                  ? 'Nenhuma série concluída. Terminar vai descartar o treino.'
                  : 'Terminar o treino? Séries não marcadas com ✓ ficam de fora.'}
            </Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Button
                  title={confirm === 'discard' ? 'Descartar' : 'Terminar'}
                  variant={confirm === 'discard' ? 'danger' : 'primary'}
                  onPress={() => {
                    setConfirm(null);
                    if (confirm === 'discard') {
                      discard();
                      router.back();
                    } else doFinish();
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Continuar treinando" variant="secondary" onPress={() => setConfirm(null)} />
              </View>
            </View>
          </Card>
        </View>
      </Modal>

      {restEndsAt ? (
        <View
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 16,
            borderRadius: 14,
            backgroundColor: colors.inverse,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: 696,
            alignSelf: 'center',
          }}
        >
          <View>
            <Text style={{ color: colors.inverseMuted, fontSize: 12 }}>DESCANSO</Text>
            <Text style={{ color: colors.onInverse, fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{mmss(restLeft)}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: '−15', fn: () => setRestEndsAt((t) => (t ? t - 15000 : t)) },
              { label: '+15', fn: () => setRestEndsAt((t) => (t ? t + 15000 : t)) },
              { label: 'Pular', fn: () => setRestEndsAt(null) },
            ].map((b) => (
              <Pressable key={b.label} onPress={b.fn} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(128,128,128,0.28)' }}>
                <Text style={{ color: colors.onInverse, fontWeight: '700' }}>{b.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
