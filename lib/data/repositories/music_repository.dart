import 'dart:io';
import 'dart:math';
import 'package:flutter/foundation.dart';
import '../database/app_database.dart';
import '../models/song_model.dart';
import '../models/playlist_model.dart';
import '../services/catalogue_sync_service.dart';

class MusicRepository extends ChangeNotifier {
  final AppDatabase _db;
  final CatalogueSyncService _syncService;

  List<Song> _songs = [];
  List<Song> _shuffledSongs = [];
  List<Song> _favoriteSongs = [];
  List<Song> _downloadedSongs = [];
  List<Song> _recentSongs = [];
  List<Playlist> _playlists = [];
  bool _isLoading = false;
  String? _error;

  MusicRepository({AppDatabase? db, CatalogueSyncService? syncService})
      : _db = db ?? AppDatabase.instance,
        _syncService = syncService ??
            CatalogueSyncService(db: db ?? AppDatabase.instance);

  final Set<String> _favoriteIds = {};

  List<Song> get songs => _songs;
  List<Song> get shuffledSongs => _shuffledSongs.isNotEmpty ? _shuffledSongs : _songs;
  List<Song> get favoriteSongs => _favoriteSongs;
  List<Song> get downloadedSongs => _downloadedSongs;
  List<Song> get recentSongs => _recentSongs;
  List<Playlist> get playlists => _playlists;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Optimized initial boot sequence:
  /// 1. Fast count check: If DB has songs and playlist songs, skip redundant JSON parse!
  /// 2. If DB is empty or playlist songs are missing, seed from bundled assets/data/music.json.
  /// 3. Parallel async database loading via Future.wait.
  /// 4. Defer remote GitHub sync to not block UI rendering.
  Future<void> initializeAndSync() async {
    try {
      final count = await _db.getSongCount();
      final totalPlaylistSongs = await _db.getTotalPlaylistSongsCount();
      if (count == 0 || totalPlaylistSongs == 0) {
        await _db.removeTempTestSongs();
        final bundledSongs = await _syncService.loadBundledCatalogue();
        if (bundledSongs.isNotEmpty) {
          await _db.upsertSongs(bundledSongs);
        }
      }
    } catch (_) {
      // In case of error, attempt loading bundled
      final bundledSongs = await _syncService.loadBundledCatalogue();
      if (bundledSongs.isNotEmpty) {
        await _db.upsertSongs(bundledSongs);
      }
    }

    await loadCatalogue();

    // Defer background remote GitHub sync so cold start is instantaneous
    Future.delayed(const Duration(seconds: 3), () {
      syncWithRemoteCatalogue().catchError((e) {
        debugPrint('[MusicRepository] Background remote sync notice: $e');
      });
    });
  }

  /// Explicitly sync with remote repository (e.g. on pull-to-refresh)
  Future<void> syncWithRemoteCatalogue() async {
    await _db.removeTempTestSongs();
    await _syncService.fetchRemoteCatalogue();
    await loadCatalogue();
  }

  /// Load all catalogue data from database using parallel execution
  Future<void> loadCatalogue() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _db.getAllSongs(),
        _db.getFavoriteSongs(),
        _db.getDownloadedSongs(),
        _db.getRecentlyPlayed(),
        _db.getAllPlaylists(),
      ]);

      _songs = results[0] as List<Song>;
      _favoriteSongs = results[1] as List<Song>;
      _downloadedSongs = results[2] as List<Song>;
      _recentSongs = results[3] as List<Song>;
      _playlists = results[4] as List<Playlist>;

      // Randomly shuffle all songs freshly for this session
      _shuffledSongs = List<Song>.from(_songs)..shuffle(Random());

      // Auto-repair: If playlists exist but have 0 tracks, populate from bundled catalogue
      final totalSongsInPlaylists = _playlists.fold<int>(0, (sum, p) => sum + p.songCount);
      if (totalSongsInPlaylists == 0 && _songs.isNotEmpty) {
        await _syncService.loadBundledCatalogue();
        _playlists = await _db.getAllPlaylists();
      }

      _favoriteIds.clear();
      for (final s in _favoriteSongs) {
        _favoriteIds.add(s.id);
      }

      // Asynchronously verify downloaded files exist on disk without blocking UI
      _verifyDownloadedFilesAsync();
    } catch (e) {
      _error = 'Failed to load music catalogue: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void _verifyDownloadedFilesAsync() {
    Future.microtask(() async {
      bool changed = false;
      for (final song in _downloadedSongs) {
        if (song.localFilePath != null) {
          final file = File(song.localFilePath!);
          if (!await file.exists()) {
            await _db.updateDownloadStatus(song.id, false, null);
            changed = true;
          }
        }
      }
      if (changed) {
        _downloadedSongs = await _db.getDownloadedSongs();
        notifyListeners();
      }
    });
  }

  Future<void> addSong(Song song) async {
    try {
      await _db.insertSong(song);
      await loadCatalogue();
    } catch (e) {
      _error = 'Failed to add song: $e';
      notifyListeners();
      rethrow;
    }
  }

  Future<void> updateSong(Song song) async {
    try {
      await _db.updateSong(song);
      await loadCatalogue();
    } catch (e) {
      _error = 'Failed to update song: $e';
      notifyListeners();
      rethrow;
    }
  }

  Future<void> deleteSong(String songId, {bool deleteLocalFile = true}) async {
    try {
      final song = await _db.getSongById(songId);
      if (song != null && deleteLocalFile && song.localFilePath != null) {
        final file = File(song.localFilePath!);
        if (await file.exists()) {
          try {
            await file.delete();
          } catch (_) {}
        }
      }
      await _db.deleteSong(songId);
      await loadCatalogue();
    } catch (e) {
      _error = 'Failed to delete song: $e';
      notifyListeners();
      rethrow;
    }
  }

  bool isFavorite(String songId) {
    return _favoriteIds.contains(songId);
  }

  Future<void> toggleFavorite(String songId) async {
    final currentlyFav = isFavorite(songId);
    final newStatus = !currentlyFav;

    if (newStatus) {
      _favoriteIds.add(songId);
    } else {
      _favoriteIds.remove(songId);
    }

    // 1. Optimistic in-memory update for instant real-time live UI reaction
    if (newStatus) {
      final match = _songs.where((s) => s.id == songId).firstOrNull;
      if (match != null && !_favoriteSongs.any((s) => s.id == songId)) {
        _favoriteSongs = [match.copyWith(isFavorite: true), ..._favoriteSongs];
      }
    } else {
      _favoriteSongs = _favoriteSongs.where((s) => s.id != songId).toList();
    }

    _songs = _songs.map((s) => s.id == songId ? s.copyWith(isFavorite: newStatus) : s).toList();
    _recentSongs = _recentSongs.map((s) => s.id == songId ? s.copyWith(isFavorite: newStatus) : s).toList();
    _downloadedSongs = _downloadedSongs.map((s) => s.id == songId ? s.copyWith(isFavorite: newStatus) : s).toList();

    notifyListeners();

    // 2. Persist to SQLite database
    try {
      await _db.toggleFavorite(songId, newStatus);
      final refreshedFavs = await _db.getFavoriteSongs();
      _favoriteSongs = refreshedFavs;
      notifyListeners();
    } catch (e) {
      _error = 'Failed to update favorite status: $e';
      notifyListeners();
    }
  }

  /// Smart Vibe & Similarity Engine: returns songs ranked by feeling, music vibe, genre, and artist
  List<Song> getSimilarSongs(Song currentSong, {int limit = 50}) {
    final candidates = _songs.where((s) => s.id != currentSong.id).toList();
    if (candidates.isEmpty) return [];

    final targetGenre = currentSong.genre?.toLowerCase().trim() ?? '';
    final targetArtists = currentSong.artist
        .toLowerCase()
        .split(RegExp(r'[,&/]|\bfeat\b|\bft\b'))
        .map((a) => a.trim())
        .where((a) => a.isNotEmpty)
        .toList();
    final targetAlbum = currentSong.album.toLowerCase().trim();
    final targetDesc = (currentSong.description ?? '').toLowerCase();

    // Vibe clusters
    final isPeppyDance = targetGenre.contains('dance') ||
        targetGenre.contains('samba') ||
        targetGenre.contains('rock') ||
        targetDesc.contains('dance') ||
        targetDesc.contains('peppy') ||
        targetDesc.contains('party') ||
        targetDesc.contains('energy');

    final isMelodyRomantic = targetGenre.contains('melody') ||
        targetGenre.contains('soulful') ||
        targetDesc.contains('romantic') ||
        targetDesc.contains('melody') ||
        targetDesc.contains('soul');

    final isActionMass = targetGenre.contains('action') ||
        targetGenre.contains('theme') ||
        targetDesc.contains('mass') ||
        targetDesc.contains('action') ||
        targetDesc.contains('high-octane');

    final isDevotionalFolk = targetGenre.contains('devotional') ||
        targetGenre.contains('folk') ||
        targetDesc.contains('devotional') ||
        targetDesc.contains('folk');

    final scored = candidates.map((c) {
      double score = 0.0;
      final cGenre = c.genre?.toLowerCase().trim() ?? '';
      final cAlbum = c.album.toLowerCase().trim();
      final cDesc = (c.description ?? '').toLowerCase();
      final cArtists = c.artist
          .toLowerCase()
          .split(RegExp(r'[,&/]|\bfeat\b|\bft\b'))
          .map((a) => a.trim())
          .where((a) => a.isNotEmpty)
          .toList();

      // 1. Same Album (Movie soundtrack match)
      if (cAlbum.isNotEmpty && cAlbum == targetAlbum) {
        score += 50.0;
      }

      // 2. Exact or partial Genre match
      if (targetGenre.isNotEmpty && cGenre.isNotEmpty) {
        if (cGenre == targetGenre) {
          score += 45.0;
        } else if (cGenre.contains(targetGenre) || targetGenre.contains(cGenre)) {
          score += 30.0;
        }
      }

      // 3. Artist overlap (Composer / Singer match)
      for (final ta in targetArtists) {
        for (final ca in cArtists) {
          if (ta == ca || ta.contains(ca) || ca.contains(ta)) {
            score += 35.0;
          }
        }
      }

      // 4. Vibe & Mood Cluster Match
      if (isPeppyDance &&
          (cGenre.contains('dance') ||
              cGenre.contains('samba') ||
              cGenre.contains('rock') ||
              cDesc.contains('dance') ||
              cDesc.contains('peppy') ||
              cDesc.contains('party') ||
              cDesc.contains('energy'))) {
        score += 25.0;
      }

      if (isMelodyRomantic &&
          (cGenre.contains('melody') ||
              cGenre.contains('soulful') ||
              cDesc.contains('romantic') ||
              cDesc.contains('melody') ||
              cDesc.contains('soul'))) {
        score += 25.0;
      }

      if (isActionMass &&
          (cGenre.contains('action') ||
              cGenre.contains('theme') ||
              cDesc.contains('mass') ||
              cDesc.contains('action') ||
              cDesc.contains('high-octane'))) {
        score += 25.0;
      }

      if (isDevotionalFolk &&
          (cGenre.contains('devotional') ||
              cGenre.contains('folk') ||
              cDesc.contains('devotional') ||
              cDesc.contains('folk'))) {
        score += 25.0;
      }

      // 5. Release Year proximity
      if (currentSong.releaseYear != null && c.releaseYear != null) {
        final diff = (currentSong.releaseYear! - c.releaseYear!).abs();
        if (diff <= 1) {
          score += 8.0;
        } else if (diff <= 3) {
          score += 4.0;
        }
      }

      return MapEntry(c, score);
    }).toList();

    // Sort by descending score
    scored.sort((a, b) => b.value.compareTo(a.value));
    return scored.map((e) => e.key).take(limit).toList();
  }

  Future<void> updateLyrics(String songId, String lyrics) async {
    try {
      await _db.updateSongLyrics(songId, lyrics);
      await loadCatalogue();
    } catch (e) {
      _error = 'Failed to update lyrics: $e';
      notifyListeners();
    }
  }

  Future<List<Song>> search(String query) async {
    if (query.trim().isEmpty) return _songs;
    return await _db.searchSongs(query);
  }

  // ==================== PLAYLISTS ====================

  Future<void> createPlaylist(String name, {String? description, String? thumbnailUrl}) async {
    try {
      final playlist = Playlist(
        id: 'pl-${DateTime.now().millisecondsSinceEpoch}',
        name: name.trim(),
        description: description?.trim(),
        thumbnailUrl: thumbnailUrl,
        createdAt: DateTime.now(),
      );
      await _db.insertPlaylist(playlist);
      await loadCatalogue();
    } catch (e) {
      _error = 'Failed to create playlist: $e';
      notifyListeners();
      rethrow;
    }
  }

  Future<void> renamePlaylist(String playlistId, String newName) async {
    try {
      final playlist = _playlists.firstWhere((p) => p.id == playlistId);
      final updated = playlist.copyWith(name: newName.trim());
      await _db.updatePlaylist(updated);
      await loadCatalogue();
    } catch (e) {
      _error = 'Failed to rename playlist: $e';
      notifyListeners();
      rethrow;
    }
  }

  Future<void> deletePlaylist(String playlistId) async {
    try {
      await _db.deletePlaylist(playlistId);
      await loadCatalogue();
    } catch (e) {
      _error = 'Failed to delete playlist: $e';
      notifyListeners();
      rethrow;
    }
  }

  Future<List<Song>> getPlaylistSongs(String playlistId) async {
    return await _db.getPlaylistSongs(playlistId);
  }

  Future<void> addSongToPlaylist(String playlistId, String songId) async {
    try {
      await _db.addSongToPlaylist(playlistId, songId);
      await loadCatalogue();
    } catch (e) {
      _error = 'Failed to add song to playlist: $e';
      notifyListeners();
      rethrow;
    }
  }

  Future<void> removeSongFromPlaylist(String playlistId, String songId) async {
    try {
      await _db.removeSongFromPlaylist(playlistId, songId);
      await loadCatalogue();
    } catch (e) {
      _error = 'Failed to remove song from playlist: $e';
      notifyListeners();
      rethrow;
    }
  }

  Future<void> reorderPlaylist(String playlistId, List<String> songIds) async {
    try {
      await _db.reorderPlaylistSongs(playlistId, songIds);
      await loadCatalogue();
    } catch (e) {
      _error = 'Failed to reorder playlist: $e';
      notifyListeners();
      rethrow;
    }
  }

  // ==================== HISTORY ====================

  Future<void> recordPlayback(String songId) async {
    try {
      await _db.recordPlayback(songId);
      _recentSongs = await _db.getRecentlyPlayed();
      notifyListeners();
    } catch (e) {
      debugPrint('Error recording playback: $e');
    }
  }

  Future<void> clearHistory() async {
    try {
      await _db.clearHistory();
      _recentSongs = [];
      notifyListeners();
    } catch (e) {
      _error = 'Failed to clear history: $e';
      notifyListeners();
      rethrow;
    }
  }
}
