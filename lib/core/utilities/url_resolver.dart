class AppUrls {
  static const String githubRawBase =
      'https://raw.githubusercontent.com/wwwvasanth507-create/mm/main/public';

  /// Resolves a thumbnail URL to a full network URL suitable for Image loading and MediaItem.
  static String? resolveThumbnailUrl(String? rawUrl) {
    if (rawUrl == null || rawUrl.trim().isEmpty) return null;
    final trimmed = rawUrl.trim();

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    if (trimmed.startsWith('assets/')) {
      return trimmed;
    }

    if (trimmed.startsWith('/covers/') || trimmed.startsWith('covers/')) {
      final filename = trimmed.split('/').last;
      return '$githubRawBase/covers/$filename';
    }

    if (trimmed.startsWith('/')) {
      return '$githubRawBase$trimmed';
    }

    return '$githubRawBase/covers/$trimmed';
  }

  /// Returns an optimized high-speed CDN URL scaled to target dimensions.
  /// For Apple Music CDN (mzstatic.com), dynamically replaces resolution (e.g. 150x150, 300x300, 600x600)
  /// reducing download payload by 75-90% for lightning-fast loads.
  static String? getOptimizedThumbnailUrl(String? rawUrl, {int width = 300}) {
    final resolved = resolveThumbnailUrl(rawUrl);
    if (resolved == null) return null;

    // Optimize mzstatic.com (Apple Music CDN)
    if (resolved.contains('mzstatic.com')) {
      final targetSize = width.clamp(100, 600);
      return resolved.replaceFirst(
        RegExp(r'/\d+x\d+bb\.(jpg|png|webp)', caseSensitive: false),
        '/${targetSize}x${targetSize}bb.jpg',
      );
    }

    return resolved;
  }

  static final Set<String> _bundledCovers = {};


  /// Returns the local asset path if a thumbnail exists in bundled assets/covers/
  static String? getLocalAssetCoverPath(String? rawUrl) {
    if (rawUrl == null || rawUrl.trim().isEmpty) return null;
    final trimmed = rawUrl.trim();

    if (trimmed.startsWith('assets/covers/')) {
      return trimmed;
    }

    final pathWithoutQuery = trimmed.split('?').first.split('#').first;
    final rawFilename = pathWithoutQuery.split('/').last;
    String filename;
    try {
      filename = Uri.decodeComponent(rawFilename).toLowerCase();
    } catch (_) {
      filename = rawFilename.toLowerCase();
    }
    if (filename.isEmpty) return null;

    if (!filename.contains('.')) {
      filename = '$filename.jpg';
    }

    if (_bundledCovers.contains(filename)) {
      return 'assets/covers/$filename';
    }

    return null;
  }
}

/// Backwards compatibility alias
typedef UrlResolver = AppUrls;
