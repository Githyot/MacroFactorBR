import { Text, View } from 'react-native';

import { monthGrid } from '../domain/workout/stats';
import { colors } from './ui';

const HEAD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Mês de domingo a sábado com os dias de treino em círculos cheios. */
export function MonthCalendar({ month, days, today }: { month: string; days: Set<string>; today?: string }) {
  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        {HEAD.map((h) => (
          <Text key={h} style={{ flex: 1, textAlign: 'center', color: colors.muted, fontSize: 12, marginBottom: 6 }}>
            {h}
          </Text>
        ))}
      </View>
      {monthGrid(month).map((week, i) => (
        <View key={i} style={{ flexDirection: 'row', marginBottom: 6 }}>
          {week.map((d, j) => {
            const on = d ? days.has(d) : false;
            return (
              <View key={j} style={{ flex: 1, alignItems: 'center' }}>
                {d ? (
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: on ? colors.primary : 'transparent',
                      borderWidth: d === today && !on ? 1 : 0,
                      borderColor: colors.primary,
                    }}
                  >
                    <Text style={{ color: on ? colors.onPrimary : colors.text, fontVariant: ['tabular-nums'] }}>{Number(d.slice(8))}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
