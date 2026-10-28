import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { Button, Card, colors, Field, Muted, styles, Title, ToggleRow, useTheme } from '../components/ui';
import { todayIso } from '../domain/foods';
import { hasBackend } from '../services/config';
import { shareText } from '../services/files';
import { connectHealth, healthProviderName, isHealthAvailable } from '../services/health';
import { supabase } from '../services/supabase';
import { pullAndMerge } from '../services/sync';
import { pickPersisted, useAppStore } from '../store/useAppStore';

export default function AccountScreen() {
  useTheme();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const resetAll = useAppStore((s) => s.resetAll);
  const [email, setEmail] = useState<string | null>(null);
  const [inputEmail, setInputEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [healthOk, setHealthOk] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    isHealthAvailable().then(setHealthOk);
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setEmail(session?.user.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const run = async (fn: () => Promise<string | void>) => {
    setBusy(true);
    setMsg(null);
    try {
      const out = await fn();
      if (out) setMsg(out);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Algo deu errado.');
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () =>
    run(async () => {
      const { error } = await supabase!.auth.signInWithOtp({ email: inputEmail.trim(), options: { shouldCreateUser: true } });
      if (error) throw error;
      setCodeSent(true);
      return 'Enviamos um código para o seu e-mail.';
    });

  const verify = () =>
    run(async () => {
      const { error } = await supabase!.auth.verifyOtp({ email: inputEmail.trim(), token: code.trim(), type: 'email' });
      if (error) throw error;
      const r = await pullAndMerge();
      return r === 'pulled' ? 'Conectado. Seus dados da nuvem foram carregados.' : 'Conectado. Seus dados estão sincronizados.';
    });

  const syncNow = () =>
    run(async () => {
      const r = await pullAndMerge();
      return r === 'offline' ? 'Sem conexão com a conta.' : 'Sincronizado.';
    });

  const exportAll = () =>
    run(async () => {
      const data = { ...pickPersisted(useAppStore.getState()), photos: [] };
      await shareText(`macrofactorbr-dados-${todayIso()}.json`, JSON.stringify(data, null, 2), 'application/json');
    });

  const deleteEverything = () =>
    run(async () => {
      if (supabase && email) {
        const { error } = await supabase.functions.invoke('delete-account', { body: {} });
        if (error) throw new Error('Não foi possível apagar a conta na nuvem. Tente de novo.');
        await supabase.auth.signOut();
      }
      resetAll();
      router.replace('/');
    });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Conta e dados' }} />

      <Card>
        <Title>Conta</Title>
        {!hasBackend ? (
          <Muted>Este app está funcionando só no aparelho. A conta e a sincronização aparecem quando o servidor estiver configurado.</Muted>
        ) : email ? (
          <>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Conectado como {email}</Text>
            <Muted style={{ marginBottom: 10 }}>
              {settings.lastSyncAt ? `Última sincronização: ${new Date(settings.lastSyncAt).toLocaleString('pt-BR')}` : 'Ainda não sincronizado.'}
            </Muted>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Button title="Sincronizar agora" variant="secondary" onPress={syncNow} disabled={busy} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Sair" variant="secondary" onPress={() => run(async () => void (await supabase!.auth.signOut()))} disabled={busy} />
              </View>
            </View>
          </>
        ) : (
          <>
            <Muted style={{ marginBottom: 8 }}>Entre para guardar seus dados na nuvem, usar em outro aparelho e liberar a IA. Sem senha: mandamos um código por e-mail.</Muted>
            <Field label="E-mail" value={inputEmail} onChangeText={setInputEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            {codeSent ? <Field label="Código recebido" value={code} onChangeText={setCode} keyboardType="number-pad" /> : null}
            <Button
              title={codeSent ? 'Entrar' : 'Receber código'}
              onPress={codeSent ? verify : sendCode}
              disabled={busy || !inputEmail.includes('@') || (codeSent && code.length < 6)}
            />
          </>
        )}
      </Card>

      {healthProviderName ? (
        <Card>
          <Title>{healthProviderName}</Title>
          {healthOk ? (
            <ToggleRow
              label={`Conectar ao ${healthProviderName}`}
              hint="Importa pesagens da balança inteligente e salva as pesagens feitas aqui."
              value={Boolean(settings.healthSync)}
              onChange={(v) =>
                v
                  ? run(async () => {
                      const ok = await connectHealth();
                      updateSettings({ healthSync: ok });
                      return ok ? 'Conectado. Importe as pesagens na aba Progresso.' : 'Permissão negada.';
                    })
                  : updateSettings({ healthSync: false })
              }
            />
          ) : (
            <Muted>
              {healthProviderName} não está disponível neste aparelho
              {healthProviderName === 'Health Connect' ? ' (instale o app Health Connect pela Play Store)' : ''}.
            </Muted>
          )}
        </Card>
      ) : null}

      <Card>
        <Title>Seus dados (LGPD)</Title>
        <Muted style={{ marginBottom: 8 }}>
          {settings.consentAt
            ? `Você aceitou o uso de dados de saúde em ${new Date(settings.consentAt).toLocaleDateString('pt-BR')}.`
            : 'Você ainda não aceitou o uso de dados de saúde.'}{' '}
          Nada é vendido ou compartilhado. Fotos de progresso nunca saem do aparelho.
        </Muted>
        <Button title="Exportar todos os meus dados (JSON)" variant="secondary" onPress={exportAll} disabled={busy} />
        <View style={{ height: 8 }} />
        {confirmDelete ? (
          <>
            <Text style={{ color: colors.danger, marginBottom: 8 }}>
              Isso apaga perfil, diário, pesos e alimentos {email ? 'deste aparelho e da nuvem, e exclui sua conta' : 'deste aparelho'}. Não dá para desfazer.
            </Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Button title="Apagar tudo" variant="danger" onPress={deleteEverything} disabled={busy} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Cancelar" variant="secondary" onPress={() => setConfirmDelete(false)} />
              </View>
            </View>
          </>
        ) : (
          <Button title={email ? 'Excluir conta e dados' : 'Apagar todos os dados'} variant="danger" onPress={() => setConfirmDelete(true)} />
        )}
      </Card>

      {busy ? <ActivityIndicator color={colors.primary} /> : null}
      {msg ? (
        <View style={[styles.warning, { backgroundColor: colors.primarySoft }]}>
          <Text style={{ color: colors.primary }}>{msg}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
