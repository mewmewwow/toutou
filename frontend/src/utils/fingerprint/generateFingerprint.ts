/**
 * Device fingerprint generation for guest identification
 * Combines multiple signals for stability across sessions
 */

import { setDeviceFingerprint, getDeviceFingerprint } from '../../services/api';

const FINGERPRINT_STORAGE_KEY = 'deviceFingerprint';

/**
 * SHA-256 hash function using Web Crypto API
 * Returns a 64-character hexadecimal string
 */
async function sha256Hash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get canvas fingerprint
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = 200;
    canvas.height = 50;

    // Draw text with specific styling
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('CiShanJia 词善佳', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('CiShanJia 词善佳', 4, 17);

    return canvas.toDataURL();
  } catch {
    return '';
  }
}

/**
 * Get WebGL fingerprint
 */
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';

    const webgl = gl as WebGLRenderingContext;
    const debugInfo = webgl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return '';

    const vendor = webgl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = webgl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

    return `${vendor}|${renderer}`;
  } catch {
    return '';
  }
}

/**
 * Get audio context fingerprint
 */
async function getAudioFingerprint(): Promise<string> {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    const gainNode = audioContext.createGain();
    const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

    gainNode.gain.value = 0; // Mute
    oscillator.type = 'triangle';
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(0);

    return new Promise((resolve) => {
      scriptProcessor.onaudioprocess = (event) => {
        const output = event.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < output.length; i++) {
          sum += Math.abs(output[i]);
        }
        oscillator.disconnect();
        scriptProcessor.disconnect();
        audioContext.close();
        resolve(sum.toString());
      };

      // Timeout fallback
      setTimeout(() => {
        oscillator.disconnect();
        scriptProcessor.disconnect();
        audioContext.close();
        resolve('');
      }, 100);
    });
  } catch {
    return '';
  }
}

/**
 * Collect all fingerprint signals
 */
async function collectFingerprints(): Promise<string[]> {
  const signals: string[] = [];

  // User agent
  signals.push(navigator.userAgent);

  // Language
  signals.push(navigator.language);

  // Screen resolution
  signals.push(`${screen.width}x${screen.height}`);

  // Color depth
  signals.push(screen.colorDepth.toString());

  // Timezone offset
  signals.push(new Date().getTimezoneOffset().toString());

  // Platform
  signals.push(navigator.platform);

  // Hardware concurrency
  signals.push((navigator.hardwareConcurrency || 0).toString());

  // Canvas fingerprint
  signals.push(getCanvasFingerprint());

  // WebGL fingerprint
  signals.push(getWebGLFingerprint());

  // Audio fingerprint
  const audioFp = await getAudioFingerprint();
  signals.push(audioFp);

  return signals;
}

/**
 * Generate a stable device fingerprint
 * Combines multiple signals for reliability
 */
export async function generateFingerprint(): Promise<string> {
  // Check if we already have a fingerprint
  const existing = getDeviceFingerprint();
  if (existing) {
    return existing;
  }

  // Also check localStorage directly (in case API wasn't initialized)
  const stored = localStorage.getItem(FINGERPRINT_STORAGE_KEY);
  if (stored) {
    setDeviceFingerprint(stored);
    return stored;
  }

  // Generate new fingerprint
  const signals = await collectFingerprints();
  const combined = signals.join('|||');
  const fingerprint = await sha256Hash(combined);

  // Store and return
  setDeviceFingerprint(fingerprint);
  return fingerprint;
}

/**
 * Get current fingerprint (sync, returns null if not yet generated)
 */
export function getCurrentFingerprint(): string | null {
  return getDeviceFingerprint() || localStorage.getItem(FINGERPRINT_STORAGE_KEY);
}

/**
 * Initialize fingerprint on app load
 */
export async function initializeFingerprint(): Promise<string> {
  return generateFingerprint();
}
