// OCR no celular com Google ML Kit (roda no aparelho, sem internet).
// Precisa de um development build: no Expo Go o módulo nativo não existe.

import TextRecognition from '@react-native-ml-kit/text-recognition';

import { linesFromWords, OcrWord } from '../domain/labelParser';

export async function recognizeText(imageUri: string): Promise<string> {
  const result = await TextRecognition.recognize(imageUri);
  const words: OcrWord[] = [];
  for (const block of result.blocks) {
    for (const line of block.lines) {
      for (const el of line.elements) {
        if (el.frame) words.push({ text: el.text, ...el.frame });
      }
    }
  }
  // Refaz as linhas pela posição na foto, porque o ML Kit separa as colunas da tabela em blocos.
  return words.length > 0 ? linesFromWords(words) : result.text;
}
