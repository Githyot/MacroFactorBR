// Na web não há loja: a assinatura feita no celular vale também aqui pelo login (profiles.is_pro).

export function purchasesAvailable(): boolean {
  return false;
}
export async function initPurchases(_appUserId?: string): Promise<void> {}
export async function isProActive(): Promise<boolean> {
  return false;
}
export async function getPlans(): Promise<{ id: string; title: string; price: string; pkg: unknown }[]> {
  return [];
}
export async function buy(_pkg: unknown): Promise<boolean> {
  return false;
}
export async function restore(): Promise<boolean> {
  return false;
}
