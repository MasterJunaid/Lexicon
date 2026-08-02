/** Web Speech API wrapper. No network, works offline, degrades to silence. */

let voicesCache: SpeechSynthesisVoice[] = [];

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function loadVoices(): SpeechSynthesisVoice[] {
  if (!speechSupported()) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) voicesCache = voices;
  return voicesCache;
}

export function primeVoices() {
  if (!speechSupported()) return;
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => loadVoices();
}

function bestVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = loadVoices();
  if (!voices.length) return undefined;
  const base = lang.split('-')[0];
  return (
    voices.find((v) => v.lang.replace('_', '-') === lang && v.localService) ||
    voices.find((v) => v.lang.replace('_', '-') === lang) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(base) && v.localService) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(base))
  );
}

export function speak(text: string, lang = 'en-US', rate = 0.92) {
  if (!speechSupported() || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  utterance.pitch = 1;
  const voice = bestVoice(lang);
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}

export function hasVoiceFor(lang: string): boolean {
  return Boolean(bestVoice(lang));
}
