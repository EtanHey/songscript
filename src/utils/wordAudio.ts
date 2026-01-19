/**
 * Utility functions for word audio playback
 */

/**
 * Encode Persian text for safe filename (URL-safe base64)
 * This matches the encoding used in generate-word-audio.ts
 */
export function encodeWordFilename(persian: string): string {
  // Use URL-safe base64 encoding for the Persian text
  // Browser-compatible base64 encoding
  const utf8Bytes = new TextEncoder().encode(persian);
  let binary = "";
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64 = btoa(binary);
  // Convert to URL-safe base64 (replace + with -, / with _, remove padding =)
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Generate the audio URL for a Persian word
 */
export function getWordAudioUrl(persian: string): string {
  const filename = encodeWordFilename(persian);
  return `/audio/words/${filename}.mp3`;
}

/**
 * Check if word audio file exists (async check)
 * Returns the URL if exists, null otherwise
 */
export async function checkWordAudioExists(
  persian: string
): Promise<string | null> {
  const url = getWordAudioUrl(persian);
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok ? url : null;
  } catch {
    return null;
  }
}

/**
 * Audio player singleton to prevent overlapping audio
 */
let currentAudio: HTMLAudioElement | null = null;
let currentPlayingWord: string | null = null;

export interface PlayWordResult {
  success: boolean;
  error?: string;
}

/**
 * Play audio for a word
 * Stops any currently playing audio before starting new one
 * Returns a promise that resolves when audio starts playing or rejects on error
 */
export async function playWordAudio(persian: string): Promise<PlayWordResult> {
  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
    currentPlayingWord = null;
  }

  const url = getWordAudioUrl(persian);

  return new Promise((resolve) => {
    const audio = new Audio(url);
    currentAudio = audio;
    currentPlayingWord = persian;

    audio.oncanplay = () => {
      audio.play().catch((error) => {
        resolve({ success: false, error: error.message });
      });
    };

    audio.onplay = () => {
      resolve({ success: true });
    };

    audio.onerror = () => {
      currentAudio = null;
      currentPlayingWord = null;
      resolve({ success: false, error: "Audio file not found or failed to load" });
    };

    audio.onended = () => {
      if (currentAudio === audio) {
        currentAudio = null;
        currentPlayingWord = null;
      }
    };

    // Load the audio
    audio.load();
  });
}

/**
 * Stop currently playing audio
 */
export function stopWordAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
    currentPlayingWord = null;
  }
}

/**
 * Get currently playing word (if any)
 */
export function getCurrentPlayingWord(): string | null {
  return currentPlayingWord;
}
