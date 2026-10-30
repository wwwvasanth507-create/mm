import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../data/models/song_model.dart';
import '../../data/repositories/music_repository.dart';
import '../../data/services/audio_player_service.dart';
import '../../data/services/download_service.dart';
import '../../features/player/now_playing_screen.dart';
import '../../features/playlists/widgets/add_to_playlist_dialog.dart';
import 'about_song_sheet.dart';
import 'app_artwork_image.dart';

class SongTile extends StatelessWidget {
  final Song song;
  final VoidCallback? onTap;
  final VoidCallback? onAddToPlaylist;
  final bool showMoreOptions;

  const SongTile({
    super.key,
    required this.song,
    this.onTap,
    this.onAddToPlaylist,
    this.showMoreOptions = true,
  });

  @override
  Widget build(BuildContext context) {
    // Selective listeners to prevent whole list rebuilding during scrolling
    final isCurrent = context.select<AudioPlayerService, bool>(
      (p) => p.currentSong?.id == song.id,
    );
    final isPlaying = isCurrent && context.select<AudioPlayerService, bool>(
      (p) => p.isPlaying,
    );
    final repository = context.read<MusicRepository>();
    final downloadService = context.read<DownloadService>();

    return RepaintBoundary(
      child: InkWell(
        onTap: onTap ?? () => context.read<AudioPlayerService>().playSong(song),
        borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: SizedBox(
          height: 52,
          child: Row(
          children: [
            // Thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Stack(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    color: AppColors.surfaceLight,
                    child: _buildThumbnail(),
                  ),
                  if (isPlaying)
                    Container(
                      width: 52,
                      height: 52,
                      color: Colors.black.withOpacity(0.55),
                      child: const Center(
                        child: Icon(
                          Icons.graphic_eq_rounded,
                          color: AppColors.primary,
                          size: 26,
                        ),
                      ),
                    ),
                  if (song.hasVideo && !isPlaying)
                    Positioned(
                      bottom: 2,
                      right: 2,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: Colors.black87,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Icon(Icons.play_circle_fill_rounded, color: AppColors.primary, size: 14),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 14),

            // Title & Artist
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          song.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.title.copyWith(
                            color: isCurrent ? AppColors.primary : AppColors.textPrimary,
                            fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w600,
                          ),
                        ),
                      ),
                      if (song.hasVideo) ...[
                        const SizedBox(width: 6),
                        GestureDetector(
                          onTap: () => _openVideo(context),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.18),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: AppColors.primary.withOpacity(0.4), width: 0.5),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.videocam_rounded, size: 10, color: AppColors.primary),
                                SizedBox(width: 3),
                                Text(
                                  'VIDEO',
                                  style: TextStyle(
                                    color: AppColors.primary,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      if (song.isDownloaded) ...[
                        const Icon(
                          Icons.download_done_rounded,
                          size: 13,
                          color: AppColors.accentEmerald,
                        ),
                        const SizedBox(width: 4),
                      ],
                      Expanded(
                        child: Text(
                          '${song.artist} • ${song.album}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.caption,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Isolated download progress indicator
            _SongTileDownloadIndicator(songId: song.id),

            // Isolated live synchronized favorite button
            _SongTileFavoriteButton(songId: song.id),

            // More Options Menu
            if (showMoreOptions)
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert_rounded, size: 20, color: AppColors.textMuted),
                color: AppColors.surface,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                onSelected: (action) => _handleAction(context, action, repository, downloadService),
                itemBuilder: (context) => [
                  if (song.hasVideo)
                    const PopupMenuItem(
                      value: 'video',
                      child: Row(
                        children: [
                          Icon(Icons.play_circle_fill_rounded, size: 20, color: AppColors.primary),
                          SizedBox(width: 12),
                          Text(
                            'Watch Video',
                            style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  const PopupMenuItem(
                    value: 'add_to_playlist',
                    child: Row(
                      children: [
                        Icon(Icons.playlist_add_rounded, size: 20, color: AppColors.textSecondary),
                        SizedBox(width: 12),
                        Text('Add to Playlist'),
                      ],
                    ),
                  ),
                  PopupMenuItem(
                    value: song.isDownloaded ? 'delete_download' : 'download',
                    child: Row(
                      children: [
                        Icon(
                          song.isDownloaded ? Icons.delete_outline_rounded : Icons.download_rounded,
                          size: 20,
                          color: song.isDownloaded ? AppColors.error : AppColors.accentEmerald,
                        ),
                        SizedBox(width: 12),
                        Text(song.isDownloaded ? 'Remove Download' : 'Download Offline'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'about_song',
                    child: Row(
                      children: [
                        Icon(Icons.info_outline_rounded, size: 20, color: AppColors.primary),
                        SizedBox(width: 12),
                        Text('About This Song'),
                      ],
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    ),
  ),
  );
  }

  Widget _buildThumbnail() {
    return AppArtworkImage(
      url: song.thumbnailUrl,
      width: 52,
      height: 52,
      cacheSize: 104,
      placeholder: _buildPlaceholder(),
      errorWidget: _buildPlaceholder(),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      decoration: const BoxDecoration(
        gradient: AppColors.waveGradient,
      ),
      child: const Center(
        child: Icon(Icons.music_note_rounded, color: Colors.white, size: 24),
      ),
    );
  }

  void _openVideo(BuildContext context) {
    final playerService = context.read<AudioPlayerService>();
    playerService.playSong(song, autoPlay: false);
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
  }

  void _handleAction(
    BuildContext context,
    String action,
    MusicRepository repo,
    DownloadService dlService,
  ) {
    switch (action) {
      case 'video':
        _openVideo(context);
        break;
      case 'add_to_playlist':
        if (onAddToPlaylist != null) {
          onAddToPlaylist!.call();
        } else {
          showDialog(
            context: context,
            builder: (_) => AddToPlaylistDialog(song: song),
          );
        }
        break;
      case 'about_song':
        AboutSongSheet.show(context, song);
        break;
      case 'download':
        dlService.startDownload(song);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Downloading "${song.title}"...'),
            duration: const Duration(seconds: 2),
            behavior: SnackBarBehavior.floating,
          ),
        );
        break;
      case 'delete_download':
        dlService.deleteDownload(song);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Removed "${song.title}" from downloads'),
            duration: const Duration(seconds: 2),
            behavior: SnackBarBehavior.floating,
          ),
        );
        break;
    }
  }
}

class _SongTileDownloadIndicator extends StatelessWidget {
  final String songId;

  const _SongTileDownloadIndicator({required this.songId});

  @override
  Widget build(BuildContext context) {
    final isDownloading = context.select<DownloadService, bool>(
      (d) => d.isDownloading(songId),
    );

    if (!isDownloading) return const SizedBox.shrink();

    final progress = context.select<DownloadService, double>(
      (d) => d.getProgress(songId),
    );

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: SizedBox(
        width: 22,
        height: 22,
        child: CircularProgressIndicator(
          value: progress > 0 ? progress : null,
          strokeWidth: 2.2,
          color: AppColors.primary,
          backgroundColor: AppColors.surface,
        ),
      ),
    );
  }
}

class _SongTileFavoriteButton extends StatelessWidget {
  final String songId;

  const _SongTileFavoriteButton({required this.songId});

  @override
  Widget build(BuildContext context) {
    final isFavorite = context.select<MusicRepository, bool>(
      (r) => r.isFavorite(songId),
    );

    return IconButton(
      icon: Icon(
        isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
        size: 20,
        color: isFavorite ? AppColors.primary : AppColors.textMuted,
      ),
      onPressed: () => context.read<MusicRepository>().toggleFavorite(songId),
      visualDensity: VisualDensity.compact,
    );
  }
}

