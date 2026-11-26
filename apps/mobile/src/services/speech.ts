import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';
import type {Personality} from '../types/navigation';

let initialized = false;
export async function initializeSpeech(): Promise<void> {
  if (initialized) return;
  await Tts.getInitStatus();
  await Tts.setDefaultLanguage('en-US');
  await Tts.setDefaultRate(0.48);
  initialized = true;
}

export async function speakNavigation(text: string, personality: Personality, locale = 'en-US'): Promise<void> {
  try {
    await initializeSpeech();
    await Tts.setDefaultLanguage(locale);
    await Tts.stop();
    await Tts.setDefaultRate(personality === 'angry' ? 0.56 : 0.48);
    await Tts.setDefaultPitch(personality === 'funny' ? 1.12 : 1.0);
    Tts.speak(personality === 'angry' ? text.toUpperCase() : text);
  } catch {
    // Keep visual navigation available when no compatible system TTS voice is installed.
  }
}

export async function stopSpeech(): Promise<void> {
  try { await Tts.stop(); } catch { /* no-op: speech engine may not be initialized */ }
}

export async function startSpeechRecognition(locale = 'en-US'): Promise<void> {
  const available = await Voice.isAvailable();
  if (!available) throw new Error('Speech recognition is not available on this device.');
  await Voice.start(locale);
}
export async function stopSpeechRecognition(): Promise<void> {
  try { await Voice.stop(); } catch { /* recognizer may already be stopped */ }
}
export function setSpeechRecognitionHandlers(onText: (text: string) => void, onError: (message: string) => void, onEnd: () => void): void {
  Voice.onSpeechResults = event => {
    const text = event.value?.[0];
    if (text) onText(text);
  };
  Voice.onSpeechError = event => onError(event.error?.message ?? 'Speech recognition failed');
  Voice.onSpeechEnd = onEnd;
}
export async function destroySpeechRecognition(): Promise<void> {
  try { await Voice.destroy(); Voice.removeAllListeners(); } catch { /* safe during unmount */ }
}
