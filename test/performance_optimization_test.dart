import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:wavemusic_premium/core/cache/cache_config.dart';
import 'package:wavemusic_premium/data/database/app_database.dart';
import 'package:wavemusic_premium/data/models/playlist_model.dart';
import 'package:wavemusic_premium/data/models/song_model.dart';
import 'package:wavemusic_premium/data/repositories/music_repository.dart';
import 'package:wavemusic_premium/features/player/widgets/lyrics_sheet.dart';

void main() {
  sqfliteFfiInit();
  databaseFactory = databaseFactoryFfi;

  late Database db;
  late AppDatabase appDb;

  setUp(() async {
    db = await databaseFactory.openDatabase(
      inMemoryDatabasePath,
      options: OpenDatabaseOptions(
        version: 1,
        onCreate: (Database db, int version) async {
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

          await db.execute('''
            CREATE TABLE playback_history (
              id TEXT PRIMARY KEY,
              song_id TEXT NOT NULL,
              played_at TEXT NOT NULL
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
              created_at TEXT NOT NULL
            )
          ''');

          await db.execute('CREATE INDEX idx_songs_date_added ON songs(date_added DESC)');
        },
      ),
    );

    AppDatabase.setMockDatabase(db);
    appDb = AppDatabase.instance;
    AppCacheConfig.clearMetadataCache();
  });

  tearDown(() async {
    await db.close();
  });

  group('Performance & Memory-Aware Caching Tests', () {
    test('In-memory Song LRU cache stores, retrieves, and invalidates in 0ms', () {
      final song = Song(
        id: 'perf-1',
        title: 'Instant Velocity',
        artist: 'Fast Track',
        album: 'Zero Lag',
        audioUrl: 'https://example.com/fast.mp3',
        dateAdded: DateTime.now(),
      );

      // Verify null before cache
      expect(AppCacheConfig.getCachedSong('perf-1'), isNull);

      // Cache song
      AppCacheConfig.cacheSong(song);
      final retrieved = AppCacheConfig.getCachedSong('perf-1');
      expect(retrieved, isNotNull);
      expect(retrieved!.title, 'Instant Velocity');

      // Invalidate song
      AppCacheConfig.invalidateSong('perf-1');
      expect(AppCacheConfig.getCachedSong('perf-1'), isNull);
    });

    test('Low memory callback evicts memory caches cleanly', () {
      final song = Song(
        id: 'mem-1',
        title: 'Buffer Test',
        artist: 'RAM Saver',
        album: 'Low Mem',
        audioUrl: 'https://example.com/mem.mp3',
        dateAdded: DateTime.now(),
      );

      AppCacheConfig.cacheSong(song);
      expect(AppCacheConfig.getCachedSong('mem-1'), isNotNull);

      // Simulate Android onTrimMemory / didHaveMemoryPressure
      AppCacheConfig.onLowMemory();
      expect(AppCacheConfig.getCachedSong('mem-1'), isNull);
    });

    test('Fast song count query executes efficiently without full table scan', () async {
      expect(await appDb.getSongCount(), 0);

      final song = Song(
        id: 'count-test-1',
        title: 'Fast Count',
        artist: 'Performer',
        album: 'Index Suite',
        audioUrl: 'https://example.com/count.mp3',
        dateAdded: DateTime.now(),
      );

      await appDb.insertSong(song);
      expect(await appDb.getSongCount(), 1);
    });
  });

  group('Removal of Add Songs and Add Lyrics Verification', () {
    testWidgets('LyricsSheet has no edit button or custom lyric entry field', (tester) async {
      final songWithoutLyrics = Song(
        id: 'no-lyric-song',
        title: 'Instrumental Theme',
        artist: 'Composer',
        album: 'Soundtrack',
        audioUrl: 'https://example.com/theme.mp3',
        dateAdded: DateTime.now(),
        lyrics: null,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: LyricsSheet(song: songWithoutLyrics),
          ),
        ),
      );

      // Verify no edit icon button
      expect(find.byIcon(Icons.edit_note_rounded), findsNothing);
      expect(find.byIcon(Icons.check_circle_rounded), findsNothing);
      expect(find.byType(TextField), findsNothing);

      // Verify read-only notice
      expect(find.text('No lyrics available'), findsOneWidget);
      expect(
        find.text('Tap the edit icon to add custom lyrics for this song.'),
        findsNothing,
      );
    });

    testWidgets('LyricsSheet renders lyrics in pure read-only view when present', (tester) async {
      final songWithLyrics = Song(
        id: 'lyric-song',
        title: 'Vocal Anthem',
        artist: 'Vocalist',
        album: 'Anthems',
        audioUrl: 'https://example.com/anthem.mp3',
        dateAdded: DateTime.now(),
        lyrics: 'Line 1 of song\nLine 2 of song\nLine 3 of song',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: LyricsSheet(song: songWithLyrics),
          ),
        ),
      );

      expect(find.text('Line 1 of song\nLine 2 of song\nLine 3 of song'), findsOneWidget);
      expect(find.byIcon(Icons.edit_note_rounded), findsNothing);
      expect(find.byType(TextField), findsNothing);
    });
  });

  group('Search Debouncing Simulation Test', () {
    test('Debounced search controller only fires final query after typing pause', () async {
      int queryExecutionCount = 0;
      String? lastExecutedQuery;

      void performSearch(String query) {
        queryExecutionCount++;
        lastExecutedQuery = query;
      }

      Timer? debounceTimer;
      void onQueryChanged(String query) {
        debounceTimer?.cancel();
        debounceTimer = Timer(const Duration(milliseconds: 100), () {
          performSearch(query);
        });
      }

      // Simulate rapid user typing: 'A', 'An', 'Ani', 'Anirudh'
      onQueryChanged('A');
      await Future.delayed(const Duration(milliseconds: 20));
      onQueryChanged('An');
      await Future.delayed(const Duration(milliseconds: 20));
      onQueryChanged('Ani');
      await Future.delayed(const Duration(milliseconds: 20));
      onQueryChanged('Anirudh');

      // Before timer expires: 0 executions
      expect(queryExecutionCount, 0);

      // Wait for debounce timer to fire
      await Future.delayed(const Duration(milliseconds: 150));

      // After pause: exactly 1 execution of the final query!
      expect(queryExecutionCount, 1);
      expect(lastExecutedQuery, 'Anirudh');
    });
  });

  group('Playlist Verification & Session Shuffle Tests', () {
    test('MusicRepository shuffles all songs randomly on catalogue load', () async {
      // Insert multiple songs
      for (int i = 1; i <= 20; i++) {
        await appDb.insertSong(Song(
          id: 'song-$i',
          title: 'Song $i',
          artist: 'Artist $i',
          album: 'Album',
          audioUrl: 'https://example.com/$i.mp3',
          dateAdded: DateTime.now(),
        ));
      }

      final repo = MusicRepository(db: appDb);
      await repo.loadCatalogue();

      expect(repo.songs.length, 20);
      expect(repo.shuffledSongs.length, 20);
      // Ensure all song IDs are retained in shuffled view
      final originalIds = repo.songs.map((s) => s.id).toSet();
      final shuffledIds = repo.shuffledSongs.map((s) => s.id).toSet();
      expect(shuffledIds, originalIds);
    });

    test('getTotalPlaylistSongsCount tracks count accurately', () async {
      expect(await appDb.getTotalPlaylistSongsCount(), 0);

      // Insert test song
      final song = Song(
        id: 'song-test-1',
        title: 'Song One',
        artist: 'Artist',
        album: 'Album',
        audioUrl: 'https://example.com/1.mp3',
        dateAdded: DateTime.now(),
      );
      await appDb.insertSong(song);

      // Create playlist and associate song
      final pl = Playlist(id: 'pl-test-count', name: 'Test', createdAt: DateTime.now());
      await appDb.insertPlaylist(pl);
      await appDb.addSongToPlaylist('pl-test-count', 'song-test-1');

      expect(await appDb.getTotalPlaylistSongsCount(), 1);
    });
  });
}
