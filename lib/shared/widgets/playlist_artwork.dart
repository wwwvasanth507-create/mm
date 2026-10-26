import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utilities/url_resolver.dart';

class PlaylistArtwork extends StatelessWidget {
  final String? thumbnailUrl;
  final double size;
  final double borderRadius;
  final IconData placeholderIcon;

  const PlaylistArtwork({
    super.key,
    required this.thumbnailUrl,
    this.size = 50,
    this.borderRadius = 10,
    this.placeholderIcon = Icons.queue_music_rounded,
  });

  @override
  Widget build(BuildContext context) {
    final assetPath = AppUrls.getLocalAssetCoverPath(thumbnailUrl);
    final resolvedUrl = AppUrls.resolveThumbnailUrl(thumbnailUrl);

    Widget imageContent;
    if (assetPath != null) {
      imageContent = Image.asset(
        assetPath,
        width: size,
        height: size,
        fit: BoxFit.cover,
        cacheWidth: (size * 2).toInt(),
        cacheHeight: (size * 2).toInt(),
        errorBuilder: (_, __, ___) => _buildNetworkOrPlaceholder(resolvedUrl),
      );
    } else {
      imageContent = _buildNetworkOrPlaceholder(resolvedUrl);
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: Container(
        width: size,
        height: size,
        color: AppColors.surfaceLight,
        child: imageContent,
      ),
    );
  }

  Widget _buildNetworkOrPlaceholder(String? url) {
    if (url != null && url.isNotEmpty) {
      return CachedNetworkImage(
        imageUrl: url,
        width: size,
        height: size,
        fit: BoxFit.cover,
        memCacheWidth: (size * 2).toInt(),
        memCacheHeight: (size * 2).toInt(),
        placeholder: (_, __) => _buildPlaceholder(),
        errorWidget: (_, __, ___) => _buildPlaceholder(),
      );
    }
    return _buildPlaceholder();
  }

  Widget _buildPlaceholder() {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        gradient: AppColors.waveGradient,
      ),
      child: Center(
        child: Icon(
          placeholderIcon,
          color: Colors.white,
          size: size * 0.48,
        ),
      ),
    );
  }
}
