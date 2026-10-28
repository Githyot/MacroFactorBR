// No navegador não há pasta privada: a foto é guardada reduzida como data URI no armazenamento local.

import * as ImagePicker from 'expo-image-picker';

export async function pickProgressPhoto(_from: 'camera' | 'library'): Promise<string | undefined> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.3, base64: true });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset?.base64) return undefined;
  return `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`;
}

export function deleteProgressPhoto(_uri: string): void {}
