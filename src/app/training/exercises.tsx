// Biblioteca de exercícios. Com ?pick=active adiciona ao treino em andamento;
// com ?pick=routine&routine=<id> adiciona à rotina.

import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button, Card, Chips, colors, Field, Muted, styles, Title, useTheme } from '../../components/ui';
import { Equipment, EQUIPMENT_LABEL, ExerciseKind, Muscle, MUSCLE_LABEL, searchExercises } from '../../domain/workout/exercises';
import { useAllExercises, useAppStore } from '../../store/useAppStore';

export default function ExerciseLibrary() {
  useTheme();
  const params = useLocalSearchParams<{ pick?: 'active' | 'routine'; routine?: string }>();
  const all = useAllExercises();
  const updateActive = useAppStore((s) => s.updateActiveWorkout);
  const routines = useAppStore((s) => s.routines);
  const saveRoutine = useAppStore((s) => s.saveRoutine);
  const addCustom = useAppStore((s) => s.addCustomExercise);
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<Muscle | undefined>();
  const [equipment, setEquipment] = useState<Equipment | undefined>();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<{ name: string; primary: Muscle; equipment: Equipment; kind: ExerciseKind }>({
    name: '',
    primary: 'peito',
    equipment: 'halter',
    kind: 'weight_reps',
  });

  const list = useMemo(() => searchExercises(Object.values(all), query, muscle, equipment), [all, query, muscle, equipment]);

  const choose = (id: string) => {
    if (params.pick === 'active') {
      updateActive((w) => ({ ...w, exercises: [...w.exercises, { exerciseId: id, restSec: 90, sets: [{ type: 'normal', done: false }, { type: 'normal', done: false }, { type: 'normal', done: false }] }] }));
      router.back();
    } else if (params.pick === 'routine' && params.routine && routines[params.routine]) {
      const r = routines[params.routine];
      saveRoutine({ ...r, exercises: [...r.exercises, { exerciseId: id, sets: 3, repRange: [8, 12], restSec: 90 }] });
      router.back();
    } else {
      router.push({ pathname: '/exercise/[id]', params: { id } });
    }
  };

  const header = (
    <View style={{ gap: 10 }}>
      <View style={styles.inputRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar: supino, agachamento, rosca…"
          placeholderTextColor={colors.muted}
          style={styles.input}
          autoCorrect={false}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {[undefined, ...(Object.keys(MUSCLE_LABEL) as Muscle[])].map((m) => (
          <Pressable key={m ?? 'all'} onPress={() => setMuscle(m)} style={[styles.chip, muscle === m && styles.chipActive]}>
            <Text style={[styles.chipText, muscle === m && styles.chipTextActive]}>{m ? MUSCLE_LABEL[m] : 'Todos'}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {[undefined, ...(Object.keys(EQUIPMENT_LABEL) as Equipment[])].map((eq) => (
          <Pressable key={eq ?? 'all'} onPress={() => setEquipment(eq)} style={[styles.chip, { paddingVertical: 6 }, equipment === eq && styles.chipActive]}>
            <Text style={[styles.chipText, { fontSize: 13 }, equipment === eq && styles.chipTextActive]}>{eq ? EQUIPMENT_LABEL[eq] : 'Todo equipamento'}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Muted>{list.length} exercícios</Muted>
      {creating ? (
        <Card>
          <Title>Novo exercício</Title>
          <Field label="Nome" value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} />
          <Text style={styles.fieldLabel}>Músculo principal</Text>
          <Chips
            options={(Object.keys(MUSCLE_LABEL) as Muscle[]).map((m) => ({ value: m, label: MUSCLE_LABEL[m] }))}
            value={draft.primary}
            onChange={(primary) => setDraft({ ...draft, primary })}
          />
          <Text style={styles.fieldLabel}>Equipamento</Text>
          <Chips
            options={(Object.keys(EQUIPMENT_LABEL) as Equipment[]).map((e) => ({ value: e, label: EQUIPMENT_LABEL[e] }))}
            value={draft.equipment}
            onChange={(equipment) => setDraft({ ...draft, equipment })}
          />
          <Chips
            options={[
              { value: 'weight_reps', label: 'Carga e repetições' },
              { value: 'bodyweight_reps', label: 'Só repetições' },
              { value: 'duration', label: 'Tempo' },
            ]}
            value={draft.kind}
            onChange={(kind) => setDraft({ ...draft, kind })}
          />
          <Button
            title="Criar exercício"
            disabled={!draft.name.trim()}
            onPress={() => {
              const ex = addCustom({ ...draft, name: draft.name.trim(), secondary: [] });
              setCreating(false);
              setDraft({ ...draft, name: '' });
              choose(ex.id);
            }}
          />
        </Card>
      ) : (
        <Pressable onPress={() => setCreating(true)}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>+ Criar exercício personalizado</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: params.pick ? 'Adicionar exercício' : 'Exercícios' }} />
      <FlatList
        data={list}
        keyExtractor={(e) => e.id}
        ListHeaderComponent={header}
        contentContainerStyle={[styles.content, { gap: 6 }]}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Muted>Nenhum exercício encontrado.</Muted>}
        renderItem={({ item }) => (
          <Pressable onPress={() => choose(item.id)} style={({ pressed }) => [styles.card, { paddingVertical: 12 }, pressed && { opacity: 0.7 }]}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{item.name}</Text>
            <Text style={styles.muted}>
              {MUSCLE_LABEL[item.primary]}
              {item.secondary.length ? ` · ${item.secondary.map((m) => MUSCLE_LABEL[m]).join(', ')}` : ''} · {EQUIPMENT_LABEL[item.equipment]}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
