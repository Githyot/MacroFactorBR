// Configuração guiada do perfil: uma pergunta por vez, no estilo MacroFactor.
// No fim mostra as metas calculadas e salva o perfil.

import { router } from 'expo-router';
import { ReactNode, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { GoalSummary, RatePicker } from '../components/goalWeight';
import { Button, Card, Chips, colors, Field, Muted, parseInput, ProgressBar, styles, ToggleRow, useTheme } from '../components/ui';
import { todayIso } from '../domain/foods';
import {
  ACTIVITY_FACTORS,
  ActivityLevel,
  ageFromBirthDate,
  computeTargets,
  DAILY_ROUTINES,
  DailyRoutine,
  DEFAULT_PROTEIN_PER_KG,
  DIET_STYLES,
  DietStyle,
  explainTargets,
  Goal,
  goalWeightConflict,
  GOALS,
  Profile,
  proteinPerMealRange,
  Sex,
  suggestActivity,
  TRAINING_LEVELS,
  TrainingLevel,
} from '../domain/targets';
import { useAppStore } from '../store/useAppStore';

/** Digita a data só com números e coloca as barras sozinho: 01021996 → 01/02/1996. */
function maskBirth(s: string): string {
  const d = s.replace(/\D/g, '').slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean).join('/');
}

function parseBirth(s: string): string | undefined {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return undefined;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime()) || d.getDate() !== Number(m[1])) return undefined;
  const age = ageFromBirthDate(iso);
  return age >= 13 && age <= 100 ? iso : undefined;
}

const formatBirth = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '');
const num = (n?: number) => (n === undefined ? '' : String(n).replace('.', ','));

const BODY_FAT_OPTIONS = ['', '10', '15', '20', '25', '30', '35'];
const PROTEIN_OPTIONS = ['1.6', '1.8', '2', '2.2', '2.5'];

type Step = { key: string; title: string; hint?: string; valid: boolean; body: ReactNode; skip?: boolean };

export default function OnboardingScreen() {
  useTheme();
  const profile = useAppStore((s) => s.profile);
  const saveProfile = useAppStore((s) => s.saveProfile);
  const logWeight = useAppStore((s) => s.logWeight);
  const hasWeights = useAppStore((s) => s.weights.length > 0);
  const consentAt = useAppStore((s) => s.settings.consentAt);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const [i, setI] = useState(0);
  const [name, setName] = useState(profile?.name ?? '');
  const [sex, setSex] = useState<Sex | ''>(profile?.sex ?? '');
  const [birth, setBirth] = useState(formatBirth(profile?.birthDate));
  const [height, setHeight] = useState(num(profile?.heightCm));
  const [weight, setWeight] = useState(num(profile?.weightKg));
  const [bodyFat, setBodyFat] = useState(num(profile?.bodyFatPct));
  const [routine, setRoutine] = useState<DailyRoutine | ''>(profile?.dailyRoutine ?? '');
  const [trainingDays, setTrainingDays] = useState(profile?.trainingDays !== undefined ? String(profile.trainingDays) : '');
  const [trainingLevel, setTrainingLevel] = useState<TrainingLevel | ''>(profile?.trainingLevel ?? '');
  const [goal, setGoal] = useState<Goal | ''>(profile?.goal ?? '');
  const [goalWeight, setGoalWeight] = useState(num(profile?.goalWeightKg));
  const [rate, setRate] = useState(profile?.weeklyRatePct ? String(profile.weeklyRatePct) : '');
  const [dietStyle, setDietStyle] = useState<DietStyle>(profile?.dietStyle ?? 'balanced');
  const [proteinPerKg, setProteinPerKg] = useState(String(profile?.proteinPerKg ?? DEFAULT_PROTEIN_PER_KG));
  const [meals, setMeals] = useState(String(profile?.mealsPerDay ?? 4));
  const [activity, setActivity] = useState<ActivityLevel | undefined>(profile?.activity);
  const [consent, setConsent] = useState(Boolean(consentAt));

  const birthDate = parseBirth(birth);
  const heightCm = parseInput(height);
  const weightKg = parseInput(weight);
  const goalWeightKg = goalWeight ? parseInput(goalWeight) : undefined;
  const days = trainingDays === '' ? undefined : Number(trainingDays);
  const suggested = routine && days !== undefined ? suggestActivity(routine, days) : undefined;
  const level = trainingLevel || 'intermediate';
  const rateValue = rate ? parseInput(rate) : undefined;

  const draft: Profile | undefined =
    sex && birthDate && heightCm && weightKg && goal
      ? {
          name: name.trim() || undefined,
          sex,
          birthDate,
          heightCm,
          weightKg,
          bodyFatPct: bodyFat ? parseInput(bodyFat) : undefined,
          activity: activity ?? suggested ?? 'moderate',
          goal,
          proteinPerKg: parseInput(proteinPerKg) ?? DEFAULT_PROTEIN_PER_KG,
          mealsPerDay: Math.max(1, Math.round(parseInput(meals) ?? 4)),
          trainingLevel: level,
          trainingDays: days ?? 4,
          carbCycling: profile?.carbCycling,
          kcalAdjustment: profile?.kcalAdjustment,
          goalWeightKg: goal === 'recomp' ? undefined : goalWeightKg,
          weeklyRatePct: goal === 'recomp' ? undefined : rateValue,
          dietStyle,
          dailyRoutine: routine || undefined,
        }
      : undefined;
  const preview = draft ? computeTargets(draft) : undefined;

  const steps: Step[] = [
    {
      key: 'sex',
      title: 'Qual é o seu sexo biológico?',
      hint: 'Muda a fórmula do gasto energético.',
      valid: Boolean(sex),
      body: (
        <>
          <Chips options={[{ value: 'male', label: 'Masculino' }, { value: 'female', label: 'Feminino' }]} value={sex} onChange={setSex} />
          <Field label="Como quer ser chamado? (opcional)" value={name} onChangeText={setName} />
        </>
      ),
    },
    {
      key: 'birth',
      title: 'Quando você nasceu?',
      hint: 'O gasto em repouso cai um pouco com a idade.',
      valid: Boolean(birthDate),
      body: (
        <>
          <Field label="Data de nascimento" value={birth} onChangeText={(t) => setBirth(maskBirth(t))} placeholder="DD/MM/AAAA" keyboardType="number-pad" maxLength={10} />
          {birth.length === 10 && !birthDate ? <Text style={{ color: colors.danger }}>Data inválida.</Text> : null}
        </>
      ),
    },
    {
      key: 'height',
      title: 'Qual é a sua altura?',
      valid: Boolean(heightCm && heightCm > 100 && heightCm < 250),
      body: <Field label="Altura" suffix="cm" keyboardType="decimal-pad" value={height} onChangeText={setHeight} placeholder="175" />,
    },
    {
      key: 'weight',
      title: 'Quanto você pesa hoje?',
      hint: 'De manhã, em jejum, é o mais confiável. Esse peso entra no seu histórico.',
      valid: Boolean(weightKg && weightKg > 30 && weightKg < 300),
      body: <Field label="Peso atual" suffix="kg" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} placeholder="75,0" />,
    },
    {
      key: 'bodyfat',
      title: 'Sabe seu percentual de gordura?',
      hint: 'Se souber (bioimpedância, dobras ou DEXA), o cálculo usa sua massa magra e fica mais preciso. Se não souber, tudo bem.',
      valid: !bodyFat || Boolean(parseInput(bodyFat) && parseInput(bodyFat)! > 3 && parseInput(bodyFat)! < 60),
      body: (
        <>
          <Chips
            options={BODY_FAT_OPTIONS.map((v) => ({ value: v, label: v ? `${v}%` : 'Não sei' }))}
            value={BODY_FAT_OPTIONS.includes(bodyFat) ? bodyFat : '__custom'}
            onChange={setBodyFat}
          />
          <Field label="Outro valor" suffix="%" keyboardType="decimal-pad" value={bodyFat} onChangeText={setBodyFat} />
        </>
      ),
    },
    {
      key: 'routine',
      title: 'Como é seu dia fora da academia?',
      hint: 'Trabalho, estudo e deslocamento contam mais no gasto do que parece.',
      valid: Boolean(routine),
      body: (
        <View style={{ gap: 8 }}>
          {(Object.keys(DAILY_ROUTINES) as DailyRoutine[]).map((k) => (
            <Choice key={k} selected={routine === k} title={DAILY_ROUTINES[k].label} subtitle={DAILY_ROUTINES[k].description} onPress={() => setRoutine(k)} />
          ))}
        </View>
      ),
    },
    {
      key: 'days',
      title: 'Quantos dias por semana você treina?',
      hint: 'Musculação ou outro treino intenso.',
      valid: days !== undefined,
      body: (
        <Chips options={['0', '1', '2', '3', '4', '5', '6', '7'].map((v) => ({ value: v, label: v }))} value={trainingDays} onChange={setTrainingDays} />
      ),
    },
    {
      key: 'level',
      title: 'Há quanto tempo você treina com regularidade?',
      hint: 'Quanto mais experiente, mais devagar se ganha músculo. Isso define o ritmo recomendado.',
      valid: Boolean(trainingLevel),
      body: (
        <View style={{ gap: 8 }}>
          {(Object.keys(TRAINING_LEVELS) as TrainingLevel[]).map((k) => (
            <Choice key={k} selected={trainingLevel === k} title={TRAINING_LEVELS[k].label} subtitle={`Ganho esperado: ${TRAINING_LEVELS[k].description}`} onPress={() => setTrainingLevel(k)} />
          ))}
        </View>
      ),
    },
    {
      key: 'goal',
      title: 'Qual é o seu objetivo agora?',
      valid: Boolean(goal),
      body: (
        <View style={{ gap: 8 }}>
          {(Object.keys(GOALS) as Goal[]).map((k) => (
            <Choice key={k} selected={goal === k} title={GOALS[k].label} subtitle={GOALS[k].description} onPress={() => setGoal(k)} />
          ))}
        </View>
      ),
    },
    {
      key: 'goalWeight',
      title: goal === 'cut' ? 'Até quanto quer chegar?' : 'Qual peso você quer atingir?',
      hint: 'Ao chegar nele, as metas passam para manutenção. Pode deixar em branco e decidir depois.',
      skip: goal === 'recomp',
      valid: !goalWeight || Boolean(goalWeightKg && goalWeightKg > 30 && goalWeightKg < 300 && !goalWeightConflict({ goal: goal || 'bulk', weightKg: weightKg ?? 0, goalWeightKg })),
      body: (
        <>
          <Field label="Peso alvo (opcional)" suffix="kg" keyboardType="decimal-pad" value={goalWeight} onChangeText={setGoalWeight} placeholder={weightKg ? num(Math.round(weightKg + (goal === 'cut' ? -5 : 5))) : ''} />
          {goal && goalWeightKg && weightKg && goalWeightConflict({ goal, weightKg, goalWeightKg }) ? (
            <Text style={styles.warningText}>
              {goal === 'bulk' ? 'Para ganhar massa, o alvo precisa ser maior que o peso atual.' : 'Na definição, o alvo precisa ser menor que o peso atual.'}
            </Text>
          ) : null}
        </>
      ),
    },
    {
      key: 'rate',
      title: goal === 'cut' ? 'Em que ritmo quer perder?' : 'Em que ritmo quer ganhar?',
      hint:
        goal === 'cut'
          ? 'Mais rápido = déficit maior. Até ~0,75% do peso por semana costuma preservar a massa magra.'
          : 'Mais rápido = superávit maior, mas acima do recomendado o extra tende a virar gordura.',
      skip: goal === 'recomp',
      valid: !rate || Boolean(rateValue && rateValue > 0 && rateValue <= 1.5),
      body:
        goal === 'bulk' || goal === 'cut' ? (
          <>
            <RatePicker goal={goal} level={level} weightKg={weightKg} value={rate} onChange={setRate} />
            {draft ? <GoalSummary profile={draft} editing /> : null}
          </>
        ) : null,
    },
    {
      key: 'diet',
      title: 'Como prefere dividir carboidrato e gordura?',
      hint: 'A proteína fica igual em todas. Muda só o que sobra.',
      valid: true,
      body: (
        <View style={{ gap: 8 }}>
          {(Object.keys(DIET_STYLES) as DietStyle[]).map((k) => (
            <Choice key={k} selected={dietStyle === k} title={DIET_STYLES[k].label} subtitle={DIET_STYLES[k].description} onPress={() => setDietStyle(k)} />
          ))}
        </View>
      ),
    },
    {
      key: 'protein',
      title: 'Quanta proteína por kg?',
      hint: 'Para hipertrofia, a evidência aponta 1,6 a 2,2 g por kg. Na definição, o lado alto ajuda a preservar músculo.',
      valid: Boolean(parseInput(proteinPerKg) && parseInput(proteinPerKg)! >= 1 && parseInput(proteinPerKg)! <= 3.5),
      body: (
        <>
          <Chips
            options={PROTEIN_OPTIONS.map((v) => ({ value: v, label: `${v.replace('.', ',')} g/kg${v === '2' ? ' (padrão)' : ''}` }))}
            value={PROTEIN_OPTIONS.includes(proteinPerKg) ? proteinPerKg : ''}
            onChange={setProteinPerKg}
          />
          <Field label="Outro valor" suffix="g/kg" keyboardType="decimal-pad" value={proteinPerKg.replace('.', ',')} onChangeText={setProteinPerKg} />
          {weightKg && parseInput(proteinPerKg) ? <Muted>= {Math.round(weightKg * parseInput(proteinPerKg)!)} g de proteína por dia.</Muted> : null}
        </>
      ),
    },
    {
      key: 'meals',
      title: 'Quantas refeições você faz por dia?',
      hint: 'Usado para dividir a proteína: o ideal é 0,3–0,4 g/kg por refeição.',
      valid: Boolean(parseInput(meals) && parseInput(meals)! >= 1 && parseInput(meals)! <= 10),
      body: (
        <>
          <Chips options={['2', '3', '4', '5', '6'].map((v) => ({ value: v, label: v }))} value={meals} onChange={setMeals} />
          {weightKg ? <Muted>Proteína ideal por refeição: {proteinPerMealRange(weightKg).join('–')} g.</Muted> : null}
        </>
      ),
    },
    {
      key: 'summary',
      title: 'Suas metas',
      valid: Boolean(draft && consent),
      body:
        draft && preview ? (
          <>
            <Text style={{ fontSize: 30, fontWeight: '800', color: colors.kcal }}>{preview.kcal} kcal</Text>
            <Text style={[styles.macroLabel, { marginBottom: 4 }]}>
              <Text style={{ color: colors.protein }}>{preview.protein} g proteína</Text> · <Text style={{ color: colors.carbs }}>{preview.carbs} g carbo</Text> ·{' '}
              <Text style={{ color: colors.fat }}>{preview.fat} g gordura</Text>
            </Text>
            <GoalSummary profile={draft} editing />
            <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Nível de atividade</Text>
            <Chips
              options={(Object.keys(ACTIVITY_FACTORS) as ActivityLevel[]).map((k) => ({ value: k, label: `${ACTIVITY_FACTORS[k].label}${k === suggested ? ' ✓' : ''}` }))}
              value={draft.activity}
              onChange={setActivity}
            />
            {suggested ? <Muted style={{ marginBottom: 8 }}>✓ = sugerido pela sua rotina e pelos {days} treinos por semana.</Muted> : null}
            <Text style={[styles.fieldLabel, { marginTop: 4 }]}>Como calculamos</Text>
            {explainTargets(draft, preview).map((l) => (
              <Muted key={l} style={{ marginBottom: 4 }}>
                • {l}
              </Muted>
            ))}
            <Muted style={{ marginBottom: 8 }}>Depois de 2 semanas registrando peso e refeições, o app passa a usar o seu gasto real e corrige as calorias sozinho.</Muted>
            {!consentAt ? (
              <ToggleRow
                label="Concordo com o uso dos meus dados"
                hint="Peso, medidas e alimentação são dados de saúde (LGPD). Ficam no seu aparelho e, se você entrar numa conta, na nuvem para sincronizar. Nunca são vendidos."
                value={consent}
                onChange={setConsent}
              />
            ) : null}
          </>
        ) : (
          <Muted>Faltam respostas nas etapas anteriores.</Muted>
        ),
    },
  ];

  const visible = steps.filter((s) => !s.skip);
  const idx = Math.min(i, visible.length - 1);
  const step = visible[idx];
  const last = idx === visible.length - 1;

  const finish = () => {
    if (!draft || !consent) return;
    if (!consentAt) updateSettings({ consentAt: new Date().toISOString() });
    saveProfile(draft);
    if (!hasWeights || draft.weightKg !== profile?.weightKg) logWeight(todayIso(), draft.weightKg);
    router.replace('/');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={{ gap: 6 }}>
        <Muted style={{ fontSize: 12 }}>
          Etapa {idx + 1} de {visible.length}
        </Muted>
        <ProgressBar value={idx + 1} target={visible.length} color={colors.primary} />
      </View>
      <Card>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 6 }}>{step.title}</Text>
        {step.hint ? <Muted style={{ marginBottom: 12 }}>{step.hint}</Muted> : null}
        {step.body}
      </Card>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {idx > 0 ? (
          <View style={{ flex: 1 }}>
            <Button title="Voltar" variant="secondary" onPress={() => setI(idx - 1)} />
          </View>
        ) : null}
        <View style={{ flex: 2 }}>
          <Button title={last ? 'Salvar e começar' : 'Continuar'} disabled={!step.valid} onPress={() => (last ? finish() : setI(idx + 1))} />
        </View>
      </View>
    </ScrollView>
  );
}

function Choice({ title, subtitle, selected, onPress }: { title: string; subtitle?: string; selected: boolean; onPress: () => void }) {
  return (
    <Text
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={{
        borderWidth: 2,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primarySoft : colors.inputBg,
        borderRadius: 12,
        padding: 14,
      }}
    >
      <Text style={{ color: selected ? colors.onPrimarySoft : colors.text, fontSize: 16, fontWeight: '700' }}>{title}</Text>
      {subtitle ? <Text style={{ color: selected ? colors.onPrimarySoft : colors.muted, fontSize: 13 }}>{'\n'}{subtitle}</Text> : null}
    </Text>
  );
}
