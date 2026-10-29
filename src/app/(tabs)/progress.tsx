import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { ListCard, ListRow, Section, Segmented, WeightChart } from '../../components/diet';
import { Button, Card, Chips, colors, Field, LinkText, Muted, parseInput, styles, Title, useTheme } from '../../components/ui';
import { MIN_LOGGED_DAYS, MIN_WEIGH_INS, trendWeights } from '../../domain/adaptiveTdee';
import { addDays, todayIso } from '../../domain/foods';
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

type Tab = 'peso' | 'medidas' | 'fotos' | 'relatorio';

const TABS: { value: Tab; label: string }[] = [
  { value: 'peso', label: 'Peso' },
  { value: 'medidas', label: 'Medidas' },
  { value: 'fotos', label: 'Fotos' },
  { value: 'relatorio', label: 'Relatório' },
];

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
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(params.tab ?? 'peso');
  // Abrir com ?tab=medidas (atalho do modo Treino) troca a aba mesmo com a tela já montada.
  const [paramTab, setParamTab] = useState(params.tab);
  if (params.tab !== paramTab) {
    setParamTab(params.tab);
    if (params.tab) setTab(params.tab);
  }
  const [range, setRange] = useState<'30' | '90' | 'all'>('30');
  const [allHistory, setAllHistory] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  const shown = range === 'all' ? weights : weights.slice(-Number(range));
  const points = shown.map((w) => ({ ...w, trend: trend.find((t) => t.date === w.date)!.kg }));
  const lastTrend = trend[trend.length - 1]?.kg;
  const weekAgo = [...trend].reverse().find((t) => t.date <= addDays(today, -7))?.kg;
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

  const measured = MFIELDS.map((f) => {
    const withVal = measurements.filter((x) => x[f.key] !== undefined);
    if (!withVal.length) return null;
    const first = withVal[0][f.key] as number;
    const last = withVal[withVal.length - 1][f.key] as number;
    return { ...f, first, last, count: withVal.length, date: withVal[withVal.length - 1].date };
  }).filter((x) => x !== null);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Segmented options={TABS} value={tab} onChange={setTab} />

      {msg ? (
        <View style={[styles.warning, { backgroundColor: colors.primarySoft }]}>
          <Text style={{ color: colors.onPrimarySoft }}>{msg}</Text>
        </View>
      ) : null}

      {tab === 'peso' ? (
        <>
          <Card>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Muted style={{ fontSize: 13 }}>Peso de tendência</Muted>
                <Text style={{ fontSize: 30, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] }}>
                  {lastTrend ? fmt(lastTrend) : '–'}
                  <Text style={{ fontSize: 16, color: colors.muted, fontWeight: '600' }}> kg</Text>
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Muted style={{ fontSize: 13 }}>Últimos 7 dias</Muted>
                <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4, fontVariant: ['tabular-nums'] }}>
                  {lastTrend && weekAgo ? `${lastTrend - weekAgo >= 0 ? '+' : '−'}${fmt(Math.abs(lastTrend - weekAgo))} kg` : '–'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 14 }}>
              <Field label={todayEntry ? 'Pesagem de hoje' : 'Registrar pesagem de hoje'} suffix="kg" keyboardType="decimal-pad" value={input} onChangeText={setInput} />
              <View style={{ marginBottom: 12 }}>
                <Button
                  title={todayEntry ? 'Atualizar' : 'Salvar'}
                  onPress={() => {
                    const kg = parseInput(input);
                    if (kg && kg > 20 && kg < 400) register(kg);
                  }}
                />
              </View>
            </View>
            <Muted style={{ fontSize: 12 }}>De manhã, em jejum, depois do banheiro. O app usa a tendência, então oscilações diárias não atrapalham.</Muted>
            {healthSync && healthProviderName ? (
              <View style={{ marginTop: 8 }}>
                <LinkText onPress={importHealth}>Importar de {healthProviderName}</LinkText>
              </View>
            ) : null}
          </Card>

          <Card>
            <View style={[styles.rowBetween, { marginBottom: 8 }]}>
              <Title>Tendência</Title>
              <Chips
                options={[
                  { value: '30', label: '30' },
                  { value: '90', label: '90' },
                  { value: 'all', label: 'Tudo' },
                ]}
                value={range}
                onChange={setRange}
              />
            </View>
            {points.length < 2 ? (
              <Muted>Registre pelo menos duas pesagens para ver o gráfico.</Muted>
            ) : (
              <>
                <WeightChart points={points} />
                <Muted style={{ fontSize: 12, marginTop: 6 }}>Pontos: pesagens. Linha: peso de tendência.</Muted>
              </>
            )}
          </Card>

          <Section title="Gasto energético" />
          <Card>
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
                  <Text style={{ color: colors.warn, marginTop: 8 }}>Ganho acima de 0,5% do peso por semana: parte disso tende a ser gordura.</Text>
                ) : null}
              </>
            ) : (
              <>
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{data.targets.tdee} kcal/dia</Text>
                <Muted>
                  Estimativa pela fórmula. O cálculo adaptativo começa com {MIN_LOGGED_DAYS} dias registrados e {MIN_WEIGH_INS} pesagens em 4 semanas (você tem{' '}
                  {adaptive.loggedDays} e {adaptive.weighIns}).
                </Muted>
              </>
            )}
          </Card>

          <Section
            title="Histórico"
            right={weights.length > 7 ? <LinkText onPress={() => setAllHistory(!allHistory)}>{allHistory ? 'Ver menos' : 'Ver tudo'}</LinkText> : undefined}
          />
          {weights.length === 0 ? (
            <Muted>Nenhuma pesagem ainda.</Muted>
          ) : (
            <ListCard>
              {[...weights]
                .reverse()
                .slice(0, allHistory ? 90 : 7)
                .map((w, i) => (
                  <ListRow
                    key={w.date}
                    first={i === 0}
                    title={<Text style={{ color: colors.text, fontSize: 15 }}>{w.date.split('-').reverse().join('/')}</Text>}
                    right={
                      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                        <Text style={{ color: colors.text, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{fmt(w.kg)} kg</Text>
                        <Pressable accessibilityLabel="Remover pesagem" onPress={() => removeWeight(w.date)} hitSlop={8}>
                          <Text style={{ color: colors.muted }}>✕</Text>
                        </Pressable>
                      </View>
                    }
                  />
                ))}
            </ListCard>
          )}
        </>
      ) : null}

      {tab === 'medidas' ? (
        <>
          {measuring ? (
            <Card>
              <Title>Medidas de hoje</Title>
              <Muted style={{ marginBottom: 8 }}>Preencha só o que mediu. O valor em cinza é o da última vez.</Muted>
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
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Button title="Cancelar" variant="secondary" onPress={() => setMeasuring(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Salvar"
                    disabled={!Object.values(m).some((v) => parseInput(v))}
                    onPress={() => {
                      const rec: BodyMeasurement = { date: today };
                      for (const f of MFIELDS) {
                        const v = parseInput(m[f.key] ?? '');
                        if (v) (rec as Record<string, number | string>)[f.key] = v;
                      }
                      saveMeasurement(rec);
                      setM({});
                      setMeasuring(false);
                    }}
                  />
                </View>
              </View>
            </Card>
          ) : (
            <Button title="Registrar medidas" onPress={() => setMeasuring(true)} />
          )}
          {measured.length === 0 ? (
            <Muted>No bulk, a cintura subindo rápido é sinal de gordura; braço e coxa subindo, de músculo. Meça a cada 2–4 semanas.</Muted>
          ) : (
            <>
              <Section title="Evolução" />
              <ListCard>
                {measured.map((f, i) => {
                  const d = f.last - f.first;
                  return (
                    <ListRow
                      key={f.key}
                      first={i === 0}
                      title={f.label}
                      subtitle={f.count > 1 ? `desde ${fmt(f.first)} ${f.suffix}` : `em ${f.date.split('-').reverse().slice(0, 2).join('/')}`}
                      right={
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: colors.text, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                            {fmt(f.last)} {f.suffix}
                          </Text>
                          {f.count > 1 && d !== 0 ? (
                            <Text style={{ color: colors.muted, fontSize: 12 }}>
                              {d > 0 ? '↑' : '↓'} {fmt(Math.abs(d))}
                            </Text>
                          ) : null}
                        </View>
                      }
                    />
                  );
                })}
              </ListCard>
              <Muted style={{ fontSize: 12 }}>No bulk, cintura subindo rápido indica gordura; braço e coxa subindo, músculo.</Muted>
            </>
          )}
        </>
      ) : null}

      {tab === 'fotos' ? (
        <Card>
          <Muted style={{ marginBottom: 10 }}>Ficam só neste aparelho. Mesma luz, mesmo lugar e mesma pose ajudam a comparar.</Muted>
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
          <View style={[styles.row, { marginTop: 12, gap: 8 }]}>
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
      ) : null}

      {tab === 'relatorio' ? (
        <>
          <Muted>Para levar ao nutricionista ou guardar uma cópia dos seus dados.</Muted>
          {hasFeature(isPro, 'export') ? (
            <ListCard>
              <ListRow
                first
                icon="document-text-outline"
                title="Relatório em PDF"
                subtitle="Últimos 14 dias: metas, médias, refeições e peso"
                onPress={() =>
                  data &&
                  sharePdf(reportHtml({ profile: data.profile, targets: data.targets, entries, weights, foods, endDate: today })).catch(() =>
                    setMsg('Não foi possível gerar o PDF.'),
                  )
                }
              />
              <ListRow icon="grid-outline" title="Diário em planilha" subtitle="CSV com tudo que você registrou" onPress={() => shareText(`diario-${today}.csv`, diaryCsv(entries, foods), 'text/csv')} />
              <ListRow icon="scale-outline" title="Pesos em planilha" subtitle="CSV com as pesagens" onPress={() => shareText(`pesos-${today}.csv`, weightsCsv(weights), 'text/csv')} />
            </ListCard>
          ) : (
            <Button title="Exportar é um recurso Pro" variant="secondary" onPress={() => router.push('/pro')} />
          )}
        </>
      ) : null}
    </ScrollView>
  );
}
