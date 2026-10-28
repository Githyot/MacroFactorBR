// Apple Health (iOS): lê peso e passos, grava as pesagens feitas no app.

import {
  isHealthDataAvailable,
  queryQuantitySamples,
  requestAuthorization,
  saveQuantitySample,
} from '@kingstinct/react-native-healthkit';

import { WeightEntry } from '../domain/adaptiveTdee';
import { todayIso } from '../domain/foods';

export const healthProviderName: string | null = 'Apple Saúde';

export async function isHealthAvailable(): Promise<boolean> {
  return isHealthDataAvailable();
}

export async function connectHealth(): Promise<boolean> {
  return requestAuthorization({
    toRead: ['HKQuantityTypeIdentifierBodyMass', 'HKQuantityTypeIdentifierStepCount'],
    toShare: ['HKQuantityTypeIdentifierBodyMass'],
  });
}

export async function readWeights(days: number): Promise<WeightEntry[]> {
  const samples = await queryQuantitySamples('HKQuantityTypeIdentifierBodyMass', { limit: days * 3, unit: 'kg', ascending: false });
  const since = Date.now() - days * 86_400_000;
  return samples
    .filter((s) => new Date(s.startDate).getTime() >= since)
    .map((s) => ({ date: todayIso(new Date(s.startDate)), kg: Math.round(s.quantity * 10) / 10 }));
}

export async function readStepsToday(): Promise<number | undefined> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const samples = await queryQuantitySamples('HKQuantityTypeIdentifierStepCount', { limit: 0, unit: 'count', ascending: false });
  return samples.filter((s) => new Date(s.startDate) >= start).reduce((sum, s) => sum + s.quantity, 0);
}

export async function writeWeight(kg: number, date: Date): Promise<void> {
  await saveQuantitySample('HKQuantityTypeIdentifierBodyMass', 'kg', kg, date, date);
}
