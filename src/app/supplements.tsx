// Suplementação: de onde vem a proteína e o protocolo de suplementos, vitaminas e
// medicamentos, com doses, horários e dias da semana.

import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Card, Chips, colors, Field, LinkText, Muted, parseInput, styles, Title, useTheme } from '../components/ui';
import { addDays, todayIso } from '../domain/foods';
import { NUTRIENT_BY_KEY, NutrientKey, Nutrients } from '../domain/nutrients';
import {
  adherence,
  DOSE_UNITS,
  DoseUnit,
  formatDose,
  KIND_LABEL,
  proteinBySource,
  Supplement,
  SUPPLEMENT_PRESETS,
  SupplementKind,
  WEEKDAY_SHORT,
} from '../domain/supplements';
import { useAllFoods, useAppStore } from '../store/useAppStore';

const NUTRIENT_FIELDS: NutrientKey[] = ['vitaminD', 'vitaminB12', 'vitaminA', 'vitaminC', 'calcium', 'iron', 'magnesium', 'zinc'];

type Draft = {
  id?: string;
  name: string;
  kind: SupplementKind;
  dose: string;
  unit: DoseUnit;
  timesPerDay: number;
  times: string;
  weekdays: number[];
  nutrients: Partial<Record<NutrientKey, string>>;
  note: string;
  why?: string;
};

const EMPTY_DRAFT: Draft = { name: '', kind: 'suplemento', dose: '', unit: 'g', timesPerDay: 1, times: '', weekdays: [], nutrients: {}, note: '' };

function toDraft(s: Omit<Supplement, 'id' | 'createdAt'> & { id?: string; why?: string }): Draft {
  return {
    id: s.id,
    name: s.name,
    kind: s.kind,
    dose: String(s.dose).replace('.', ','),
    unit: s.unit,
    timesPerDay: s.timesPerDay,
    times: s.times?.join(', ') ?? '',
    weekdays: s.weekdays ?? [],
    nutrients: Object.fromEntries(Object.entries(s.nutrients ?? {}).map(([k, v]) => [k, String(v).replace('.', ',')])),
    note: s.note ?? '',
    why: s.why,
  };
}

export default function SupplementsScreen() {
  useTheme();
  const supplements = useAppStore((s) => s.supplements);
  const log = useAppStore((s) => s.supplementLog);
  const entries = useAppStore((s) => s.entries);
  const saveSupplement = useAppStore((s) => s.saveSupplement);
  const deleteSupplement = useAppStore((s) => s.deleteSupplement);
  const foods = useAllFoods();
  const [draft, setDraft] = useState<Draft | null>(null);

  const today = todayIso();
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today, -i)), [today]);
  const protein = useMemo(() => {
    const recent = entries.filter((e) => e.date >= week[6] && e.date <= today);
    const days = new Set(recent.map((e) => e.date)).size;
    const split = proteinBySource(recent, foods);
    return { ...split, days };
  }, [entries, foods, week, today]);
  const rate = adherence(supplements, log, week);
  const active = Object.values(supplements)
    .filter((s) => !s.archived)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const activeNames = new Set(active.map((s) => s.name));

  const save = () => {
    if (!draft) return;
    const dose = parseInput(draft.dose);
    if (!draft.name.trim() || !dose) return;
    const nutrients: Nutrients = {};
    for (const k of NUTRIENT_FIELDS) {
      const v = parseInput(draft.nutrients[k] ?? '');
      if (v) nutrients[k] = v;
    }
    const times = draft.times
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    saveSupplement({
      id: draft.id,
      name: draft.name.trim(),
      kind: draft.kind,
      dose,
      unit: draft.unit,
      timesPerDay: draft.timesPerDay,
      times: times.length ? times : undefined,
      weekdays: draft.weekdays.length && draft.weekdays.length < 7 ? [...draft.weekdays].sort() : undefined,
      nutrients: Object.keys(nutrients).length ? nutrients : undefined,
      note: draft.note.trim() || undefined,
    });
    setDraft(null);
  };

  const perDay = (g: number) => (protein.days ? Math.round(g / protein.days) : 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Suplementação' }} />

      <Card>
        <Title>Origem da proteína</Title>
        {protein.days === 0 ? (
          <Muted>Registre refeições para ver quanto da proteína vem da comida e quanto de suplementos.</Muted>
        ) : (
          <>
            <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: colors.track, marginBottom: 8 }}>
              <View style={{ flex: protein.food, backgroundColor: colors.protein }} />
              <View style={{ flex: protein.supplement, backgroundColor: colors.carbs }} />
            </View>
            <View style={styles.rowBetween}>
              <Text style={[styles.text, { fontWeight: '600' }]}>
                <Text style={{ color: colors.protein }}>●</Text> Comida: {perDay(protein.food)} g/dia
              </Text>
              <Text style={[styles.text, { fontWeight: '600' }]}>
                <Text style={{ color: colors.carbs }}>●</Text> Suplementos: {perDay(protein.supplement)} g/dia
              </Text>
            </View>
            <Muted style={{ marginTop: 6 }}>
              Média dos {protein.days} dia(s) com registro na última semana. {Math.round(protein.supplementPct * 100)}% vem de suplementos.
              {protein.supplementPct > 0.5
                ? ' Mais da metade vem de pó: comida de verdade (carne, ovos, feijão, laticínios) traz junto ferro, zinco, B12 e fibras.'
                : protein.supplement > 0
                  ? ' Boa proporção: o suplemento completa, a comida é a base.'
                  : ''}
            </Muted>
            <Muted style={{ marginTop: 4 }}>Contam como suplemento: whey, albumina, caseína, proteína vegetal em pó e hipercalórico.</Muted>
          </>
        )}
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <Title>Seu protocolo</Title>
          {rate !== undefined ? <Text style={styles.macroValue}>{Math.round(rate * 100)}% das doses em 7 dias</Text> : null}
        </View>
        {active.length === 0 ? <Muted>Nenhum item ainda. Escolha abaixo ou crie um personalizado.</Muted> : null}
        {active.map((s) => (
          <Pressable key={s.id} onPress={() => setDraft(toDraft(s))} style={({ pressed }) => [{ paddingVertical: 8 }, pressed && { opacity: 0.6 }]}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.text, { fontWeight: '600', fontSize: 15 }]}>{s.name}</Text>
                <Muted>
                  {KIND_LABEL[s.kind]} · {formatDose(s)} · {s.timesPerDay}x ao dia
                  {s.weekdays?.length ? ` · ${s.weekdays.map((d) => WEEKDAY_SHORT[d]).join(', ')}` : ''}
                </Muted>
              </View>
              <Text style={{ color: colors.muted, fontSize: 18, marginLeft: 8 }}>›</Text>
            </View>
          </Pressable>
        ))}
      </Card>

      {draft ? (
        <Card>
          <Title>{draft.id ? 'Editar' : 'Novo item'}</Title>
          {draft.why ? <Muted style={{ marginBottom: 10 }}>{draft.why}</Muted> : null}
          <Field label="Nome" value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} placeholder="Ex.: Creatina, Multivitamínico, Losartana" />
          <Chips
            options={(Object.keys(KIND_LABEL) as SupplementKind[]).map((k) => ({ value: k, label: KIND_LABEL[k] }))}
            value={draft.kind}
            onChange={(kind) => setDraft({ ...draft, kind })}
          />
          {draft.kind === 'medicamento' ? (
            <View style={[styles.warning, { marginBottom: 12 }]}>
              <Text style={styles.warningText}>O app só lembra e registra. Dose e uso de medicamentos seguem a receita do seu médico.</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Field label="Dose" value={draft.dose} onChangeText={(dose) => setDraft({ ...draft, dose })} keyboardType="decimal-pad" />
            <Field
              label="Vezes ao dia"
              value={String(draft.timesPerDay)}
              onChangeText={(t) => setDraft({ ...draft, timesPerDay: Math.min(6, Math.max(1, Math.round(parseInput(t) ?? 1))) })}
              keyboardType="number-pad"
            />
          </View>
          <Text style={styles.fieldLabel}>Unidade</Text>
          <Chips options={DOSE_UNITS.map((u) => ({ value: u, label: u }))} value={draft.unit} onChange={(unit) => setDraft({ ...draft, unit })} />
          <Field label="Horários (opcional)" value={draft.times} onChangeText={(times) => setDraft({ ...draft, times })} placeholder="Ex.: 08:00, 20:00 ou pré-treino" />
          <Text style={styles.fieldLabel}>Dias da semana (nenhum marcado = todos)</Text>
          <View style={styles.chips}>
            {WEEKDAY_SHORT.map((label, d) => {
              const on = draft.weekdays.includes(d);
              return (
                <Pressable
                  key={label}
                  onPress={() => setDraft({ ...draft, weekdays: on ? draft.weekdays.filter((x) => x !== d) : [...draft.weekdays, d] })}
                  style={[styles.chip, on && styles.chipActive]}
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.chipText, on && styles.chipTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
          {draft.kind !== 'medicamento' || Object.keys(draft.nutrients).length > 0 ? (
            <>
              <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Vitaminas e minerais por dose (opcional, entram no painel de micronutrientes)</Text>
              <View style={styles.row}>
                {NUTRIENT_FIELDS.map((k) => (
                  <Field
                    key={k}
                    label={NUTRIENT_BY_KEY[k].label}
                    suffix={NUTRIENT_BY_KEY[k].unit}
                    value={draft.nutrients[k] ?? ''}
                    onChangeText={(v) => setDraft({ ...draft, nutrients: { ...draft.nutrients, [k]: v } })}
                    keyboardType="decimal-pad"
                  />
                ))}
              </View>
              {draft.unit === 'UI' ? <Muted style={{ marginBottom: 10 }}>Vitamina D: 40 UI = 1 µg (2000 UI = 50 µg).</Muted> : null}
            </>
          ) : null}
          <Field label="Observação (opcional)" value={draft.note} onChangeText={(note) => setDraft({ ...draft, note })} />
          <Button title="Salvar" onPress={save} disabled={!draft.name.trim() || !parseInput(draft.dose)} />
          <View style={[styles.rowBetween, { marginTop: 12 }]}>
            <LinkText onPress={() => setDraft(null)}>Cancelar</LinkText>
            {draft.id ? (
              <LinkText
                onPress={() => {
                  deleteSupplement(draft.id!);
                  setDraft(null);
                }}
              >
                Remover do protocolo
              </LinkText>
            ) : null}
          </View>
        </Card>
      ) : (
        <Card>
          <Title>Adicionar</Title>
          <View style={styles.chips}>
            {SUPPLEMENT_PRESETS.filter((p) => !activeNames.has(p.name)).map((p) => (
              <Pressable key={p.presetId} onPress={() => setDraft(toDraft(p))} style={styles.chip}>
                <Text style={styles.chipText}>+ {p.name}</Text>
              </Pressable>
            ))}
          </View>
          <Button title="Criar item personalizado" variant="secondary" onPress={() => setDraft({ ...EMPTY_DRAFT })} />
          <Muted style={{ marginTop: 10 }}>
            Whey e outros pós de proteína são registrados no diário como alimento, para entrar nas calorias e na proteína.
          </Muted>
        </Card>
      )}
    </ScrollView>
  );
}
