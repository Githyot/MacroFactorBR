// Peças do Painel e das telas de métrica do modo Dieta: visual limpo, fundo claro,
// cartões brancos, preto para o que é ação e uma cor por macro.

import Ionicons from '@expo/vector-icons/Ionicons';
import { ComponentProps, ReactNode, useState } from 'react';
import { Platform, Pressable, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import { addDays, todayIso } from '../domain/foods';
import { ModeSwitch } from './ModeSwitch';
import { colors } from './ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

const FONT = Platform.OS === 'web' ? 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' : undefined;
export const WEEK_LETTERS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Cor com transparência (só para cores #RRGGBB). */
export function soft(color: string, alpha = 0.18): string {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return colors.cardAlt;
  return `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
}

/** Roxo da linha de tendência do peso. */
export const TREND_COLOR = '#8B7CF6';

export const fmtNum = (v: number, d = 0) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

/** "26 out – 1 nov 2026" */
export function fmtRange(from: string, to: string): string {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  const left = y1 === y2 ? (m1 === m2 ? `${d1}` : `${d1} ${MONTHS_SHORT[m1 - 1]}`) : `${d1} ${MONTHS_SHORT[m1 - 1]} ${y1}`;
  return `${left} – ${d2} ${MONTHS_SHORT[m2 - 1]} ${y2}`;
}

/** Título grande da aba, com o seletor Dieta | Treino e um botão redondo opcional. */
export function ScreenHeader({ title, right, onBack }: { title: string; right?: ReactNode; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 14, paddingHorizontal: 16, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {onBack ? (
        <Pressable onPress={onBack} accessibilityLabel="Voltar" hitSlop={10} style={{ marginLeft: -4 }}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
      ) : null}
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ flex: 1, color: colors.text, fontSize: title.length > 8 ? 25 : 30, fontWeight: '900', letterSpacing: 0.4, textTransform: 'uppercase' }}>
        {title}
      </Text>
      <ModeSwitch compact />
      {right}
    </View>
  );
}

/** Botão redondo cinza só com ícone. */
export function RoundButton({ icon, label, onPress, size = 44 }: { icon: IconName; label: string; onPress: () => void; size?: number }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => ({ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
    >
      <Ionicons name={icon} size={size * 0.45} color={colors.text} />
    </Pressable>
  );
}

/** Abas em pílula: a escolhida fica preta (Consumido | Restante, 1S 1M 3M…). */
export function PillTabs<T extends string>({ options, value, onChange, style }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: 'row', backgroundColor: colors.cardAlt, borderRadius: 999, padding: 3 }, style]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={{ flexGrow: 1, alignItems: 'center', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, backgroundColor: on ? colors.primary : 'transparent' }}
          >
            <Text style={{ color: on ? colors.onPrimary : colors.text, fontWeight: on ? '700' : '500', fontSize: 15 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Título de seção grande com "Ver tudo" à direita. */
export function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 18, marginBottom: 10 }}>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>{title}</Text>
      {onSeeAll ? (
        <Text onPress={onSeeAll} accessibilityRole="link" style={{ color: colors.text, fontSize: 15, textDecorationLine: 'underline' }}>
          Ver tudo
        </Text>
      ) : null}
    </View>
  );
}

/** Grade de duas colunas para os cartões de métrica. */
export function CardGrid({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{children}</View>;
}

/** Cartão de métrica: título, período, mini gráfico e o valor embaixo. */
export function MetricCard({ title, subtitle, value, unit, onPress, children, full }: { title: string; subtitle: string; value: string; unit?: string; onPress?: () => void; children?: ReactNode; full?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${value} ${unit ?? ''}`}
      style={({ pressed }) => ({ flexBasis: full ? '100%' : '45%', flexGrow: 1, backgroundColor: colors.card, borderRadius: 18, padding: 16, opacity: pressed ? 0.75 : 1 })}
    >
      <Text numberOfLines={1} style={{ color: colors.text, fontSize: 17, fontWeight: '600' }}>
        {title}
      </Text>
      <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 14, marginTop: 1 }}>
        {subtitle}
      </Text>
      <View style={{ height: 64, justifyContent: 'center', marginVertical: 8 }}>{children}</View>
      <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, flexDirection: 'row', alignItems: 'center' }}>
        <Text numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: 22, fontWeight: '500', fontVariant: ['tabular-nums'] }}>
          {value}
          {unit ? <Text style={{ fontSize: 14, color: colors.muted }}> {unit}</Text> : null}
        </Text>
        {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
      </View>
    </Pressable>
  );
}

function useWidth(initial = 140): [number, (e: { nativeEvent: { layout: { width: number } } }) => void] {
  const [w, setW] = useState(initial);
  return [w, (e) => setW(Math.max(60, Math.round(e.nativeEvent.layout.width)))];
}

/** Barra horizontal com a meta marcada (a meta fica a 80% da largura). */
export function MiniTargetBar({ value, target, color, height = 18 }: { value: number; target: number; color: string; height?: number }) {
  const scale = target > 0 ? target * 1.25 : Math.max(1, value);
  const pct = Math.min(1, value / scale);
  const tick = target > 0 ? target / scale : undefined;
  return (
    <View style={{ height, backgroundColor: colors.track, borderRadius: 3, justifyContent: 'center' }}>
      <View style={{ width: `${pct * 100}%`, height: 7, backgroundColor: color, borderRadius: 2 }} />
      {tick ? <View style={{ position: 'absolute', left: `${tick * 100}%`, width: 3, height: 12, marginLeft: -1.5, borderRadius: 2, backgroundColor: pct >= tick ? colors.text : colors.muted }} /> : null}
    </View>
  );
}

/** Barrinhas verticais (passos, calorias da semana). */
export function MiniBars({ values, color, height = 60 }: { values: number[]; color: string; height?: number }) {
  const max = Math.max(1, ...values);
  return (
    <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 4, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      {values.map((v, i) => (
        <View key={i} style={{ flex: 1, height: Math.max(v > 0 ? 3 : 0, (v / max) * height), backgroundColor: color, borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
      ))}
    </View>
  );
}

/** Linha com pontos vazados (peso, gasto, % de gordura). Valores ausentes são pulados. */
export function MiniLine({ values, color, height = 56 }: { values: (number | undefined)[]; color: string; height?: number }) {
  const [width, onLayout] = useWidth();
  const pts = values.map((v, i) => (v === undefined ? null : { i, v })).filter((p): p is { i: number; v: number } => p !== null);
  if (!pts.length) return <View onLayout={onLayout} style={{ height }} />;
  const min = Math.min(...pts.map((p) => p.v));
  const max = Math.max(...pts.map((p) => p.v));
  const pad = 6;
  const x = (i: number) => (values.length <= 1 ? width - pad : pad + (i / (values.length - 1)) * (width - pad * 2));
  const y = (v: number) => (max === min ? height / 2 : pad + (1 - (v - min) / (max - min)) * (height - pad * 2));
  return (
    <View onLayout={onLayout} style={{ height }}>
      <Svg width={width} height={height}>
        {pts.length > 1 ? <Polyline points={pts.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" /> : null}
        {pts.map((p) => (
          <Circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={3.5} fill={colors.card} stroke={color} strokeWidth={2} />
        ))}
      </Svg>
    </View>
  );
}

/** Quadradinhos dos últimos 30 dias (3 linhas de 10): coloridos nos dias com registro. */
export function DotGrid({ days, color }: { days: boolean[]; color: string }) {
  return (
    <View style={{ gap: 5 }}>
      {[0, 1, 2].map((r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 5 }}>
          {days.slice(r * 10, r * 10 + 10).map((on, i) => (
            <View key={i} style={{ flex: 1, aspectRatio: 1, maxHeight: 16, borderRadius: 4, backgroundColor: on ? color : colors.track }} />
          ))}
        </View>
      ))}
    </View>
  );
}

/** Cartão de legenda dos gráficos. */
export function LegendCard({ items, right }: { items: { color: string; label: string; shape?: 'bar' | 'line' | 'dot' | 'square' }[]; right?: ReactNode }) {
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 22 }}>
      {items.map((it) => (
        <View key={it.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {it.shape === 'line' ? (
            <View style={{ width: 18, height: 3, borderRadius: 2, backgroundColor: it.color }} />
          ) : it.shape === 'dot' ? (
            <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2.5, borderColor: it.color }} />
          ) : it.shape === 'square' ? (
            <View style={{ width: 14, height: 14, borderRadius: 2, backgroundColor: soft(it.color, 0.35) }} />
          ) : (
            <Ionicons name="bar-chart" size={16} color={it.color} />
          )}
          <Text style={{ color: colors.text, fontSize: 16 }}>{it.label}</Text>
        </View>
      ))}
      {right}
    </View>
  );
}

/** Cartão colorido de explicação ("O que é o peso de tendência?"). */
export function InfoCard({ icon, title, text, color }: { icon: IconName; title: string; text: string; color: string }) {
  return (
    <View style={{ backgroundColor: soft(color, 0.16), borderRadius: 16, padding: 18, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ionicons name={icon} size={22} color={colors.text} />
        <Text style={{ flex: 1, color: colors.text, fontSize: 18, fontWeight: '600' }}>{title}</Text>
      </View>
      <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>{text}</Text>
    </View>
  );
}

/** Cabeçalho das telas de métrica: média, diferença e período. */
export function StatHeader({ items, range }: { items: { label: string; value: string; unit?: string }[]; range?: string }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        {items.map((it) => (
          <View key={it.label} style={{ flex: 1 }}>
            <Text style={{ color: colors.muted, fontSize: 15 }}>{it.label}</Text>
            <Text numberOfLines={1} style={{ color: colors.text, fontSize: 38, fontWeight: '600', fontVariant: ['tabular-nums'], letterSpacing: -0.5 }}>
              {it.value}
              {it.unit ? <Text style={{ fontSize: 16, fontWeight: '400', color: colors.muted }}> {it.unit}</Text> : null}
            </Text>
          </View>
        ))}
      </View>
      {range ? <Text style={{ color: colors.text, fontSize: 16, marginTop: 2 }}>{range}</Text> : null}
    </View>
  );
}

function niceStep(span: number): number {
  const raw = span / 3;
  const p = 10 ** Math.floor(Math.log10(Math.max(raw, 1e-6)));
  for (const m of [1, 2, 5, 10]) if (m * p >= raw) return m * p;
  return 10 * p;
}

function xLabel(date: string, count: number): string {
  if (count <= 7) return WEEKDAY_SHORT[new Date(`${date}T12:00:00`).getDay()];
  const [, m, d] = date.split('-').map(Number);
  return count > 200 ? MONTHS_SHORT[m - 1] : `${d}/${m}`;
}

/**
 * Gráfico grande das telas de métrica. Barras (calorias, macros, passos) ou pontos com
 * linha (peso, gasto, % de gordura). Grade tracejada com os valores à direita.
 */
export function TrendChart({
  dates,
  values,
  color,
  kind,
  target,
  line,
  fromZero = kind === 'bar',
  height = 300,
  format = (v: number) => fmtNum(v),
}: {
  dates: string[];
  values: (number | undefined)[];
  color: string;
  kind: 'bar' | 'line';
  /** Meta de cada dia (linha fina). */
  target?: (number | undefined)[];
  /** Segunda série em linha contínua (tendência por cima das pesagens). */
  line?: { values: (number | undefined)[]; color: string };
  fromZero?: boolean;
  height?: number;
  format?: (v: number) => string;
}) {
  const [width, onLayout] = useWidth(340);
  const axisW = 52;
  const top = 14;
  const bottom = 34;
  const plotW = width - axisW;
  const plotH = height - top - bottom;
  const all = [...values, ...(target ?? []), ...(line?.values ?? [])].filter((v): v is number => v !== undefined && Number.isFinite(v));
  let min = all.length ? Math.min(...all) : 0;
  let max = all.length ? Math.max(...all) : 1;
  if (fromZero) min = 0;
  if (max - min < 1e-6) {
    max += Math.max(1, Math.abs(max) * 0.02);
    min = fromZero ? 0 : min - Math.max(1, Math.abs(min) * 0.02);
  }
  const step = niceStep(max - min);
  const lo = fromZero ? 0 : Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(v);
  const n = dates.length;
  const slot = plotW / Math.max(1, n);
  const x = (i: number) => slot * i + slot / 2;
  const y = (v: number) => top + plotH - ((v - lo) / (hi - lo || 1)) * plotH;
  const barW = Math.max(2, Math.min(44, slot * 0.7));
  const labelEvery = Math.max(1, Math.ceil(n / 7));
  const pts = values.map((v, i) => (v === undefined ? null : { i, v })).filter((p): p is { i: number; v: number } => p !== null);
  const linePts = (line?.values ?? []).map((v, i) => (v === undefined ? null : `${x(i)},${y(v)}`)).filter(Boolean) as string[];
  const targetPts = (target ?? []).map((v, i) => (v === undefined ? null : `${x(i)},${y(v)}`)).filter(Boolean) as string[];
  const decimals = step < 1 ? 1 : 0;
  return (
    <View onLayout={onLayout}>
      <Svg width={width} height={height}>
        {ticks.map((t, k) => (
          <Line key={`g${k}`} x1={0} x2={plotW} y1={y(t)} y2={y(t)} stroke={colors.border} strokeWidth={1} strokeDasharray={k === 0 ? undefined : '5 5'} />
        ))}
        {ticks.map((t, k) => (
          <SvgText key={`t${k}`} fontFamily={FONT} x={width - 4} y={y(t) + 5} fontSize={14} fill={colors.muted} textAnchor="end">
            {decimals ? t.toFixed(1).replace('.', ',') : format(t)}
          </SvgText>
        ))}
        {kind === 'bar'
          ? pts.map((p) => <Rect key={p.i} x={x(p.i) - barW / 2} y={y(p.v)} width={barW} height={Math.max(0, y(lo) - y(p.v))} rx={Math.min(3, barW / 4)} fill={color} />)
          : null}
        {targetPts.length > 1 ? <Polyline points={targetPts.join(' ')} fill="none" stroke={colors.muted} strokeWidth={2} strokeOpacity={0.7} /> : null}
        {kind === 'line' && pts.length > 1 && !line ? (
          <Polyline points={pts.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
        ) : null}
        {kind === 'line'
          ? pts.map((p) => <Circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={n > 60 ? 2.5 : 4.5} fill={colors.card} stroke={line ? soft(color, 0.9) : color} strokeWidth={2} />)
          : null}
        {linePts.length > 1 ? <Polyline points={linePts.join(' ')} fill="none" stroke={line!.color} strokeWidth={3} strokeLinejoin="round" /> : null}
        {dates.map((d, i) =>
          i % labelEvery === 0 ? (
            <SvgText key={d} fontFamily={FONT} x={x(i)} y={height - 8} fontSize={14} fill={colors.muted} textAnchor="middle">
              {xLabel(d, n)}
            </SvgText>
          ) : null,
        )}
        <Line x1={0} x2={plotW} y1={top + plotH} y2={top + plotH} stroke={colors.muted} strokeOpacity={0.5} strokeWidth={1} />
      </Svg>
    </View>
  );
}

/** Calendário do mês em círculos (segunda a domingo). Dias com registro ganham o anel colorido. */
export function CircleCalendar({ month, tracked, color, onMonth }: { month: string; tracked: (date: string) => boolean; color: string; onMonth: (m: string) => void }) {
  const today = todayIso();
  const [y, m] = month.split('-').map(Number);
  const first = `${month}-01`;
  const lead = (new Date(`${first}T12:00:00`).getDay() + 6) % 7;
  const start = addDays(first, -lead);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const shift = (k: number) => {
    const d = new Date(y, m - 1 + k, 1);
    onMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  return (
    <View style={{ paddingHorizontal: 12 }}>
      {[0, 1, 2, 3, 4, 5].map((r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {cells.slice(r * 7, r * 7 + 7).map((d) => {
            const inMonth = d.slice(0, 7) === month;
            const on = inMonth && tracked(d);
            return (
              <View key={d} style={{ flex: 1, aspectRatio: 1, padding: 3 }}>
                <View
                  style={{
                    flex: 1,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: inMonth ? (on ? 2.5 : 1.5) : 0,
                    borderColor: on ? color : colors.border,
                  }}
                >
                  <Text style={{ color: inMonth ? colors.text : colors.muted, fontSize: 17, fontVariant: ['tabular-nums'] }}>{Number(d.slice(8))}</Text>
                  {d === today ? <View style={{ position: 'absolute', bottom: '16%', width: 5, height: 5, borderRadius: 3, backgroundColor: colors.text }} /> : null}
                </View>
              </View>
            );
          })}
        </View>
      ))}
      <View style={{ flexDirection: 'row' }}>
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
          <Text key={d} style={{ flex: 1, textAlign: 'center', color: colors.muted, fontSize: 14, marginTop: 4 }}>
            {d}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 }}>
        <View style={{ flexDirection: 'row', backgroundColor: colors.cardAlt, borderRadius: 999 }}>
          <Pressable onPress={() => shift(-1)} accessibilityLabel="Mês anterior" style={{ paddingVertical: 12, paddingHorizontal: 18 }}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => shift(1)} disabled={month >= today.slice(0, 7)} accessibilityLabel="Próximo mês" style={{ paddingVertical: 12, paddingHorizontal: 18, opacity: month >= today.slice(0, 7) ? 0.3 : 1 }}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.cardAlt, borderRadius: 999, paddingVertical: 12, alignItems: 'center' }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '500' }}>
            {MONTHS[m - 1]} {y}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Linha de nutriente com barra: valor, meta e % à direita. A meta fica a 58% da barra;
 * a faixa suave mostra a zona boa (acima do mínimo ou abaixo do máximo).
 */
export function BreakdownRow({ label, value, target, unit, color, kind = 'min', fmt = (v: number) => fmtNum(v, v < 10 && v % 1 ? 1 : 0) }: { label: string; value: number; target?: number; unit: string; color: string; kind?: 'min' | 'max'; fmt?: (v: number) => string }) {
  const T = 0.58;
  const has = target !== undefined && target > 0;
  const pct = has ? value / target! : 0;
  const fill = has ? Math.min(1, pct * T) : 0;
  return (
    <View style={{ paddingVertical: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 }}>
        <Text style={{ flex: 1.1, color: colors.text, fontSize: 16 }} numberOfLines={1}>
          {label}
        </Text>
        <Text numberOfLines={1} style={{ flex: 1.4, color: colors.text, fontSize: 14, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
          {fmt(value)}
          {has ? ` / ${fmt(target!)}` : ''} {unit}
        </Text>
        <Text style={{ flex: 0.8, color: colors.text, fontSize: 15, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{has ? `${Math.round(pct * 100)}%` : 'Sem meta'}</Text>
      </View>
      {has ? (
        <View style={{ height: 18, backgroundColor: colors.track, borderRadius: 2, justifyContent: 'center', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: kind === 'min' ? `${T * 100}%` : 0, right: kind === 'min' ? 0 : `${(1 - T) * 100}%`, backgroundColor: soft(color, 0.22) }} />
          <View style={{ width: `${fill * 100}%`, minWidth: value > 0 ? 6 : 0, height: 7, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ position: 'absolute', left: `${T * 100}%`, width: 3, height: 10, marginLeft: -1.5, borderRadius: 2, backgroundColor: colors.muted }} />
        </View>
      ) : null}
    </View>
  );
}

export type WeekDay = { date: string; kcal: number; protein: number; fat: number; carbs: number; logged: boolean; target: { kcal: number; protein: number; fat: number; carbs: number } };

const WEEK_ROWS = [
  { key: 'kcal', letter: '', colorKey: 'kcal' },
  { key: 'protein', letter: 'P', colorKey: 'protein' },
  { key: 'fat', letter: 'G', colorKey: 'fat' },
  { key: 'carbs', letter: 'C', colorKey: 'carbs' },
] as const;

/**
 * Nutrição da semana: uma linha por macro e uma coluna por dia (segunda a domingo).
 * Cada célula tem a barra do dia e um traço na altura da meta. À direita, os números
 * do dia escolhido. "Restante" mostra quanto falta para a meta.
 */
export function WeeklyNutrition({ days, selected, onSelect, mode }: { days: WeekDay[]; selected: string; onSelect: (d: string) => void; mode: 'consumed' | 'remaining' }) {
  const today = todayIso();
  const sel = days.find((d) => d.date === selected) ?? days[0];
  const CELL = 64;
  // A meta fica a 82% da altura; acima disso a barra passa do traço.
  const TARGET_AT = 0.82;
  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: 12 }}>
      <View style={{ flex: 1 }}>
        {WEEK_ROWS.map((row, r) => (
          <View key={row.key} style={{ flexDirection: 'row', height: CELL + 16, alignItems: 'center', borderBottomWidth: r < 3 ? 1 : 0, borderBottomColor: colors.border }}>
            {days.map((d) => {
              const target = d.target[row.key];
              const value = d[row.key];
              const future = d.date > today;
              const shown = mode === 'remaining' ? Math.max(0, target - value) : value;
              const h = target > 0 ? Math.min(1, (shown / target) * TARGET_AT) : 0;
              const color = colors[row.colorKey];
              return (
                <Pressable key={d.date} onPress={() => onSelect(d.date)} accessibilityLabel={d.date} style={{ flex: 1, alignItems: 'center' }}>
                  <View style={{ width: '62%', height: CELL, backgroundColor: colors.track, opacity: future ? 0.6 : 1, alignItems: 'center', justifyContent: 'flex-end', borderRadius: 2 }}>
                    {(mode === 'remaining' && !future) || d.logged ? (
                      <View style={{ width: '42%', height: `${h * 100}%`, backgroundColor: color, borderTopLeftRadius: 1, borderTopRightRadius: 1 }} />
                    ) : null}
                    {future && mode === 'remaining' ? <View style={{ position: 'absolute', bottom: 0, width: '42%', height: `${TARGET_AT * 100}%`, backgroundColor: colors.border }} /> : null}
                    <View
                      style={{
                        position: 'absolute',
                        bottom: `${TARGET_AT * 100}%`,
                        width: '50%',
                        height: 3,
                        marginBottom: -1.5,
                        borderRadius: 2,
                        backgroundColor: d.logged && !future ? colors.text : colors.muted,
                        opacity: d.logged && !future ? 1 : 0.35,
                      }}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
        <View style={{ flexDirection: 'row', height: 34, alignItems: 'center' }}>
          {days.map((d, i) => (
            <Pressable key={d.date} onPress={() => onSelect(d.date)} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: d.date === sel.date ? colors.text : colors.muted, fontWeight: d.date === sel.date ? '800' : '400' }}>{WEEK_LETTERS[i]}</Text>
            </Pressable>
          ))}
        </View>
        {/* Moldura do dia escolhido */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -4,
            bottom: 0,
            left: `${(days.indexOf(sel) / 7) * 100}%`,
            width: `${100 / 7}%`,
            borderWidth: 2,
            borderColor: colors.text,
            borderRadius: 10,
          }}
        />
      </View>
      <View style={{ width: 92, paddingLeft: 10 }}>
        {WEEK_ROWS.map((row) => {
          const value = sel[row.key];
          const target = sel.target[row.key];
          const shown = mode === 'remaining' ? target - value : value;
          return (
            <View key={row.key} style={{ height: CELL + 16, justifyContent: 'center' }}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.text, fontSize: 22, fontVariant: ['tabular-nums'] }}>
                {fmtNum(Math.round(shown))}
                {row.letter ? ` ${row.letter}` : ''}
                {!row.letter ? <Ionicons name="flame" size={16} color={colors.text} /> : null}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 14 }}>de {fmtNum(Math.round(target))}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
