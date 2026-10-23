/**
 * Central Audio Streaming Configuration
 *
 * NOTE:
 * - Songs and audio URLs are manually configured in src/data/music.json.
 * - Audio URLs can be hosted on any HTTPS server, public storage bucket, or CDN.
 * - Native browser HTML5 streaming is used with HTTP Range requests.
 */

export interface AudioConfig {
  siteName: string;
  preload: 'auto' | 'metadata' | 'none';
  defaultVolume: number;
  supportedFormats: readonly string[];
  maxHistoryItems: number;
}

export const AUDIO_CONFIG: AudioConfig = {
  // Website Brand Name (configurable via VITE_SITE_NAME or default)
  siteName: (import.meta.env.VITE_SITE_NAME as string) || 'WaveMusic',

  // Stream progressively with metadata preloaded (never download entire audio file upfront)
  preload: 'metadata',

  // Default initial volume (0.0 to 1.0)
  defaultVolume: 0.85,

  // Recognized audio file extensions and containers
  supportedFormats: ['mp3', 'm4a', 'aac', 'flac', 'wav', 'ogg'] as const,

  // Maximum recently played tracks to remember in localStorage
  maxHistoryItems: 50,
};

/**
 * Storage keys for persisting library state locally
 */
export const STORAGE_KEYS = {
  USER_TRACKS: 'wavemusic_user_tracks_v1',
  FAVOURITES: 'wavemusic_favourites_v1',
  PLAYLISTS: 'wavemusic_playlists_v1',
  HISTORY: 'wavemusic_history_v1',
  VOLUME: 'wavemusic_volume_v1',
  MUTED: 'wavemusic_muted_v1',
  REPEAT: 'wavemusic_repeat_v1',
  SHUFFLE: 'wavemusic_shuffle_v1',
  THEME_ACCENT: 'wavemusic_accent_v1',
};

/**
 * Validates whether a given string is a valid HTTPS or HTTP URL
 */
export function isValidUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' || url.startsWith('data:') || url.startsWith('/');
  } catch {
    return false;
  }
}
