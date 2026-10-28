// Assinatura Pro pelas lojas (RevenueCat cuida de App Store e Google Play).
// Sem chave configurada, o app usa o modo de teste do Pro (Configurações > Plano).

import { Platform } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

import { config } from './config';

const ENTITLEMENT = 'pro';
let configured = false;

function apiKey(): string {
  return Platform.OS === 'ios' ? config.revenueCatIosKey : config.revenueCatAndroidKey;
}

export function purchasesAvailable(): boolean {
  return Boolean(apiKey());
}

export async function initPurchases(appUserId?: string): Promise<void> {
  if (configured || !purchasesAvailable()) return;
  Purchases.configure({ apiKey: apiKey(), appUserID: appUserId });
  configured = true;
}

export async function isProActive(): Promise<boolean> {
  if (!configured) return false;
  const info = await Purchases.getCustomerInfo();
  return ENTITLEMENT in info.entitlements.active;
}

export async function getPlans(): Promise<{ id: string; title: string; price: string; pkg: PurchasesPackage }[]> {
  if (!configured) return [];
  const offerings = await Purchases.getOfferings();
  return (offerings.current?.availablePackages ?? []).map((pkg) => ({
    id: pkg.identifier,
    title: pkg.product.title,
    price: pkg.product.priceString,
    pkg,
  }));
}

export async function buy(pkg: PurchasesPackage): Promise<boolean> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return ENTITLEMENT in customerInfo.entitlements.active;
}

export async function restore(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  return ENTITLEMENT in info.entitlements.active;
}
