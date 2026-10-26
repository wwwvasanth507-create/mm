import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import '../database/app_database.dart';
import '../models/song_model.dart';
import '../models/download_item_model.dart';
import '../repositories/music_repository.dart';

class DownloadService extends ChangeNotifier {
  final AppDatabase _db;
  final MusicRepository _repository;
  final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 20),
    receiveTimeout: const Duration(minutes: 5),
  ));

  final Map<String, CancelToken> _cancelTokens = {};
  final Map<String, double> _downloadProgress = {};
  final Map<String, DownloadStatus> _downloadStatus = {};

  DownloadService({
    AppDatabase? db,
    required MusicRepository repository,
  })  : _repository = repository,
        _db = db ?? AppDatabase.instance;

  double getProgress(String songId) => _downloadProgress[songId] ?? 0.0;
  DownloadStatus getStatus(String songId) =>
      _downloadStatus[songId] ?? DownloadStatus.pending;

  bool isDownloading(String songId) =>
      _downloadStatus[songId] == DownloadStatus.downloading;

  Future<String> _getDownloadDirectory() async {
    final appDocDir = await getApplicationDocumentsDirectory();
    final downloadDir = Directory(p.join(appDocDir.path, 'wave_music_downloads'));
    if (!await downloadDir.exists()) {
      await downloadDir.create(recursive: true);
    }
    return downloadDir.path;
  }

  /// Start downloading a song from its audioUrl
  Future<void> startDownload(Song song) async {
    if (isDownloading(song.id)) return;

    final cancelToken = CancelToken();
    _cancelTokens[song.id] = cancelToken;
    _downloadProgress[song.id] = 0.0;
    _downloadStatus[song.id] = DownloadStatus.downloading;
    notifyListeners();

    try {
      final dir = await _getDownloadDirectory();
      final fileName = '${song.id}.mp3';
      final savePath = p.join(dir, fileName);

      final downloadItem = DownloadItem(
        id: 'dl-${song.id}',
        songId: song.id,
        downloadUrl: song.audioUrl,
        localPath: savePath,
        status: DownloadStatus.downloading,
        progress: 0.0,
        createdAt: DateTime.now(),
      );
      await _db.saveDownloadItem(downloadItem);

      await _dio.download(
        song.audioUrl,
        savePath,
        cancelToken: cancelToken,
        onReceiveProgress: (received, total) {
          if (total > 0) {
            final progress = (received / total).clamp(0.0, 1.0);
            _downloadProgress[song.id] = progress;
            notifyListeners();
            _db.updateDownloadProgress(
              'dl-${song.id}',
              progress,
              DownloadStatus.downloading,
              fileSize: received,
            );
          }
        },
      );

      // Verify file was written and is not empty
      final file = File(savePath);
      if (await file.exists() && await file.length() > 0) {
        _downloadProgress[song.id] = 1.0;
        _downloadStatus[song.id] = DownloadStatus.completed;

        await _db.updateDownloadProgress(
          'dl-${song.id}',
          1.0,
          DownloadStatus.completed,
          fileSize: await file.length(),
        );

        // Update song in database with local path
        await _db.updateDownloadStatus(song.id, true, savePath);
        await _repository.loadCatalogue();
      } else {
        throw Exception('Downloaded file is empty or corrupted');
      }
    } on DioException catch (e) {
      if (CancelToken.isCancel(e)) {
        _downloadStatus[song.id] = DownloadStatus.cancelled;
        await _db.updateDownloadProgress('dl-${song.id}', 0.0, DownloadStatus.cancelled);
      } else {
        _downloadStatus[song.id] = DownloadStatus.failed;
        await _db.updateDownloadProgress('dl-${song.id}', 0.0, DownloadStatus.failed);
      }
    } catch (e) {
      _downloadStatus[song.id] = DownloadStatus.failed;
      await _db.updateDownloadProgress('dl-${song.id}', 0.0, DownloadStatus.failed);
    } finally {
      _cancelTokens.remove(song.id);
      notifyListeners();
    }
  }

  /// Cancel an ongoing download
  void cancelDownload(String songId) {
    if (_cancelTokens.containsKey(songId)) {
      _cancelTokens[songId]?.cancel('User cancelled download');
      _cancelTokens.remove(songId);
      _downloadStatus[songId] = DownloadStatus.cancelled;
      _downloadProgress[songId] = 0.0;
      notifyListeners();
    }
  }

  /// Delete a downloaded audio file
  Future<void> deleteDownload(Song song) async {
    cancelDownload(song.id);

    if (song.localFilePath != null) {
      final file = File(song.localFilePath!);
      if (await file.exists()) {
        try {
          await file.delete();
        } catch (e) {
          debugPrint('Error deleting local file: $e');
        }
      }
    }

    _downloadProgress.remove(song.id);
    _downloadStatus.remove(song.id);

    await _db.updateDownloadStatus(song.id, false, null);
    await _db.deleteDownloadItem(song.id);
    await _repository.loadCatalogue();
    notifyListeners();
  }

  Future<void> downloadSong(Song song) => startDownload(song);

  Future<void> deleteDownloadedSong(String songId) async {
    final song = _repository.songs.cast<Song?>().firstWhere(
          (s) => s?.id == songId,
          orElse: () => null,
        );
    if (song != null) {
      await deleteDownload(song);
    } else {
      cancelDownload(songId);
      _downloadProgress.remove(songId);
      _downloadStatus.remove(songId);
      await _db.updateDownloadStatus(songId, false, null);
      await _db.deleteDownloadItem(songId);
      notifyListeners();
    }
  }

  /// Calculate total storage used by offline music in bytes
  Future<int> getTotalDownloadSize() async {
    try {
      final dirPath = await _getDownloadDirectory();
      final dir = Directory(dirPath);
      if (!await dir.exists()) return 0;

      int total = 0;
      await for (final entity in dir.list(recursive: false, followLinks: false)) {
        if (entity is File) {
          total += await entity.length();
        }
      }
      return total;
    } catch (_) {
      return 0;
    }
  }
}
