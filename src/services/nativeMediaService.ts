import { Capacitor, registerPlugin } from '@capacitor/core';
import { Track } from '@/types/music';
import { resolveArtworkUrl } from '@/services/musicService';

export type NativeMediaAction = 'play' | 'pause' | 'next' | 'previous' | 'seek';

export interface NativeMediaActionEvent {
  action: NativeMediaAction;
  position?: number;
}

export interface WaveMediaPluginInterface {
  updatePlaybackState(options: {
    title: string;
    artist: string;
    album?: string;
    artworkUrl?: string;
    isPlaying: boolean;
    position: number;
    duration: number;
  }): Promise<void>;
  stopPlayback(): Promise<void>;
  addListener(
    eventName: 'onMediaAction',
    listenerFunc: (data: NativeMediaActionEvent) => void
  ): Promise<{ remove: () => void }>;
}

const WaveMedia = registerPlugin<WaveMediaPluginInterface>('WaveMedia');

let isListenerAttached = false;
let actionListener: ((action: NativeMediaAction, position?: number) => void) | null = null;

export const nativeMediaService = {
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  },

  async initActionListener(callback: (action: NativeMediaAction, position?: number) => void) {
    actionListener = callback;
    if (this.isNative() && !isListenerAttached) {
      try {
        await WaveMedia.addListener('onMediaAction', (data: NativeMediaActionEvent) => {
          if (actionListener && data && data.action) {
            actionListener(data.action, data.position);
          }
        });
        isListenerAttached = true;
      } catch (err) {
        console.warn('[WaveMedia Plugin] Could not attach listener:', err);
      }
    }
  },

  async updatePlayback(
    track: Track | null,
    isPlaying: boolean,
    currentTime: number = 0,
    duration: number = 0
  ) {
    if (!this.isNative() || !track) return;

    try {
      const artwork = resolveArtworkUrl(track);
      await WaveMedia.updatePlaybackState({
        title: track.title || 'WaveMusic',
        artist: track.artist || 'Unknown Artist',
        album: track.album || '',
        artworkUrl: artwork,
        isPlaying,
        position: currentTime,
        duration: duration || track.duration || 0,
      });
    } catch (err) {
      console.warn('[WaveMedia Plugin] updatePlayback failed:', err);
    }
  },

  async stopPlayback() {
    if (!this.isNative()) return;
    try {
      await WaveMedia.stopPlayback();
    } catch (err) {
      console.warn('[WaveMedia Plugin] stopPlayback failed:', err);
    }
  },
};