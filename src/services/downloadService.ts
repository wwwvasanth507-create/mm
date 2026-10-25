import { Track } from '@/types/music';
import { STORAGE_KEYS } from '@/config/audio';
import { resolveAudioUrl } from '@/services/musicService';

export interface DownloadedTrackRecord {
  id: string;
  track: Track;
  blob: Blob;
  size: number;
  mimeType: string;
  downloadedAt: number;
}

export type DownloadStatus = 'idle' | 'downloading' | 'completed' | 'error';

const DB_NAME = 'wavemusic_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'downloaded_tracks';

// Memory cache for active Blob URLs so audio playback is smooth and instant
const blobUrlCache = new Map<string, string>();
const activeControllers = new Map<string, AbortController>();

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Checks if a track is available offline
 */
export async function isTrackDownloaded(trackId: string): Promise<boolean> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(trackId);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Retrieves a downloaded track record from offline storage
 */
export async function getDownloadedRecord(trackId: string): Promise<DownloadedTrackRecord | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(trackId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Returns list of all downloaded tracks
 */
export async function getAllDownloadedTracks(): Promise<Track[]> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const records = (req.result || []) as DownloadedTrackRecord[];
        resolve(records.map((r) => r.track));
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Returns formatted total storage calculation
 */
export async function getTotalStorageUsed(): Promise<{ bytes: number; formatted: string; count: number }> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const records = (req.result || []) as DownloadedTrackRecord[];
        const bytes = records.reduce((sum, r) => sum + (r.size || 0), 0);
        const mb = (bytes / (1024 * 1024)).toFixed(1);
        resolve({
          bytes,
          formatted: `${mb} MB`,
          count: records.length,
        });
      };
      req.onerror = () => resolve({ bytes: 0, formatted: '0 MB', count: 0 });
    });
  } catch {
    return { bytes: 0, formatted: '0 MB', count: 0 };
  }
}

/**
 * Wi-Fi only download setting
 */
export function isWifiOnlyDownloads(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.WIFI_ONLY_DOWNLOAD) === 'true';
}

export function setWifiOnlyDownloads(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.WIFI_ONLY_DOWNLOAD, String(enabled));
}

/**
 * Downloads a track and saves it into local IndexedDB
 */
export async function downloadTrack(
  track: Track,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; error?: string }> {
  const streamUrl = resolveAudioUrl(track);
  if (!streamUrl) {
    return { success: false, error: 'Track has no audio stream URL' };
  }

  // Network check for Wi-Fi only preference
  if (isWifiOnlyDownloads() && typeof navigator !== 'undefined') {
    const navConn = (navigator as unknown as { connection?: { type?: string } }).connection;
    if (navConn?.type && navConn.type !== 'wifi' && navConn.type !== 'ethernet') {
      return { success: false, error: 'Wi-Fi Only is enabled. Connect to Wi-Fi to download.' };
    }
  }

  // Cancel any prior active download for this track
  cancelDownload(track.id);
  const controller = new AbortController();
  activeControllers.set(track.id, controller);

  try {
    const res = await fetch(streamUrl, {
      signal: controller.signal,
      mode: 'cors',
    });

    if (!res.ok) {
      throw new Error(`HTTP download error: ${res.status} ${res.statusText}`);
    }

    const contentLength = Number(res.headers.get('content-length')) || 0;
    const contentType = res.headers.get('content-type') || 'audio/mpeg';

    let blob: Blob;

    if (res.body && contentLength > 0) {
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          receivedBytes += value.length;
          if (onProgress && contentLength > 0) {
            const pct = Math.min(100, Math.round((receivedBytes / contentLength) * 100));
            onProgress(pct);
          }
        }
      }

      blob = new Blob(chunks as BlobPart[], { type: contentType });
    } else {
      onProgress?.(50);
      blob = await res.blob();
      onProgress?.(100);
    }

    const record: DownloadedTrackRecord = {
      id: track.id,
      track,
      blob,
      size: blob.size,
      mimeType: contentType,
      downloadedAt: Date.now(),
    };

    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    activeControllers.delete(track.id);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wavemusic_download_completed', { detail: { trackId: track.id, track } })
      );
    }

    return { success: true };
  } catch (err: unknown) {
    activeControllers.delete(track.id);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('abort')) {
      return { success: false, error: 'Download cancelled' };
    }
    return { success: false, error: msg };
  }
}

/**
 * Cancels an ongoing download
 */
export function cancelDownload(trackId: string): void {
  const ctrl = activeControllers.get(trackId);
  if (ctrl) {
    ctrl.abort();
    activeControllers.delete(trackId);
  }
}

/**
 * Removes a downloaded track from offline storage
 */
export async function deleteDownloadedTrack(trackId: string): Promise<boolean> {
  try {
    cancelDownload(trackId);

    // Revoke any active blob URL
    const cachedUrl = blobUrlCache.get(trackId);
    if (cachedUrl) {
      URL.revokeObjectURL(cachedUrl);
      blobUrlCache.delete(trackId);
    }

    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(trackId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wavemusic_download_deleted', { detail: { trackId } })
      );
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Deletes all downloaded audio files from offline storage
 */
export async function clearAllDownloads(): Promise<void> {
  try {
    for (const [, url] of blobUrlCache.entries()) {
      URL.revokeObjectURL(url);
    }
    blobUrlCache.clear();

    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wavemusic_downloads_cleared'));
    }
  } catch (err) {
    console.error('Failed to clear downloads', err);
  }
}

/**
 * Resolves the most optimal playable URL for a track:
 * If the track is downloaded, returns a persistent local Blob URL (100% offline).
 * Otherwise, returns the remote stream URL.
 */
export async function getPlayableAudioUrl(track: Track): Promise<string> {
  if (!track || !track.id) return '';

  // Check in-memory cached blob URL first
  if (blobUrlCache.has(track.id)) {
    return blobUrlCache.get(track.id)!;
  }

  // Check offline IndexedDB
  const record = await getDownloadedRecord(track.id);
  if (record && record.blob) {
    const blobUrl = URL.createObjectURL(record.blob);
    blobUrlCache.set(track.id, blobUrl);
    return blobUrl;
  }

  // Fallback to remote direct audio stream
  return resolveAudioUrl(track);
}
