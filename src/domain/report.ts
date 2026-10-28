// Exportação para levar ao nutricionista: CSV (planilha) e relatório HTML (vira PDF).

import { WeightEntry, trendWeights } from './adaptiveTdee';
import { addDays, dayTotals, DiaryEntry, Food, MEALS } from './foods';
import { scaleNutrients } from './nutrients';
import { Profile, Targets } from './targets';

function csvCell(v: string | number | undefined): string {
  if (v === undefined) return '';
  const s = typeof v === 'number' ? String(Math.round(v * 10) / 10).replace('.', ',') : v;
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Ponto e vírgula + vírgula decimal: abre direto no Excel/Sheets em português.
export function diaryCsv(entries: DiaryEntry[], foods: Record<string, Food>): string {
  const header = ['data', 'refeição', 'alimento', 'gramas', 'kcal', 'proteína (g)', 'carboidratos (g)', 'gorduras (g)', 'fibra (g)', 'sódio (mg)'];
  const mealLabel = Object.fromEntries(MEALS.map((m) => [m.key, m.label]));
  const rows = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => {
      const f = foods[e.foodId];
      const n = f ? scaleNutrients(f.per100g, e.grams) : {};
      return [e.date, mealLabel[e.meal], f?.name ?? '?', e.grams, n.kcal, n.protein, n.carbs, n.fat, n.fiber, n.sodium];
    });
  return [header, ...rows].map((r) => r.map(csvCell).join(';')).join('\n');
}

export function weightsCsv(weights: WeightEntry[]): string {
  const trend = trendWeights(weights);
  const rows = weights.map((w, i) => [w.date, w.kg, trend[i]?.kg]);
  return [['data', 'peso (kg)', 'tendência (kg)'], ...rows].map((r) => r.map(csvCell).join(';')).join('\n');
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

export function reportHtml(args: {
  profile: Profile;
  targets: Targets;
  entries: DiaryEntry[];
  weights: WeightEntry[];
  foods: Record<string, Food>;
  endDate: string;
  days?: number;
}): string {
  const { profile, targets, entries, weights, foods, endDate } = args;
  const days = args.days ?? 14;
  const rows: string[] = [];
  let sumK = 0;
  let sumP = 0;
  let logged = 0;
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(endDate, -i);
    const list = entries.filter((e) => e.date === date);
    if (list.length === 0) continue;
    const t = dayTotals(list, foods);
    logged++;
    sumK += t.kcal ?? 0;
    sumP += t.protein ?? 0;
    rows.push(
      `<tr><td>${date.split('-').reverse().join('/')}</td><td>${Math.round(t.kcal ?? 0)}</td><td>${Math.round(t.protein ?? 0)}</td><td>${Math.round(t.carbs ?? 0)}</td><td>${Math.round(t.fat ?? 0)}</td><td>${Math.round(t.fiber ?? 0)}</td></tr>`,
    );
  }
  const trend = trendWeights(weights);
  const first = trend.find((w) => w.date >= addDays(endDate, -days + 1));
  const last = trend[trend.length - 1];
  const change = first && last ? last.kg - first.kg : undefined;

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório MacroFactorBR</title>
<style>body{font-family:Helvetica,Arial,sans-serif;color:#16201B;margin:32px}h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:24px 0 8px}
table{border-collapse:collapse;width:100%;font-size:13px}td,th{border-bottom:1px solid #DDE3E0;padding:6px;text-align:right}td:first-child,th:first-child{text-align:left}
.muted{color:#5F6B65;font-size:12px}.grid{display:flex;gap:24px;flex-wrap:wrap}.box{border:1px solid #DDE3E0;border-radius:8px;padding:10px 14px}</style></head><body>
<h1>Relatório nutricional${profile.name ? ` · ${esc(profile.name)}` : ''}</h1>
<div class="muted">Últimos ${days} dias até ${endDate.split('-').reverse().join('/')} · gerado pelo MacroFactorBR</div>
<h2>Metas atuais</h2>
<div class="grid"><div class="box">${targets.kcal} kcal</div><div class="box">${targets.protein} g proteína (${profile.proteinPerKg} g/kg)</div><div class="box">${targets.carbs} g carboidratos</div><div class="box">${targets.fat} g gorduras</div></div>
<h2>Resumo</h2>
<p>Dias registrados: ${logged} de ${days}. Média: ${logged ? Math.round(sumK / logged) : 0} kcal e ${logged ? Math.round(sumP / logged) : 0} g de proteína por dia.
${change !== undefined ? `Peso de tendência: ${first!.kg.toFixed(1)} → ${last!.kg.toFixed(1)} kg (${change >= 0 ? '+' : ''}${change.toFixed(1)} kg).` : ''}</p>
<h2>Consumo diário</h2>
<table><tr><th>Data</th><th>kcal</th><th>Proteína (g)</th><th>Carbo (g)</th><th>Gordura (g)</th><th>Fibra (g)</th></tr>${rows.join('')}</table>
<p class="muted">Valores calculados a partir da TACO (NEPA/Unicamp) e de rótulos cadastrados pelo usuário.</p>
</body></html>`;
}
