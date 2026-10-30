// Gráficos do modo Treino (barras, linhas e radar), desenhados em SVG para
// funcionar igual no Android, iOS, web e desktop.

import { ReactNode, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import { colors } from './ui';

function useWidth(initial = 320): [number, (e: { nativeEvent: { layout: { width: number } } }) => void] {
  const [w, setW] = useState(initial);
  return [w, (e) => setW(Math.max(120, Math.round(e.nativeEvent.layout.width)))];
}

/** Arredonda o topo do eixo para um valor "bonito" (1, 2, 2,5, 5 × 10ⁿ). */
export function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

const AXIS_W = 44;
// Na web o texto do SVG cai na fonte serifada se não for definido.
const FONT = Platform.OS === 'web' ? 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' : undefined;

function YAxis({ max, height, top, width, format }: { max: number; height: number; top: number; width: number; format: (v: number) => string }) {
  return (
    <G>
      {[0, 0.5, 1].map((f) => {
        const y = top + height - f * height;
        return (
          <G key={f}>
            <Line x1={AXIS_W} x2={width} y1={y} y2={y} stroke={colors.border} strokeDasharray={f ? '3 4' : undefined} strokeWidth={1} />
            <SvgText fontFamily={FONT} x={AXIS_W - 6} y={y + 4} fontSize={10} fill={colors.muted} textAnchor="end">
              {format(max * f)}
            </SvgText>
          </G>
        );
      })}
    </G>
  );
}

function XLabels({ labels, width, y, every }: { labels: string[]; width: number; y: number; every: number }) {
  const step = (width - AXIS_W) / Math.max(1, labels.length);
  return (
    <G>
      {labels.map((l, i) =>
        i % every === 0 ? (
          <SvgText fontFamily={FONT} key={i} x={AXIS_W + step * i + step / 2} y={y} fontSize={10} fill={colors.muted} textAnchor="middle">
            {l}
          </SvgText>
        ) : null,
      )}
    </G>
  );
}

export function BarChart({
  values,
  labels,
  format,
  height = 170,
  highlight,
  every,
}: {
  values: number[];
  labels: string[];
  format: (v: number) => string;
  height?: number;
  /** Índice da barra destacada (as outras ficam mais claras). */
  highlight?: number;
  /** Mostra 1 a cada N rótulos do eixo X (padrão: cerca de 6 rótulos). */
  every?: number;
}) {
  const [width, onLayout] = useWidth();
  const top = 8;
  const plotH = height - top - 22;
  const max = niceMax(Math.max(...values, 0));
  const step = (width - AXIS_W) / Math.max(1, values.length);
  const barW = Math.max(3, Math.min(28, step * 0.62));
  return (
    <View onLayout={onLayout}>
      <Svg width={width} height={height}>
        <YAxis max={max} height={plotH} top={top} width={width} format={format} />
        {values.map((v, i) => {
          const h = (v / max) * plotH;
          return (
            <Rect
              key={i}
              x={AXIS_W + step * i + (step - barW) / 2}
              y={top + plotH - h}
              width={barW}
              height={Math.max(0, h)}
              rx={Math.min(4, barW / 3)}
              fill={highlight === undefined || highlight === i ? colors.primary : colors.track}
            />
          );
        })}
        <XLabels labels={labels} width={width} y={height - 6} every={every ?? Math.ceil(labels.length / 6)} />
      </Svg>
    </View>
  );
}

export function LineChart({
  series,
  labels,
  height = 200,
  format = (v) => String(Math.round(v)),
}: {
  series: { color: string; values: number[] }[];
  labels: string[];
  height?: number;
  format?: (v: number) => string;
}) {
  const [width, onLayout] = useWidth();
  const top = 8;
  const plotH = height - top - 22;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const n = labels.length;
  const step = (width - AXIS_W) / Math.max(1, n);
  const x = (i: number) => AXIS_W + step * i + step / 2;
  const y = (v: number) => top + plotH - (v / max) * plotH;
  return (
    <View onLayout={onLayout}>
      <Svg width={width} height={height}>
        <YAxis max={max} height={plotH} top={top} width={width} format={format} />
        {series.map((s, k) => (
          <G key={k}>
            <Polyline points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke={s.color} strokeWidth={2} />
            {s.values.map((v, i) => (
              <Circle key={i} cx={x(i)} cy={y(v)} r={3} fill={s.color} />
            ))}
          </G>
        ))}
        <XLabels labels={labels} width={width} y={height - 6} every={Math.ceil(n / 5)} />
      </Svg>
    </View>
  );
}

/** Radar de 6 eixos: período atual (cor do tema) sobre o anterior (cinza). */
export function RadarChart({ axes, current, previous, size = 260 }: { axes: string[]; current: number[]; previous?: number[]; size?: number }) {
  const [width, onLayout] = useWidth(size);
  const w = Math.min(width, 420);
  const h = size;
  const cx = width / 2;
  const cy = h / 2;
  const r = Math.min(w / 2 - 50, h / 2 - 24);
  const max = Math.max(1, ...current, ...(previous ?? []));
  const pt = (i: number, f: number) => {
    // Primeiro eixo em cima à esquerda, como no Hevy (Costas, Peito, …).
    const a = -Math.PI / 2 - Math.PI / axes.length + (2 * Math.PI * i) / axes.length;
    return [cx + Math.cos(a) * r * f, cy + Math.sin(a) * r * f];
  };
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v / max).join(',')).join(' ');
  return (
    <View onLayout={onLayout}>
      <Svg width={width} height={h}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <Polygon key={f} points={axes.map((_, i) => pt(i, f).join(',')).join(' ')} fill="none" stroke={colors.border} strokeWidth={1} />
        ))}
        {axes.map((_, i) => {
          const [x2, y2] = pt(i, 1);
          return <Line key={i} x1={cx} y1={cy} x2={x2} y2={y2} stroke={colors.border} strokeWidth={1} />;
        })}
        {previous ? <Polygon points={poly(previous)} fill={colors.muted} fillOpacity={0.25} stroke={colors.muted} strokeWidth={1.5} /> : null}
        <Polygon points={poly(current)} fill={colors.primary} fillOpacity={0.3} stroke={colors.primary} strokeWidth={2} />
        {axes.map((label, i) => {
          const [lx, ly] = pt(i, 1.2);
          return (
            <SvgText fontFamily={FONT} key={label} x={lx} y={ly + 4} fontSize={12} fill={colors.muted} textAnchor={Math.abs(lx - cx) < 8 ? 'middle' : lx < cx ? 'end' : 'start'}>
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

export function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
      {items.map((it) => (
        <View key={it.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: it.color }} />
          <Text style={{ color: colors.muted, fontSize: 13 }}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** Barra horizontal com rótulo e valor (séries por músculo nos relatórios). */
export function HBar({ label, value, max, right }: { label: string; value: number; max: number; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
      <Text style={{ color: colors.text, width: 110 }} numberOfLines={1}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 14, borderRadius: 4, backgroundColor: colors.track, overflow: 'hidden' }}>
        <View style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`, height: 14, backgroundColor: colors.primary, borderRadius: 4 }} />
      </View>
      <Text style={{ color: colors.text, width: 44, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{right ?? String(Math.round(value * 2) / 2).replace('.', ',')}</Text>
    </View>
  );
}
