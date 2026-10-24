import musicData from '@/data/music.json';
import { Track, Album, Artist, Playlist, PlaybackHistoryItem } from '@/types/music';
import { AUDIO_CONFIG, STORAGE_KEYS, isValidUrl } from '@/config/audio';

// Extract raw songs from music.json (supporting songs, tracks, or direct array)
interface RawCatalog {
  songs?: Track[];
  tracks?: Track[];
  playlists?: Playlist[];
}

const typedCatalog = musicData as RawCatalog;
const rawSongs: Track[] = (
  typedCatalog.songs ||
  typedCatalog.tracks ||
  (Array.isArray(musicData) ? musicData : [])
) as Track[];

// Normalize catalog items to ensure thumbnailUrl and audioUrl are populated
const normalizedTracks: Track[] = rawSongs.map((song, idx) => {
  const directVideo = isDirectVideoUrl(song.videoUrl) ? song.videoUrl?.trim() : '';
  return {
    ...song,
    id: song.id || `song-${idx + 1}`,
    title: song.title || 'Untitled Track',
    artist: song.artist || 'Unknown Artist',
    album: song.album || 'Single',
    genre: song.genre || 'General',
    year: song.year || new Date().getFullYear(),
    duration: song.duration || 0,
    audioUrl: song.audioUrl || '',
    thumbnailUrl: song.thumbnailUrl || song.artworkUrl || '',
    artworkUrl: song.thumbnailUrl || song.artworkUrl || '',
    language: song.language || 'English',
    description: song.description || '',
    isExplicit: Boolean(song.isExplicit),
    videoUrl: directVideo || '',
    hasVideo: Boolean(directVideo),
  };
});

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
 * Safely resolves an audio URL for streaming
 * Plays direct HTTPS URLs from any compatible host, including query parameters
 */
export function resolveAudioUrl(track?: Track | null): string {
  if (!track || !track.audioUrl) return '';
  return track.audioUrl.trim();
}

/**
 * Verifies if a URL is a direct media video URL (e.g. Cloudflare R2, direct MP4/WebM/HLS stream)
 * Rejects YouTube, Vimeo, and third-party page links
 */
export function isDirectVideoUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
    return false;
  }
  // Disallow YouTube and third-party video page links
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
 * Safely resolves a direct video stream URL (Cloudflare R2, direct MP4/WebM)
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
 * User-Added Tracks (Local Storage)
 */
export function getUserTracks(): Track[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_TRACKS);
    if (!raw) return [];
    const list: Track[] = JSON.parse(raw);
    return list.map((t) => {
      const directVideo = isDirectVideoUrl(t.videoUrl) ? t.videoUrl?.trim() : '';
      return {
        ...t,
        videoUrl: directVideo || '',
        hasVideo: Boolean(directVideo),
      };
    });
  } catch {
    return [];
  }
}

export function saveUserTrack(track: Track): Track[] {
  const current = getUserTracks();
  const directVideo = isDirectVideoUrl(track.videoUrl) ? track.videoUrl?.trim() : '';
  const sanitizedTrack: Track = {
    ...track,
    videoUrl: directVideo || '',
    hasVideo: Boolean(directVideo),
  };
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
  const updated = current.filter((t) => t.id !== trackId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.USER_TRACKS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('wavemusic_tracks_updated'));
  }
  return updated;
}

/**
 * Returns complete combined catalog:
 * user-added tracks + tracks from music.json
 */
export function getAllTracks(): Track[] {
  const userTracks = getUserTracks();
  const userTrackIds = new Set(userTracks.map((t) => t.id));
  const staticTracks = normalizedTracks.filter((t) => !userTrackIds.has(t.id));
  return [...userTracks, ...staticTracks];
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
 * Auto-derives unique Album collections from songs metadata
 * No need to maintain duplicate album entries in separate files!
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
 * Auto-derives unique Artist profiles from songs metadata
 * Automatically links top tracks and albums!
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
 * Playlists Queries
 */
export function getCuratedPlaylists(): Playlist[] {
  if (typedCatalog.playlists && Array.isArray(typedCatalog.playlists)) {
    return typedCatalog.playlists;
  }

  // Fallback curated playlist
  return [
    {
      id: 'playlist-featured',
      name: 'Featured Library Tracks',
      description: 'Songs available in your catalog',
      coverUrl: normalizedTracks[0]?.thumbnailUrl,
      trackIds: normalizedTracks.map((t) => t.id),
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
 * Tests any audio URL (including query parameters) for HTTP Range 206 support,
 * Content-Type, latency, and CORS availability.
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
