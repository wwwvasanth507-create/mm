import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import '../../core/utilities/url_resolver.dart';

class CoverCacheService {
  static String? _coversDirPath;
  static final Map<String, String> _extractedCache = {};
  static bool _isPrewarming = false;

  /// Initialize the local covers cache directory on the Android filesystem
  static Future<void> init() async {
    try {
      final appSupportDir = await getApplicationSupportDirectory();
      final dir = Directory('${appSupportDir.path}/media_covers');
      if (!dir.existsSync()) {
        dir.createSync(recursive: true);
      }
      _coversDirPath = dir.path;

      // Prewarm popular/initial covers in the background without blocking UI
      if (!_isPrewarming) {
        _isPrewarming = true;
        _prewarmCoversInBackground();
      }
    } catch (e) {
      debugPrint('[CoverCacheService] Init note: $e');
    }
  }

  /// Get a safe URI for Android Lock Screen & Notification Shade.
  /// If local extracted cover exists, returns a file:// URI so AudioService immediately
  /// decodes the local Bitmap on disk without an HTTP request.
  /// Otherwise, falls back to resolved HTTPS URI.
  static Uri? getMediaItemArtUri(String? thumbnailUrl) {
    if (thumbnailUrl == null || thumbnailUrl.trim().isEmpty) return null;

    // Check if thumbnailUrl is already a direct local file
    if (File(thumbnailUrl).existsSync()) {
      return Uri.file(thumbnailUrl);
    }

    // Check if extracted local asset cover file exists on disk
    final localAsset = AppUrls.getLocalAssetCoverPath(thumbnailUrl);
    if (localAsset != null && _coversDirPath != null) {
      final filename = localAsset.split('/').last;
      final targetFile = File('$_coversDirPath/$filename');
      if (targetFile.existsSync()) {
        return Uri.file(targetFile.path);
      }
    }

    final resolvedUrl = AppUrls.resolveThumbnailUrl(thumbnailUrl);
    if (resolvedUrl != null && resolvedUrl.isNotEmpty) {
      return Uri.tryParse(resolvedUrl);
    }

    return null;
  }

  /// Ensure a single cover asset is extracted to disk
  static Future<String?> ensureCoverExtracted(String? thumbnailUrl) async {
    if (thumbnailUrl == null || thumbnailUrl.trim().isEmpty) return null;
    final localAsset = AppUrls.getLocalAssetCoverPath(thumbnailUrl);
    if (localAsset == null) return null;

    if (_coversDirPath == null) {
      await init();
    }
    if (_coversDirPath == null) return null;

    final filename = localAsset.split('/').last;
    final targetFile = File('$_coversDirPath/$filename');

    if (targetFile.existsSync()) {
      _extractedCache[localAsset] = targetFile.path;
      return targetFile.path;
    }

    return await _extractSingleAsset(localAsset, targetFile);
  }

  static Future<String?> _extractSingleAsset(String assetPath, File targetFile) async {
    try {
      final byteData = await rootBundle.load(assetPath);
      final bytes = byteData.buffer.asUint8List(
        byteData.offsetInBytes,
        byteData.lengthInBytes,
      );
      await targetFile.writeAsBytes(bytes, flush: true);
      _extractedCache[assetPath] = targetFile.path;
      return targetFile.path;
    } catch (e) {
      return null;
    }
  }

  static void _prewarmCoversInBackground() {
    // Delay prewarming until after UI has rendered and settled
    Future.delayed(const Duration(milliseconds: 800), () async {
      try {
        final manifest = await AssetManifest.loadFromAssetBundle(rootBundle);
        final coverPaths = manifest
            .listAssets()
            .where((path) => path.startsWith('assets/covers/') && path.endsWith('.jpg'))
            .toList();

        for (final path in coverPaths) {
          if (_coversDirPath == null) break;
          final filename = path.split('/').last;
          final file = File('$_coversDirPath/$filename');
          if (!file.existsSync()) {
            await _extractSingleAsset(path, file);
          } else {
            _extractedCache[path] = file.path;
          }
        }
      } catch (e) {
        debugPrint('[CoverCacheService] Prewarm notice: $e');
      }
    });
  }
}
