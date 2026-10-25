import { describe, it, expect, beforeEach } from 'vitest';
import {
  isWifiOnlyDownloads,
  setWifiOnlyDownloads,
  getPlayableAudioUrl,
} from '@/services/downloadService';
import { Track } from '@/types/music';

const mockTrack: Track = {
  id: 'offline-test-01',
  title: 'Offline Song',
  artist: 'Offline Artist',
  album: 'Offline Album',
  genre: 'Acoustic',
  year: 2026,
  duration: 180,
  audioUrl: 'https://example.com/audio/offline-stream.mp3',
  thumbnailUrl: 'https://example.com/images/cover.jpg',
  language: 'Tamil',
  isExplicit: false,
};

describe('Offline Download Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('manages Wi-Fi only download preferences in local storage', () => {
    expect(isWifiOnlyDownloads()).toBe(false);

    setWifiOnlyDownloads(true);
    expect(isWifiOnlyDownloads()).toBe(true);

    setWifiOnlyDownloads(false);
    expect(isWifiOnlyDownloads()).toBe(false);
  });

  it('falls back to remote audioUrl when a track is not downloaded', async () => {
    const url = await getPlayableAudioUrl(mockTrack);
    expect(url).toBe('https://example.com/audio/offline-stream.mp3');
  });

  it('returns empty string for invalid track', async () => {
    // @ts-ignore
    const url = await getPlayableAudioUrl(null);
    expect(url).toBe('');
  });
});