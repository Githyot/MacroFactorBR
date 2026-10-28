import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Card, Chips, colors, Field, LinkText, Muted, parseInput, styles, Title, useTheme } from '../../components/ui';
import { MIN_LOGGED_DAYS, MIN_WEIGH_INS, trendWeights } from '../../domain/adaptiveTdee';
import { todayIso } from '../../domain/foods';
import { hasFeature } from '../../domain/pro';
import { diaryCsv, reportHtml, weightsCsv } from '../../domain/report';
import { usePro } from '../../hooks/usePro';
import { shareText, sharePdf } from '../../services/files';
import { healthProviderName, readWeights, writeWeight } from '../../services/health';
import { deleteProgressPhoto, pickProgressPhoto } from '../../services/photos';
import { useTargets } from '../../hooks/useTargets';
import { BodyMeasurement, ProgressPhoto, useAllFoods, useAppStore } from '../../store/useAppStore';

function fmt(kg: number) {
  return kg.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function TrendChart({ points }: { points: { date: string; kg: number; trend: number }[] }) {
  if (points.length < 2) return null;
  const all = points.flatMap((p) => [p.kg, p.trend]);
  const min = Math.min(...all) - 0.3;
  const max = Math.max(...all) + 0.3;
  const h = 120;
  const y = (kg: number) => h - ((kg - min) / (max - min)) * h;
  return (
    <View style={{ height: h, flexDirection: 'row', alignItems: 'stretch', gap: 2, marginVertical: 8 }}>
      {points.map((p) => (
        <View key={p.date} style={{ flex: 1, position: 'relative' }}>
          <View style={{ position: 'absolute', top: y(p.kg) - 3, left: '50%', marginLeft: -3, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.muted }} />
          <View style={{ position: 'absolute', top: y(p.trend) - 2, left: 0, right: 0, height: 4, borderRadius: 2, backgroundColor: colors.primary }} />
        </View>
      ))}
    </View>
  );
}

export default function ProgressScreen() {
  useTheme();
  const weights = useAppStore((s) => s.weights);
  const logWeight = useAppStore((s) => s.logWeight);
  const removeWeight = useAppStore((s) => s.removeWeight);
  const data = useTargets();
  const today = todayIso();
  const todayEntry = weights.find((w) => w.date === today);
  const [input, setInput] = useState(todayEntry ? fmt(todayEntry.kg) : '');

  const trend = trendWeights(weights);
  const points = weights.slice(-30).map((w) => ({ ...w, trend: trend.find((t) => t.date === w.date)!.kg }));
  const adaptive = data?.adaptive;
  const healthSync = useAppStore((s) => s.settings.healthSync);
  const measurements = useAppStore((s) => s.measurements);
  const saveMeasurement = useAppStore((s) => s.saveMeasurement);
  const photos = useAppStore((s) => s.photos);
  const addPhoto = useAppStore((s) => s.addPhoto);
  const removePhoto = useAppStore((s) => s.removePhoto);
  const entries = useAppStore((s) => s.entries);
  const foods = useAllFoods();
  const isPro = usePro();
  const lastM = measurements[measurements.length - 1];
  const [m, setM] = useState<Record<string, string>>({});
  const [pose, setPose] = useState<NonNullable<ProgressPhoto['pose']>>('frente');
  const [msg, setMsg] = useState<string | null>(null);

  const register = (kg: number) => {
    logWeight(today, kg);
    if (healthSync) writeWeight(kg, new Date()).catch(() => {});
  };

  const importHealth = async () => {
    try {
      const list = await readWeights(60);
      const known = new Set(weights.map((w) => w.date));
      const fresh = list.filter((w) => !known.has(w.date));
      fresh.forEach((w) => logWeight(w.date, w.kg));
      setMsg(`${fresh.length} pesagem(ns) importada(s) de ${healthProviderName}.`);
    } catch {
      setMsg(`Não foi possível ler ${healthProviderName}. Autorize em Perfil › Conta e dados.`);
    }
  };

  const MFIELDS: { key: keyof BodyMeasurement; label: string; suffix: string }[] = [
    { key: 'waistCm', label: 'Cintura', suffix: 'cm' },
    { key: 'hipCm', label: 'Quadril', suffix: 'cm' },
    { key: 'chestCm', label: 'Peito', suffix: 'cm' },
    { key: 'shouldersCm', label: 'Ombros', suffix: 'cm' },
    { key: 'neckCm', label: 'Pescoço', suffix: 'cm' },
    { key: 'armCm', label: 'Braço esq.', suffix: 'cm' },
    { key: 'armRightCm', label: 'Braço dir.', suffix: 'cm' },
    { key: 'forearmCm', label: 'Antebraço', suffix: 'cm' },
    { key: 'thighCm', label: 'Coxa esq.', suffix: 'cm' },
    { key: 'thighRightCm', label: 'Coxa dir.', suffix: 'cm' },
    { key: 'calfCm', label: 'Panturrilha', suffix: 'cm' },
    { key: 'bodyFatPct', label: '% gordura', suffix: '%' },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card>
        <View style={styles.rowBetween}>
          <Title>Pesagem de hoje</Title>
          {healthSync && healthProviderName ? <LinkText onPress={importHealth}>Importar de {healthProviderName}</LinkText> : null}
        </View>
        <Muted style={{ marginBottom: 8 }}>Pese-se de manhã, em jejum, depois de ir ao banheiro. O app usa a tendência, então oscilações diárias não atrapalham.</Muted>
        <Field label="Peso" suffix="kg" keyboardType="decimal-pad" value={input} onChangeText={setInput} />
        <Button
          title={todayEntry ? 'Atualizar' : 'Registrar'}
          onPress={() => {
            const kg = parseInput(input);
            if (kg && kg > 20 && kg < 400) register(kg);
          }}
        />
      </Card>

      <Card>
        <Title>Tendência</Title>
        {points.length < 2 ? (
          <Muted>Registre pelo menos duas pesagens para ver o gráfico.</Muted>
        ) : (
          <>
            <TrendChart points={points} />
            <Muted>Pontos: pesagens. Linha verde: peso de tendência ({fmt(points[points.length - 1].trend)} kg).</Muted>
          </>
        )}
      </Card>

      <Card>
        <Title>Gasto energético adaptativo</Title>
        {!adaptive ? (
          <Muted>Configure o perfil primeiro.</Muted>
        ) : adaptive.status === 'ok' ? (
          <>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{adaptive.tdee} kcal/dia</Text>
            <Muted>
              Média consumida {adaptive.avgIntake} kcal, peso {adaptive.weeklyChangeKg >= 0 ? 'subindo' : 'caindo'}{' '}
              {fmt(Math.abs(adaptive.weeklyChangeKg))} kg/semana. Suas metas já usam esse valor.
            </Muted>
            {data.profile.goal === 'bulk' && adaptive.weeklyChangeKg > data.profile.weightKg * 0.005 ? (
              <Text style={{ color: colors.warn, marginTop: 8 }}>
                Ganho acima de 0,5% do peso por semana: parte disso tende a ser gordura.
              </Text>
            ) : null}
          </>
        ) : (
          <Muted>
            Juntando dados: {adaptive.loggedDays}/{MIN_LOGGED_DAYS} dias com refeições registradas e {adaptive.weighIns}/{MIN_WEIGH_INS} pesagens nas últimas 4 semanas. Até lá, as metas usam a fórmula.
          </Muted>
        )}
      </Card>

      {msg ? (
        <View style={[styles.warning, { backgroundColor: colors.primarySoft }]}>
          <Text style={{ color: colors.primary }}>{msg}</Text>
        </View>
      ) : null}

      <Card>
        <Title>Medidas</Title>
        <Muted style={{ marginBottom: 8 }}>
          No bulk, a cintura subindo rápido é sinal de gordura; braço e coxa subindo, de músculo. Meça a cada 2–4 semanas.
        </Muted>
        <View style={styles.row}>
          {MFIELDS.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              suffix={f.suffix}
              keyboardType="decimal-pad"
              value={m[f.key] ?? ''}
              placeholder={lastM?.[f.key] ? String(lastM[f.key]).replace('.', ',') : undefined}
              onChangeText={(v) => setM({ ...m, [f.key]: v })}
            />
          ))}
        </View>
        <Button
          title="Salvar medidas de hoje"
          variant="secondary"
          disabled={!Object.values(m).some((v) => parseInput(v))}
          onPress={() => {
            const rec: BodyMeasurement = { date: today };
            for (const f of MFIELDS) {
              const v = parseInput(m[f.key] ?? '');
              if (v) (rec as Record<string, number | string>)[f.key] = v;
            }
            saveMeasurement(rec);
            setM({});
          }}
        />
        {measurements.length > 1 ? (
          <View style={{ marginTop: 10 }}>
            {MFIELDS.map((f) => {
              const withVal = measurements.filter((x) => x[f.key] !== undefined);
              if (withVal.length < 2) return null;
              const first = withVal[0][f.key] as number;
              const last = withVal[withVal.length - 1][f.key] as number;
              const d = last - first;
              return (
                <Text key={f.key} style={styles.macroValue}>
                  {f.label}: {fmt(first)} → {fmt(last)} {f.suffix} ({d >= 0 ? '+' : ''}
                  {fmt(d)})
                </Text>
              );
            })}
          </View>
        ) : null}
      </Card>

      <Card>
        <Title>Fotos de progresso</Title>
        <Muted style={{ marginBottom: 8 }}>Ficam só neste aparelho. Mesma luz, mesmo lugar e mesma pose ajudam a comparar.</Muted>
        <Chips
          options={[
            { value: 'frente', label: 'Frente' },
            { value: 'lado', label: 'Lado' },
            { value: 'costas', label: 'Costas' },
          ]}
          value={pose}
          onChange={setPose}
        />
        <View style={styles.row}>
          {Platform.OS !== 'web' ? (
            <View style={{ flex: 1 }}>
              <Button
                title="Tirar foto"
                variant="secondary"
                onPress={async () => {
                  const uri = await pickProgressPhoto('camera');
                  if (uri) addPhoto({ date: today, uri, pose });
                }}
              />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Button
              title="Da galeria"
              variant="secondary"
              onPress={async () => {
                const uri = await pickProgressPhoto('library');
                if (uri) addPhoto({ date: today, uri, pose });
              }}
            />
          </View>
        </View>
        <View style={[styles.row, { marginTop: 10, gap: 8 }]}>
          {[...photos].reverse().map((p) => (
            <Pressable
              key={p.id}
              onLongPress={() => {
                deleteProgressPhoto(p.uri);
                removePhoto(p.id);
              }}
              style={{ width: 100 }}
            >
              <Image source={{ uri: p.uri }} style={{ width: 100, height: 133, borderRadius: 8, backgroundColor: colors.border }} />
              <Text style={[styles.muted, { fontSize: 12 }]}>
                {p.date.split('-').reverse().slice(0, 2).join('/')} · {p.pose}
              </Text>
            </Pressable>
          ))}
        </View>
        {photos.length > 0 ? <Muted style={{ marginTop: 6, fontSize: 12 }}>Toque e segure uma foto para apagar.</Muted> : null}
      </Card>

      <Card>
        <Title>Levar ao nutricionista</Title>
        {hasFeature(isPro, 'export') ? (
          <View style={{ gap: 8 }}>
            <Button
              title="Relatório em PDF (14 dias)"
              variant="secondary"
              disabled={!data}
              onPress={() =>
                data &&
                sharePdf(reportHtml({ profile: data.profile, targets: data.targets, entries, weights, foods, endDate: today })).catch(() =>
                  setMsg('Não foi possível gerar o PDF.'),
                )
              }
            />
            <Button title="Diário em planilha (CSV)" variant="secondary" onPress={() => shareText(`diario-${today}.csv`, diaryCsv(entries, foods), 'text/csv')} />
            <Button title="Pesos em planilha (CSV)" variant="secondary" onPress={() => shareText(`pesos-${today}.csv`, weightsCsv(weights), 'text/csv')} />
          </View>
        ) : (
          <Button title="Exportar é um recurso Pro" variant="secondary" onPress={() => router.push('/pro')} />
        )}
      </Card>

      <Card>
        <Title>Histórico</Title>
        {weights.length === 0 ? <Muted>Nenhuma pesagem ainda.</Muted> : null}
        {[...weights].reverse().slice(0, 30).map((w) => (
          <View key={w.date} style={[styles.rowBetween, { paddingVertical: 4 }]}>
            <Text style={{ color: colors.text }}>{w.date.split('-').reverse().join('/')}</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Text style={styles.macroValue}>{fmt(w.kg)} kg</Text>
              <Pressable accessibilityLabel="Remover pesagem" onPress={() => removeWeight(w.date)} hitSlop={8}>
                <Text style={{ color: colors.danger }}>✕</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}
