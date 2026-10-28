// Sincronização do estado do app com o Supabase: um documento por usuário,
// a versão com updated_at mais novo vence. Simples e suficiente para um usuário em vários aparelhos.

import { pickPersisted, PersistedState, useAppStore } from '../store/useAppStore';
import { currentUserId, supabase } from './supabase';

let pushTimer: ReturnType<typeof setTimeout> | undefined;
let applyingRemote = false;

export async function pullAndMerge(): Promise<'pulled' | 'pushed' | 'same' | 'offline'> {
  const userId = await currentUserId();
  if (!supabase || !userId) return 'offline';
  const { data, error } = await supabase.from('user_state').select('data, updated_at').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  const local = pickPersisted(useAppStore.getState());
  const remote = data?.data as PersistedState | undefined;
  if (remote && remote.updatedAt > local.updatedAt) {
    applyingRemote = true;
    useAppStore.getState().replaceAll(remote);
    applyingRemote = false;
    return 'pulled';
  }
  if (!remote || local.updatedAt > remote.updatedAt) {
    await push();
    return 'pushed';
  }
  return 'same';
}

export async function push(): Promise<void> {
  const userId = await currentUserId();
  if (!supabase || !userId) return;
  const state = pickPersisted(useAppStore.getState());
  // Fotos de progresso ficam só no aparelho (arquivos locais e privados).
  const data = { ...state, photos: [] };
  const { error } = await supabase.from('user_state').upsert({ user_id: userId, data, updated_at: state.updatedAt });
  if (error) throw error;
  useAppStore.setState({ settings: { ...useAppStore.getState().settings, lastSyncAt: new Date().toISOString() } });
}

/** Envia alterações 3 s depois da última mudança. Retorna a função para parar. */
export function startAutoSync(): () => void {
  const unsub = useAppStore.subscribe((s, prev) => {
    if (applyingRemote || s.updatedAt === prev.updatedAt) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => push().catch((e) => console.warn('sync', e)), 3000);
  });
  return () => {
    unsub();
    if (pushTimer) clearTimeout(pushTimer);
  };
}
