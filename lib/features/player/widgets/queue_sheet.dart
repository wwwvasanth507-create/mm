import 'dart:io';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../core/utilities/url_resolver.dart';
import '../../../data/models/song_model.dart';
import '../../../data/services/audio_player_service.dart';

class QueueSheet extends StatelessWidget {
  const QueueSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final playerService = context.watch<AudioPlayerService>();
    final queue = playerService.queue;
    final currentIndex = playerService.currentIndex;

    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.surfaceHighlight,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Now Playing Queue', style: AppTypography.heading3),
                  Text('${queue.length} tracks', style: AppTypography.caption),
                ],
              ),
              if (queue.isNotEmpty)
                TextButton.icon(
                  onPressed: () => playerService.clearQueue(),
                  icon: const Icon(Icons.clear_all_rounded, size: 18, color: AppColors.error),
                  label: const Text('Clear', style: TextStyle(color: AppColors.error)),
                ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(color: AppColors.divider, height: 1),
          const SizedBox(height: 8),

          // Reorderable Queue List
          Expanded(
            child: queue.isEmpty
                ? const Center(
                    child: Text('Queue is empty', style: TextStyle(color: AppColors.textMuted)),
                  )
                : ReorderableListView.builder(
                    physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                    itemCount: queue.length,
                    onReorder: (oldIndex, newIndex) =>
                        playerService.reorderQueue(oldIndex, newIndex),
                    itemBuilder: (context, index) {
                      final song = queue[index];
                      final isCurrent = index == currentIndex;

                      return RepaintBoundary(
                        key: ValueKey('${song.id}_$index'),
                        child: Container(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          decoration: BoxDecoration(
                            color: isCurrent
                                ? AppColors.primary.withOpacity(0.12)
                                : AppColors.card,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isCurrent
                                  ? AppColors.primary.withOpacity(0.5)
                                  : AppColors.divider,
                              width: 0.8,
                            ),
                          ),
                          child: ListTile(
                            onTap: () => playerService.playAtIndex(index),
                            leading: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                SizedBox(
                                  width: 24,
                                  child: isCurrent
                                      ? const Icon(
                                          Icons.graphic_eq_rounded,
                                          color: AppColors.primary,
                                          size: 20,
                                        )
                                      : Text(
                                          '${index + 1}',
                                          textAlign: TextAlign.center,
                                          style: AppTypography.caption.copyWith(color: AppColors.textMuted),
                                        ),
                                ),
                                const SizedBox(width: 8),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: SizedBox(
                                    width: 44,
                                    height: 44,
                                    child: _buildThumbnail(song),
                                  ),
                                ),
                              ],
                            ),
                            title: Text(
                              song.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTypography.title.copyWith(
                                fontSize: 14,
                                color: isCurrent ? AppColors.primary : AppColors.textPrimary,
                              ),
                            ),
                            subtitle: Text(
                              song.artist,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTypography.caption,
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.close_rounded, size: 18, color: AppColors.textMuted),
                                  onPressed: () => playerService.removeFromQueue(index),
                                ),
                                ReorderableDragStartListener(
                                  index: index,
                                  child: const Icon(Icons.drag_handle_rounded, color: AppColors.textMuted),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildThumbnail(Song song) {
    final assetPath = AppUrls.getLocalAssetCoverPath(song.thumbnailUrl);
    final resolvedUrl = AppUrls.resolveThumbnailUrl(song.thumbnailUrl);

    if (assetPath != null) {
      return Image.asset(
        assetPath,
        fit: BoxFit.cover,
        cacheWidth: 88,
        cacheHeight: 88,
        errorBuilder: (_, __, ___) {
          if (resolvedUrl != null) {
            return CachedNetworkImage(
              imageUrl: resolvedUrl,
              fit: BoxFit.cover,
              memCacheWidth: 88,
              memCacheHeight: 88,
              errorWidget: (_, __, ___) => _buildFallback(),
            );
          }
          return _buildFallback();
        },
      );
    }

    if (resolvedUrl != null) {
      return CachedNetworkImage(
        imageUrl: resolvedUrl,
        fit: BoxFit.cover,
        memCacheWidth: 88,
        memCacheHeight: 88,
        errorWidget: (_, __, ___) => _buildFallback(),
      );
    }

    if (!kIsWeb && song.thumbnailUrl != null && song.thumbnailUrl!.isNotEmpty) {
      final file = File(song.thumbnailUrl!);
      if (file.existsSync()) {
        return Image.file(file, fit: BoxFit.cover);
      }
    }

    return _buildFallback();
  }

  Widget _buildFallback() {
    return Container(
      decoration: const BoxDecoration(
        gradient: AppColors.waveGradient,
      ),
      child: const Center(
        child: Icon(Icons.music_note_rounded, size: 20, color: Colors.white),
      ),
    );
  }
}
