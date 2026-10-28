// Coach: explica o dia e a semana em linguagem simples. Esta versão roda offline por regras;
// com o backend configurado, o app pede uma explicação mais rica à IA (supabase/functions/ai).

import { CheckIn } from './checkin';
import { MicroStatus } from './micros';
import { NUTRIENT_BY_KEY, Nutrients } from './nutrients';
import { Targets } from './targets';

export function dailyTips(args: {
  totals: Nutrients;
  targets: Targets;
  mealProtein: number[];
  proteinPerMealMin: number;
  micros: MicroStatus[];
  hour: number;
}): string[] {
  const { totals, targets, mealProtein, proteinPerMealMin, micros, hour } = args;
  const tips: string[] = [];
  const p = totals.protein ?? 0;
  const left = targets.protein - p;
  if (left > 0 && hour >= 18) {
    tips.push(`Faltam ${Math.round(left)} g de proteína. Uma opção: ${left > 35 ? '150 g de frango grelhado' : left > 20 ? '1 scoop de whey ou 3 ovos' : '1 pote de iogurte'} no jantar ou na ceia.`);
  }
  const low = mealProtein.filter((x) => x > 0 && x < proteinPerMealMin).length;
  if (low > 0) tips.push(`${low} refeição(ões) ficaram abaixo de ${proteinPerMealMin} g de proteína. Distribuir melhor ajuda a síntese muscular.`);
  const kcal = totals.kcal ?? 0;
  if (kcal > targets.kcal * 1.1) tips.push('Calorias acima da meta hoje. Sem culpa: o que importa é a média da semana.');
  const missing = micros.filter((m) => m.kind === 'min' && m.pct < 0.5).slice(0, 2);
  for (const m of missing) tips.push(`${NUTRIENT_BY_KEY[m.key].label} baixo hoje (${Math.round(m.pct * 100)}% do alvo). Veja sugestões no painel de micronutrientes.`);
  const sodium = micros.find((m) => m.key === 'sodium');
  if (sodium && !sodium.ok) tips.push('Sódio acima do limite. Atenção a embutidos, temperos prontos e salgadinhos.');
  return tips;
}

export function explainCheckIn(c: CheckIn): string {
  if (c.verdict === 'insufficient') return c.message;
  const why =
    c.verdict === 'keep'
      ? 'O ritmo está dentro do alvo, então trocar as metas agora só atrapalharia.'
      : c.verdict === 'increase'
        ? 'Você está ganhando menos que o planejado. Comer um pouco mais garante energia para construir músculo.'
        : 'Você está ganhando mais rápido que o planejado. Reduzir um pouco evita acumular gordura junto com o músculo.';
  return `${c.message} ${why} O ajuste é pequeno de propósito: o peso oscila com água e sal, e a tendência leva algumas semanas para mostrar o efeito.`;
}
