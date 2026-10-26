import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import '../database/app_database.dart';
import '../models/song_model.dart';

class CatalogueSyncService {
  static const List<String> defaultRemoteUrls = [
    'https://raw.githubusercontent.com/wwwvasanth507-create/mm/feature/native-android-audio-and-catalogue/src/data/music.json',
    'https://raw.githubusercontent.com/wwwvasanth507-create/mm/main/src/data/music.json',
  ];

  final AppDatabase _db;
  final Dio _dio;

  CatalogueSyncService({AppDatabase? db, Dio? dio})
      : _db = db ?? AppDatabase.instance,
        _dio = dio ??
            Dio(
              BaseOptions(
                connectTimeout: const Duration(seconds: 15),
                receiveTimeout: const Duration(seconds: 20),
                headers: {
                  'Accept': 'application/json',
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                },
              ),
            );

  /// Load bundled seed songs from assets/data/music.json
  Future<List<Song>> loadBundledCatalogue() async {
    try {
      final jsonString = await rootBundle.loadString('assets/data/music.json');
      final dynamic decoded = jsonDecode(jsonString);
      final songs = _parseSongsFromJson(decoded);
      if (songs.isNotEmpty) {
        await _db.upsertSongs(songs);
      }
      final playlists = parsePlaylistsFromJson(decoded);
      if (playlists.isNotEmpty) {
        await _db.upsertPlaylistsWithTrackIds(playlists);
      }
      return songs;
    } catch (e) {
      debugPrint('[CatalogueSyncService] Error loading bundled catalogue: $e');
      return [];
    }
  }

  /// Synchronize with GitHub remote repository music.json
  /// Automatically fetches new songs and metadata updates without reinstalling APK.
  Future<List<Song>> fetchRemoteCatalogue({String? url}) async {
    final urlsToTry = url != null ? [url] : defaultRemoteUrls;

    for (final candidateUrl in urlsToTry) {
      try {
        final cacheBustedUrl = '$candidateUrl?_wave_t=${DateTime.now().millisecondsSinceEpoch}';
        final response = await _dio.get(cacheBustedUrl);

        if (response.statusCode == 200) {
          dynamic data = response.data;
          if (data is String) {
            data = jsonDecode(data);
          }
          final songs = _parseSongsFromJson(data);
          if (songs.isNotEmpty) {
            await _db.upsertSongs(songs);
            debugPrint('[CatalogueSyncService] Synced ${songs.length} songs from $candidateUrl');
          }

          final playlists = parsePlaylistsFromJson(data);
          if (playlists.isNotEmpty) {
            await _db.upsertPlaylistsWithTrackIds(playlists);
            debugPrint('[CatalogueSyncService] Synced ${playlists.length} playlists from $candidateUrl');
          }

          if (songs.isNotEmpty || playlists.isNotEmpty) {
            return songs;
          }
        }
      } catch (e) {
        debugPrint('[CatalogueSyncService] Remote sync from $candidateUrl failed: $e');
      }
    }
    return [];
  }

  List<Song> _parseSongsFromJson(dynamic decoded) {
    List<dynamic> rawList = [];
    if (decoded is List) {
      rawList = decoded;
    } else if (decoded is Map<String, dynamic>) {
      if (decoded['songs'] is List) {
        rawList = decoded['songs'] as List;
      } else if (decoded['tracks'] is List) {
        rawList = decoded['tracks'] as List;
      }
    }

    final List<Song> songs = [];
    for (final item in rawList) {
      if (item is Map<String, dynamic>) {
        try {
          songs.add(Song.fromJson(item));
        } catch (e) {
          debugPrint('[CatalogueSyncService] Song parse warning: $e');
        }
      }
    }
    return songs;
  }

  /// Extracts playlist definitions including trackIds from music.json
  List<Map<String, dynamic>> parsePlaylistsFromJson(dynamic decoded) {
    if (decoded is! Map<String, dynamic>) return [];
    final rawPlaylists = decoded['playlists'];
    if (rawPlaylists is! List) return [];

    final List<Map<String, dynamic>> result = [];
    for (final item in rawPlaylists) {
      if (item is Map<String, dynamic>) {
        result.add(item);
      }
    }
    return result;
  }
}
