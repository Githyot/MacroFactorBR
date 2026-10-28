// Ditado por voz no navegador (Web Speech API, em português do Brasil).

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function ctor(): (new () => Recognition) | undefined {
  const w = globalThis as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function speechSupported(): boolean {
  return Boolean(ctor());
}

export function listen(onText: (text: string) => void, onEnd: () => void): () => void {
  const C = ctor();
  if (!C) return () => {};
  const r = new C();
  r.lang = 'pt-BR';
  r.interimResults = true;
  r.continuous = false;
  r.onresult = (e) => {
    const text = Array.from(e.results)
      .map((res) => res[0].transcript)
      .join(' ');
    onText(text);
  };
  r.onend = onEnd;
  r.start();
  return () => r.stop();
}
