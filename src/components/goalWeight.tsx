// Peças compartilhadas entre o perfil e a configuração guiada: escolha do ritmo
// semanal e resumo da meta de peso com a data prevista.

import { Text, View } from 'react-native';

import { goalForecast, goalWeightConflict, Profile, RATE_OPTIONS, recommendedWeeklyRatePct, TrainingLevel } from '../domain/targets';
import { Chips, colors, Field, Muted, parseInput, styles } from './ui';

const fmt = (n: number, digits = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: digits });

export const fmtDate = (d: Date) => d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });

/** Texto "x kg por semana (y kg por mês)" para um ritmo em % do peso. */
export function rateText(weightKg: number, pct: number): string {
  const week = (weightKg * pct) / 100;
  return `${fmt(week, 2)} kg/semana · ${fmt(week * (30 / 7), 1)} kg/mês`;
}

/**
 * Seletor de ritmo. `value` é o texto digitado (% do peso por semana);
 * vazio significa "recomendado para o meu nível".
 */
export function RatePicker({
  goal,
  level,
  weightKg,
  value,
  onChange,
}: {
  goal: 'bulk' | 'cut';
  level: TrainingLevel;
  weightKg?: number;
  value: string;
  onChange: (v: string) => void;
}) {
  const rec = recommendedWeeklyRatePct(goal, level);
  const options = [
    { value: '', label: `Recomendado (${fmt(rec, 2)}%)` },
    ...RATE_OPTIONS[goal].filter((o) => Math.abs(o.pct - rec) > 0.01).map((o) => ({ value: String(o.pct), label: `${o.label} (${fmt(o.pct, 2)}%)` })),
  ];
  const pct = value ? parseInput(value) : rec;
  return (
    <View>
      <Chips options={options} value={options.some((o) => o.value === value) ? value : '__custom'} onChange={onChange} />
      <Field label="Outro ritmo" suffix="% do peso/semana" keyboardType="decimal-pad" value={value.replace('.', ',')} onChangeText={onChange} placeholder={fmt(rec, 2)} />
      {weightKg && pct ? (
        <Muted style={{ marginBottom: 8 }}>
          {goal === 'bulk' ? 'Ganhar' : 'Perder'} {rateText(weightKg, pct)}.
          {goal === 'bulk' && pct > rec * 1.5 ? ' Acima do recomendado para o seu nível: parte do ganho tende a ser gordura.' : ''}
          {goal === 'cut' && pct > 1 ? ' Ritmo agressivo: aumenta o risco de perder massa magra.' : ''}
        </Muted>
      ) : null}
    </View>
  );
}

/**
 * Resumo da meta: quanto falta e quando deve chegar no ritmo atual.
 * `editing`: o peso e o alvo estão sendo digitados agora, então alvo do lado errado é engano, não meta cumprida.
 */
export function GoalSummary({ profile, currentKg, editing }: { profile: Profile; currentKg?: number; editing?: boolean }) {
  const now = currentKg ?? profile.weightKg;
  if (profile.goalWeightKg === undefined) return null;
  if (goalWeightConflict({ ...profile, weightKg: now })) {
    return (
      <Text style={[styles.warningText, { marginBottom: 8 }]}>
        {!editing
          ? 'Você já passou do peso alvo. As metas estão em manutenção até você definir uma meta nova.'
          : profile.goal === 'bulk'
            ? 'O peso alvo é menor que o atual, mas o objetivo é ganhar massa. Ajuste o alvo ou o objetivo.'
            : 'O peso alvo é maior que o atual, mas o objetivo é definição. Ajuste o alvo ou o objetivo.'}
      </Text>
    );
  }
  const f = goalForecast(profile, now);
  if (!f) return null;
  if (f.weeks === 0) return <Text style={{ color: colors.carbs, marginBottom: 8 }}>Peso alvo atingido. As metas estão em manutenção.</Text>;
  return (
    <Muted style={{ marginBottom: 8 }}>
      Faltam {fmt(Math.abs(f.remainingKg))} kg. No ritmo escolhido, você chega em {fmt(profile.goalWeightKg)} kg por volta de {fmtDate(f.date)} ({f.weeks}{' '}
      {f.weeks === 1 ? 'semana' : 'semanas'}).
    </Muted>
  );
}
