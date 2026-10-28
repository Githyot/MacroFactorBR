// Ditado por voz. No celular, o microfone do próprio teclado já transcreve para o campo de texto,
// então aqui só a web tem reconhecimento embutido (speech.web.ts).

export function speechSupported(): boolean {
  return false;
}

export function listen(_onText: (text: string) => void, _onEnd: () => void): () => void {
  return () => {};
}
