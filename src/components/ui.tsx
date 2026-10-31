import { ReactNode, useSyncExternalStore } from 'react';
import { Link, Href } from 'expo-router';
import { Appearance, Platform, Pressable, Switch, Text, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';

import { useAppStore } from '../store/useAppStore';
import { ColorMode, Palette, ThemeDef, THEMES } from './themes';

// Cores e estilos são objetos estáveis que o tema troca por dentro. As telas chamam
// useTheme() para redesenhar quando o tema ou o modo claro/escuro muda.
export const colors: Palette = { ...THEMES.padrao.light };

let current = { def: THEMES.padrao, dark: false, key: '' };
const listeners = new Set<() => void>();

function applyTheme(def: ThemeDef, dark: boolean) {
  const key = `${def.id}-${dark ? 'dark' : 'light'}`;
  if (key === current.key) return;
  current = { def, dark, key };
  Object.assign(colors, dark ? def.dark : def.light);
  Object.assign(styles, makeStyles(colors, def));
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    // No vidro, o degradê fica no fundo da página e também em cada tela (veja makeStyles).
    const g = def.glass?.[dark ? 'dark' : 'light'];
    document.body.style.background = g ? `linear-gradient(160deg, ${g[0]} 0%, ${g[1]} 100%) fixed` : colors.bg;
    document.body.style.colorScheme = dark ? 'dark' : 'light';
    if (def.webFont) document.body.style.fontFamily = def.webFont;
    else document.body.style.removeProperty('font-family');
  }
  listeners.forEach((l) => l());
}

function syncTheme() {
  const { themeId, colorMode } = useAppStore.getState().settings;
  const mode: ColorMode = colorMode ?? 'auto';
  const dark = mode === 'dark' || (mode === 'auto' && Appearance.getColorScheme() === 'dark');
  applyTheme(THEMES[themeId ?? 'padrao'] ?? THEMES.padrao, dark);
}

/** Tema atual. Chamar no topo de cada tela faz ela redesenhar quando o tema muda. */
export function useTheme() {
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current.key,
    () => current.key,
  );
  return current;
}

/** Vidro só na web, onde há desfoque de fundo; no celular fica a cor translúcida. */
export const isGlass = () => Boolean(current.def.glass) && Platform.OS === 'web';

/** Cor sólida do fundo de vidro (primeira cor do degradê), ou undefined fora do vidro. */
function glassBase(def: ThemeDef, dark: boolean): string | undefined {
  return Platform.OS === 'web' ? def.glass?.[dark ? 'dark' : 'light'][0] : undefined;
}

/** Degradê do vidro como imagem de fundo da tela (só na web). */
function glassImage(def: ThemeDef, dark: boolean): ViewStyle {
  const g = Platform.OS === 'web' ? def.glass?.[dark ? 'dark' : 'light'] : undefined;
  return g ? ({ backgroundImage: `linear-gradient(160deg, ${g[0]} 0%, ${g[1]} 100%)`, backgroundAttachment: 'fixed' } as ViewStyle) : {};
}

/** Fundo opaco das telas e das cenas da navegação. */
export function screenBackground(): string {
  return glassBase(current.def, current.dark) ?? colors.bg;
}


export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Muted({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      <Text style={[styles.buttonText, variant === 'secondary' && { color: colors.onPrimarySoft }]}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, suffix, ...props }: TextInputProps & { label: string; suffix?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput placeholderTextColor={colors.muted} style={styles.input} {...props} />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          style={[styles.chip, value === o.value && styles.chipActive]}
          accessibilityState={{ selected: value === o.value }}
        >
          <Text style={[styles.chipText, value === o.value && styles.chipTextActive]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ProgressBar({ value, target, color }: { value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

export function MacroRow({ label, value, target, unit, color }: { label: string; value: number; target: number; unit: string; color: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={styles.rowBetween}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>
          {Math.round(value)} / {target} {unit}
        </Text>
      </View>
      <ProgressBar value={value} target={target} color={color} />
    </View>
  );
}

export function ToggleRow({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <View style={[styles.rowBetween, { marginBottom: 8 }]}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={[styles.text, { fontSize: 15 }]}>{label}</Text>
        {hint ? <Text style={styles.muted}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.track }} thumbColor={value ? colors.onPrimary : undefined} />
    </View>
  );
}

export function Badge({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'warn' | 'danger' | 'good' }) {
  const bg = { neutral: colors.cardAlt, warn: colors.warnSoft, danger: colors.dangerSoft, good: colors.primarySoft }[tone];
  const fg = { neutral: colors.muted, warn: colors.warn, danger: colors.danger, good: colors.onPrimarySoft }[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: Math.min(6, current.def.shape.radiusChip), paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={{ color: fg, fontSize: 12, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

/** Linha clicável que leva a outra tela. */
export function NavRow({ href, title, subtitle }: { href: Href; title: string; subtitle?: string }) {
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => ({ paddingVertical: 10, opacity: pressed ? 0.6 : 1 })}>
        <View style={[styles.rowBetween, { marginBottom: 0 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.text, { fontSize: 15, fontWeight: '600' }]}>{title}</Text>
            {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
          </View>
          <Text style={{ color: colors.muted, fontSize: 18, marginLeft: 8 }}>›</Text>
        </View>
      </Pressable>
    </Link>
  );
}

export function LinkText({ children, onPress }: { children: ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={{ color: colors.primary, fontWeight: '600' }}>{children}</Text>
    </Pressable>
  );
}

/** Converte texto digitado ("12,5") em número; vazio vira undefined. */
export function parseInput(s: string): number | undefined {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

type Named<T> = { [K in keyof T]: ViewStyle | TextStyle };
const sheet = <T extends Named<T>>(x: T) => x;

function makeStyles(c: Palette, def: ThemeDef) {
  const sh = def.shape;
  const glass = Boolean(def.glass) && Platform.OS === 'web';
  const web = Platform.OS === 'web';
  const shadow: ViewStyle = sh.cardShadow
    ? { boxShadow: glass ? '0 8px 32px rgba(0,0,0,0.10)' : current.dark ? '0 1px 2px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)' }
    : {};
  const blur = glass ? ({ backdropFilter: `blur(${def.glass!.blur}px) saturate(180%)` } as ViewStyle) : {};
  const font: TextStyle = web && def.webFont ? { fontFamily: def.webFont } : {};
  return sheet({
    // Telas sempre opacas: as abas e a pilha mantêm as telas anteriores montadas por baixo,
    // e uma tela transparente deixava o conteúdo delas aparecer sobreposto.
    screen: { flex: 1, backgroundColor: glassBase(def, current.dark) ?? c.bg, ...glassImage(def, current.dark) },
    content: { padding: sh.padding, paddingBottom: 48, gap: sh.gap, maxWidth: 720, width: '100%', alignSelf: 'center' },
    card: { backgroundColor: c.card, borderRadius: sh.radiusCard, padding: 16, borderWidth: sh.cardBorder, borderColor: c.border, ...shadow, ...blur },
    title: { fontSize: sh.titleSize, fontWeight: sh.titleWeight, color: c.text, marginBottom: 8, ...font },
    muted: { color: c.muted, fontSize: 14, ...font },
    button: { backgroundColor: c.primary, paddingVertical: sh.buttonPadV, paddingHorizontal: 18, borderRadius: sh.radiusButton, alignItems: 'center' },
    buttonSecondary: { backgroundColor: c.primarySoft },
    buttonDanger: { backgroundColor: c.danger },
    buttonText: { color: c.onPrimary, fontWeight: def.id === 'windows' ? '600' : '700', fontSize: 15, ...font },
    field: { marginBottom: 12, flex: 1, minWidth: 140 },
    fieldLabel: { fontSize: 13, color: c.muted, marginBottom: 4, ...font },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: sh.inputBorder ? 1 : 0,
      borderColor: c.border,
      borderRadius: sh.radiusInput,
      backgroundColor: c.inputBg,
      ...(def.id === 'windows' ? { borderBottomWidth: 2, borderBottomColor: c.muted } : {}),
    },
    input: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: c.text, ...font },
    suffix: { paddingRight: 12, color: c.muted },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: sh.radiusChip, borderWidth: 1, borderColor: c.border, backgroundColor: glass ? c.cardAlt : c.inputBg },
    chipActive: { backgroundColor: def.id === 'pixel' ? c.primarySoft : c.primary, borderColor: def.id === 'pixel' ? c.primarySoft : c.primary },
    chipText: { color: c.text, fontSize: 14, ...font },
    chipTextActive: { color: def.id === 'pixel' ? c.onPrimarySoft : c.onPrimary, fontWeight: '600' },
    track: { height: 8, borderRadius: 4, backgroundColor: c.track, overflow: 'hidden' },
    fill: { height: 8, borderRadius: 4 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    row: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
    macroLabel: { fontSize: 15, fontWeight: '600', color: c.text, ...font },
    macroValue: { fontSize: 14, color: c.muted, fontVariant: ['tabular-nums'], ...font },
    warning: { backgroundColor: c.warnSoft, borderRadius: sh.radiusSmall, padding: 12 },
    warningText: { color: c.warn, fontSize: 14 },
    /** Fundo neutro pequeno (séries, contadores, pílulas). */
    soft: { backgroundColor: c.cardAlt, borderRadius: sh.radiusSmall },
    text: { color: c.text, ...font },
  });
}

export const styles = makeStyles(colors, THEMES.padrao);

useAppStore.subscribe(syncTheme);
Appearance.addChangeListener(syncTheme);
syncTheme();
