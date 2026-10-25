import musicData from '@/data/music.json';
import { Track, Album, Artist, Playlist, PlaybackHistoryItem } from '@/types/music';
import { AUDIO_CONFIG, STORAGE_KEYS, isValidUrl } from '@/config/audio';

// Extract raw songs from bundled fallback music.json (supporting songs, tracks, or direct array)
interface RawCatalog {
  songs?: Track[];
  tracks?: Track[];
  playlists?: Playlist[];
}

const typedCatalog = musicData as RawCatalog;
const rawStaticSongs: Track[] = (
  typedCatalog.songs ||
  typedCatalog.tracks ||
  (Array.isArray(musicData) ? musicData : [])
) as Track[];

/**
 * Normalizes catalog items to ensure all required fields are present and sanitized
 */
export function normalizeTrack(song: Partial<Track>, idx: number = 0): Track {
  const directVideo = isDirectVideoUrl(song.videoUrl) ? song.videoUrl?.trim() : '';
  const fallbackId = `song-${idx + 1}`;
  return {
    id: String(song.id || fallbackId).trim(),
    title: (song.title || 'Untitled Track').trim(),
    artist: (song.artist || 'Unknown Artist').trim(),
    album: (song.album || 'Single').trim(),
    genre: (song.genre || 'General').trim(),
    year: Number(song.year) || new Date().getFullYear(),
    duration: Number(song.duration) || 0,
    audioUrl: (song.audioUrl || '').trim(),
    thumbnailUrl: (song.thumbnailUrl || song.artworkUrl || '').trim(),
    artworkUrl: (song.thumbnailUrl || song.artworkUrl || '').trim(),
    language: (song.language || 'English').trim(),
    description: (song.description || '').trim(),
    isExplicit: Boolean(song.isExplicit),
    videoUrl: directVideo || '',
    hasVideo: Boolean(directVideo),
    lyrics: song.lyrics || undefined,
  };
}

export function isTempTestSong(song: Partial<Track>): boolean {
  const id = (song.id || '').toLowerCase();
  const title = (song.title || '').toLowerCase();
  const artist = (song.artist || '').toLowerCase();
  return id.startsWith('wave-starter-') || title.includes('soundhelix') || artist.includes('soundhelix');
}

const bundledNormalizedTracks: Track[] = rawStaticSongs.filter(s => !isTempTestSong(s)).map((song, idx) =>
  normalizeTrack(song, idx)
);

/**
 * Normalizes a string into a clean URL-friendly ID slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Configurable Remote Catalogue Manifest URL
 */
export function getCatalogueUrl(): string {
  if (typeof window === 'undefined') return AUDIO_CONFIG.defaultCatalogueUrl;
  return (
    localStorage.getItem(STORAGE_KEYS.CATALOGUE_URL) || AUDIO_CONFIG.defaultCatalogueUrl
  );
}

export function setCatalogueUrl(newUrl: string): boolean {
  if (typeof window === 'undefined') return false;
  const trimmed = newUrl.trim();
  if (!isValidUrl(trimmed)) return false;
  localStorage.setItem(STORAGE_KEYS.CATALOGUE_URL, trimmed);
  return true;
}

export function resetCatalogueUrl(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.CATALOGUE_URL);
}

export function getLastCatalogueSyncTime(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEYS.CATALOGUE_LAST_SYNC);
  return raw ? Number(raw) : null;
}

/**
 * Cached Remote Catalogue Storage
 */
export function getCachedCatalogue(): Track[] {
  if (typeof window === 'undefined') return bundledNormalizedTracks;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CACHED_CATALOGUE);
    if (!raw) return bundledNormalizedTracks;
    const parsed = JSON.parse(raw);
    const list: Partial<Track>[] = Array.isArray(parsed)
      ? parsed
      : parsed?.songs || parsed?.tracks || [];
    if (!Array.isArray(list) || list.length === 0) return bundledNormalizedTracks;
    return list.filter(s => !isTempTestSong(s)).map((item, idx) => normalizeTrack(item, idx));
  } catch {
    return bundledNormalizedTracks;
  }
}

/**
 * Hidden/Removed Catalogue Track IDs (Soft-Delete)
 */
export function getHiddenTrackIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HIDDEN_TRACK_IDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function hideTrack(trackId: string): void {
  if (typeof window === 'undefined') return;
  const current = getHiddenTrackIds();
  if (!current.includes(trackId)) {
    localStorage.setItem(STORAGE_KEYS.HIDDEN_TRACK_IDS, JSON.stringify([...current, trackId]));
    window.dispatchEvent(new CustomEvent('wavemusic_tracks_updated'));
  }
}

export function unhideTrack(trackId: string): void {
  if (typeof window === 'undefined') return;
  const current = getHiddenTrackIds();
  const updated = current.filter((id) => id !== trackId);
  localStorage.setItem(STORAGE_KEYS.HIDDEN_TRACK_IDS, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('wavemusic_tracks_updated'));
}

/**
 * Remote Catalogue Fetch & Synchronization Engine
 * Fetches the remote manifest without requiring an app rebuild or APK update.
 */
export interface SyncCatalogueResult {
  success: boolean;
  message: string;
  count: number;
  updated: boolean;
  lastSync?: number;
}

export async function fetchRemoteCatalogue(
  forceRefresh: boolean = false
): Promise<SyncCatalogueResult> {
  const url = getCatalogueUrl();
  const cached = getCachedCatalogue();

  try {
    const lastEtag = localStorage.getItem(STORAGE_KEYS.CATALOGUE_ETAG);
    const headers: HeadersInit = {
      Accept: 'application/json',
    };

    if (lastEtag && !forceRefresh) {
      headers['If-None-Match'] = lastEtag;
    }

    // Append cache-busting timestamp query parameter to bypass CDN/proxy caching
    const urlObj = new URL(url);
    urlObj.searchParams.set('_wave_t', String(Date.now()));

    const res = await fetch(urlObj.toString(), {
      method: 'GET',
      headers,
      mode: 'cors',
      cache: 'no-cache',
    });

    if (res.status === 304) {
      // 304 Not Modified: Cached catalogue is already up to date
      const now = Date.now();
      localStorage.setItem(STORAGE_KEYS.CATALOGUE_LAST_SYNC, String(now));
      return {
        success: true,
        message: 'Catalogue is already up to date',
        count: cached.length,
        updated: false,
        lastSync: now,
      };
    }

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const rawList: Partial<Track>[] = Array.isArray(data)
      ? data
      : data?.songs || data?.tracks || [];

    if (!Array.isArray(rawList) || rawList.length === 0) {
      throw new Error('Remote manifest contains no valid tracks array');
    }

    // Normalize and sanitize fetched tracks
    const freshTracks = rawList.filter(t => !isTempTestSong(t)).map((t, idx) => normalizeTrack(t, idx));

    // Save to local cache
    localStorage.setItem(STORAGE_KEYS.CACHED_CATALOGUE, JSON.stringify(freshTracks));

    // Store ETag if provided
    const newEtag = res.headers.get('ETag');
    if (newEtag) {
      localStorage.setItem(STORAGE_KEYS.CATALOGUE_ETAG, newEtag);
    }

    const now = Date.now();
    localStorage.setItem(STORAGE_KEYS.CATALOGUE_LAST_SYNC, String(now));

    // Notify application components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wavemusic_catalogue_updated', {
          detail: { trackCount: freshTracks.length, source: 'remote' },
        })
      );
      window.dispatchEvent(new CustomEvent('wavemusic_tracks_updated'));
    }

    return {
      success: true,
      message: `Successfully synchronized ${freshTracks.length} tracks`,
      count: freshTracks.length,
      updated: true,
      lastSync: now,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('[WaveMusic Catalogue Sync] Network fetch failed, retaining cached catalogue:', errorMsg);

    return {
      success: false,
      message: `Using cached catalogue (${cached.length} tracks): ${errorMsg}`,
      count: cached.length,
      updated: false,
      lastSync: getLastCatalogueSyncTime() || undefined,
    };
  }
}

/**
 * Initializes automatic background catalogue synchronization on app foregrounding & online events
 */
let isAutoSyncInitialized = false;

export function initCatalogueAutoSync(): void {
  if (isAutoSyncInitialized || typeof window === 'undefined') return;
  isAutoSyncInitialized = true;

  const maybeSync = () => {
    fetchRemoteCatalogue().catch(() => {});
  };

  // Immediate sync on app startup
  maybeSync();

  // Sync when returning from background / phone unlocked
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      maybeSync();
    }
  });

  // Sync when phone reconnects to internet
  window.addEventListener('online', () => {
    fetchRemoteCatalogue().catch(() => {});
  });
}

/**
 * Safely resolves an audio URL for streaming
 */
export function resolveAudioUrl(track?: Track | null): string {
  if (!track || !track.audioUrl) return '';
  return track.audioUrl.trim();
}

/**
 * Verifies if a URL is a direct media video URL
 */
export function isDirectVideoUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  if (
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('https://') &&
    !trimmed.startsWith('/')
  ) {
    return false;
  }
  if (
    trimmed.includes('youtube.com') ||
    trimmed.includes('youtu.be') ||
    trimmed.includes('vimeo.com')
  ) {
    return false;
  }
  return true;
}

/**
 * Safely resolves a direct video stream URL
 */
export function resolveVideoUrl(track?: Track | null): string {
  if (!track || !track.videoUrl) return '';
  const trimmed = track.videoUrl.trim();
  return isDirectVideoUrl(trimmed) ? trimmed : '';
}

/**
 * Resolves artwork image URL with graceful SVG gradient fallback
 */
export function resolveArtworkUrl(item?: {
  thumbnailUrl?: string;
  artworkUrl?: string;
  coverUrl?: string;
  avatarUrl?: string;
}): string {
  const url = item?.thumbnailUrl || item?.artworkUrl || item?.coverUrl || item?.avatarUrl;
  if (url && (isValidUrl(url) || url.startsWith('data:') || url.startsWith('/'))) {
    return url;
  }

  // Sleek SVG placeholder gradient when no image is available
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231a1a24"/><stop offset="50%" stop-color="%23261a2e"/><stop offset="100%" stop-color="%23fa2d48" stop-opacity="0.6"/></linearGradient></defs><rect width="400" height="400" fill="url(%23g)"/><circle cx="200" cy="180" r="50" fill="%23ffffff" fill-opacity="0.15"/><path d="M185 155 L225 180 L185 205 Z" fill="%23ffffff" fill-opacity="0.8"/></svg>`;
}

/**
 * User-Added Local Tracks (Local Storage)
 */
export function getUserTracks(): Track[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_TRACKS);
    if (!raw) return [];
    const list: Partial<Track>[] = JSON.parse(raw);
    return list.map((t, idx) => normalizeTrack(t, idx));
  } catch {
    return [];
  }
}

export function saveUserTrack(track: Partial<Track>): Track[] {
  const current = getUserTracks();
  const sanitizedTrack = normalizeTrack(track);
  const existsIndex = current.findIndex((t) => t.id === sanitizedTrack.id);
  let updated: Track[];
  if (existsIndex >= 0) {
    updated = [...current];
    updated[existsIndex] = sanitizedTrack;
  } else {
    updated = [sanitizedTrack, ...current];
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.USER_TRACKS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('wavemusic_tracks_updated'));
  }
  return updated;
}

export function deleteUserTrack(trackId: string): Track[] {
  const current = getUserTracks();
  const isCustom = current.some((t) => t.id === trackId);

  if (isCustom) {
    const updated = current.filter((t) => t.id !== trackId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USER_TRACKS, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('wavemusic_tracks_updated'));
    }
    return updated;
  } else {
    // Soft delete/hide catalogue track
    hideTrack(trackId);
    return current;
  }
}

/**
 * Returns complete combined catalog:
 * user-added custom tracks + cached/bundled tracks - hidden tracks
 */
export function getAllTracks(): Track[] {
  const userTracks = getUserTracks();
  const catalogueTracks = getCachedCatalogue();
  const hiddenIds = new Set(getHiddenTrackIds());

  const userTrackIds = new Set(userTracks.map((t) => t.id));
  const activeCatalogueTracks = catalogueTracks.filter(
    (t) => !userTrackIds.has(t.id) && !hiddenIds.has(t.id)
  );

  return [...userTracks, ...activeCatalogueTracks];
}

export function getTrackById(id: string): Track | undefined {
  return getAllTracks().find((t) => t.id === id);
}

export function getTracksByIds(ids: string[]): Track[] {
  const all = getAllTracks();
  return ids
    .map((id) => all.find((t) => t.id === id))
    .filter((t): t is Track => t !== undefined);
}

/**
 * Auto-derives unique Album collections from tracks metadata
 */
export function getAllAlbums(): Album[] {
  const albumMap = new Map<string, Album>();
  const tracks = getAllTracks();

  for (const track of tracks) {
    const albumTitle = track.album?.trim() || 'Singles';
    const albumId = `album-${slugify(albumTitle)}`;

    if (!albumMap.has(albumId)) {
      albumMap.set(albumId, {
        id: albumId,
        title: albumTitle,
        artist: track.artist,
        artworkUrl: track.thumbnailUrl || '',
        releaseYear: track.year || new Date().getFullYear(),
        genre: track.genre || 'Music',
        trackCount: 1,
        trackIds: [track.id],
        description: track.description || `Album by ${track.artist}`,
      });
    } else {
      const existing = albumMap.get(albumId)!;
      existing.trackCount += 1;
      if (!existing.trackIds.includes(track.id)) {
        existing.trackIds.push(track.id);
      }
    }
  }

  return Array.from(albumMap.values());
}

export function getAlbumById(id: string): Album | undefined {
  return getAllAlbums().find((a) => a.id === id);
}

/**
 * Auto-derives unique Artist profiles from tracks metadata
 */
export function getAllArtists(): Artist[] {
  const artistMap = new Map<string, Artist>();
  const tracks = getAllTracks();

  for (const track of tracks) {
    const artistName = track.artist?.trim() || 'Unknown Artist';
    const artistId = `artist-${slugify(artistName)}`;
    const albumId = `album-${slugify(track.album || 'Singles')}`;

    if (!artistMap.has(artistId)) {
      artistMap.set(artistId, {
        id: artistId,
        name: artistName,
        avatarUrl: track.thumbnailUrl || '',
        bannerUrl: track.thumbnailUrl || '',
        genre: track.genre || 'Music',
        monthlyListeners: 'Verified Artist',
        bio: `${artistName} • Collection of songs in ${track.language || 'Music'}`,
        topTrackIds: [track.id],
        albumIds: [albumId],
      });
    } else {
      const existing = artistMap.get(artistId)!;
      if (!existing.topTrackIds.includes(track.id)) {
        existing.topTrackIds.push(track.id);
      }
      if (!existing.albumIds.includes(albumId)) {
        existing.albumIds.push(albumId);
      }
    }
  }

  return Array.from(artistMap.values());
}

export function getArtistById(id: string): Artist | undefined {
  return getAllArtists().find((a) => a.id === id);
}

/**
 * Curated Playlists
 */
export function getCuratedPlaylists(): Playlist[] {
  const tracks = getAllTracks();
  const tamilTracks = tracks.filter((t) => t.language?.toLowerCase() === 'tamil');
  const melodyTracks = tracks.filter((t) =>
    (t.genre + t.title + t.description).toLowerCase().includes('melody')
  );

  return [
    {
      id: 'playlist-top-hits',
      name: 'WaveMusic Top Hits',
      description: 'The most streamed tracks and trending releases',
      coverUrl: tracks[0]?.thumbnailUrl || '',
      trackIds: tracks.slice(0, 20).map((t) => t.id),
      createdAt: '2025-01-01',
    },
    {
      id: 'playlist-tamil-vibes',
      name: 'Tamil Pure Vibes',
      description: 'Soulful melodies and timeless Tamil cinema songs',
      coverUrl: tamilTracks[0]?.thumbnailUrl || tracks[1]?.thumbnailUrl || '',
      trackIds: tamilTracks.map((t) => t.id),
      createdAt: '2025-01-01',
    },
    {
      id: 'playlist-night-chill',
      name: 'Midnight Melodies',
      description: 'Late night calm, acoustic melodies and soothing vocals',
      coverUrl: melodyTracks[0]?.thumbnailUrl || tracks[2]?.thumbnailUrl || '',
      trackIds: melodyTracks.map((t) => t.id),
      createdAt: '2025-01-01',
    },
    {
      id: 'playlist-all-songs',
      name: 'Full 24/7 Library Loop',
      description: 'Continuous uninterrupted stream of all songs in the catalog',
      coverUrl: tracks[3]?.thumbnailUrl || tracks[0]?.thumbnailUrl || '',
      trackIds: tracks.map((t) => t.id),
      createdAt: '2025-01-01',
    },
  ];
}

export function getPlaylistById(id: string): Playlist | undefined {
  const curated = getCuratedPlaylists().find((p) => p.id === id);
  if (curated) return curated;
  const user = getUserPlaylists().find((p) => p.id === id);
  return user;
}

/**
 * Local User Playlists Management
 */
export function getUserPlaylists(): Playlist[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function createUserPlaylist(name: string, description: string = ''): Playlist {
  const userPlaylists = getUserPlaylists();
  const newPlaylist: Playlist = {
    id: `playlist-user-${Date.now()}`,
    name: name.trim() || 'My Playlist',
    description: description.trim(),
    trackIds: [],
    isUserCreated: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newPlaylist, ...userPlaylists];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updated));
  }
  return newPlaylist;
}

export function updateUserPlaylist(id: string, updates: Partial<Playlist>): Playlist | null {
  const userPlaylists = getUserPlaylists();
  const index = userPlaylists.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const current = userPlaylists[index];
  const updatedPlaylist: Playlist = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  userPlaylists[index] = updatedPlaylist;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(userPlaylists));
  }
  return updatedPlaylist;
}

export function deleteUserPlaylist(id: string): boolean {
  const userPlaylists = getUserPlaylists();
  const filtered = userPlaylists.filter((p) => p.id !== id);
  if (filtered.length === userPlaylists.length) return false;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(filtered));
  }
  return true;
}

export function addTrackToPlaylist(playlistId: string, trackId: string): boolean {
  const userPlaylists = getUserPlaylists();
  const playlist = userPlaylists.find((p) => p.id === playlistId);
  if (!playlist) return false;

  if (!playlist.trackIds.includes(trackId)) {
    playlist.trackIds.push(trackId);
    playlist.updatedAt = new Date().toISOString();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(userPlaylists));
    }
  }
  return true;
}

export function removeTrackFromPlaylist(playlistId: string, trackId: string): boolean {
  const userPlaylists = getUserPlaylists();
  const playlist = userPlaylists.find((p) => p.id === playlistId);
  if (!playlist) return false;

  const initialLength = playlist.trackIds.length;
  playlist.trackIds = playlist.trackIds.filter((id) => id !== trackId);
  if (playlist.trackIds.length !== initialLength) {
    playlist.updatedAt = new Date().toISOString();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(userPlaylists));
    }
    return true;
  }
  return false;
}

/**
 * Favourites / Liked Songs
 */
export function getFavourites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVOURITES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavourite(trackId: string): boolean {
  const favourites = getFavourites();
  const exists = favourites.includes(trackId);
  let updated: string[];
  if (exists) {
    updated = favourites.filter((id) => id !== trackId);
  } else {
    updated = [trackId, ...favourites];
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.FAVOURITES, JSON.stringify(updated));
  }
  return !exists;
}

export function isFavourite(trackId: string): boolean {
  return getFavourites().includes(trackId);
}

/**
 * Playback History
 */
export function getPlaybackHistory(): PlaybackHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToPlaybackHistory(track: Track): PlaybackHistoryItem[] {
  if (!track || !track.id) return getPlaybackHistory();
  const history = getPlaybackHistory();
  const filtered = history.filter((item) => item?.track?.id && item.track.id !== track.id);
  const updated: PlaybackHistoryItem[] = [
    { track, playedAt: Date.now() },
    ...filtered,
  ].slice(0, AUDIO_CONFIG.maxHistoryItems);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  }
  return updated;
}

export function clearPlaybackHistory(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  }
}

/**
 * Generic Audio URL Stream Diagnostic Tester
 */
export interface AudioDiagnosticResult {
  success: boolean;
  status?: number;
  statusText?: string;
  latencyMs?: number;
  byteRangeSupport?: boolean;
  contentType?: string | null;
  contentLength?: string | null;
  corsOk?: boolean;
  message: string;
}

export async function testAudioUrl(testUrl: string): Promise<AudioDiagnosticResult> {
  const startTime = performance.now();
  try {
    const res = await fetch(testUrl, {
      method: 'GET',
      headers: {
        Range: 'bytes=0-1024',
      },
      mode: 'cors',
      cache: 'no-store',
    });

    const latencyMs = Math.round(performance.now() - startTime);
    const contentType = res.headers.get('content-type');
    const contentLength = res.headers.get('content-length');
    const acceptRanges = res.headers.get('accept-ranges');
    const contentRange = res.headers.get('content-range');

    const byteRangeSupport = res.status === 206 || acceptRanges === 'bytes' || !!contentRange;

    if (res.status === 200 || res.status === 206) {
      return {
        success: true,
        status: res.status,
        statusText: res.statusText,
        latencyMs,
        byteRangeSupport,
        contentType,
        contentLength,
        corsOk: true,
        message: byteRangeSupport
          ? `Audio stream verified! HTTP 206 Partial Content range seeking supported (${latencyMs}ms latency).`
          : `Connected successfully! (Server returned ${res.status}. Note: Range headers were not detected, so seeking may require downloading segments).`,
      };
    }

    if (res.status === 403) {
      return {
        success: false,
        status: 403,
        latencyMs,
        message:
          'HTTP 403 Forbidden: Access to this audio URL is restricted. Verify public permissions or signed token parameters.',
      };
    }

    if (res.status === 404) {
      return {
        success: false,
        status: 404,
        latencyMs,
        message: 'HTTP 404 Not Found: The specified audio file does not exist at this URL.',
      };
    }

    return {
      success: false,
      status: res.status,
      latencyMs,
      message: `Received HTTP ${res.status} ${res.statusText}`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const isCors = errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError');

    return {
      success: false,
      message: isCors
        ? 'Network or CORS error: Browser could not reach the audio URL. Verify the server allows cross-origin requests (Access-Control-Allow-Origin).'
        : `Connection test failed: ${errorMsg}`,
    };
  }
}
