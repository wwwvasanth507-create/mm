import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/utilities/url_resolver.dart';
import '../../data/models/song_model.dart';
import '../../data/services/audio_player_service.dart';
import '../../features/player/now_playing_screen.dart';

class MiniPlayer extends StatelessWidget {
  const MiniPlayer({super.key});

  @override
  Widget build(BuildContext context) {
    final playerService = context.watch<AudioPlayerService>();
    final song = playerService.currentSong;

    if (song == null) {
      return const SizedBox.shrink();
    }

    final isPlaying = playerService.isPlaying;
    final isBuffering = playerService.isBuffering;

    return RepaintBoundary(
      child: GestureDetector(
        onTap: () {
          Navigator.of(context).push(
            PageRouteBuilder(
              pageBuilder: (_, __, ___) => const NowPlayingScreen(),
              transitionsBuilder: (_, animation, __, child) {
                return SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0, 1),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(
                    parent: animation,
                    curve: Curves.easeOutCubic,
                  )),
                  child: child,
                );
              },
            ),
          );
        },
        child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.divider, width: 0.8),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.4),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
            BoxShadow(
              color: AppColors.primary.withOpacity(0.12),
              blurRadius: 12,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                child: Row(
                  children: [
                    // Artwork
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: SizedBox(
                        width: 44,
                        height: 44,
                        child: _buildThumbnail(song),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Title & Artist
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            song.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTypography.title.copyWith(fontSize: 14),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            song.artist,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTypography.caption,
                          ),
                        ],
                      ),
                    ),

                    // Video Button if song has video
                    if (song.hasVideo)
                      IconButton(
                        icon: const Icon(
                          Icons.movie_creation_rounded,
                          color: AppColors.primary,
                          size: 22,
                        ),
                        tooltip: 'Direct Video Song',
                        onPressed: () {
                          Navigator.of(context).push(
                            PageRouteBuilder(
                              pageBuilder: (_, __, ___) => const NowPlayingScreen(initialVideoMode: true),
                              transitionsBuilder: (_, animation, __, child) {
                                return SlideTransition(
                                  position: Tween<Offset>(
                                    begin: const Offset(0, 1),
                                    end: Offset.zero,
                                  ).animate(CurvedAnimation(
                                    parent: animation,
                                    curve: Curves.easeOutCubic,
                                  )),
                                  child: child,
                                );
                              },
                            ),
                          );
                        },
                      ),

                    // Play/Pause button
                    IconButton(
                      icon: isBuffering
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.primary,
                              ),
                            )
                          : Icon(
                              isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                              color: AppColors.primary,
                              size: 30,
                            ),
                      onPressed: () => playerService.togglePlayPause(),
                    ),

                    // Next button
                    IconButton(
                      icon: const Icon(
                        Icons.skip_next_rounded,
                        color: AppColors.textSecondary,
                        size: 24,
                      ),
                      onPressed: () => playerService.next(),
                    ),
                  ],
                ),
              ),

              // Bottom Progress Bar
              StreamBuilder<Duration>(
                stream: playerService.positionStream,
                builder: (context, snapshot) {
                  final pos = snapshot.data ?? playerService.currentPosition;
                  final dur = playerService.currentDuration;
                  final p = dur.inMilliseconds > 0
                      ? (pos.inMilliseconds / dur.inMilliseconds).clamp(0.0, 1.0)
                      : 0.0;
                  return LinearProgressIndicator(
                    value: p,
                    backgroundColor: AppColors.surfaceHighlight,
                    valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                    minHeight: 2.2,
                  );
                },
              ),
            ],
          ),
        ),
      ),
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
              placeholder: (_, __) => _buildPlaceholder(),
              errorWidget: (_, __, ___) => _buildPlaceholder(),
            );
          }
          return _buildPlaceholder();
        },
      );
    }

    if (resolvedUrl != null) {
      return CachedNetworkImage(
        imageUrl: resolvedUrl,
        fit: BoxFit.cover,
        memCacheWidth: 88,
        memCacheHeight: 88,
        placeholder: (_, __) => _buildPlaceholder(),
        errorWidget: (_, __, ___) => _buildPlaceholder(),
      );
    }

    return _buildPlaceholder();
  }

  Widget _buildPlaceholder() {
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
