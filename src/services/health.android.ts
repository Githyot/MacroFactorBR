// Health Connect (Android): lê peso e passos, grava as pesagens feitas no app.

import {
  getSdkStatus,
  initialize,
  insertRecords,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

import { WeightEntry } from '../domain/adaptiveTdee';
import { todayIso } from '../domain/foods';

export const healthProviderName: string | null = 'Health Connect';

export async function isHealthAvailable(): Promise<boolean> {
  try {
    return (await getSdkStatus()) === SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch {
    return false;
  }
}

export async function connectHealth(): Promise<boolean> {
  if (!(await initialize())) return false;
  const granted = await requestPermission([
    { accessType: 'read', recordType: 'Weight' },
    { accessType: 'write', recordType: 'Weight' },
    { accessType: 'read', recordType: 'Steps' },
  ]);
  return granted.length > 0;
}

export async function readWeights(days: number): Promise<WeightEntry[]> {
  await initialize();
  const start = new Date(Date.now() - days * 86_400_000).toISOString();
  const { records } = await readRecords('Weight', {
    timeRangeFilter: { operator: 'between', startTime: start, endTime: new Date().toISOString() },
  });
  return records.map((r) => ({ date: todayIso(new Date(r.time)), kg: Math.round(r.weight.inKilograms * 10) / 10 }));
}

export async function readStepsToday(): Promise<number | undefined> {
  await initialize();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { records } = await readRecords('Steps', {
    timeRangeFilter: { operator: 'between', startTime: start.toISOString(), endTime: new Date().toISOString() },
  });
  return records.reduce((s, r) => s + r.count, 0);
}

export async function writeWeight(kg: number, date: Date): Promise<void> {
  await initialize();
  await insertRecords([{ recordType: 'Weight', time: date.toISOString(), weight: { value: kg, unit: 'kilograms' } }]);
}
