// Aba Treino no layout do Hevy: começar treino vazio, rotinas em pastas
// (recolher, renomear, reordenar, excluir) e programas prontos em "Explorar".

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ActionSheet, SheetOption } from '../../components/training';
import { Button, Card, colors, Muted, styles, Title, useTheme } from '../../components/ui';
import { PROGRAMS } from '../../domain/workout/programs';
import { completedSets, Routine, workoutDurationMin, workoutFromRoutine } from '../../domain/workout/training';
import { newId, useAllExercises, useAppStore } from '../../store/useAppStore';

const LEVEL_LABEL = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' };
const NO_FOLDER = 'Minhas rotinas';

/** Caixa de texto em modal para criar ou renomear pasta. */
function NamePrompt({ title, initial, onSubmit, onClose }: { title: string; initial: string; onSubmit: (v: string) => void; onClose: () => void }) {
  const [text, setText] = useState(initial);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 16 }}>
        <Card style={{ maxWidth: 420, width: '100%', alignSelf: 'center' }}>
          <Title>{title}</Title>
          <View style={[styles.inputRow, { marginBottom: 12 }]}>
            <TextInput value={text} onChangeText={setText} autoFocus style={styles.input} placeholder="Nome da pasta" placeholderTextColor={colors.muted} />
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Button title="Salvar" disabled={!text.trim()} onPress={() => onSubmit(text.trim())} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Cancelar" variant="secondary" onPress={onClose} />
            </View>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

export default function WorkoutTab() {
  useTheme();
  const active = useAppStore((s) => s.activeWorkout);
  const workouts = useAppStore((s) => s.workouts);
  const routines = useAppStore((s) => s.routines);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const startWorkout = useAppStore((s) => s.startWorkout);
  const saveRoutine = useAppStore((s) => s.saveRoutine);
  const deleteRoutine = useAppStore((s) => s.deleteRoutine);
  const addProgram = useAppStore((s) => s.addProgram);
  const exercises = useAllExercises();
  const [explore, setExplore] = useState(false);
  const [sheet, setSheet] = useState<{ title: string; options: SheetOption[] } | null>(null);
  const [prompt, setPrompt] = useState<{ title: string; initial: string; submit: (v: string) => void } | null>(null);

  const routineList = Object.values(routines).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const used = [...new Set(routineList.map((r) => r.folder ?? NO_FOLDER))];
  const folders = [...(settings.routineFolders ?? []).filter((f) => f !== NO_FOLDER), ...used.filter((f) => !(settings.routineFolders ?? []).includes(f))];
  const ordered = [...folders.filter((f) => f !== NO_FOLDER), ...(used.includes(NO_FOLDER) ? [NO_FOLDER] : [])];
  const collapsed = new Set(settings.collapsedFolders ?? []);

  const setFolders = (list: string[]) => updateSettings({ routineFolders: list.filter((f) => f !== NO_FOLDER) });
  const startEmpty = () => {
    if (!active) startWorkout({ id: newId(), name: 'Treino livre', startedAt: new Date().toISOString(), exercises: [] });
    router.push('/training/active');
  };
  const startRoutine = (r: Routine) => {
    if (!active) startWorkout(workoutFromRoutine(r, workouts, newId()));
    router.push('/training/active');
  };
  const newRoutine = (folder?: string) => {
    const r = saveRoutine({ name: 'Nova rotina', exercises: [], folder: folder === NO_FOLDER ? undefined : folder });
    router.push({ pathname: '/routine/[id]', params: { id: r.id } });
  };
  const renameFolder = (from: string, to: string) => {
    for (const r of routineList) if ((r.folder ?? NO_FOLDER) === from) saveRoutine({ ...r, folder: to });
    setFolders(ordered.map((f) => (f === from ? to : f)));
  };

  const folderMenu = (folder: string) =>
    setSheet({
      title: folder,
      options: [
        { label: 'Adicionar rotina', icon: 'add', onPress: () => newRoutine(folder) },
        ...(folder !== NO_FOLDER
          ? ([
              { label: 'Renomear pasta', icon: 'pencil-outline', onPress: () => setPrompt({ title: 'Renomear pasta', initial: folder, submit: (v) => renameFolder(folder, v) }) },
              {
                label: 'Mover pasta para cima',
                icon: 'arrow-up',
                onPress: () => {
                  const list = ordered.filter((f) => f !== NO_FOLDER);
                  const i = list.indexOf(folder);
                  if (i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
                  setFolders(list);
                },
              },
              {
                label: 'Excluir pasta (as rotinas vão para Minhas rotinas)',
                icon: 'trash-outline',
                danger: true,
                onPress: () => {
                  for (const r of routineList) if (r.folder === folder) saveRoutine({ ...r, folder: undefined });
                  setFolders(ordered.filter((f) => f !== folder));
                },
              },
            ] as SheetOption[])
          : []),
      ],
    });

  const routineMenu = (r: Routine) =>
    setSheet({
      title: r.name,
      options: [
        { label: 'Editar rotina', icon: 'pencil-outline', onPress: () => router.push({ pathname: '/routine/[id]', params: { id: r.id } }) },
        { label: 'Duplicar rotina', icon: 'copy-outline', onPress: () => saveRoutine({ ...r, id: undefined, name: `${r.name} (cópia)` }) },
        ...ordered
          .filter((f) => f !== (r.folder ?? NO_FOLDER))
          .map((f) => ({ label: `Mover para ${f}`, icon: 'folder-outline' as const, onPress: () => saveRoutine({ ...r, folder: f === NO_FOLDER ? undefined : f }) })),
        { label: 'Excluir rotina', icon: 'trash-outline', danger: true, onPress: () => deleteRoutine(r.id) },
      ],
    });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {active ? (
        <Card style={{ borderColor: colors.primary, borderWidth: 2 }}>
          <Title>Treino em andamento</Title>
          <Muted style={{ marginBottom: 10 }}>
            {active.name} · {workoutDurationMin(active)} min · {completedSets(active)} séries feitas
          </Muted>
          <Button title="Voltar ao treino" onPress={() => router.push('/training/active')} />
        </Card>
      ) : (
        <Pressable onPress={startEmpty} style={({ pressed }) => [styles.soft, { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, opacity: pressed ? 0.6 : 1 }]}>
          <Ionicons name="add" size={22} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>Começar treino vazio</Text>
        </Pressable>
      )}

      <View style={[styles.rowBetween, { marginTop: 8 }]}>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>Rotinas</Text>
        <Pressable
          onPress={() => setPrompt({ title: 'Nova pasta', initial: '', submit: (v) => setFolders([...ordered.filter((f) => f !== v), v]) })}
          hitSlop={8}
          accessibilityLabel="Nova pasta"
        >
          <Ionicons name="folder-open-outline" size={24} color={colors.text} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {(
          [
            ['document-text-outline', 'Nova rotina', () => newRoutine()],
            ['search-outline', 'Explorar', () => setExplore(!explore)],
          ] as const
        ).map(([icon, label, fn]) => (
          <Pressable key={label} onPress={fn} style={({ pressed }) => [styles.soft, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons name={icon} size={20} color={colors.text} />
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '500' }}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {explore ? (
        <Card>
          <Title>Programas prontos</Title>
          {PROGRAMS.map((p) => (
            <View key={p.id} style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {p.name} · {p.daysPerWeek}x/semana · {LEVEL_LABEL[p.level]}
              </Text>
              <Muted style={{ marginBottom: 6 }}>{p.description}</Muted>
              <Button
                title={`Adicionar ${p.routines.length} rotinas`}
                variant="secondary"
                onPress={() => {
                  addProgram(p);
                  setExplore(false);
                }}
              />
            </View>
          ))}
        </Card>
      ) : null}

      {routineList.length === 0 && !explore ? <Muted>Crie uma rotina ou toque em Explorar para adicionar um programa pronto.</Muted> : null}

      {ordered.map((folder) => {
        const list = routineList.filter((r) => (r.folder ?? NO_FOLDER) === folder);
        const closed = collapsed.has(folder);
        return (
          <View key={folder} style={{ gap: 10 }}>
            <View style={[styles.rowBetween, { marginBottom: 0 }]}>
              <Pressable
                onPress={() => updateSettings({ collapsedFolders: closed ? [...collapsed].filter((f) => f !== folder) : [...collapsed, folder] })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingVertical: 4 }}
              >
                <Ionicons name={closed ? 'caret-forward' : 'caret-down'} size={14} color={colors.muted} />
                <Text style={{ color: colors.muted, fontSize: 15 }}>
                  {folder} ({list.length})
                </Text>
              </Pressable>
              <Pressable onPress={() => folderMenu(folder)} hitSlop={10} accessibilityLabel={`Opções da pasta ${folder}`}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
              </Pressable>
            </View>
            {closed
              ? null
              : list.map((r) => (
                  <Card key={r.id}>
                    <View style={[styles.rowBetween, { alignItems: 'flex-start' }]}>
                      <Pressable style={{ flex: 1 }} onPress={() => router.push({ pathname: '/routine/[id]', params: { id: r.id } })}>
                        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>{r.name}</Text>
                        <Text style={[styles.muted, { marginTop: 2, marginBottom: 10 }]} numberOfLines={2}>
                          {r.exercises.length ? r.exercises.map((e) => exercises[e.exerciseId]?.name ?? '?').join(', ') : 'Sem exercícios ainda'}
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => routineMenu(r)} hitSlop={10} accessibilityLabel={`Opções da rotina ${r.name}`}>
                        <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
                      </Pressable>
                    </View>
                    <Button title={active ? 'Voltar ao treino' : 'Iniciar rotina'} onPress={() => startRoutine(r)} />
                  </Card>
                ))}
          </View>
        );
      })}

      <ActionSheet visible={sheet !== null} title={sheet?.title} options={sheet?.options ?? []} onClose={() => setSheet(null)} />
      {prompt ? (
        <NamePrompt
          title={prompt.title}
          initial={prompt.initial}
          onClose={() => setPrompt(null)}
          onSubmit={(v) => {
            prompt.submit(v);
            setPrompt(null);
          }}
        />
      ) : null}
    </ScrollView>
  );
}
