import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveAudioUrl,
  resolveArtworkUrl,
  getAllTracks,
  getTrackById,
  getAllAlbums,
  getAllArtists,
  getCuratedPlaylists,
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
} from '@/services/musicService';
import { Track } from '@/types/music';
import { formatTime, formatNumber } from '@/utils/formatters';

describe('Music Catalog and Audio URL Resolution', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads catalog tracks, derived albums, derived artists, and curated playlists', () => {
    const tracks = getAllTracks();
    expect(tracks.length).toBeGreaterThan(0);

    const albums = getAllAlbums();
    expect(albums.length).toBeGreaterThan(0);

    const artists = getAllArtists();
    expect(artists.length).toBeGreaterThan(0);

    const playlists = getCuratedPlaylists();
    expect(playlists.length).toBeGreaterThan(0);
  });

  it('finds track by id with full metadata (year, language, duration, etc.)', () => {
    const track = getTrackById('song-tamil-001');
    expect(track).toBeDefined();
    expect(track?.title).toContain('Kanmani Anbodu');
    expect(track?.language).toBe('Tamil');
    expect(track?.year).toBe(2024);
    expect(track?.genre).toBe('Melody');
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

  it('automatically derives unique albums and artists from song catalog', () => {
    const albums = getAllAlbums();
    const gunaaAlbum = albums.find((a) => a.title === 'Gunaa');
    expect(gunaaAlbum).toBeDefined();
    expect(gunaaAlbum?.artist).toContain('Kamal Haasan');
    expect(gunaaAlbum?.trackIds).toContain('song-tamil-001');

    const artists = getAllArtists();
    const artist = artists.find((ar) => ar.name.includes('Shankar Mahadevan'));
    expect(artist).toBeDefined();
    expect(artist?.topTrackIds).toContain('song-tamil-002');
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
    addTrackToPlaylist(pl.id, 'song-tamil-001');
    addTrackToPlaylist(pl.id, 'song-tamil-002');

    let updated = getUserPlaylists().find((p) => p.id === pl.id);
    expect(updated?.trackIds).toContain('song-tamil-001');
    expect(updated?.trackIds).toContain('song-tamil-002');
    expect(updated?.trackIds.length).toBe(2);

    removeTrackFromPlaylist(pl.id, 'song-tamil-001');
    updated = getUserPlaylists().find((p) => p.id === pl.id);
    expect(updated?.trackIds).not.toContain('song-tamil-001');
    expect(updated?.trackIds.length).toBe(1);
  });

  it('deletes user playlists', () => {
    const pl = createUserPlaylist('Temporary Playlist');
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
    expect(isFavourite('song-tamil-001')).toBe(false);

    toggleFavourite('song-tamil-001');
    expect(isFavourite('song-tamil-001')).toBe(true);

    toggleFavourite('song-tamil-001');
    expect(isFavourite('song-tamil-001')).toBe(false);
  });

  it('records played tracks to history without duplicates and clears history', () => {
    const track1 = getTrackById('song-tamil-001')!;
    const track2 = getTrackById('song-tamil-002')!;

    addToPlaybackHistory(track1);
    addToPlaybackHistory(track2);

    let history = getPlaybackHistory();
    expect(history.length).toBe(2);
    expect(history[0].track.id).toBe(track2.id); // Latest is first

    clearPlaybackHistory();
    expect(getPlaybackHistory().length).toBe(0);
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
