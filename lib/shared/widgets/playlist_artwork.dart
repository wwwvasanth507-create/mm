import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import 'app_artwork_image.dart';

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
    return AppArtworkImage(
      url: thumbnailUrl,
      width: size,
      height: size,
      borderRadius: BorderRadius.circular(borderRadius),
      placeholderIcon: placeholderIcon,
      placeholder: _buildPlaceholder(),
      errorWidget: _buildPlaceholder(),
    );
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
