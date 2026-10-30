import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';

class AppUpdateInfo {
  final int versionCode;
  final String versionName;
  final String apkUrl;
  final String title;
  final String releaseNotes;
  final bool forceUpdate;
  final int? fileSizeBytes;

  const AppUpdateInfo({
    required this.versionCode,
    required this.versionName,
    required this.apkUrl,
    required this.title,
    required this.releaseNotes,
    this.forceUpdate = false,
    this.fileSizeBytes,
  });

  factory AppUpdateInfo.fromJson(Map<String, dynamic> json) {
    return AppUpdateInfo(
      versionCode: json['version_code'] is int
          ? json['version_code'] as int
          : int.tryParse(json['version_code']?.toString() ?? '1') ?? 1,
      versionName: json['version_name']?.toString() ?? '1.0.0',
      apkUrl: json['apk_url']?.toString() ??
          'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/app/Jalra.apk',
      title: json['title']?.toString() ?? 'New Update Available! 🎵',
      releaseNotes: json['release_notes']?.toString() ??
          '• Performance improvements\n• Bug fixes & new features',
      forceUpdate: json['force_update'] == true,
      fileSizeBytes: json['file_size_bytes'] is int
          ? json['file_size_bytes'] as int
          : int.tryParse(json['file_size_bytes']?.toString() ?? ''),
    );
  }
}

enum UpdateDownloadStatus {
  idle,
  checking,
  available,
  downloading,
  downloadCompleted,
  installing,
  upToDate,
  error,
}

class AppUpdateService extends ChangeNotifier {
  static const MethodChannel _updaterChannel =
      MethodChannel('in.wavemusic.premium/updater');

  /// Cloudflare R2 version metadata endpoint
  static const String defaultVersionUrl =
      'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/app/version.json';

  /// Current installed app version (corresponds to pubspec.yaml version: 1.0.4+5)
  static const int currentVersionCode = 5;
  static const String currentVersionName = '1.0.4';

  final Dio _dio;
  Timer? _periodicTimer;
  CancelToken? _cancelToken;

  UpdateDownloadStatus _status = UpdateDownloadStatus.idle;
  AppUpdateInfo? _latestUpdateInfo;
  double _downloadProgress = 0.0;
  String _downloadProgressText = '';
  String? _errorMessage;
  bool _dialogDismissedByUser = false;

  AppUpdateService({Dio? dio})
      : _dio = dio ??
            Dio(
              BaseOptions(
                connectTimeout: const Duration(seconds: 12),
                receiveTimeout: const Duration(seconds: 30),
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                },
              ),
            ) {
    // Automatically delete leftover old APK files on startup
    cleanOldApkFiles();
  }

  UpdateDownloadStatus get status => _status;
  AppUpdateInfo? get latestUpdateInfo => _latestUpdateInfo;
  double get downloadProgress => _downloadProgress;
  String get downloadProgressText => _downloadProgressText;
  String? get errorMessage => _errorMessage;
  bool get hasUpdate =>
      _latestUpdateInfo != null &&
      _latestUpdateInfo!.versionCode > currentVersionCode;
  bool get shouldShowPrompt =>
      hasUpdate &&
      (!_dialogDismissedByUser || (_latestUpdateInfo?.forceUpdate ?? false)) &&
      _status != UpdateDownloadStatus.downloading;

  /// Starts live periodic check every 15 minutes (music playback is completely undisturbed)
  void startPeriodicChecks({Duration interval = const Duration(minutes: 15)}) {
    _periodicTimer?.cancel();
    _periodicTimer = Timer.periodic(interval, (_) {
      checkForUpdates(silent: true);
    });
  }

  /// Automatically clean up / delete any downloaded APK installer files
  /// to save device storage immediately after update or on startup.
  Future<void> cleanOldApkFiles() async {
    if (kIsWeb || !Platform.isAndroid) return;
    try {
      final tempDir = await getTemporaryDirectory();
      final updatesDir = Directory('${tempDir.path}/jalra_updates');
      if (await updatesDir.exists()) {
        final entities = updatesDir.listSync();
        for (final entity in entities) {
          if (entity is File &&
              (entity.path.endsWith('.apk') ||
                  entity.path.endsWith('.part') ||
                  entity.path.endsWith('.tmp'))) {
            try {
              entity.deleteSync();
              debugPrint('[AppUpdateService] Deleted old APK file: ${entity.path}');
            } catch (e) {
              debugPrint('[AppUpdateService] Could not delete file: $e');
            }
          }
        }
      }
    } catch (e) {
      debugPrint('[AppUpdateService] Note on cleaning APK files: $e');
    }
  }

  /// Check for updates from Cloudflare R2 version.json
  Future<AppUpdateInfo?> checkForUpdates({
    String? url,
    bool silent = false,
  }) async {
    if (!silent) {
      _status = UpdateDownloadStatus.checking;
      _errorMessage = null;
      notifyListeners();
    }

    final targetUrl = url ?? defaultVersionUrl;
    try {
      final response = await _dio.get(
        targetUrl,
        queryParameters: {'_t': DateTime.now().millisecondsSinceEpoch},
      );

      if (response.statusCode == 200 && response.data != null) {
        Map<String, dynamic> data;
        if (response.data is Map<String, dynamic>) {
          data = response.data as Map<String, dynamic>;
        } else if (response.data is String) {
          // If response was returned as plain text
          final decoded = jsonDecode(response.data as String);
          data = Map<String, dynamic>.from(decoded as Map);
        } else {
          throw Exception('Invalid version.json format');
        }

        final updateInfo = AppUpdateInfo.fromJson(data);
        _latestUpdateInfo = updateInfo;

        if (updateInfo.versionCode > currentVersionCode) {
          _status = UpdateDownloadStatus.available;
          _dialogDismissedByUser = false;
          debugPrint(
            '[AppUpdateService] New update found: v${updateInfo.versionName} (${updateInfo.versionCode}) vs current: $currentVersionCode',
          );
        } else {
          _status = UpdateDownloadStatus.upToDate;
          debugPrint('[AppUpdateService] App is up to date.');
        }

        notifyListeners();
        return updateInfo;
      } else {
        throw Exception('Server responded with status: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('[AppUpdateService] Update check failed: $e');
      if (!silent) {
        _status = UpdateDownloadStatus.error;
        _errorMessage = 'Could not check for updates. Please try again.';
        notifyListeners();
      }
      return null;
    }
  }

  /// Dismiss the update dialog for this session (unless forced)
  void dismissPrompt() {
    _dialogDismissedByUser = true;
    notifyListeners();
  }

  /// Reset dismiss state to show dialog again
  void showPromptAgain() {
    _dialogDismissedByUser = false;
    notifyListeners();
  }

  /// Download APK with live progress and trigger Android package installer
  Future<void> downloadAndInstall({AppUpdateInfo? customInfo}) async {
    final info = customInfo ?? _latestUpdateInfo;
    if (info == null) {
      _errorMessage = 'No update information found';
      notifyListeners();
      return;
    }

    if (kIsWeb || !Platform.isAndroid) {
      _errorMessage = 'In-app update is only supported on Android devices.';
      _status = UpdateDownloadStatus.error;
      notifyListeners();
      return;
    }

    try {
      // 1. Clean any old APK files first to free space
      await cleanOldApkFiles();

      // 2. Prepare destination path
      final tempDir = await getTemporaryDirectory();
      final updatesDir = Directory('${tempDir.path}/jalra_updates');
      if (!await updatesDir.exists()) {
        await updatesDir.create(recursive: true);
      }

      final targetApkPath =
          '${updatesDir.path}/Jalra_v${info.versionCode}.apk';
      final tempApkPath = '$targetApkPath.part';

      _status = UpdateDownloadStatus.downloading;
      _downloadProgress = 0.0;
      _downloadProgressText = 'Starting download...';
      _errorMessage = null;
      _cancelToken = CancelToken();
      notifyListeners();

      // 3. Download APK via Dio with live progress
      await _dio.download(
        info.apkUrl,
        tempApkPath,
        cancelToken: _cancelToken,
        onReceiveProgress: (received, total) {
          if (total > 0) {
            _downloadProgress = received / total;
            final receivedMb = (received / (1024 * 1024)).toStringAsFixed(1);
            final totalMb = (total / (1024 * 1024)).toStringAsFixed(1);
            final percent = (_downloadProgress * 100).toInt();
            _downloadProgressText = '$percent% ($receivedMb MB / $totalMb MB)';
          } else {
            final receivedMb = (received / (1024 * 1024)).toStringAsFixed(1);
            _downloadProgressText = '$receivedMb MB downloaded';
          }
          notifyListeners();
        },
      );

      // Rename .part to .apk
      final tempFile = File(tempApkPath);
      if (await tempFile.exists()) {
        await tempFile.rename(targetApkPath);
      }

      _status = UpdateDownloadStatus.downloadCompleted;
      _downloadProgress = 1.0;
      _downloadProgressText = 'Download complete! Opening installer...';
      notifyListeners();

      // 4. Trigger Android Package Installer
      await installDownloadedApk(targetApkPath);
    } on DioException catch (e) {
      if (CancelToken.isCancel(e)) {
        _status = UpdateDownloadStatus.available;
        _downloadProgress = 0.0;
        _downloadProgressText = 'Download cancelled';
        await cleanOldApkFiles();
      } else {
        _status = UpdateDownloadStatus.error;
        _errorMessage = 'Download failed: ${e.message ?? 'Network error'}';
        await cleanOldApkFiles();
      }
      notifyListeners();
    } catch (e) {
      _status = UpdateDownloadStatus.error;
      _errorMessage = 'Update error: $e';
      await cleanOldApkFiles();
      notifyListeners();
    }
  }

  /// Cancels an in-progress download
  void cancelDownload() {
    _cancelToken?.cancel('Cancelled by user');
    _cancelToken = null;
  }

  /// Call native Android channel to install the APK
  Future<bool> installDownloadedApk(String filePath) async {
    try {
      _status = UpdateDownloadStatus.installing;
      notifyListeners();

      final dynamic result = await _updaterChannel.invokeMethod('installApk', {
        'filePath': filePath,
      });

      if (result == true) {
        debugPrint('[AppUpdateService] Package installer launched successfully');
        return true;
      } else {
        debugPrint('[AppUpdateService] Permission requested or cancelled');
        return false;
      }
    } on PlatformException catch (e) {
      debugPrint('[AppUpdateService] PlatformException installing APK: ${e.message}');
      _errorMessage = 'Could not launch installer: ${e.message}';
      _status = UpdateDownloadStatus.error;
      notifyListeners();
      return false;
    }
  }

  @override
  void dispose() {
    _periodicTimer?.cancel();
    _cancelToken?.cancel();
    super.dispose();
  }
}
