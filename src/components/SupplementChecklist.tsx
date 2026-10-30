import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { formatAmount, NUTRIENT_BY_KEY } from '../domain/nutrients';
import { formatDose, scheduledDoses, UpperLimitWarning } from '../domain/supplements';
import { useAppStore } from '../store/useAppStore';
import { Button, colors, LinkText, Muted, styles, Title } from './ui';

/** Doses do dia para marcar, na tela Hoje. */
export function SupplementChecklist({ date, warnings, compact }: { date: string; warnings: UpperLimitWarning[]; compact?: boolean }) {
  const supplements = useAppStore((s) => s.supplements);
  const taken = useAppStore((s) => s.supplementLog[date]);
  const setTaken = useAppStore((s) => s.setSupplementTaken);
  const today = Object.values(supplements)
    .map((s) => ({ s, doses: scheduledDoses(s, date) }))
    .filter((x) => x.doses > 0)
    .sort((a, b) => a.s.name.localeCompare(b.s.name, 'pt-BR'));
  const done = today.reduce((n, x) => n + Math.min(x.doses, taken?.[x.s.id] ?? 0), 0);
  const total = today.reduce((n, x) => n + x.doses, 0);

  return (
    <View>
      {compact ? (
        total > 0 ? <Text style={[styles.macroValue, { marginBottom: 4 }]}>{done}/{total} doses marcadas</Text> : null
      ) : (
        <View style={styles.rowBetween}>
          <Title>Suplementação</Title>
          {total > 0 ? <Text style={styles.macroValue}>{done}/{total} doses</Text> : null}
        </View>
      )}
      {Object.keys(supplements).length === 0 ? (
        <>
          <Muted style={{ marginBottom: 10 }}>Monte seu protocolo de suplementos, vitaminas e remédios para marcar as doses de cada dia.</Muted>
          <Button title="Montar minha suplementação" variant="secondary" onPress={() => router.push('/supplements')} />
        </>
      ) : today.length === 0 ? (
        <Muted>Nada programado para este dia.</Muted>
      ) : (
        today.map(({ s, doses }) => {
          const count = taken?.[s.id] ?? 0;
          return (
            <View key={s.id} style={[styles.rowBetween, { paddingVertical: 6, gap: 10 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.text, { fontWeight: '600', fontSize: 15 }]}>{s.name}</Text>
                <Muted>
                  {formatDose(s)}
                  {s.times?.length ? ` · ${s.times.join(', ')}` : doses > 1 ? ` · ${doses}x ao dia` : ''}
                </Muted>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {Array.from({ length: doses }, (_, i) => {
                  const on = i < count;
                  return (
                    <Pressable
                      key={i}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={`${s.name}, dose ${i + 1}`}
                      hitSlop={6}
                      onPress={() => setTaken(date, s.id, on ? i : i + 1)}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: on ? colors.primary : colors.cardAlt,
                      }}
                    >
                      <Text style={{ color: on ? colors.onPrimary : colors.muted, fontWeight: '800' }}>{on ? '✓' : i + 1}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })
      )}
      {warnings.map((w) => {
        const info = NUTRIENT_BY_KEY[w.key];
        return (
          <View key={w.key} style={[styles.warning, { marginTop: 8 }]}>
            <Text style={styles.warningText}>
              {info.label}: {formatAmount(w.total, info.unit)} hoje, acima do limite seguro de {formatAmount(w.limit, info.unit)}
              {w.key === 'magnesium' ? ' em suplementos' : ''}. Revise as doses.
            </Text>
          </View>
        );
      })}
      {Object.keys(supplements).length > 0 && !compact ? (
        <View style={{ marginTop: 8 }}>
          <LinkText onPress={() => router.push('/supplements')}>Gerenciar suplementação ›</LinkText>
        </View>
      ) : null}
    </View>
  );
}
