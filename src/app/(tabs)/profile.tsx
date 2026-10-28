import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button, Card, Chips, colors, Field, Muted, parseInput, styles, Title } from '../../components/ui';
import { todayIso } from '../../domain/foods';
import {
  ACTIVITY_FACTORS,
  ActivityLevel,
  computeTargets,
  DEFAULT_PROTEIN_PER_KG,
  Goal,
  GOALS,
  Profile,
  proteinPerMealRange,
  Sex,
} from '../../domain/targets';
import { useAppStore } from '../../store/useAppStore';

const PROTEIN_OPTIONS = ['1.6', '1.8', '2', '2.2', '2.5'];

/** Aceita data em DD/MM/AAAA e devolve AAAA-MM-DD. */
function parseBirth(s: string): string | undefined {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return undefined;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  return Number.isNaN(new Date(`${iso}T00:00:00`).getTime()) ? undefined : iso;
}

function formatBirth(iso?: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function ProfileScreen() {
  const profile = useAppStore((s) => s.profile);
  const saveProfile = useAppStore((s) => s.saveProfile);
  const logWeight = useAppStore((s) => s.logWeight);
  const hasWeights = useAppStore((s) => s.weights.length > 0);

  const [name, setName] = useState(profile?.name ?? '');
  const [sex, setSex] = useState<Sex>(profile?.sex ?? 'male');
  const [birth, setBirth] = useState(formatBirth(profile?.birthDate));
  const [height, setHeight] = useState(profile ? String(profile.heightCm) : '');
  const [weight, setWeight] = useState(profile ? String(profile.weightKg).replace('.', ',') : '');
  const [bodyFat, setBodyFat] = useState(profile?.bodyFatPct ? String(profile.bodyFatPct) : '');
  const [activity, setActivity] = useState<ActivityLevel>(profile?.activity ?? 'moderate');
  const [goal, setGoal] = useState<Goal>(profile?.goal ?? 'bulk');
  const [proteinPerKg, setProteinPerKg] = useState(String(profile?.proteinPerKg ?? DEFAULT_PROTEIN_PER_KG));
  const [meals, setMeals] = useState(String(profile?.mealsPerDay ?? 4));
  const [saved, setSaved] = useState(false);

  const birthDate = parseBirth(birth);
  const heightCm = parseInput(height);
  const weightKg = parseInput(weight);
  const draft: Profile | undefined =
    birthDate && heightCm && weightKg
      ? {
          name: name.trim() || undefined,
          sex,
          birthDate,
          heightCm,
          weightKg,
          bodyFatPct: parseInput(bodyFat),
          activity,
          goal,
          proteinPerKg: parseInput(proteinPerKg) ?? DEFAULT_PROTEIN_PER_KG,
          mealsPerDay: Math.max(1, Math.round(parseInput(meals) ?? 4)),
        }
      : undefined;
  const preview = draft ? computeTargets(draft) : undefined;

  const save = () => {
    if (!draft) return;
    const isFirst = !profile;
    saveProfile(draft);
    // O peso do perfil também entra no histórico, que alimenta o gasto adaptativo.
    if (!hasWeights || draft.weightKg !== profile?.weightKg) logWeight(todayIso(), draft.weightKg);
    setSaved(true);
    if (isFirst) router.replace('/');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card>
        <Title>Seus dados</Title>
        <Field label="Nome (opcional)" value={name} onChangeText={setName} />
        <Chips options={[{ value: 'male', label: 'Masculino' }, { value: 'female', label: 'Feminino' }]} value={sex} onChange={setSex} />
        <View style={styles.row}>
          <Field label="Nascimento" value={birth} onChangeText={setBirth} placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" />
          <Field label="Altura" suffix="cm" keyboardType="decimal-pad" value={height} onChangeText={setHeight} />
        </View>
        <View style={styles.row}>
          <Field label="Peso" suffix="kg" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
          <Field label="% de gordura (opcional)" suffix="%" keyboardType="decimal-pad" value={bodyFat} onChangeText={setBodyFat} />
        </View>
        {birth.length >= 10 && !birthDate ? <Text style={{ color: colors.danger }}>Data inválida. Use DD/MM/AAAA.</Text> : null}
      </Card>

      <Card>
        <Title>Nível de atividade</Title>
        <Chips
          options={(Object.keys(ACTIVITY_FACTORS) as ActivityLevel[]).map((k) => ({ value: k, label: ACTIVITY_FACTORS[k].label }))}
          value={activity}
          onChange={setActivity}
        />
        <Title>Objetivo</Title>
        <Chips options={(Object.keys(GOALS) as Goal[]).map((k) => ({ value: k, label: GOALS[k].label }))} value={goal} onChange={setGoal} />
        <Muted>{GOALS[goal].description}</Muted>
      </Card>

      <Card>
        <Title>Proteína</Title>
        <Muted style={{ marginBottom: 8 }}>
          Para hipertrofia, a evidência aponta 1,6 a 2,2 g por kg. O padrão do app é 2,0 g/kg.
        </Muted>
        <Chips
          options={PROTEIN_OPTIONS.map((v) => ({ value: v, label: `${v.replace('.', ',')} g/kg` }))}
          value={PROTEIN_OPTIONS.includes(proteinPerKg) ? proteinPerKg : ''}
          onChange={setProteinPerKg}
        />
        <View style={styles.row}>
          <Field label="Outro valor" suffix="g/kg" keyboardType="decimal-pad" value={proteinPerKg} onChangeText={setProteinPerKg} />
          <Field label="Refeições por dia" keyboardType="number-pad" value={meals} onChangeText={setMeals} />
        </View>
      </Card>

      {preview && draft ? (
        <Card style={{ borderColor: colors.primary }}>
          <Title>Suas metas diárias</Title>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.protein }}>{preview.protein} g de proteína</Text>
          <Muted style={{ marginBottom: 8 }}>
            ~{preview.proteinPerMeal} g por refeição (ideal: {proteinPerMealRange(draft.weightKg).join('–')} g por refeição)
          </Muted>
          <Text style={styles.macroLabel}>
            {preview.kcal} kcal · {preview.carbs} g carboidratos · {preview.fat} g gorduras
          </Text>
          <Muted>Gasto estimado pela fórmula: {preview.tdee} kcal. Depois de 2 semanas registrando peso e refeições, o app passa a usar o seu gasto real.</Muted>
        </Card>
      ) : null}

      <Button title={profile ? 'Salvar alterações' : 'Calcular minhas metas'} onPress={save} disabled={!draft} />
      {saved ? <Muted>Perfil salvo.</Muted> : null}
    </ScrollView>
  );
}
