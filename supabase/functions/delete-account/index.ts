// LGPD: apaga a conta e todos os dados do usuário (as tabelas usam on delete cascade).

import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

import { corsHeaders, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const authHeader = req.headers.get('Authorization') ?? '';
  const url = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return json({ error: 'Não autenticado' }, 401);

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { error: delError } = await admin.auth.admin.deleteUser(data.user.id);
  if (delError) return json({ error: delError.message }, 500);
  return json({ ok: true });
});
