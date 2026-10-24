import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveAudioUrl,
  resolveArtworkUrl,
  getAllTracks,
  getTrackById,
  getAllAlbums,
  getAllArtists,
  getCuratedPlaylists,
  saveUserTrack,
  deleteUserTrack,
  createUserPlaylist,
  getUserPlaylists,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  deleteUserPlaylist,
  toggleFavourite,
  isFavourite,
  addToPlaybackHistory,
  getPlaybackHistory,
  clearPlaybackHistory,
  resolveVideoUrl,
  getYouTubeVideoId,
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

    const albums = getAllAlbums();
    expect(Array.isArray(albums)).toBe(true);

    const artists = getAllArtists();
    expect(Array.isArray(artists)).toBe(true);

    const playlists = getCuratedPlaylists();
    expect(Array.isArray(playlists)).toBe(true);
  });

  it('supports dynamically adding, finding, and deleting user tracks', () => {
    saveUserTrack(sampleMockTrack);

    const found = getTrackById('test-song-001');
    expect(found).toBeDefined();
    expect(found?.title).toBe('Test Melody');
    expect(found?.artist).toBe('Test Singer');
    expect(found?.language).toBe('Tamil');

    const all = getAllTracks();
    expect(all.some((t) => t.id === 'test-song-001')).toBe(true);

    deleteUserTrack('test-song-001');
    expect(getTrackById('test-song-001')).toBeUndefined();
  });

  it('resolves direct HTTPS audioUrl as-is, including query parameters', () => {
    const track: Track = {
      id: 'test-1',
      title: 'Direct Stream Track',
      artist: 'Tester',
      album: 'Test Album',
      genre: 'Test',
      year: 2025,
      duration: 120,
      audioUrl: 'https://example.com/audio/song.mp3?token=abc123xyz&expires=1700000000',
      thumbnailUrl: 'https://example.com/images/cover.jpg',
    };
    const resolved = resolveAudioUrl(track);
    expect(resolved).toBe('https://example.com/audio/song.mp3?token=abc123xyz&expires=1700000000');
  });

  it('resolves artwork URL with SVG gradient fallback if missing', () => {
    const fallback = resolveArtworkUrl({});
    expect(fallback).toContain('data:image/svg+xml');

    const validUrl = 'https://images.unsplash.com/photo-1';
    const resolved = resolveArtworkUrl({ thumbnailUrl: validUrl });
    expect(resolved).toBe(validUrl);
  });

  it('automatically derives unique albums and artists from user songs', () => {
    saveUserTrack(sampleMockTrack);

    const albums = getAllAlbums();
    const testAlbum = albums.find((a) => a.title === 'Test Album');
    expect(testAlbum).toBeDefined();
    expect(testAlbum?.artist).toContain('Test Singer');
    expect(testAlbum?.trackIds).toContain('test-song-001');

    const artists = getAllArtists();
    const artist = artists.find((ar) => ar.name === 'Test Singer');
    expect(artist).toBeDefined();
    expect(artist?.topTrackIds).toContain('test-song-001');
  });
});

describe('User Playlist Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates and retrieves user playlists', () => {
    const playlist = createUserPlaylist('My Melodies', 'Tamil chill songs');
    expect(playlist.id).toBeDefined();
    expect(playlist.name).toBe('My Melodies');
    expect(playlist.isUserCreated).toBe(true);

    const all = getUserPlaylists();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe('My Melodies');
  });

  it('adds and removes tracks from user playlists', () => {
    const pl = createUserPlaylist('Workout Mix');
    addTrackToPlaylist(pl.id, 'test-song-001');
    addTrackToPlaylist(pl.id, 'test-song-002');

    let updated = getUserPlaylists().find((p) => p.id === pl.id);
    expect(updated?.trackIds).toContain('test-song-001');
    expect(updated?.trackIds).toContain('test-song-002');
    expect(updated?.trackIds.length).toBe(2);

    removeTrackFromPlaylist(pl.id, 'test-song-001');
    updated = getUserPlaylists().find((p) => p.id === pl.id);
    expect(updated?.trackIds).not.toContain('test-song-001');
    expect(updated?.trackIds.length).toBe(1);
  });

  it('deletes user playlists', () => {
    const pl = createUserPlaylist('Temp Playlist');
    expect(getUserPlaylists().length).toBe(1);

    const deleted = deleteUserPlaylist(pl.id);
    expect(deleted).toBe(true);
    expect(getUserPlaylists().length).toBe(0);
  });
});

describe('Favourites and Playback History', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('toggles favourites on and off', () => {
    expect(isFavourite('test-song-001')).toBe(false);

    toggleFavourite('test-song-001');
    expect(isFavourite('test-song-001')).toBe(true);

    toggleFavourite('test-song-001');
    expect(isFavourite('test-song-001')).toBe(false);
  });

  it('records played tracks to history without duplicates and clears history', () => {
    const track1 = { ...sampleMockTrack, id: 'test-song-001' };
    const track2 = { ...sampleMockTrack, id: 'test-song-002', title: 'Second Song' };

    addToPlaybackHistory(track1);
    addToPlaybackHistory(track2);

    let history = getPlaybackHistory();
    expect(history.length).toBe(2);
    expect(history[0].track.id).toBe(track2.id); // Latest is first

    clearPlaybackHistory();
    expect(getPlaybackHistory().length).toBe(0);
  });

  it('correctly resolves video URLs and parses YouTube video IDs', () => {
    const trackWithVideo = {
      ...sampleMockTrack,
      videoUrl: 'https://www.youtube.com/watch?v=AyYyZUI0Rgk',
    };
    expect(resolveVideoUrl(trackWithVideo)).toBe('https://www.youtube.com/watch?v=AyYyZUI0Rgk');
    expect(getYouTubeVideoId(trackWithVideo.videoUrl)).toBe('AyYyZUI0Rgk');

    // Shortened youtu.be format
    expect(getYouTubeVideoId('https://youtu.be/8cviQKlGBoE')).toBe('8cviQKlGBoE');

    // Embed format
    expect(getYouTubeVideoId('https://www.youtube.com/embed/13F1eZ0b8iE')).toBe('13F1eZ0b8iE');

    // Non-video track
    expect(resolveVideoUrl(sampleMockTrack)).toBe('');
    expect(getYouTubeVideoId(undefined)).toBeNull();
  });

  it('includes the 6 Bison: Kaalamaadan tracks in the catalog with real thumbnails', () => {
    const tracks = getAllTracks();
    const bisonIds = [
      'song-cheenikkallu',
      'song-cheenikkallu-unplugged',
      'song-kaalamaadan-gaanam',
      'song-rekka-rekka',
      'song-theekkoluthi',
      'song-thennaadu',
    ];

    bisonIds.forEach((id) => {
      const found = tracks.find((t) => t.id === id);
      expect(found).toBeDefined();
      expect(found?.album).toBe('Bison Kaalamaadan');
      expect(found?.audioUrl).toContain('pub-cb5744f7bc244e399af05b93c8aff51d.r2.dev/songs/');
      expect(found?.thumbnailUrl).toContain('c.saavncdn.com');
      expect(found?.videoUrl).toBeTruthy();
    });
  });

  it('only assigns videoUrl to the 6 Bison tracks and keeps other tracks strictly audio-only', () => {
    const tracks = getAllTracks();
    const tracksWithVideo = tracks.filter((t) => Boolean(t.videoUrl));
    expect(tracksWithVideo.length).toBe(6);
    expect(tracksWithVideo.every((t) => t.album === 'Bison Kaalamaadan')).toBe(true);

    const nonVideoTrack = tracks.find((t) => t.id === 'song-ravana-tandavam');
    expect(nonVideoTrack?.videoUrl).toBe('');
    expect(nonVideoTrack?.hasVideo).toBe(false);
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
