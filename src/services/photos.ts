// Fotos de progresso: copiadas para a pasta privada do app (não vão para a nuvem).

import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

export async function pickProgressPhoto(from: 'camera' | 'library'): Promise<string | undefined> {
  let result: ImagePicker.ImagePickerResult;
  if (from === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return undefined;
    result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.7 });
  } else {
    result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7 });
  }
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return undefined;
  const dir = new Directory(Paths.document, 'progress');
  dir.create({ idempotent: true, intermediates: true });
  const dest = new File(dir, `${Date.now()}.jpg`);
  await new File(asset.uri).copy(dest);
  return dest.uri;
}

export function deleteProgressPhoto(uri: string): void {
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // Arquivo já não existe.
  }
}
