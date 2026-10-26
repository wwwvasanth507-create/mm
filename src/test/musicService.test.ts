import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  resolveAudioUrl,
  resolveArtworkUrl,
  getAllTracks,
  getTrackById,
  getAllAlbums,
  getAllArtists,
  saveUserTrack,
  deleteUserTrack,
  createUserPlaylist,
  getUserPlaylists,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  deleteUserPlaylist,
  getCuratedPlaylists,
  getPlaylistById,
  toggleFavourite,
  isFavourite,
  addToPlaybackHistory,
  getPlaybackHistory,
  clearPlaybackHistory,
  getCatalogueUrl,
  setCatalogueUrl,
  resetCatalogueUrl,
  hideTrack,
  unhideTrack,
  getHiddenTrackIds,
  fetchRemoteCatalogue,
} from '@/services/musicService';
import { Track } from '@/types/music';
import { formatTime, formatNumber } from '@/utils/formatters';

const sampleMockTrack: Track = {
  id: 'test-song-001',
  title: 'Test Melody',
  artist: 'Test Singer',
  album: 'Test Album',
  genre: 'Melody',
  year: 2025,
  duration: 240,
  audioUrl: 'https://example.com/audio/test.mp3',
  thumbnailUrl: 'https://example.com/images/cover.jpg',
  language: 'Tamil',
  isExplicit: false,
};

describe('Music Catalog and Audio URL Resolution', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('safely handles empty catalog and retrieves arrays', () => {
    const tracks = getAllTracks();
    expect(Array.isArray(tracks)).toBe(true);
    expect(tracks.length).toBeGreaterThan(0);
  });

  it('resolves direct audio URLs correctly', () => {
    expect(resolveAudioUrl(sampleMockTrack)).toBe('https://example.com/audio/test.mp3');
    expect(resolveAudioUrl(null)).toBe('');
  });

  it('provides reliable fallback for missing artwork', () => {
    const noArtTrack: Track = { ...sampleMockTrack, thumbnailUrl: '' };
    const artwork = resolveArtworkUrl(noArtTrack);
    expect(artwork.startsWith('data:image/svg+xml')).toBe(true);
  });

  it('manages user tracks locally and combines with catalog', () => {
    const initialCount = getAllTracks().length;
    saveUserTrack(sampleMockTrack);

    const updatedTracks = getAllTracks();
    expect(updatedTracks.length).toBe(initialCount + 1);

    const retrieved = getTrackById('test-song-001');
    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe('Test Melody');

    deleteUserTrack('test-song-001');
    expect(getAllTracks().length).toBe(initialCount);
  });

  it('auto-derives unique albums and artists correctly', () => {
    const albums = getAllAlbums();
    const artists = getAllArtists();
    expect(albums.length).toBeGreaterThan(0);
    expect(artists.length).toBeGreaterThan(0);
  });

  it('creates, updates, and deletes user playlists', () => {
    const playlist = createUserPlaylist('Night Drives', 'Late night tunes');
    expect(playlist.name).toBe('Night Drives');

    addTrackToPlaylist(playlist.id, 'test-song-001');
    const lists = getUserPlaylists();
    expect(lists.find((p) => p.id === playlist.id)?.trackIds).toContain('test-song-001');

    removeTrackFromPlaylist(playlist.id, 'test-song-001');
    expect(getUserPlaylists().find((p) => p.id === playlist.id)?.trackIds).not.toContain(
      'test-song-001'
    );

    deleteUserPlaylist(playlist.id);
    expect(getUserPlaylists().find((p) => p.id === playlist.id)).toBeUndefined();
  });

  it('includes Ayothi playlist with correct cover URL and tracks', () => {
    const playlists = getCuratedPlaylists();
    const ayothi = playlists.find((p) => p.name.toLowerCase() === 'ayothi');
    expect(ayothi).toBeDefined();
    expect(ayothi?.coverUrl).toBe(
      'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/thumbnalis/kaatrodu-pattam-pola.jpg'
    );
    expect(ayothi?.trackIds).toContain('song-kaatrodu-pattam-pola');

    const byId = getPlaylistById('playlist-ayothi');
    expect(byId).toBeDefined();
    expect(byId?.id).toBe('playlist-ayothi');

    const byName = getPlaylistById('ayothi');
    expect(byName).toBeDefined();
    expect(byName?.id).toBe('playlist-ayothi');
  });

  it('toggles favourites accurately', () => {
    expect(isFavourite('fav-track-1')).toBe(false);
    toggleFavourite('fav-track-1');
    expect(isFavourite('fav-track-1')).toBe(true);
    toggleFavourite('fav-track-1');
    expect(isFavourite('fav-track-1')).toBe(false);
  });

  it('records playback history and avoids duplicates', () => {
    clearPlaybackHistory();
    addToPlaybackHistory(sampleMockTrack);
    let history = getPlaybackHistory();
    expect(history.length).toBe(1);
    expect(history[0].track.id).toBe('test-song-001');

    addToPlaybackHistory(sampleMockTrack);
    history = getPlaybackHistory();
    expect(history.length).toBe(1);
  });

  it('allows configuring and resetting remote catalogue URL', () => {
    const defaultUrl = getCatalogueUrl();
    expect(defaultUrl).toContain('raw.githubusercontent.com');

    const customUrl = 'https://my-cdn.com/songs-manifest.json';
    const success = setCatalogueUrl(customUrl);
    expect(success).toBe(true);
    expect(getCatalogueUrl()).toBe(customUrl);

    resetCatalogueUrl();
    expect(getCatalogueUrl()).toBe(defaultUrl);
  });

  it('supports soft-deleting / hiding catalogue tracks without affecting original file', () => {
    const tracks = getAllTracks();
    const firstTrack = tracks[0];
    expect(firstTrack).toBeDefined();

    hideTrack(firstTrack.id);
    expect(getHiddenTrackIds()).toContain(firstTrack.id);
    expect(getAllTracks().some((t) => t.id === firstTrack.id)).toBe(false);

    unhideTrack(firstTrack.id);
    expect(getHiddenTrackIds()).not.toContain(firstTrack.id);
    expect(getAllTracks().some((t) => t.id === firstTrack.id)).toBe(true);
  });

  it('allows editing an existing track metadata via saveUserTrack', () => {
    const tracks = getAllTracks();
    const target = tracks[0];

    const edited: Track = {
      ...target,
      title: 'Edited Special Title',
      artist: 'Remastered Singer',
    };

    saveUserTrack(edited);
    const updated = getTrackById(target.id);
    expect(updated?.title).toBe('Edited Special Title');
    expect(updated?.artist).toBe('Remastered Singer');

    deleteUserTrack(target.id);
  });

  it('falls back gracefully when remote catalogue network call fails', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    const res = await fetchRemoteCatalogue();
    expect(res.success).toBe(false);
    expect(res.count).toBeGreaterThan(0);
    expect(res.message).toContain('cached');

    global.fetch = originalFetch;
  });

  it('only activates video features when a valid direct video URL is present and strips YouTube links', () => {
    const tracks = getAllTracks();
    const tracksWithVideo = tracks.filter((t) => Boolean(t.videoUrl));
    expect(tracksWithVideo.length).toBeGreaterThanOrEqual(1);
    const monicaTrack = tracksWithVideo.find((t) => t.id === 'song-monica');
    expect(monicaTrack).toBeDefined();
    expect(monicaTrack?.videoUrl).toContain('Monica%20-%20Lyric%20Video');
    expect(monicaTrack?.hasVideo).toBe(true);

    const nonVideoTrack = tracks.find((t) => t.id === 'song-ravana-tandavam');
    expect(nonVideoTrack?.videoUrl).toBe('');
    expect(nonVideoTrack?.hasVideo).toBe(false);

    const cloudflareVideoTrack: Track = {
      id: 'custom-cf-video-001',
      title: 'Cloudflare Video Song',
      artist: 'Artist',
      album: 'Album',
      genre: 'Soundtrack',
      year: 2026,
      duration: 200,
      audioUrl: 'https://pub-cb5744f7bc244e399af05b93c8aff51d.r2.dev/song.mp3',
      thumbnailUrl: 'https://example.com/cover.jpg',
      videoUrl: 'https://pub-cb5744f7bc244e399af05b93c8aff51d.r2.dev/video.mp4',
    };
    saveUserTrack(cloudflareVideoTrack);

    const savedCfTrack = getAllTracks().find((t) => t.id === 'custom-cf-video-001');
    expect(savedCfTrack?.videoUrl).toBe(
      'https://pub-cb5744f7bc244e399af05b93c8aff51d.r2.dev/video.mp4'
    );
    expect(savedCfTrack?.hasVideo).toBe(true);

    const youtubeTrack: Track = {
      id: 'custom-yt-video-002',
      title: 'YouTube Track',
      artist: 'Artist',
      album: 'Album',
      genre: 'Pop',
      year: 2026,
      duration: 180,
      audioUrl: 'https://example.com/song.mp3',
      thumbnailUrl: 'https://example.com/cover.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=12345',
    };
    saveUserTrack(youtubeTrack);

    const savedYtTrack = getAllTracks().find((t) => t.id === 'custom-yt-video-002');
    expect(savedYtTrack?.videoUrl).toBe('');
    expect(savedYtTrack?.hasVideo).toBe(false);

    deleteUserTrack('custom-cf-video-001');
    deleteUserTrack('custom-yt-video-002');
  });
});

describe('Formatters', () => {
  it('formats seconds into mm:ss and hh:mm:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(240)).toBe('4:00');
    expect(formatTime(3665)).toBe('1:01:05');
  });

  it('formats numbers into compact K/M', () => {
    expect(formatNumber(500)).toBe('500');
    expect(formatNumber(14200)).toBe('14.2K');
    expect(formatNumber(1500000)).toBe('1.5M');
  });
});