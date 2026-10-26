import 'dart:async';
import 'dart:io';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:video_player/video_player.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/utilities/formatters.dart';
import '../../core/utilities/screen_keeper.dart';
import '../../core/utilities/url_resolver.dart';
import '../../data/models/song_model.dart';
import '../../data/repositories/music_repository.dart';
import '../../data/services/audio_player_service.dart';
import '../../data/services/download_service.dart';
import 'widgets/lyrics_sheet.dart';
import 'widgets/queue_sheet.dart';
import '../../shared/widgets/about_song_sheet.dart';
import '../playlists/widgets/add_to_playlist_dialog.dart';

class NowPlayingScreen extends StatefulWidget {
  const NowPlayingScreen({super.key});

  @override
  State<NowPlayingScreen> createState() => _NowPlayingScreenState();
}

class _NowPlayingScreenState extends State<NowPlayingScreen> with WidgetsBindingObserver {
  double? _dragPositionSeconds;

  // Video State
  bool _isVideoMode = false;
  VideoPlayerController? _videoController;
  bool _isVideoBuffering = false;
  String? _loadedVideoUrl;
  String? _lastSongId;
  bool _hasHandledVideoCompletion = false;

  // Audio Real-time Position ValueNotifier to isolate slider rebuilds
  final ValueNotifier<Duration> _positionNotifier = ValueNotifier<Duration>(Duration.zero);
  StreamSubscription<Duration>? _positionSubscription;

  // Volume State
  double _volume = 1.0;
  bool _isMuted = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _subscribePosition();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused ||
        state == AppLifecycleState.hidden) {
      // Screen turned off or user exited/backgrounded app during video
      if (_isVideoMode && _videoController != null && _videoController!.value.isInitialized) {
        if (_videoController!.value.isPlaying) {
          debugPrint('[NowPlaying] Screen off or app backgrounded: seamlessly continuing playback via background audio');
          _switchToAudio(preservePosition: true);
        }
      }
    }
  }

  void _subscribePosition() {
    final playerService = Provider.of<AudioPlayerService>(context, listen: false);
    _positionSubscription?.cancel();
    _positionSubscription = playerService.positionStream.listen((pos) {
      if (!_isVideoMode && _dragPositionSeconds == null) {
        _positionNotifier.value = pos;
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _positionSubscription?.cancel();
    _positionNotifier.dispose();
    ScreenKeeper.setKeepScreenOn(false);
    _cleanupVideoOnExit();
    super.dispose();
  }

  void _cleanupVideoOnExit() {
    ScreenKeeper.setKeepScreenOn(false);
    if (_videoController != null) {
      if (_isVideoMode && mounted) {
        final vPos = _videoController!.value.position;
        final wasPlaying = _videoController!.value.isPlaying;
        try {
          final playerService = context.read<AudioPlayerService>();
          playerService.seek(vPos);
          if (wasPlaying) {
            playerService.play();
          }
        } catch (_) {}
      }
      _videoController!.removeListener(_onVideoControllerTick);
      _videoController!.dispose();
      _videoController = null;
    }
  }

  Future<void> _initVideo(String videoUrl, {Duration startPosition = Duration.zero}) async {
    if (_loadedVideoUrl == videoUrl && _videoController != null && _videoController!.value.isInitialized) {
      if (startPosition > Duration.zero) {
        await _videoController!.seekTo(startPosition);
      }
      await _videoController!.play();
      ScreenKeeper.setKeepScreenOn(true);
      if (mounted) setState(() {});
      return;
    }

    if (_videoController != null) {
      _videoController!.removeListener(_onVideoControllerTick);
      await _videoController!.dispose();
      _videoController = null;
    }

    _loadedVideoUrl = videoUrl;
    if (mounted) {
      setState(() {
        _isVideoBuffering = true;
      });
    }

    try {
      final controller = VideoPlayerController.networkUrl(
        Uri.parse(videoUrl),
        videoPlayerOptions: VideoPlayerOptions(mixWithOthers: true),
      );
      _videoController = controller;
      await controller.initialize();
      controller.addListener(_onVideoControllerTick);

      if (startPosition > Duration.zero) {
        await controller.seekTo(startPosition);
      }
      await controller.setVolume(_isMuted ? 0.0 : _volume);
      await controller.play();
      ScreenKeeper.setKeepScreenOn(true);

      if (mounted) {
        setState(() {
          _isVideoBuffering = false;
        });
        _preWarmNextVideo();
      }
    } catch (e) {
      debugPrint('[NowPlaying] Failed to initialize video: $e');
      ScreenKeeper.setKeepScreenOn(false);
      if (mounted) {
        setState(() {
          _isVideoMode = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Video could not be loaded. Playing high-quality audio.'),
            duration: Duration(seconds: 2),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _preWarmNextVideo() {
    if (!mounted) return;
    try {
      final playerService = context.read<AudioPlayerService>();
      final nextIndex = playerService.currentIndex + 1;
      if (nextIndex < playerService.queue.length) {
        final nextSong = playerService.queue[nextIndex];
        if (nextSong.hasVideo && nextSong.videoUrl != null) {
          _preWarmMediaUrl(nextSong.videoUrl!);
        }
      }
    } catch (_) {}
  }

  Future<void> _preWarmMediaUrl(String url) async {
    try {
      final uri = Uri.tryParse(url);
      if (uri == null || !uri.hasScheme || !uri.scheme.startsWith('http')) return;
      final client = HttpClient()..connectionTimeout = const Duration(seconds: 6);
      final request = await client.getUrl(uri);
      request.headers.add('Range', 'bytes=0-262143');
      final response = await request.close();
      await response.drain();
      client.close();
    } catch (_) {}
  }

  void _onVideoControllerTick() {
    if (!mounted || _videoController == null) return;
    final value = _videoController!.value;
    final buffering = value.isBuffering;

    if (buffering != _isVideoBuffering) {
      setState(() => _isVideoBuffering = buffering);
    }

    // Keep screen awake while video is actively playing
    if (value.isPlaying) {
      ScreenKeeper.setKeepScreenOn(true);
    } else {
      ScreenKeeper.setKeepScreenOn(false);
    }

    // Automatic video completion transition
    if (value.duration > Duration.zero && value.position >= value.duration) {
      if (!_hasHandledVideoCompletion) {
        _hasHandledVideoCompletion = true;
        _onNextTrack();
      }
    } else {
      if (_hasHandledVideoCompletion && value.position < value.duration) {
        _hasHandledVideoCompletion = false;
      }
      if (_dragPositionSeconds == null) {
        _positionNotifier.value = value.position;
      }
    }
  }

  void _onNextTrack() {
    final playerService = context.read<AudioPlayerService>();
    if (playerService.repeatMode == AppRepeatMode.one) {
      if (_isVideoMode && _videoController != null) {
        _videoController!.seekTo(Duration.zero);
        _videoController!.play();
        _hasHandledVideoCompletion = false;
      } else {
        playerService.seek(Duration.zero);
        playerService.play();
      }
      return;
    }

    final nextIndex = playerService.currentIndex + 1;
    final queue = playerService.queue;
    Song? nextSong;
    if (nextIndex < queue.length) {
      nextSong = queue[nextIndex];
    } else if (playerService.repeatMode == AppRepeatMode.all && queue.isNotEmpty) {
      nextSong = queue.first;
    }

    if (nextSong == null) {
      if (_isVideoMode && _videoController != null) {
        _videoController!.pause();
        ScreenKeeper.setKeepScreenOn(false);
      }
      return;
    }

    if (_isVideoMode) {
      if (nextSong.hasVideo) {
        // Next song has video: maintain video mode and play next video
        _hasHandledVideoCompletion = false;
        playerService.next().then((_) {
          if (mounted) {
            playerService.pause();
            _initVideo(nextSong!.videoUrl!, startPosition: Duration.zero);
          }
        });
      } else {
        // Next song does not have video: automatically switch to audio mode
        _hasHandledVideoCompletion = false;
        _switchToAudio(preservePosition: false);
        playerService.next();
      }
    } else {
      playerService.next();
    }
  }

  void _onPreviousTrack() {
    final playerService = context.read<AudioPlayerService>();
    if (_isVideoMode && _videoController != null && _videoController!.value.position.inSeconds > 3) {
      _videoController!.seekTo(Duration.zero);
      _hasHandledVideoCompletion = false;
      return;
    }

    final prevIndex = playerService.currentIndex - 1;
    final queue = playerService.queue;
    Song? prevSong;
    if (prevIndex >= 0 && prevIndex < queue.length) {
      prevSong = queue[prevIndex];
    }

    if (prevSong == null) {
      if (_isVideoMode && _videoController != null) {
        _videoController!.seekTo(Duration.zero);
      } else {
        playerService.seek(Duration.zero);
      }
      return;
    }

    if (_isVideoMode) {
      if (prevSong.hasVideo) {
        _hasHandledVideoCompletion = false;
        playerService.previous().then((_) {
          if (mounted) {
            playerService.pause();
            _initVideo(prevSong!.videoUrl!, startPosition: Duration.zero);
          }
        });
      } else {
        _hasHandledVideoCompletion = false;
        _switchToAudio(preservePosition: false);
        playerService.previous();
      }
    } else {
      playerService.previous();
    }
  }

  void _switchToVideo(Song song) {
    if (!song.hasVideo) return;
    final playerService = context.read<AudioPlayerService>();
    final curPos = playerService.currentPosition;
    playerService.pause();

    setState(() {
      _isVideoMode = true;
      _hasHandledVideoCompletion = false;
    });

    _initVideo(song.videoUrl!, startPosition: curPos);
  }

  void _switchToAudio({bool preservePosition = true}) {
    Duration audioPos = Duration.zero;
    bool wasPlaying = true;

    if (_videoController != null) {
      if (preservePosition && _videoController!.value.isInitialized) {
        audioPos = _videoController!.value.position;
        wasPlaying = _videoController!.value.isPlaying;
      }
      _videoController!.pause();
    }

    ScreenKeeper.setKeepScreenOn(false);

    setState(() {
      _isVideoMode = false;
    });

    final playerService = context.read<AudioPlayerService>();
    if (preservePosition) {
      playerService.seek(audioPos);
    }
    if (wasPlaying) {
      playerService.play();
    }
  }

  void _setVolume(double newVol) {
    setState(() {
      _volume = newVol.clamp(0.0, 1.0);
      _isMuted = _volume == 0.0;
    });
    try {
      context.read<AudioPlayerService>().player.setVolume(_isMuted ? 0.0 : _volume);
    } catch (_) {}
    _videoController?.setVolume(_isMuted ? 0.0 : _volume);
  }

  void _toggleMute() {
    setState(() {
      _isMuted = !_isMuted;
    });
    final effectiveVol = _isMuted ? 0.0 : _volume;
    try {
      context.read<AudioPlayerService>().player.setVolume(effectiveVol);
    } catch (_) {}
    _videoController?.setVolume(effectiveVol);
  }

  @override
  Widget build(BuildContext context) {
    final playerService = context.watch<AudioPlayerService>();
    final repository = context.watch<MusicRepository>();
    final downloadService = context.watch<DownloadService>();

    final song = playerService.currentSong;

    if (song == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(leading: const BackButton()),
        body: const Center(
          child: Text('No song selected', style: TextStyle(color: AppColors.textMuted)),
        ),
      );
    }

    // Auto-detect track transition
    if (_lastSongId != song.id) {
      _lastSongId = song.id;
      _hasHandledVideoCompletion = false;
      if (_isVideoMode) {
        if (song.hasVideo) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              playerService.pause();
              _initVideo(song.videoUrl!, startPosition: Duration.zero);
            }
          });
        } else {
          // Song doesn't have video, fall back to audio automatically
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              _switchToAudio(preservePosition: false);
            }
          });
        }
      }
    }

    // Dynamic duration and playback state based on current active mode
    Duration duration;
    bool isPlaying;
    bool isBuffering;

    if (_isVideoMode && _videoController != null && _videoController!.value.isInitialized) {
      duration = _videoController!.value.duration;
      isPlaying = _videoController!.value.isPlaying;
      isBuffering = _isVideoBuffering;
    } else {
      duration = playerService.currentDuration;
      isPlaying = playerService.isPlaying;
      isBuffering = playerService.isBuffering;
    }

    final double maxSec = duration.inSeconds.toDouble() > 0 ? duration.inSeconds.toDouble() : 1.0;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.playerBackgroundGradient,
        ),
        child: SafeArea(
          child: Column(
            children: [
              // 1. Top Bar
              _buildTopBar(context, song, repository, downloadService),

              // 2. Audio / Video Mode Switcher (Pill Toggle)
              if (song.hasVideo)
                _buildModeSwitcher(song)
              else
                const SizedBox(height: 12),

              // 3. Center Player Stage (Artwork in Audio Mode, Clean Video in Video Mode)
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: _isVideoMode && song.hasVideo
                      ? _buildVideoStage(context, song)
                      : _buildAudioStage(song, repository),
                ),
              ),

              // 4. Unified Scrubber & Time Display (isolated position listener)
              ValueListenableBuilder<Duration>(
                valueListenable: _positionNotifier,
                builder: (context, currentPos, _) {
                  final double posSec = _dragPositionSeconds ?? currentPos.inSeconds.toDouble().clamp(0.0, maxSec);
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      children: [
                        SliderTheme(
                          data: SliderTheme.of(context).copyWith(
                            trackHeight: 3.5,
                            thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                            overlayShape: const RoundSliderOverlayShape(overlayRadius: 14),
                            activeTrackColor: AppColors.primary,
                            inactiveTrackColor: Colors.white.withOpacity(0.2),
                            thumbColor: AppColors.primary,
                            overlayColor: AppColors.primary.withOpacity(0.2),
                          ),
                          child: Slider(
                            value: posSec.clamp(0.0, maxSec),
                            min: 0.0,
                            max: maxSec,
                            onChangeStart: (val) {
                              setState(() => _dragPositionSeconds = val);
                            },
                            onChanged: (val) {
                              setState(() => _dragPositionSeconds = val);
                            },
                            onChangeEnd: (val) {
                              final targetSec = val.toInt();
                              if (_isVideoMode && _videoController != null) {
                                _videoController!.seekTo(Duration(seconds: targetSec));
                              } else {
                                playerService.seek(Duration(seconds: targetSec));
                              }
                              setState(() => _dragPositionSeconds = null);
                            },
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                AppFormatters.formatDuration(
                                  _dragPositionSeconds != null
                                      ? Duration(seconds: _dragPositionSeconds!.toInt())
                                      : currentPos,
                                ),
                                style: AppTypography.caption.copyWith(
                                  fontFamily: 'monospace',
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              Text(
                                '-${AppFormatters.formatDuration(duration > currentPos ? duration - currentPos : Duration.zero)}',
                                style: AppTypography.caption.copyWith(
                                  fontFamily: 'monospace',
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),

              const SizedBox(height: 10),

              // 5. Unified Player Control Buttons
              _buildControlButtons(playerService, isPlaying, isBuffering),

              const SizedBox(height: 12),

              // 6. Volume Slider at Bottom
              _buildVolumeSlider(),

              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  // ==================== TOP BAR ====================
  Widget _buildTopBar(
    BuildContext context,
    Song song,
    MusicRepository repository,
    DownloadService downloadService,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 30),
            onPressed: () => Navigator.pop(context),
            visualDensity: VisualDensity.compact,
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(
                    song.album.toUpperCase(),
                    style: AppTypography.caption.copyWith(
                      letterSpacing: 1.5,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                      fontSize: 12.5,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 2),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 1.5),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      song.genre?.isNotEmpty == true ? song.genre! : 'Tamil',
                      style: AppTypography.caption.copyWith(
                        color: AppColors.textSecondary,
                        fontSize: 9.5,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.lyrics_outlined, color: AppColors.textSecondary, size: 20),
                tooltip: 'Lyrics',
                visualDensity: VisualDensity.compact,
                padding: const EdgeInsets.all(6),
                constraints: const BoxConstraints(),
                onPressed: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) => LyricsSheet(song: song),
                  );
                },
              ),
              const SizedBox(width: 4),
              IconButton(
                icon: const Icon(Icons.queue_music_rounded, color: AppColors.textSecondary, size: 22),
                tooltip: 'Queue',
                visualDensity: VisualDensity.compact,
                padding: const EdgeInsets.all(6),
                constraints: const BoxConstraints(),
                onPressed: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) => const QueueSheet(),
                  );
                },
              ),
              const SizedBox(width: 4),
              IconButton(
                icon: const Icon(Icons.more_vert_rounded, size: 20),
                visualDensity: VisualDensity.compact,
                padding: const EdgeInsets.all(6),
                constraints: const BoxConstraints(),
                onPressed: () => _showMoreMenu(context, song, repository, downloadService),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ==================== MODE SWITCHER ====================
  Widget _buildModeSwitcher(Song song) {
    return Padding(
      padding: const EdgeInsets.only(top: 4, bottom: 12),
      child: Center(
        child: Container(
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.08),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.white.withOpacity(0.12)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Song (Audio) Tab
              GestureDetector(
                onTap: _isVideoMode ? _switchToAudio : null,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
                  decoration: BoxDecoration(
                    color: !_isVideoMode ? AppColors.primary : Colors.transparent,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: !_isVideoMode
                        ? [
                            BoxShadow(
                              color: AppColors.primary.withOpacity(0.4),
                              blurRadius: 12,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : null,
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.music_note_rounded,
                        size: 14,
                        color: !_isVideoMode ? Colors.black : AppColors.textMuted,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Song (Audio)',
                        style: TextStyle(
                          color: !_isVideoMode ? Colors.black : AppColors.textMuted,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Direct Video Song Tab
              GestureDetector(
                onTap: !_isVideoMode ? () => _switchToVideo(song) : null,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
                  decoration: BoxDecoration(
                    color: _isVideoMode ? AppColors.primary : Colors.transparent,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: _isVideoMode
                        ? [
                            BoxShadow(
                              color: AppColors.primary.withOpacity(0.4),
                              blurRadius: 12,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : null,
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.movie_creation_rounded,
                        size: 14,
                        color: _isVideoMode ? Colors.white : AppColors.textMuted,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Direct Video Song',
                        style: TextStyle(
                          color: _isVideoMode ? Colors.white : AppColors.textMuted,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ==================== AUDIO STAGE ====================
  Widget _buildAudioStage(Song song, MusicRepository repository) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Spacer(flex: 1),

        // Album Artwork
        Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: AspectRatio(
              aspectRatio: 1,
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.28),
                      blurRadius: 36,
                      spreadRadius: 2,
                      offset: const Offset(0, 14),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: _buildArtwork(song),
                ),
              ),
            ),
          ),
        ),

        const Spacer(flex: 1),

        // Song Info Row
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      song.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.heading2.copyWith(fontSize: 22),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      song.artist,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.bodySecondary.copyWith(
                        fontSize: 15,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(
                  repository.isFavorite(song.id) ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                  color: repository.isFavorite(song.id) ? AppColors.primary : AppColors.textMuted,
                  size: 28,
                ),
                onPressed: () => repository.toggleFavorite(song.id),
              ),
            ],
          ),
        ),
        const SizedBox(height: 6),
      ],
    );
  }

  // ==================== VIDEO STAGE ====================
  Widget _buildVideoStage(BuildContext context, Song song) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // 16:9 Clean Video Container
        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withOpacity(0.2), width: 1.0),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withOpacity(0.35),
                blurRadius: 28,
                spreadRadius: 1,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: AspectRatio(
              aspectRatio: 16 / 9,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  if (_videoController != null && _videoController!.value.isInitialized)
                    GestureDetector(
                      onTap: () {
                        if (_videoController!.value.isPlaying) {
                          _videoController!.pause();
                        } else {
                          _videoController!.play();
                        }
                        setState(() {});
                      },
                      child: VideoPlayer(_videoController!),
                    )
                  else
                    const Center(
                      child: CircularProgressIndicator(
                        color: AppColors.primary,
                        strokeWidth: 2.8,
                      ),
                    ),

                  if (_isVideoBuffering)
                    const Center(
                      child: CircularProgressIndicator(
                        color: AppColors.primary,
                        strokeWidth: 2.8,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),

        const SizedBox(height: 14),

        // Video Controls / Switch Row matching user's screenshot
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.movie_creation_rounded,
                        color: AppColors.primary,
                        size: 16,
                      ),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          song.title,
                          style: AppTypography.title.copyWith(fontSize: 16, fontWeight: FontWeight.bold),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: AppColors.primary.withOpacity(0.4), width: 0.5),
                        ),
                        child: const Text(
                          'DIRECT VIDEO',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 8.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    song.artist,
                    style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),

            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                // "Switch to Audio" pill button
                InkWell(
                  onTap: _switchToAudio,
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.white.withOpacity(0.15)),
                    ),
                    child: Text(
                      'Switch to Audio',
                      style: AppTypography.caption.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  // ==================== UNIFIED CONTROL BUTTONS ====================
  Widget _buildControlButtons(
    AudioPlayerService playerService,
    bool isPlaying,
    bool isBuffering,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // Shuffle
          IconButton(
            icon: Icon(
              Icons.shuffle_rounded,
              color: playerService.isShuffle ? AppColors.primary : AppColors.textMuted,
              size: 22,
            ),
            onPressed: () => playerService.toggleShuffle(),
          ),

          // Previous
          IconButton(
            icon: const Icon(Icons.skip_previous_rounded, size: 36),
            onPressed: _onPreviousTrack,
          ),

          // Big Play/Pause circular button (Jalra electric green gradient)
          GestureDetector(
            onTap: () {
              if (_isVideoMode && _videoController != null) {
                if (_videoController!.value.isPlaying) {
                  _videoController!.pause();
                  ScreenKeeper.setKeepScreenOn(false);
                } else {
                  _videoController!.play();
                  ScreenKeeper.setKeepScreenOn(true);
                }
                setState(() {});
              } else {
                playerService.togglePlayPause();
              }
            },
            child: Container(
              width: 66,
              height: 66,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [AppColors.primary, AppColors.primaryDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.55),
                    blurRadius: 24,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Center(
                child: isBuffering
                    ? const SizedBox(
                        width: 26,
                        height: 26,
                        child: CircularProgressIndicator(
                          color: Colors.black,
                          strokeWidth: 2.8,
                        ),
                      )
                    : Icon(
                        isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                        color: Colors.black,
                        size: 38,
                      ),
              ),
            ),
          ),

          // Next
          IconButton(
            icon: const Icon(Icons.skip_next_rounded, size: 36),
            onPressed: _onNextTrack,
          ),

          // Repeat
          IconButton(
            icon: Icon(
              playerService.repeatMode == AppRepeatMode.one
                  ? Icons.repeat_one_rounded
                  : Icons.repeat_rounded,
              color: playerService.repeatMode != AppRepeatMode.off
                  ? AppColors.primary
                  : AppColors.textMuted,
              size: 22,
            ),
            onPressed: () => playerService.toggleRepeat(),
          ),
        ],
      ),
    );
  }

  // ==================== VOLUME SLIDER ====================
  Widget _buildVolumeSlider() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Row(
        children: [
          IconButton(
            icon: Icon(
              _isMuted || _volume == 0.0 ? Icons.volume_off_rounded : Icons.volume_up_rounded,
              color: AppColors.textSecondary,
              size: 20,
            ),
            onPressed: _toggleMute,
          ),
          Expanded(
            child: SliderTheme(
              data: SliderTheme.of(context).copyWith(
                trackHeight: 2.5,
                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 4.5),
                overlayShape: const RoundSliderOverlayShape(overlayRadius: 10),
                activeTrackColor: Colors.white,
                inactiveTrackColor: Colors.white.withOpacity(0.2),
                thumbColor: Colors.white,
              ),
              child: Slider(
                value: _isMuted ? 0.0 : _volume,
                min: 0.0,
                max: 1.0,
                onChanged: _setVolume,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==================== ARTWORK BUILDER ====================
  Widget _buildArtwork(Song song) {
    final assetPath = AppUrls.getLocalAssetCoverPath(song.thumbnailUrl);
    final resolvedUrl = AppUrls.resolveThumbnailUrl(song.thumbnailUrl);

    // 1. Instant local asset cover (offline, 0 latency)
    if (assetPath != null) {
      return Image.asset(
        assetPath,
        key: ValueKey('now_playing_art_${song.id}'),
        fit: BoxFit.cover,
        cacheWidth: 600,
        cacheHeight: 600,
        errorBuilder: (_, __, ___) {
          if (resolvedUrl != null) {
            return CachedNetworkImage(
              key: ValueKey('now_playing_net_art_${song.id}'),
              imageUrl: resolvedUrl,
              fit: BoxFit.cover,
              memCacheWidth: 600,
              memCacheHeight: 600,
              placeholder: (_, __) => _buildArtworkPlaceholder(),
              errorWidget: (_, __, ___) => _buildArtworkPlaceholder(),
            );
          }
          return _buildArtworkPlaceholder();
        },
      );
    }

    // 2. Resolved network URL (GitHub CDN fallback)
    if (resolvedUrl != null) {
      return CachedNetworkImage(
        key: ValueKey('now_playing_net_art_${song.id}'),
        imageUrl: resolvedUrl,
        fit: BoxFit.cover,
        memCacheWidth: 600,
        memCacheHeight: 600,
        placeholder: (_, __) => _buildArtworkPlaceholder(),
        errorWidget: (_, __, ___) => _buildArtworkPlaceholder(),
      );
    }

    // 3. Local downloaded / cached file
    if (song.thumbnailUrl != null && song.thumbnailUrl!.isNotEmpty) {
      final file = File(song.thumbnailUrl!);
      if (file.existsSync()) {
        return Image.file(file, fit: BoxFit.cover);
      }
    }

    return _buildArtworkPlaceholder();
  }

  Widget _buildArtworkPlaceholder() {
    return Container(
      decoration: const BoxDecoration(
        gradient: AppColors.waveGradient,
      ),
      child: const Center(
        child: Icon(Icons.music_note_rounded, size: 80, color: Colors.white),
      ),
    );
  }

  // ==================== MORE OPTIONS (NO URLS) ====================
  void _showMoreMenu(
    BuildContext context,
    Song song,
    MusicRepository repo,
    DownloadService dlService,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (song.hasVideo)
              ListTile(
                leading: const Icon(Icons.smart_display_rounded, color: AppColors.primary),
                title: Text(
                  _isVideoMode ? 'Switch to Audio' : 'Direct Video Song',
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                ),
                onTap: () {
                  Navigator.pop(ctx);
                  if (_isVideoMode) {
                    _switchToAudio();
                  } else {
                    _switchToVideo(song);
                  }
                },
              ),
            ListTile(
              leading: const Icon(Icons.playlist_add_rounded, color: AppColors.textSecondary),
              title: const Text('Add to Playlist'),
              onTap: () {
                Navigator.pop(ctx);
                showDialog(
                  context: context,
                  builder: (_) => AddToPlaylistDialog(song: song),
                );
              },
            ),
            ListTile(
              leading: Icon(
                song.isDownloaded ? Icons.delete_outline_rounded : Icons.download_rounded,
                color: song.isDownloaded ? AppColors.error : AppColors.accentEmerald,
              ),
              title: Text(song.isDownloaded ? 'Remove Offline Download' : 'Download Offline'),
              onTap: () {
                Navigator.pop(ctx);
                if (song.isDownloaded) {
                  dlService.deleteDownload(song);
                } else {
                  dlService.startDownload(song);
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.info_outline_rounded, color: AppColors.primary),
              title: const Text('About This Song'),
              subtitle: const Text('Track, artists, album & release details'),
              onTap: () {
                Navigator.pop(ctx);
                AboutSongSheet.show(context, song);
              },
            ),
            ListTile(
              leading: const Icon(Icons.high_quality_rounded, color: AppColors.accentCyan),
              title: const Text('Audio Quality'),
              subtitle: const Text('Direct Master Stream (320kbps Lossless Audio)'),
              onTap: () => Navigator.pop(ctx),
            ),
          ],
        ),
      ),
    );
  }
}
