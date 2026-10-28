// Configuração por variáveis de ambiente (arquivo .env, veja .env.example).
// Sem elas o app funciona 100% offline: login, base compartilhada e IA ficam desligados.

export const config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
  revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
  /** Enquanto for false, tudo do Pro fica liberado (fase de testes). */
  paywallEnabled: process.env.EXPO_PUBLIC_PAYWALL_ENABLED === 'true',
};

export const hasBackend = Boolean(config.supabaseUrl && config.supabaseAnonKey);
