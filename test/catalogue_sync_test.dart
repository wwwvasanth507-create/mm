import 'package:flutter_test/flutter_test.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:wavemusic_premium/data/database/app_database.dart';
import 'package:wavemusic_premium/data/models/song_model.dart';

void main() {
  setUpAll(() {
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  });

  group('Catalogue Sync & Temp Song Removal Tests', () {
    late Database db;

    setUp(() async {
      db = await openDatabase(
        inMemoryDatabasePath,
        version: 1,
        onCreate: (db, version) async {
          await db.execute('''
            CREATE TABLE songs (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              artist TEXT NOT NULL,
              album TEXT NOT NULL,
              release_year INTEGER,
              thumbnail_url TEXT,
              audio_url TEXT NOT NULL,
              description TEXT,
              date_added TEXT NOT NULL,
              is_favorite INTEGER NOT NULL DEFAULT 0,
              is_downloaded INTEGER NOT NULL DEFAULT 0,
              local_file_path TEXT,
              duration_ms INTEGER,
              lyrics TEXT,
              video_url TEXT,
              genre TEXT
            )
          ''');
          await db.execute('''
            CREATE TABLE playlists (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              description TEXT,
              thumbnail_url TEXT,
              created_at TEXT NOT NULL
            )
          ''');
          await db.execute('''
            CREATE TABLE playlist_songs (
              playlist_id TEXT NOT NULL,
              song_id TEXT NOT NULL,
              position INTEGER NOT NULL,
              PRIMARY KEY (playlist_id, song_id)
            )
          ''');
        },
      );
      AppDatabase.setMockDatabase(db);
    });

    tearDown(() async {
      await db.close();
    });

    test('removeTempTestSongs cleans starter SoundHelix tracks', () async {
      // Seed temporary test songs
      await db.insert('songs', {
        'id': 'wave-starter-1',
        'title': 'SoundHelix Song 1',
        'artist': 'SoundHelix Ensemble',
        'album': 'Algorithmic Soundscapes',
        'audio_url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        'date_added': DateTime.now().toIso8601String(),
      });
      await db.insert('songs', {
        'id': 'song-ravana-tandavam',
        'title': 'Ravana Tandavam',
        'artist': 'A.R. Rahman',
        'album': 'Ramayana',
        'audio_url': 'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/Ravana%20Tandavam.mp3',
        'date_added': DateTime.now().toIso8601String(),
      });

      // Verify 2 songs initially
      final initialSongs = await db.query('songs');
      expect(initialSongs.length, 2);

      // Call cleanup
      await AppDatabase.instance.removeTempTestSongs(db);

      // Verify only legitimate song remains
      final remainingSongs = await db.query('songs');
      expect(remainingSongs.length, 1);
      expect(remainingSongs.first['id'], 'song-ravana-tandavam');
      expect(remainingSongs.first['title'], 'Ravana Tandavam');
    });

    test('Song.fromJson parses repo music.json format', () {
      final json = {
        'id': 'song-anthaathi',
        'title': 'Anthaathi',
        'artist': 'Govind Vasantha, Chinmayi Sripaada',
        'album': '96',
        'year': 2018,
        'duration': 435,
        'audioUrl': 'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/Anthaathi.mp3',
        'thumbnailUrl': '/covers/anthaathi.jpg',
        'description': 'Anthaathi from 96',
        'language': 'Tamil',
        'isExplicit': false
      };

      final song = Song.fromJson(json);
      expect(song.id, 'song-anthaathi');
      expect(song.title, 'Anthaathi');
      expect(song.artist, 'Govind Vasantha, Chinmayi Sripaada');
      expect(song.album, '96');
      expect(song.releaseYear, 2018);
      expect(song.durationMs, 435000);
      expect(song.audioUrl, 'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/Anthaathi.mp3');
    });

    test('upsertSongs updates metadata and preserves favorites and downloads', () async {
      final song1 = Song(
        id: 'track-1',
        title: 'Original Title',
        artist: 'Original Artist',
        album: 'Album 1',
        audioUrl: 'https://example.com/audio1.mp3',
        dateAdded: DateTime.now(),
        isFavorite: true,
        isDownloaded: true,
        localFilePath: '/storage/track-1.mp3',
      );
      await db.insert('songs', song1.toMap());

      // Remote update arrives with new title/artist/audioUrl
      final updatedSong = Song(
        id: 'track-1',
        title: 'Updated Title',
        artist: 'Updated Artist',
        album: 'Updated Album',
        audioUrl: 'https://example.com/audio1-v2.mp3',
        dateAdded: DateTime.now(),
      );

      await AppDatabase.instance.upsertSongs([updatedSong]);

      final queried = await AppDatabase.instance.getSongById('track-1');
      expect(queried, isNotNull);
      expect(queried!.title, 'Updated Title');
      expect(queried.artist, 'Updated Artist');
      expect(queried.audioUrl, 'https://example.com/audio1-v2.mp3');
      // Preserved user state
      expect(queried.isFavorite, true);
      expect(queried.isDownloaded, true);
      expect(queried.localFilePath, '/storage/track-1.mp3');
    });

    test('upsertPlaylistsWithTrackIds synchronizes playlists and maps track associations', () async {
      // 1. Seed two test songs
      final songA = Song(
        id: 'song-a',
        title: 'Song Alpha',
        artist: 'Artist One',
        album: 'Album A',
        audioUrl: 'https://example.com/a.mp3',
        dateAdded: DateTime.now(),
      );
      final songB = Song(
        id: 'song-b',
        title: 'Song Beta',
        artist: 'Artist Two',
        album: 'Album B',
        audioUrl: 'https://example.com/b.mp3',
        dateAdded: DateTime.now(),
      );
      await AppDatabase.instance.upsertSongs([songA, songB]);

      // 2. Upsert playlist with trackIds (like music.json format)
      final rawPlaylists = [
        {
          'id': 'playlist-test-hits',
          'name': 'Test Hits',
          'description': 'A curated collection of top tracks',
          'coverUrl': 'https://example.com/cover.jpg',
          'trackIds': ['song-a', 'song-b'],
          'createdAt': '2025-01-01T00:00:00Z',
        }
      ];

      await AppDatabase.instance.upsertPlaylistsWithTrackIds(rawPlaylists);

      // 3. Verify playlist exists with songCount = 2
      final playlists = await AppDatabase.instance.getAllPlaylists();
      expect(playlists.length, 1);
      expect(playlists.first.id, 'playlist-test-hits');
      expect(playlists.first.name, 'Test Hits');
      expect(playlists.first.songCount, 2);

      // 4. Verify ordered playlist songs
      final playlistSongs = await AppDatabase.instance.getPlaylistSongs('playlist-test-hits');
      expect(playlistSongs.length, 2);
      expect(playlistSongs[0].id, 'song-a');
      expect(playlistSongs[1].id, 'song-b');
    });
  });
}
