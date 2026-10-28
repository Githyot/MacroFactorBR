// OCR no navegador com Tesseract.js (modelo em português baixado na primeira leitura).

import { linesFromWords, OcrWord } from '../domain/labelParser';

export async function recognizeText(imageUri: string): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('por');
  try {
    const { data } = await worker.recognize(imageUri, {}, { blocks: true });
    const words: OcrWord[] = [];
    for (const block of data.blocks ?? []) {
      for (const para of block.paragraphs) {
        for (const line of para.lines) {
          for (const w of line.words) {
            words.push({ text: w.text, left: w.bbox.x0, top: w.bbox.y0, width: w.bbox.x1 - w.bbox.x0, height: w.bbox.y1 - w.bbox.y0 });
          }
        }
      }
    }
    return words.length > 0 ? linesFromWords(words) : data.text;
  } finally {
    await worker.terminate();
  }
}
