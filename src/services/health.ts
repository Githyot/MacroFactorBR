// Integração com Apple Health / Health Connect. Na web não existe: só informa indisponível.
// As versões de cada plataforma estão em health.ios.ts e health.android.ts.

import { WeightEntry } from '../domain/adaptiveTdee';

export const healthProviderName: string | null = null;

export async function isHealthAvailable(): Promise<boolean> {
  return false;
}

export async function connectHealth(): Promise<boolean> {
  return false;
}

export async function readWeights(_days: number): Promise<WeightEntry[]> {
  return [];
}

export async function readStepsToday(): Promise<number | undefined> {
  return undefined;
}

export async function writeWeight(_kg: number, _date: Date): Promise<void> {}
