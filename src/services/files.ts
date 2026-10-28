// Compartilhar arquivos gerados (CSV e PDF) pelo menu do sistema.

import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function shareText(filename: string, content: string, mimeType: string): Promise<void> {
  const file = new File(Paths.cache, filename);
  // BOM para o Excel reconhecer acentos em UTF-8.
  file.write(`\uFEFF${content}`);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: filename });
}

export async function sharePdf(html: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Relatório MacroFactorBR' });
}
