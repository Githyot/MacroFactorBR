// Peças compartilhadas pelas telas do modo Dieta (mesmo padrão visual do modo Treino).

import Ionicons from '@expo/vector-icons/Ionicons';
import { ComponentProps, ReactNode, useState } from 'react';
import { Pressable, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { addDays, todayIso } from '../domain/foods';
import { colors, styles } from './ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function dayLabel(date: string): string {
  const today = todayIso();
  if (date === today) return 'Hoje';
  if (date === addDays(today, -1)) return 'Ontem';
  return date.split('-').reverse().slice(0, 2).join('/');
}

/** Faixa com os últimos 7 dias; o dia escolhido fica destacado. */
export function WeekStrip({ date, onChange, marked }: { date: string; onChange: (d: string) => void; marked?: (d: string) => boolean }) {
  const today = todayIso();
  // Blocos de 7 dias terminando hoje; a faixa pula de bloco quando o dia escolhido sai dela.
  const back = Math.round((new Date(`${today}T12:00:00`).getTime() - new Date(`${date}T12:00:00`).getTime()) / 86_400_000);
  const end = addDays(today, -7 * Math.max(0, Math.floor(back / 7)));
  const days = Array.from({ length: 7 }, (_, i) => addDays(end, i - 6));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Pressable accessibilityLabel="Semana anterior" hitSlop={8} onPress={() => onChange(addDays(date, -7))} style={{ padding: 4 }}>
        <Ionicons name="chevron-back" size={18} color={colors.muted} />
      </Pressable>
      {days.map((d) => {
        const on = d === date;
        const weekday = WEEKDAYS[new Date(`${d}T12:00:00`).getDay()];
        return (
          <Pressable
            key={d}
            onPress={() => onChange(d)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={dayLabel(d)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 12, backgroundColor: on ? colors.primary : 'transparent' }}
          >
            <Text style={{ fontSize: 11, color: on ? colors.onPrimary : colors.muted, fontWeight: '600' }}>{weekday}</Text>
            <Text style={{ fontSize: 16, color: on ? colors.onPrimary : colors.text, fontWeight: d === today || on ? '800' : '500' }}>{Number(d.slice(8))}</Text>
            <View style={{ width: 4, height: 4, borderRadius: 2, marginTop: 2, backgroundColor: marked?.(d) ? (on ? colors.onPrimary : colors.primary) : 'transparent' }} />
          </Pressable>
        );
      })}
      <Pressable
        accessibilityLabel="Próxima semana"
        hitSlop={8}
        disabled={date >= today}
        onPress={() => onChange(addDays(date, 7) > today ? today : addDays(date, 7))}
        style={{ padding: 4, opacity: date >= today ? 0.3 : 1 }}
      >
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );
}

/** Anel de progresso com conteúdo no meio. */
export function Ring({ value, target, color, size = 120, stroke = 10, children }: { value: number; target: number; color: string; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  const over = target > 0 && value > target * 1.05;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={over ? colors.warn : color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

/** Uma meta com barra fina: "Proteína  120 / 160 g". */
export function MacroLine({ label, value, target, unit, color, strong }: { label: string; value: number; target: number; unit: string; color: string; strong?: boolean }) {
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={{ color: colors.text, fontSize: strong ? 15 : 14, fontWeight: strong ? '700' : '500' }}>{label}</Text>
        <Text style={{ color: colors.muted, fontSize: 13, fontVariant: ['tabular-nums'] }}>
          <Text style={{ color: strong ? color : colors.text, fontWeight: '700', fontSize: strong ? 16 : 14 }}>{Math.round(value)}</Text> / {target} {unit}
        </Text>
      </View>
      <View style={{ height: strong ? 8 : 6, borderRadius: 4, backgroundColor: colors.track, overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 4, backgroundColor: color }} />
      </View>
    </View>
  );
}

/** Botão quadrado com ícone e rótulo embaixo (barra de adicionar). */
export function ActionTile({ icon, label, onPress, primary }: { icon: IconName; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.soft,
        { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 4, opacity: pressed ? 0.6 : 1 },
        primary && { backgroundColor: colors.primary },
      ]}
    >
      <Ionicons name={icon} size={22} color={primary ? colors.onPrimary : colors.text} />
      <Text numberOfLines={1} style={{ color: primary ? colors.onPrimary : colors.text, fontSize: 12, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Título de seção em cinza, com ação opcional à direita. */
export function Section({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: -4 }}>
      <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' }}>{title}</Text>
      {right}
    </View>
  );
}

/** Cartão sem espaçamento interno, para listas com divisórias. */
export function ListCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, { paddingVertical: 0, paddingHorizontal: 0, overflow: 'hidden' }, style]}>{children}</View>;
}

/** Linha de lista com ícone, título, subtítulo e valor à direita. */
export function ListRow({
  icon,
  iconColor,
  title,
  subtitle,
  right,
  onPress,
  first,
  chevron = Boolean(onPress),
}: {
  icon?: IconName;
  iconColor?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  first?: boolean;
  chevron?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.border,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {icon ? (
        <View style={{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardAlt }}>
          <Ionicons name={icon} size={18} color={iconColor ?? colors.text} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        {typeof title === 'string' ? <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>{title}</Text> : title}
        {subtitle ? <Text style={[styles.muted, { fontSize: 13, marginTop: 1 }]}>{subtitle}</Text> : null}
      </View>
      {typeof right === 'string' ? <Text style={{ color: colors.muted, fontSize: 14, fontVariant: ['tabular-nums'] }}>{right}</Text> : right}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
    </Pressable>
  );
}

/** Controle segmentado de largura total (Peso | Medidas | Fotos…). */
export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={[styles.soft, { flexDirection: 'row', padding: 3, borderRadius: 12 }]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9, backgroundColor: on ? colors.card : 'transparent' }}
          >
            <Text style={{ color: on ? colors.text : colors.muted, fontWeight: on ? '700' : '500', fontSize: 14 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Pílula pequena colorida (status da proteína da refeição etc.). */
export function Pill({ text, tone, icon }: { text: string; tone: 'good' | 'warn' | 'neutral'; icon?: IconName }) {
  const bg = { good: colors.primarySoft, warn: colors.warnSoft, neutral: colors.cardAlt }[tone];
  const fg = { good: colors.onPrimarySoft, warn: colors.warn, neutral: colors.muted }[tone];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: bg, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start' }}>
      {icon ? <Ionicons name={icon} size={12} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: 12, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

/** Botão redondo só com ícone. */
export function IconButton({ icon, label, onPress, filled }: { icon: IconName; label: string; onPress: () => void; filled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={6}
      style={({ pressed }) => ({
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: filled ? colors.primary : colors.cardAlt,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Ionicons name={icon} size={18} color={filled ? colors.onPrimary : colors.text} />
    </Pressable>
  );
}

/** Cartão que abre e fecha (dicas, histórico). */
export function Collapsible({ title, icon, summary, children, initiallyOpen = false }: { title: string; icon?: IconName; summary?: string; children: ReactNode; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View style={styles.card}>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {icon ? <Ionicons name={icon} size={18} color={colors.primary} /> : null}
        <Text style={{ flex: 1, color: colors.text, fontWeight: '700', fontSize: 15 }}>{title}</Text>
        {summary && !open ? <Text style={[styles.muted, { fontSize: 13 }]}>{summary}</Text> : null}
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </Pressable>
      {open ? <View style={{ marginTop: 10 }}>{children}</View> : null}
    </View>
  );
}

/** Gráfico do peso: pontos das pesagens e a linha de tendência, com a escala ajustada aos dados. */
export function WeightChart({ points, height = 170 }: { points: { date: string; kg: number; trend: number }[]; height?: number }) {
  const [width, setWidth] = useState(320);
  if (points.length < 2) return null;
  const all = points.flatMap((p) => [p.kg, p.trend]);
  const min = Math.floor((Math.min(...all) - 0.3) * 2) / 2;
  const max = Math.ceil((Math.max(...all) + 0.3) * 2) / 2;
  const left = 38;
  const top = 8;
  const plotH = height - top - 20;
  const step = (width - left - 6) / Math.max(1, points.length - 1);
  const x = (i: number) => left + step * i;
  const y = (kg: number) => top + plotH - ((kg - min) / (max - min)) * plotH;
  const fmt = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  const first = points[0].date.split('-').reverse().slice(0, 2).join('/');
  const last = points[points.length - 1].date.split('-').reverse().slice(0, 2).join('/');
  return (
    <View onLayout={(e) => setWidth(Math.max(160, Math.round(e.nativeEvent.layout.width)))}>
      <Svg width={width} height={height}>
        {[0, 0.5, 1].map((f) => {
          const v = min + (max - min) * f;
          return <Line key={f} x1={left} x2={width} y1={y(v)} y2={y(v)} stroke={colors.border} strokeDasharray={f ? '3 4' : undefined} />;
        })}
        {points.map((p, i) => (
          <Circle key={p.date} cx={x(i)} cy={y(p.kg)} r={2.5} fill={colors.muted} />
        ))}
        <Polyline points={points.map((p, i) => `${x(i)},${y(p.trend)}`).join(' ')} fill="none" stroke={colors.primary} strokeWidth={3} strokeLinejoin="round" />
      </Svg>
      {[0, 0.5, 1].map((f) => (
        <Text key={f} style={{ position: 'absolute', left: 0, top: y(min + (max - min) * f) - 8, fontSize: 10, color: colors.muted, width: left - 6, textAlign: 'right' }}>
          {fmt(min + (max - min) * f)}
        </Text>
      ))}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingLeft: left, marginTop: -16 }}>
        <Text style={{ fontSize: 10, color: colors.muted }}>{first}</Text>
        <Text style={{ fontSize: 10, color: colors.muted }}>{last}</Text>
      </View>
    </View>
  );
}
