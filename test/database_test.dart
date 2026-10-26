import 'package:flutter_test/flutter_test.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:wavemusic_premium/data/database/app_database.dart';
import 'package:wavemusic_premium/data/models/song_model.dart';
import 'package:wavemusic_premium/data/models/playlist_model.dart';

void main() {
  // Initialize ffi for running sqlite tests on desktop / CLI
  sqfliteFfiInit();
  databaseFactory = databaseFactoryFfi;

  late Database db;
  late AppDatabase appDb;

  setUp(() async {
    // Open an in-memory database for testing
    db = await databaseFactory.openDatabase(
      inMemoryDatabasePath,
      options: OpenDatabaseOptions(
        version: 1,
        onCreate: (Database db, int version) async {
          // Create tables
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
              PRIMARY KEY (playlist_id, song_id),
              FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE,
              FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE CASCADE
            )
          ''');

          await db.execute('''
            CREATE TABLE playback_history (
              id TEXT PRIMARY KEY,
              song_id TEXT NOT NULL,
              played_at TEXT NOT NULL,
              FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE CASCADE
            )
          ''');

          await db.execute('''
            CREATE TABLE downloads (
              id TEXT PRIMARY KEY,
              song_id TEXT NOT NULL,
              download_url TEXT NOT NULL,
              local_path TEXT NOT NULL,
              status TEXT NOT NULL,
              progress REAL NOT NULL DEFAULT 0,
              file_size_bytes INTEGER NOT NULL DEFAULT 0,
              error_message TEXT,
              created_at TEXT NOT NULL,
              FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE CASCADE
            )
          ''');

          await db.execute('''
            CREATE TABLE settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            )
          ''');
        },
      ),
    );

    AppDatabase.setMockDatabase(db);
    appDb = AppDatabase.instance;
  });

  tearDown(() async {
    await db.close();
  });

  group('Database CRUD & Relations Tests', () {
    test('Insert, read, update, and delete song', () async {
      final now = DateTime.now();
      final newSong = Song(
        id: 'test-song-1',
        title: 'Cyber Mirage',
        artist: 'Waveform',
        album: 'Neon Horizon',
        releaseYear: 2026,
        audioUrl: 'https://example.com/audio1.mp3',
        dateAdded: now,
        isFavorite: false,
      );

      // Insert
      await appDb.insertSong(newSong);

      // Read
      final fetched = await appDb.getSongById('test-song-1');
      expect(fetched, isNotNull);
      expect(fetched!.title, 'Cyber Mirage');
      expect(fetched.artist, 'Waveform');
      expect(fetched.isFavorite, false);

      // Update favorite status
      await appDb.toggleFavorite('test-song-1', true);
      final updated = await appDb.getSongById('test-song-1');
      expect(updated!.isFavorite, true);

      // Check favorite songs query
      final favorites = await appDb.getFavoriteSongs();
      expect(favorites.length, 1);
      expect(favorites.first.id, 'test-song-1');

      // Delete song
      await appDb.deleteSong('test-song-1');
      final afterDelete = await appDb.getSongById('test-song-1');
      expect(afterDelete, isNull);
    });

    test('Playlist creation, adding songs, and retrieving playlist songs', () async {
      final now = DateTime.now();
      // Insert 2 test songs
      final song1 = Song(
        id: 'song-1',
        title: 'Song One',
        artist: 'Artist One',
        album: 'Album One',
        releaseYear: 2025,
        audioUrl: 'https://example.com/1.mp3',
        dateAdded: now,
      );
      final song2 = Song(
        id: 'song-2',
        title: 'Song Two',
        artist: 'Artist Two',
        album: 'Album Two',
        releaseYear: 2025,
        audioUrl: 'https://example.com/2.mp3',
        dateAdded: now,
      );
      await appDb.insertSong(song1);
      await appDb.insertSong(song2);

      // Create playlist
      final playlist = Playlist(
        id: 'playlist-1',
        name: 'Chill Vibes',
        description: 'Late night coding vibes',
        createdAt: DateTime.now(),
      );
      await appDb.insertPlaylist(playlist);

      // Add songs to playlist
      await appDb.addSongToPlaylist('playlist-1', 'song-1');
      await appDb.addSongToPlaylist('playlist-1', 'song-2');

      // Verify playlist songs
      final pSongs = await appDb.getPlaylistSongs('playlist-1');
      expect(pSongs.length, 2);
      expect(pSongs[0].id, 'song-1');
      expect(pSongs[1].id, 'song-2');

      // Remove a song from playlist
      await appDb.removeSongFromPlaylist('playlist-1', 'song-1');
      final remaining = await appDb.getPlaylistSongs('playlist-1');
      expect(remaining.length, 1);
      expect(remaining.first.id, 'song-2');

      // The underlying song in catalogue is NOT deleted
      final songStillInCatalogue = await appDb.getSongById('song-1');
      expect(songStillInCatalogue, isNotNull);
    });

    test('Playback history recording and duplicate-free ordering', () async {
      final song = Song(
        id: 'hist-song-1',
        title: 'History Track',
        artist: 'History Artist',
        album: 'History Album',
        releaseYear: 2024,
        audioUrl: 'https://example.com/hist.mp3',
        dateAdded: DateTime.now(),
      );
      await appDb.insertSong(song);

      // Record first play
      await appDb.recordPlayback('hist-song-1');
      // Record second play
      await appDb.recordPlayback('hist-song-1');

      final history = await appDb.getRecentlyPlayed();
      // Should deduplicate and return unique song
      expect(history.length, 1);
      expect(history.first.id, 'hist-song-1');

      // Clear history
      await appDb.clearHistory();
      final afterClear = await appDb.getRecentlyPlayed();
      expect(afterClear.isEmpty, true);
    });
  });
}
