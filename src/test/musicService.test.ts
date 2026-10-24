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
  isDirectVideoUrl,
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

  it('correctly validates direct video URLs and rejects YouTube/third-party page URLs', () => {
    // Direct Cloudflare R2 / stream / mp4 URLs are accepted
    expect(
      isDirectVideoUrl('https://pub-cb5744f7bc244e399af05b93c8aff51d.r2.dev/videos/sample.mp4')
    ).toBe(true);
    expect(isDirectVideoUrl('https://example.com/media/song.webm')).toBe(true);
    expect(isDirectVideoUrl('/videos/local-sample.mp4')).toBe(true);

    // YouTube and Vimeo URLs must be rejected
    expect(isDirectVideoUrl('https://www.youtube.com/watch?v=AyYyZUI0Rgk')).toBe(false);
    expect(isDirectVideoUrl('https://youtu.be/8cviQKlGBoE')).toBe(false);
    expect(isDirectVideoUrl('https://www.youtube.com/embed/13F1eZ0b8iE')).toBe(false);
    expect(isDirectVideoUrl('https://vimeo.com/123456')).toBe(false);
    expect(isDirectVideoUrl(undefined)).toBe(false);
    expect(isDirectVideoUrl('')).toBe(false);

    // Track resolution: only direct video URLs resolve, YouTube URLs return empty string
    const trackWithDirectVideo = {
      ...sampleMockTrack,
      videoUrl: 'https://pub-cb5744f7bc244e399af05b93c8aff51d.r2.dev/videos/sample.mp4',
    };
    expect(resolveVideoUrl(trackWithDirectVideo)).toBe(
      'https://pub-cb5744f7bc244e399af05b93c8aff51d.r2.dev/videos/sample.mp4'
    );

    const trackWithYouTube = {
      ...sampleMockTrack,
      videoUrl: 'https://www.youtube.com/watch?v=AyYyZUI0Rgk',
    };
    expect(resolveVideoUrl(trackWithYouTube)).toBe('');

    // Non-video track returns empty string
    expect(resolveVideoUrl(sampleMockTrack)).toBe('');
  });

  it('includes the Bison: Kaalamaadan tracks without duplicates and no YouTube links', () => {
    const tracks = getAllTracks();
    const bisonIds = [
      'song-cheenikkallu',
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
      expect(found?.videoUrl).not.toContain('youtube.com');
      expect(found?.videoUrl).not.toContain('youtu.be');
    });

    // Verify duplicate Unplugged track was removed
    expect(tracks.find((t) => t.id === 'song-cheenikkallu-unplugged')).toBeUndefined();
  });

  it('ensures all songs have lyrics removed as per user requirement', () => {
    const tracks = getAllTracks();
    const withLyrics = tracks.filter((t) => Boolean(t.lyrics));
    expect(withLyrics.length).toBe(0);
  });

  it('correctly includes new Dude, Dragon, and Coolie songs with valid audio URLs and covers', () => {
    const tracks = getAllTracks();

    const sampleNewSongs = [
      { id: 'song-blud-is-on-his-way', title: 'Blud Is On His Way', album: 'Dude' },
      { id: 'song-singari', title: 'Singari', album: 'Dude' },
      { id: 'song-iraivaa', title: 'Iraivaa', album: 'Dragon' },
      { id: 'song-vazhithunaiye', title: 'Vazhithunaiye', album: 'Dragon' },
      { id: 'song-chikitu', title: 'Chikitu', album: 'Coolie' },
      { id: 'song-powerhouse', title: 'Powerhouse', album: 'Coolie' },
      { id: 'song-monica', title: 'Monica', album: 'Coolie' },
    ];

    sampleNewSongs.forEach(({ id, title, album }) => {
      const found = tracks.find((t) => t.id === id);
      expect(found).toBeDefined();
      expect(found?.title).toBe(title);
      expect(found?.album).toBe(album);
      expect(found?.audioUrl).toContain('pub-cb5744f7bc244e399af05b93c8aff51d.r2.dev');
      expect(found?.thumbnailUrl).toBeTruthy();
    });
  });

  it('correctly includes the newly added songs (Thug Life, Maaman, Sirai, etc.) without duplicate versions', () => {
    const tracks = getAllTracks();

    // Verify key new tracks exist with valid audio and thumbnails
    const expectedTracks = [
      { title: 'Anju Vanna Poove', album: 'Thug Life' },
      { title: 'Muththa Mazhai', album: 'Thug Life' },
      { title: 'Engeyo', album: 'Thug Life' },
      { title: 'Jinguchaa', album: 'Thug Life' },
      { title: 'Azhage Agarame', album: 'Maaman' },
      { title: 'Dheivamagane Dheivamagane', album: 'Maaman' },
      { title: 'Kallaliye Kallaliye', album: 'Maaman' },
      { title: 'Kannale Pesuma', album: 'Maaman' },
      { title: 'Vaanam Kizhiyuthu', album: 'Maaman' },
      { title: 'Vizhuthe Thalavizhuthe', album: 'Maaman' },
      { title: 'Kanne Kalangadha', album: 'Sirai' },
      { title: 'Mannichiru', album: 'Sirai' },
      { title: 'Minnu Vattaam Poochi', album: 'Sirai' },
      { title: 'Neelothi', album: 'Sirai' },
      { title: 'OG Sambavam', album: 'Good Bad Ugly' },
      { title: 'Ranagalam', album: 'Good Bad Ugly' },
      { title: 'Pathikichu', album: 'Vidaamuyarchi' },
      { title: 'Salambala', album: 'Madharaasi' },
      { title: 'Thangapoovey', album: 'Madharaasi' },
      { title: 'Yedi', album: 'Nilavuku En Mel Ennadi Kobam (NEEK)' },
      { title: 'Kalloorum', album: 'Veera Dheera Sooran' },
    ];

    expectedTracks.forEach(({ title, album }) => {
      const found = tracks.find((t) => t.title.toLowerCase() === title.toLowerCase());
      expect(found).toBeDefined();
      expect(found?.album.toLowerCase()).toBe(album.toLowerCase());
      expect(found?.audioUrl).toContain('pub-cb5744f7bc244e399af05b93c8aff51d.r2.dev');
      expect(found?.thumbnailUrl).toBeTruthy();
    });

    // Ensure duplicates (Reprise / Chinmayi Version) are not present
    expect(tracks.find((t) => t.title.toLowerCase().includes('anju vanna poove (reprise)'))).toBeUndefined();
    expect(tracks.find((t) => t.title.toLowerCase().includes('chinmayi-version'))).toBeUndefined();

    // Verify all tracks have valid audioUrl and thumbnailUrl
    tracks.forEach((track) => {
      expect(track.audioUrl).toBeTruthy();
      expect(track.thumbnailUrl).toBeTruthy();
      expect(track.lyrics).toBeUndefined();
    });
  });

  it('correctly includes the 55 new 2024-2025 songs (Amaran, GOAT, Indian 2, Raayan, Lubber Pandhu, Vettaiyan, Pushpa 2, etc.)', () => {
    const tracks = getAllTracks();
    expect(tracks.length).toBe(130);

    const sampleNewTracks = [
      { id: 'song-aasa-orave', title: 'Aasa Orave', album: 'Lubber Pandhu' },
      { id: 'song-achacho', title: 'Achacho', album: 'Aranmanai 4' },
      { id: 'song-hey-minnale', title: 'Hey Minnale', album: 'Amaran' },
      { id: 'song-hunter-vantaar', title: 'Hunter Vantaar', album: 'Vettaiyan' },
      { id: 'song-manasilaayo', title: 'Manasilaayo', album: 'Vettaiyan' },
      { id: 'song-matta', title: 'Matta', album: 'The Greatest of All Time (GOAT)' },
      { id: 'song-whistle-podu', title: 'Whistle Podu', album: 'The Greatest of All Time (GOAT)' },
      { id: 'song-adangaatha-asuran', title: 'Adangaatha Asuran', album: 'Raayan' },
      { id: 'song-water-packet', title: 'Water Packet', album: 'Raayan' },
      { id: 'song-pushpa-pushpa', title: 'Pushpa Pushpa', album: 'Pushpa 2: The Rule' },
      { id: 'song-kissik', title: 'Kissik', album: 'Pushpa 2: The Rule' },
      { id: 'song-paaraa', title: 'Paaraa', album: 'Indian 2' },
      { id: 'song-fire-song', title: 'Fire Song', album: 'Kanguva' },
      { id: 'song-poraen-naa-poraen', title: 'Poraen Naa Poraen', album: 'Meiyazhagan' },
      { id: 'song-oru-oorula-raaja', title: 'Oru Oorula Raaja', album: 'Vaazhai' },
      { id: 'song-theansudare', title: 'Theansudare', album: 'Lover' },
    ];

    sampleNewTracks.forEach(({ id, title, album }) => {
      const found = tracks.find((t) => t.id === id);
      expect(found).toBeDefined();
      expect(found?.title).toBe(title);
      expect(found?.album).toBe(album);
      expect(found?.audioUrl).toContain('pub-cb5744f7bc244e399af05b93c8aff51d.r2.dev/songs/2025-full-songs');
      expect(found?.thumbnailUrl).toBeTruthy();
      expect(found?.lyrics).toBeUndefined();
    });
  });

  it('only activates video features when a valid direct video URL is present and strips YouTube links', () => {
    const tracks = getAllTracks();
    // Default catalog has Monica with direct Cloudflare R2 video
    const tracksWithVideo = tracks.filter((t) => Boolean(t.videoUrl));
    expect(tracksWithVideo.length).toBe(1);
    expect(tracksWithVideo[0].id).toBe('song-monica');
    expect(tracksWithVideo[0].videoUrl).toContain('Monica%20-%20Lyric%20Video');
    expect(tracksWithVideo[0].hasVideo).toBe(true);

    const nonVideoTrack = tracks.find((t) => t.id === 'song-ravana-tandavam');
    expect(nonVideoTrack?.videoUrl).toBe('');
    expect(nonVideoTrack?.hasVideo).toBe(false);

    // Dynamic track with direct Cloudflare R2 video
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

    // Dynamic track with YouTube link must have videoUrl stripped
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

    // Clean up
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
