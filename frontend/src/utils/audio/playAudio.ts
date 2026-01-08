/**
 * Audio playback utility with Youdao API primary and SpeechSynthesis fallback
 * Per spec: Silent fallback without showing degraded mode to user
 */

type PronunciationType = 'us' | 'uk';

// Youdao API URL template
const YOUDAO_API_BASE = 'https://dict.youdao.com/dictvoice';

/**
 * Build Youdao audio URL
 * @param word - The word to pronounce
 * @param type - Pronunciation type (us=American, uk=British)
 */
function getYoudaoUrl(word: string, type: PronunciationType): string {
  // Youdao type: 2 = American, 1 = British
  const youdaoType = type === 'us' ? 2 : 1;
  return `${YOUDAO_API_BASE}?audio=${encodeURIComponent(word)}&type=${youdaoType}`;
}

/**
 * Play audio using HTML5 Audio element
 */
async function playWithAudio(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.preload = 'auto';

    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error('Audio playback failed'));

    audio.play().catch(reject);
  });
}

/**
 * Play audio using Web Speech Synthesis API (fallback)
 */
function playWithSpeechSynthesis(text: string, type: PronunciationType): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('SpeechSynthesis not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = type === 'us' ? 'en-US' : 'en-GB';
    utterance.rate = 0.9; // Slightly slower for clarity

    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error('SpeechSynthesis failed'));

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Play word audio with automatic fallback
 * Primary: Youdao API
 * Fallback: SpeechSynthesis (silent, no degraded mode indicator)
 *
 * @param word - The English word to pronounce
 * @param type - Pronunciation type (default: 'us')
 */
export async function playWordAudio(
  word: string,
  type: PronunciationType = 'us',
): Promise<void> {
  const url = getYoudaoUrl(word, type);

  try {
    await playWithAudio(url);
  } catch {
    // Silent fallback to SpeechSynthesis - no error shown to user
    try {
      await playWithSpeechSynthesis(word, type);
    } catch {
      // Complete silent failure - per spec, don't show degraded mode
      console.debug('Audio playback failed silently');
    }
  }
}

/**
 * Play sentence audio
 * If audioUrl is provided, use it directly
 * Otherwise, use SpeechSynthesis
 *
 * @param sentence - The sentence to pronounce
 * @param audioUrl - Optional pre-recorded audio URL
 * @param type - Pronunciation type (default: 'us')
 */
export async function playSentenceAudio(
  sentence: string,
  audioUrl?: string,
  type: PronunciationType = 'us',
): Promise<void> {
  if (audioUrl) {
    try {
      await playWithAudio(audioUrl);
      return;
    } catch {
      // Fall through to SpeechSynthesis
    }
  }

  try {
    await playWithSpeechSynthesis(sentence, type);
  } catch {
    // Silent failure
    console.debug('Sentence audio playback failed silently');
  }
}

/**
 * Preload audio for faster playback
 * @param word - The word to preload
 * @param type - Pronunciation type
 */
export function preloadWordAudio(word: string, type: PronunciationType = 'us'): void {
  const url = getYoudaoUrl(word, type);
  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = url;
}

/**
 * Stop any currently playing speech synthesis
 */
export function stopAudio(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
