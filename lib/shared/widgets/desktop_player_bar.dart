import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utilities/formatters.dart';
import '../../core/utilities/url_resolver.dart';
import '../../data/models/song_model.dart';
import '../../data/repositories/music_repository.dart';
import '../../data/services/audio_player_service.dart';
import '../../features/player/now_playing_screen.dart';
import '../../features/player/widgets/queue_sheet.dart';
import '../../features/player/widgets/video_player_modal.dart';

class DesktopPlayerBar extends StatefulWidget {
  const DesktopPlayerBar({super.key});

  @override
  State<DesktopPlayerBar> createState() => _DesktopPlayerBarState();
}

class _DesktopPlayerBarState extends State<DesktopPlayerBar> {
  double _volume = 1.0;
  bool _isMuted = false;
  double _previousVolume = 1.0;

  Widget _buildArtwork(Song song) {
    final resolvedUrl = UrlResolver.resolveThumbnailUrl(song.thumbnailUrl);
    if (resolvedUrl == null || resolvedUrl.isEmpty) {
      return Container(
        width: 52,
        height: 52,
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Center(
          child: Icon(Icons.music_note_rounded, color: AppColors.cuteMint, size: 22),
        ),
      );
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: CachedNetworkImage(
        imageUrl: resolvedUrl,
        width: 52,
        height: 52,
        fit: BoxFit.cover,
        placeholder: (_, __) => Container(
          color: const Color(0xFF1E293B),
          child: const Center(
            child: Icon(Icons.music_note_rounded, color: AppColors.cuteMint, size: 22),
          ),
        ),
        errorWidget: (_, __, ___) => Container(
          color: const Color(0xFF1E293B),
          child: const Center(
            child: Icon(Icons.music_note_rounded, color: AppColors.cuteMint, size: 22),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final playerService = context.watch<AudioPlayerService>();
    final repository = context.watch<MusicRepository>();
    final song = playerService.currentSong;

    if (song == null) {
      return Container(
        height: 78,
        padding: const EdgeInsets.symmetric(horizontal: 24),
        decoration: const BoxDecoration(
          color: Color(0xFF0C1017),
          border: Border(top: BorderSide(color: Color(0xFF1B2330), width: 1.0)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.cuteMint.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.graphic_eq_rounded, color: AppColors.cuteMint, size: 20),
                ),
                const SizedBox(width: 14),
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Ready to Stream Jalra Music',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13.5),
                    ),
                    Text(
                      '${repository.songs.length} lossless Tamil tracks loaded and ready',
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                    ),
                  ],
                ),
              ],
            ),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.cuteMint,
                foregroundColor: const Color(0xFF070B0E),
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              onPressed: () {
                if (repository.songs.isNotEmpty) {
                  final randomQueue = List<Song>.from(repository.shuffledSongs);
                  playerService.playSong(randomQueue.first, queue: randomQueue);
                }
              },
              icon: const Icon(Icons.shuffle_rounded, size: 18),
              label: const Text('Play Random Mix', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12.5)),
            ),
          ],
        ),
      );
    }

    final isPlaying = playerService.isPlaying;
    final isBuffering = playerService.isBuffering;
    final isFavorite = repository.isFavorite(song.id);

    return Container(
      height: 84,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        color: const Color(0xFF0B0F16),
        border: const Border(top: BorderSide(color: Color(0xFF1E293B), width: 1.0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.5),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Left: Song Info & Artwork
          Expanded(
            flex: 3,
            child: Row(
              children: [
                GestureDetector(
                  onTap: () {
                    Navigator.of(context).push(
                      PageRouteBuilder(
                        pageBuilder: (_, __, ___) => const NowPlayingScreen(),
                        transitionsBuilder: (_, a, __, c) => FadeTransition(opacity: a, child: c),
                      ),
                    );
                  },
                  child: MouseRegion(
                    cursor: SystemMouseCursors.click,
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.4),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: _buildArtwork(song),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        song.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 13.5,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${song.artist}${song.album.isNotEmpty ? ' • ${song.album}' : ''}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 11.5,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: Icon(
                    isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                    color: isFavorite ? const Color(0xFFFF6584) : const Color(0xFF94A3B8),
                    size: 20,
                  ),
                  tooltip: isFavorite ? 'Unlike' : 'Like',
                  onPressed: () => repository.toggleFavorite(song.id),
                ),
              ],
            ),
          ),

          // Center: Playback Controls & Progress Bar
          Expanded(
            flex: 5,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Control Buttons
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    IconButton(
                      icon: Icon(
                        Icons.shuffle_rounded,
                        size: 19,
                        color: playerService.isShuffle ? AppColors.cuteMint : const Color(0xFF94A3B8),
                      ),
                      tooltip: 'Shuffle',
                      onPressed: () => playerService.toggleShuffle(),
                    ),
                    IconButton(
                      icon: const Icon(Icons.skip_previous_rounded, size: 24, color: Colors.white),
                      tooltip: 'Previous',
                      onPressed: () => playerService.previous(),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        gradient: AppColors.cuteDockActive,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF76E035).withOpacity(0.35),
                            blurRadius: 12,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: IconButton(
                        padding: EdgeInsets.zero,
                        icon: isBuffering
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF070B0E)),
                                ),
                              )
                            : Icon(
                                isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                                size: 24,
                                color: const Color(0xFF070B0E),
                              ),
                        onPressed: () => playerService.togglePlayPause(),
                      ),
                    ),
                    const SizedBox(width: 6),
                    IconButton(
                      icon: const Icon(Icons.skip_next_rounded, size: 24, color: Colors.white),
                      tooltip: 'Next',
                      onPressed: () => playerService.next(),
                    ),
                    IconButton(
                      icon: Icon(
                        playerService.isLooping ? Icons.repeat_one_rounded : Icons.repeat_rounded,
                        size: 19,
                        color: playerService.isLooping ? AppColors.cuteMint : const Color(0xFF94A3B8),
                      ),
                      tooltip: 'Loop Mode',
                      onPressed: () => playerService.toggleLoop(),
                    ),
                  ],
                ),

                // Progress Bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      Text(
                        AppFormatters.formatDuration(playerService.position),
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 10.5),
                      ),
                      Expanded(
                        child: SliderTheme(
                          data: SliderTheme.of(context).copyWith(
                            trackHeight: 3.5,
                            thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                            overlayShape: const RoundSliderOverlayShape(overlayRadius: 12),
                            activeTrackColor: AppColors.cuteMint,
                            inactiveTrackColor: const Color(0xFF1E293B),
                            thumbColor: Colors.white,
                          ),
                          child: Slider(
                            value: playerService.position.inMilliseconds
                                .toDouble()
                                .clamp(0.0, playerService.duration.inMilliseconds.toDouble()),
                            max: playerService.duration.inMilliseconds > 0
                                ? playerService.duration.inMilliseconds.toDouble()
                                : 1.0,
                            onChanged: (val) {
                              playerService.seek(Duration(milliseconds: val.toInt()));
                            },
                          ),
                        ),
                      ),
                      Text(
                        AppFormatters.formatDuration(playerService.duration),
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 10.5),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Right: Studio Clarity, Video, Volume, Queue
          Expanded(
            flex: 3,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                // Lossless Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.cuteMint.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppColors.cuteMint.withOpacity(0.35), width: 0.8),
                  ),
                  child: const Text(
                    'HI-FI',
                    style: TextStyle(
                      color: AppColors.cuteMint,
                      fontSize: 9.5,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Video toggle (if available)
                if (song.hasVideo) ...[
                  IconButton(
                    icon: Icon(
                      Icons.ondemand_video_rounded,
                      color: playerService.isVideoMode ? AppColors.cuteMint : const Color(0xFF94A3B8),
                      size: 20,
                    ),
                    tooltip: 'Watch Music Video',
                    onPressed: () {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => VideoPlayerModal(song: song),
                      );
                    },
                  ),
                ],

                // Volume slider
                IconButton(
                  icon: Icon(
                    _isMuted || _volume == 0
                        ? Icons.volume_off_rounded
                        : _volume < 0.5
                            ? Icons.volume_down_rounded
                            : Icons.volume_up_rounded,
                    color: const Color(0xFF94A3B8),
                    size: 20,
                  ),
                  tooltip: _isMuted ? 'Unmute' : 'Mute',
                  onPressed: () {
                    setState(() {
                      if (_isMuted) {
                        _isMuted = false;
                        _volume = _previousVolume > 0 ? _previousVolume : 1.0;
                      } else {
                        _isMuted = true;
                        _previousVolume = _volume;
                        _volume = 0.0;
                      }
                      playerService.setVolume(_volume);
                    });
                  },
                ),
                SizedBox(
                  width: 80,
                  child: SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      trackHeight: 3,
                      thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 5),
                      overlayShape: const RoundSliderOverlayShape(overlayRadius: 10),
                      activeTrackColor: AppColors.cuteMint,
                      inactiveTrackColor: const Color(0xFF1E293B),
                      thumbColor: Colors.white,
                    ),
                    child: Slider(
                      value: _volume,
                      onChanged: (v) {
                        setState(() {
                          _volume = v;
                          _isMuted = v == 0;
                        });
                        playerService.setVolume(v);
                      },
                    ),
                  ),
                ),

                // Queue button
                IconButton(
                  icon: const Icon(Icons.queue_music_rounded, color: Color(0xFF94A3B8), size: 20),
                  tooltip: 'Queue',
                  onPressed: () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const QueueSheet(),
                    );
                  },
                ),

                // Fullscreen / NowPlaying expand
                IconButton(
                  icon: const Icon(Icons.open_in_full_rounded, color: Color(0xFF94A3B8), size: 18),
                  tooltip: 'Expand Player',
                  onPressed: () {
                    Navigator.of(context).push(
                      PageRouteBuilder(
                        pageBuilder: (_, __, ___) => const NowPlayingScreen(),
                        transitionsBuilder: (_, a, __, c) => FadeTransition(opacity: a, child: c),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
