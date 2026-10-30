import 'dart:async';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';
import '../models/song_model.dart';
import '../models/playlist_model.dart';
import '../models/download_item_model.dart';
import '../../core/cache/cache_config.dart';

class AppDatabase {
  static final AppDatabase instance = AppDatabase._init();
  static Database? _database;

  AppDatabase._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('wavemusic_premium.db');
    return _database!;
  }

  /// For unit testing with mock / custom database instances
  static void setMockDatabase(Database db) {
    _database = db;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
      onConfigure: _onConfigure,
      onOpen: (db) async {
        try {
          await db.execute('ALTER TABLE songs ADD COLUMN video_url TEXT');
        } catch (_) {}
        try {
          await db.execute('ALTER TABLE songs ADD COLUMN genre TEXT');
        } catch (_) {}
        await removeTempTestSongs(db);
      },
    );
  }

  Future<void> _onConfigure(Database db) async {
    await db.execute('PRAGMA foreign_keys = ON');
    try {
      await db.execute('PRAGMA journal_mode = WAL');
      await db.execute('PRAGMA synchronous = NORMAL');
      await db.execute('PRAGMA cache_size = -2000');
      await db.execute('PRAGMA temp_store = MEMORY');
    } catch (_) {}
  }

  Future<void> _createDB(Database db, int version) async {
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

    // Create indexes for fast query performance
    await db.execute('CREATE INDEX idx_songs_title ON songs(title)');
    await db.execute('CREATE INDEX idx_songs_artist ON songs(artist)');
    await db.execute('CREATE INDEX idx_songs_album ON songs(album)');
    await db.execute('CREATE INDEX idx_songs_fav ON songs(is_favorite)');
    await db.execute('CREATE INDEX idx_songs_dl ON songs(is_downloaded)');
    await db.execute('CREATE INDEX idx_songs_date_added ON songs(date_added DESC)');
    await db.execute('CREATE INDEX idx_playlist_songs_pos ON playlist_songs(playlist_id, position)');
    await db.execute('CREATE INDEX idx_history_played ON playback_history(played_at DESC)');

  }

  /// Removes temporary demo/test songs from the database
  Future<void> removeTempTestSongs([Database? customDb]) async {
    final db = customDb ?? await database;
    try {
      await db.delete(
        'songs',
        where: "id LIKE 'wave-starter-%' OR title LIKE '%SoundHelix%' OR artist LIKE '%SoundHelix%'",
      );
      await db.delete('playlists', where: "id = 'pl-favorites-starter'");
    } catch (_) {}
  }

  /// Upserts songs received from the remote catalogue or bundled manifest.
  /// Preserves is_favorite, is_downloaded, and local_file_path if the song already exists.
  Future<void> upsertSongs(List<Song> songs) async {
    final db = await database;
    final batch = db.batch();
    for (final song in songs) {
      batch.rawInsert('''
        INSERT INTO songs (
          id, title, artist, album, release_year, thumbnail_url,
          audio_url, description, date_added, is_favorite, is_downloaded,
          local_file_path, duration_ms, lyrics, video_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          artist = excluded.artist,
          album = excluded.album,
          release_year = excluded.release_year,
          thumbnail_url = excluded.thumbnail_url,
          audio_url = excluded.audio_url,
          description = excluded.description,
          duration_ms = excluded.duration_ms,
          lyrics = excluded.lyrics,
          video_url = excluded.video_url
      ''', [
        song.id,
        song.title,
        song.artist,
        song.album,
        song.releaseYear,
        song.thumbnailUrl,
        song.audioUrl,
        song.description,
        song.dateAdded.toIso8601String(),
        song.isFavorite ? 1 : 0,
        song.isDownloaded ? 1 : 0,
        song.localFilePath,
        song.durationMs,
        song.lyrics,
        song.videoUrl,
      ]);
    }
    await batch.commit(noResult: true);
  }

  // ==================== SONG OPERATIONS ====================

  Future<int> getSongCount() async {
    final db = await database;
    final results = await db.rawQuery('SELECT COUNT(*) as count FROM songs');
    return Sqflite.firstIntValue(results) ?? 0;
  }

  Future<int> insertSong(Song song) async {
    final db = await database;
    AppCacheConfig.cacheSong(song);
    return await db.insert('songs', song.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<int> updateSong(Song song) async {
    final db = await database;
    AppCacheConfig.cacheSong(song);
    return await db.update('songs', song.toMap(), where: 'id = ?', whereArgs: [song.id]);
  }

  Future<int> deleteSong(String id) async {
    final db = await database;
    AppCacheConfig.invalidateSong(id);
    return await db.transaction((txn) async {
      await txn.delete('playlist_songs', where: 'song_id = ?', whereArgs: [id]);
      await txn.delete('playback_history', where: 'song_id = ?', whereArgs: [id]);
      await txn.delete('downloads', where: 'song_id = ?', whereArgs: [id]);
      return await txn.delete('songs', where: 'id = ?', whereArgs: [id]);
    });
  }

  Future<Song?> getSongById(String id) async {
    final cached = AppCacheConfig.getCachedSong(id);
    if (cached != null) return cached;

    final db = await database;
    final results = await db.query('songs', where: 'id = ?', whereArgs: [id]);
    if (results.isNotEmpty) {
      final song = Song.fromMap(results.first);
      AppCacheConfig.cacheSong(song);
      return song;
    }
    return null;
  }

  Future<List<Song>> getAllSongs() async {
    final db = await database;
    final results = await db.query('songs', orderBy: 'date_added DESC');
    final songs = results.map((e) => Song.fromMap(e)).toList();
    AppCacheConfig.cacheSongs(songs);
    return songs;
  }

  Future<List<Song>> getFavoriteSongs() async {
    final db = await database;
    final results = await db.query('songs', where: 'is_favorite = 1', orderBy: 'date_added DESC');
    return results.map((e) => Song.fromMap(e)).toList();
  }

  Future<List<Song>> getDownloadedSongs() async {
    final db = await database;
    final results = await db.query('songs', where: 'is_downloaded = 1', orderBy: 'date_added DESC');
    return results.map((e) => Song.fromMap(e)).toList();
  }

  Future<List<Song>> searchSongs(String query) async {
    final db = await database;
    final q = '%${query.trim().toLowerCase()}%';
    final results = await db.rawQuery('''
      SELECT * FROM songs 
      WHERE LOWER(title) LIKE ? 
         OR LOWER(artist) LIKE ? 
         OR LOWER(album) LIKE ?
      ORDER BY title ASC
    ''', [q, q, q]);
    return results.map((e) => Song.fromMap(e)).toList();
  }

  Future<void> toggleFavorite(String songId, bool isFavorite) async {
    AppCacheConfig.invalidateSong(songId);
    final db = await database;
    await db.update(
      'songs',
      {'is_favorite': isFavorite ? 1 : 0},
      where: 'id = ?',
      whereArgs: [songId],
    );
  }

  Future<void> updateDownloadStatus(String songId, bool isDownloaded, String? localFilePath) async {
    AppCacheConfig.invalidateSong(songId);
    final db = await database;
    await db.update(
      'songs',
      {
        'is_downloaded': isDownloaded ? 1 : 0,
        'local_file_path': localFilePath,
      },
      where: 'id = ?',
      whereArgs: [songId],
    );
  }

  Future<void> updateSongLyrics(String songId, String lyrics) async {
    AppCacheConfig.invalidateSong(songId);
    final db = await database;
    await db.update(
      'songs',
      {'lyrics': lyrics},
      where: 'id = ?',
      whereArgs: [songId],
    );
  }

  // ==================== PLAYLIST OPERATIONS ====================

  Future<int> getPlaylistCount() async {
    final db = await database;
    final results = await db.rawQuery('SELECT COUNT(*) as count FROM playlists');
    return Sqflite.firstIntValue(results) ?? 0;
  }

  Future<int> getTotalPlaylistSongsCount() async {
    final db = await database;
    final results = await db.rawQuery('SELECT COUNT(*) as count FROM playlist_songs');
    return Sqflite.firstIntValue(results) ?? 0;
  }

  /// Upserts playlists and maps their track IDs into playlist_songs
  Future<void> upsertPlaylistsWithTrackIds(List<Map<String, dynamic>> rawPlaylists) async {
    final db = await database;
    await db.transaction((txn) async {
      for (final p in rawPlaylists) {
        final id = (p['id'] as String?)?.trim() ?? 'playlist-${DateTime.now().millisecondsSinceEpoch}';
        final name = (p['name'] as String?)?.trim() ?? 'Untitled Playlist';
        final description = (p['description'] as String?)?.trim();
        final thumbnailUrl = (p['thumbnailUrl'] ?? p['coverUrl'] ?? p['thumbnail_url']) as String?;
        final createdAtStr = p['createdAt'] ?? p['created_at'] ?? DateTime.now().toIso8601String();

        await txn.rawInsert('''
          INSERT INTO playlists (id, name, description, thumbnail_url, created_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            description = excluded.description,
            thumbnail_url = excluded.thumbnail_url
        ''', [id, name, description, thumbnailUrl, createdAtStr]);

        final trackIds = (p['trackIds'] ?? p['songIds']) as List<dynamic>?;
        if (trackIds != null && trackIds.isNotEmpty) {
          await txn.delete('playlist_songs', where: 'playlist_id = ?', whereArgs: [id]);
          for (int i = 0; i < trackIds.length; i++) {
            final songId = trackIds[i].toString().trim();
            final songExists = await txn.rawQuery(
              'SELECT id FROM songs WHERE LOWER(id) = LOWER(?) LIMIT 1',
              [songId],
            );
            if (songExists.isNotEmpty) {
              final actualSongId = songExists.first['id'] as String;
              await txn.insert(
                'playlist_songs',
                {
                  'playlist_id': id,
                  'song_id': actualSongId,
                  'position': i,
                },
                conflictAlgorithm: ConflictAlgorithm.replace,
              );
            }
          }
        }
      }
    });
  }

  Future<int> insertPlaylist(Playlist playlist) async {
    final db = await database;
    return await db.insert('playlists', playlist.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<int> updatePlaylist(Playlist playlist) async {
    final db = await database;
    return await db.update('playlists', playlist.toMap(), where: 'id = ?', whereArgs: [playlist.id]);
  }

  Future<int> deletePlaylist(String id) async {
    final db = await database;
    return await db.transaction((txn) async {
      await txn.delete('playlist_songs', where: 'playlist_id = ?', whereArgs: [id]);
      return await txn.delete('playlists', where: 'id = ?', whereArgs: [id]);
    });
  }

  Future<List<Playlist>> getAllPlaylists() async {
    final db = await database;
    final results = await db.rawQuery('''
      SELECT p.*, 
             COUNT(ps.song_id) as song_count,
             COALESCE(
               NULLIF(p.thumbnail_url, ''),
               (
                 SELECT s.thumbnail_url 
                 FROM songs s 
                 INNER JOIN playlist_songs ps2 ON s.id = ps2.song_id 
                 WHERE ps2.playlist_id = p.id 
                 ORDER BY ps2.position ASC 
                 LIMIT 1
               )
             ) as resolved_thumbnail
      FROM playlists p
      LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    ''');
    return results.map((e) => Playlist.fromMap(e)).toList();
  }

  Future<List<Song>> getPlaylistSongs(String playlistId) async {
    final db = await database;
    final results = await db.rawQuery('''
      SELECT s.* 
      FROM songs s
      INNER JOIN playlist_songs ps ON s.id = ps.song_id
      WHERE ps.playlist_id = ?
      ORDER BY ps.position ASC
    ''', [playlistId]);
    return results.map((e) => Song.fromMap(e)).toList();
  }

  Future<void> addSongToPlaylist(String playlistId, String songId) async {
    final db = await database;
    await db.transaction((txn) async {
      final maxPosResult = await txn.rawQuery(
        'SELECT MAX(position) as max_pos FROM playlist_songs WHERE playlist_id = ?',
        [playlistId],
      );
      final maxPos = (maxPosResult.first['max_pos'] as int?) ?? -1;
      await txn.insert(
        'playlist_songs',
        {
          'playlist_id': playlistId,
          'song_id': songId,
          'position': maxPos + 1,
        },
        conflictAlgorithm: ConflictAlgorithm.ignore,
      );
    });
  }

  Future<void> removeSongFromPlaylist(String playlistId, String songId) async {
    final db = await database;
    await db.delete(
      'playlist_songs',
      where: 'playlist_id = ? AND song_id = ?',
      whereArgs: [playlistId, songId],
    );
  }

  Future<void> reorderPlaylistSongs(String playlistId, List<String> songIds) async {
    final db = await database;
    await db.transaction((txn) async {
      for (int i = 0; i < songIds.length; i++) {
        await txn.update(
          'playlist_songs',
          {'position': i},
          where: 'playlist_id = ? AND song_id = ?',
          whereArgs: [playlistId, songIds[i]],
        );
      }
    });
  }

  // ==================== HISTORY OPERATIONS ====================

  Future<void> recordPlayback(String songId) async {
    final db = await database;
    await db.transaction((txn) async {
      // Remove previous duplicate entry to keep history clean and ordered
      await txn.delete('playback_history', where: 'song_id = ?', whereArgs: [songId]);
      await txn.insert('playback_history', {
        'id': '${songId}_${DateTime.now().millisecondsSinceEpoch}',
        'song_id': songId,
        'played_at': DateTime.now().toIso8601String(),
      });
    });
  }

  Future<List<Song>> getRecentlyPlayed({int limit = 20}) async {
    final db = await database;
    final results = await db.rawQuery('''
      SELECT s.*
      FROM songs s
      INNER JOIN playback_history h ON s.id = h.song_id
      ORDER BY h.played_at DESC
      LIMIT ?
    ''', [limit]);
    return results.map((e) => Song.fromMap(e)).toList();
  }

  Future<void> clearHistory() async {
    final db = await database;
    await db.delete('playback_history');
  }

  // ==================== DOWNLOAD OPERATIONS ====================

  Future<void> saveDownloadItem(DownloadItem item) async {
    final db = await database;
    await db.insert('downloads', item.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> updateDownloadProgress(String id, double progress, DownloadStatus status, {int? fileSize}) async {
    final db = await database;
    final values = <String, dynamic>{
      'progress': progress,
      'status': status.name,
    };
    if (fileSize != null) {
      values['file_size_bytes'] = fileSize;
    }
    await db.update('downloads', values, where: 'id = ?', whereArgs: [id]);
  }

  Future<void> deleteDownloadItem(String songId) async {
    final db = await database;
    await db.delete('downloads', where: 'song_id = ?', whereArgs: [songId]);
  }

  Future<List<DownloadItem>> getAllDownloads() async {
    final db = await database;
    final results = await db.query('downloads', orderBy: 'created_at DESC');
    return results.map((e) => DownloadItem.fromMap(e)).toList();
  }

  // ==================== SETTINGS OPERATIONS ====================

  Future<void> setSetting(String key, String value) async {
    final db = await database;
    await db.insert('settings', {'key': key, 'value': value}, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<String?> getSetting(String key) async {
    final db = await database;
    final results = await db.query('settings', where: 'key = ?', whereArgs: [key]);
    if (results.isNotEmpty) {
      return results.first['value'] as String?;
    }
    return null;
  }
}
