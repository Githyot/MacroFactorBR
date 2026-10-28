import { Pressable, Text, View } from 'react-native';

import { useAppStore } from '../store/useAppStore';
import { ColorMode, THEME_ORDER, THEMES } from './themes';
import { Chips, colors, Muted, styles, Title, useTheme } from './ui';

const MODES: { value: ColorMode; label: string }[] = [
  { value: 'auto', label: 'Automático' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];

/** Escolha do visual: uma miniatura de cada tema no modo atual. */
export function ThemePicker() {
  const { def: active, dark } = useTheme();
  const mode = useAppStore((s) => s.settings.colorMode ?? 'auto');
  const updateSettings = useAppStore((s) => s.updateSettings);

  return (
    <View>
      <Title>Aparência</Title>
      <Chips options={MODES} value={mode} onChange={(colorMode) => updateSettings({ colorMode })} />
      {mode === 'auto' ? <Muted style={{ marginTop: -4, marginBottom: 10 }}>Segue o modo claro ou escuro do aparelho.</Muted> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {THEME_ORDER.map((id) => {
          const t = THEMES[id];
          const p = dark ? t.dark : t.light;
          const g = t.glass?.[dark ? 'dark' : 'light'];
          const selected = active.id === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`Tema ${t.label}`}
              onPress={() => updateSettings({ themeId: id })}
              style={({ pressed }) => [
                {
                  width: 150,
                  flexGrow: 1,
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: selected ? colors.primary : 'transparent',
                  padding: 4,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={{ height: 78, borderRadius: 10, padding: 8, gap: 6, backgroundColor: g ? g[0] : p.bg, overflow: 'hidden' }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: p.card,
                    borderRadius: Math.min(t.shape.radiusCard, 16),
                    borderWidth: t.shape.cardBorder,
                    borderColor: p.border,
                    padding: 6,
                    gap: 4,
                    justifyContent: 'center',
                  }}
                >
                  <View style={{ height: 5, width: '70%', borderRadius: 3, backgroundColor: p.text, opacity: 0.8 }} />
                  <View style={{ height: 5, width: '45%', borderRadius: 3, backgroundColor: p.muted, opacity: 0.6 }} />
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <View style={{ flex: 1, height: 14, borderRadius: Math.min(t.shape.radiusButton, 7), backgroundColor: p.primary }} />
                  <View style={{ width: 28, height: 14, borderRadius: Math.min(t.shape.radiusChip, 7), backgroundColor: p.primarySoft }} />
                </View>
              </View>
              <Text style={[styles.text, { fontWeight: '700', marginTop: 6 }]}>{t.label}</Text>
              <Text style={[styles.muted, { fontSize: 12 }]} numberOfLines={2}>
                {t.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
