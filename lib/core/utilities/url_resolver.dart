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

  /// Returns the local asset path if a thumbnail exists in bundled assets/covers/
  static String? getLocalAssetCoverPath(String? rawUrl) {
    if (rawUrl == null || rawUrl.trim().isEmpty) return null;
    final trimmed = rawUrl.trim();

    // Extract filename from relative path or full URL (e.g. covers/song.jpg or https://.../song.jpg)
    final pathWithoutQuery = trimmed.split('?').first;
    String filename = pathWithoutQuery.split('/').last;
    if (filename.isEmpty) return null;

    // Check if filename has an extension, default to .jpg if missing
    if (!filename.contains('.')) {
      filename = '$filename.jpg';
    }

    return 'assets/covers/$filename';
  }
}
