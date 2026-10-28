// Plano Pro: o que é grátis e o que é pago, conforme o documento-base.
// Grátis: diário, scanner, OCR, metas, base TACO, sem anúncios.

export type ProFeature = 'adaptive' | 'microsFull' | 'aiUnlimited' | 'mealPlan' | 'export';

export const PRO_FEATURES: Record<ProFeature, string> = {
  adaptive: 'Gasto adaptativo e check-in semanal',
  microsFull: 'Painel completo de micronutrientes com sugestões',
  aiUnlimited: 'Foto do prato e coach com IA sem limite',
  mealPlan: 'Cardápio automático e lista de compras',
  export: 'Exportar CSV/PDF para o nutricionista',
};

export const PRO_PRICES = { monthly: 'R$ 14,90/mês', yearly: 'R$ 99/ano' };

// Fotos de prato por IA por dia no plano grátis (gancho de conversão).
export const FREE_AI_PHOTOS_PER_DAY = 3;

export function hasFeature(isPro: boolean, _feature: ProFeature): boolean {
  return isPro;
}
