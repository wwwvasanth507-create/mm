import 'dart:async';
import 'dart:io';
import 'dart:math';
import 'package:audio_session/audio_session.dart';
import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';
import 'package:just_audio_background/just_audio_background.dart';
import '../models/song_model.dart';
import '../repositories/music_repository.dart';
import 'audio_clarity_engine.dart';
import 'cover_cache_service.dart';

enum AppRepeatMode {
  off,
  all,
  one,
}

class AudioPlayerService extends ChangeNotifier {
  final AndroidEqualizer? _equalizer = AudioClarityEngine.isPlatformEqualizerSupported
      ? AndroidEqualizer()
      : null;

  late final AudioPlayer _player = AudioPlayer(
    audioPipeline: _equalizer != null ? AudioPipeline(androidAudioEffects: [_equalizer]) : null,
    audioLoadConfiguration: kIsWeb
        ? null
        : const AudioLoadConfiguration(
            androidLoadControl: AndroidLoadControl(
              minBufferDuration: Duration(seconds: 8),
              maxBufferDuration: Duration(seconds: 30),
              bufferForPlaybackDuration: Duration(milliseconds: 250),
              bufferForPlaybackAfterRebufferDuration: Duration(milliseconds: 500),
              prioritizeTimeOverSizeThresholds: true,
              backBufferDuration: Duration(seconds: 15),
            ),
          ),
  );
  final MusicRepository _repository;

  int _currentPlaySessionId = 0;
  List<Song> _queue = [];
  List<Song> _originalQueue = [];
  List<Song> _lastLoadedQueue = [];
  int _currentIndex = -1;
  AppRepeatMode _repeatMode = AppRepeatMode.all;
  bool _isShuffle = false;
  bool _isBuffering = false;
  bool _isSettingSource = false;
  bool _isVideoMode = false;
  String? _errorMessage;

  StreamSubscription? _playerStateSubscription;
  StreamSubscription? _durationSubscription;
  StreamSubscription? _currentIndexSubscription;
  StreamSubscription? _becomingNoisySubscription;
  StreamSubscription? _interruptionSubscription;

  bool get isVideoMode => _isVideoMode;

  void setVideoMode(bool active) {
    _isVideoMode = active;
    if (active) {
      _player.pause();
    }
    notifyListeners();
  }

  AudioPlayerService({required MusicRepository repository})
      : _repository = repository {
    _initAudioSession();
    _initPlayerListeners();
    try {
      _player.setLoopMode(LoopMode.all);
    } catch (_) {}
  }

  Future<void> _initAudioSession() async {
    try {
      final session = await AudioSession.instance;
      await session.configure(const AudioSessionConfiguration.music());

      // Auto-pause when headphones or Bluetooth audio device is disconnected
      _becomingNoisySubscription = session.becomingNoisyEventStream.listen((_) {
        if (_player.playing) {
          pause();
        }
      });

      // Handle transient audio focus interruptions (phone calls, alarms, etc.)
      _interruptionSubscription = session.interruptionEventStream.listen((event) {
        if (event.begin) {
          switch (event.type) {
            case AudioInterruptionType.duck:
              _player.setVolume(AudioClarityEngine.kDigitalHeadroomVolume * 0.4);
              break;
            case AudioInterruptionType.pause:
            case AudioInterruptionType.unknown:
              if (_player.playing) {
                pause();
              }
              break;
          }
        } else {
          switch (event.type) {
            case AudioInterruptionType.duck:
              _player.setVolume(AudioClarityEngine.kDigitalHeadroomVolume);
              break;
            case AudioInterruptionType.pause:
              break;
            case AudioInterruptionType.unknown:
              break;
          }
        }
      });

      // Initialize the built-in acoustic clarity equalizer tuning & digital headroom
      unawaited(AudioClarityEngine.instance.applyBuiltInTuning(_equalizer, _player));
    } catch (e) {
      debugPrint('[AudioPlayerService] AudioSession note: $e');
    }
  }

  AndroidEqualizer? get equalizer => _equalizer;
  AudioPlayer get player => _player;
  List<Song> get queue => _queue;
  int get currentIndex => _currentIndex;
  Song? get currentSong =>
      (_currentIndex >= 0 && _currentIndex < _queue.length)
          ? _queue[_currentIndex]
          : null;

  bool get isPlaying => _player.playing;
  bool get isBuffering => _isBuffering;
  AppRepeatMode get repeatMode => _repeatMode;
  bool get isShuffle => _isShuffle;
  String? get errorMessage => _errorMessage;

  Stream<Duration> get positionStream => _player.positionStream;
  Stream<Duration?> get durationStream => _player.durationStream;
  Stream<PlayerState> get playerStateStream => _player.playerStateStream;
  Stream<int?> get currentIndexStream => _player.currentIndexStream;

  Duration get currentPosition => _player.position;
  Duration get currentDuration => _player.duration ?? Duration.zero;
  Duration get position => currentPosition;
  Duration get duration => currentDuration;
  bool get isLooping => _repeatMode != AppRepeatMode.off;

  void toggleLoop() => cycleRepeatMode();
  Future<void> setVolume(double vol) => _player.setVolume(vol.clamp(0.0, 1.0));

  void _initPlayerListeners() {
    bool? lastPlaying;
    ProcessingState? lastState;
    _playerStateSubscription = _player.playerStateStream.listen((state) {
      final buffering = state.processingState == ProcessingState.buffering ||
          state.processingState == ProcessingState.loading;
      final playing = state.playing;
      final procState = state.processingState;

      // Ironclad protection: Never allow audio to play while video mode is active
      if (_isVideoMode && playing) {
        _player.pause();
        return;
      }

      bool stateChanged = false;
      if (procState == ProcessingState.idle || procState == ProcessingState.completed) {
        if (_isBuffering) {
          _isBuffering = false;
          stateChanged = true;
        }
      } else if (buffering != _isBuffering) {
        _isBuffering = buffering;
        stateChanged = true;
      }
      if (playing != lastPlaying) {
        lastPlaying = playing;
        stateChanged = true;
        if (playing && _isBuffering) {
          _isBuffering = false;
        }
      }
      if (procState != lastState) {
        lastState = procState;
        stateChanged = true;
        if (procState == ProcessingState.completed && !_isSettingSource) {
          _handleTrackCompleted();
        }
      }

      if (stateChanged) {
        notifyListeners();
      }
    }, onError: (e) {
      _errorMessage = 'Playback error: $e';
      _isBuffering = false;
      notifyListeners();
    });

    _durationSubscription = _player.durationStream.listen((_) {
      notifyListeners();
    });

    // Automatically sync when user skips songs from Android Lock Screen or Notification Shade
    _currentIndexSubscription = _player.currentIndexStream.listen((index) {
      if (_isSettingSource || _isVideoMode) return;
      if (index != null && index != _currentIndex && index >= 0 && index < _queue.length) {
        _currentIndex = index;
        final song = currentSong;
        if (song != null) {
          _repository.recordPlayback(song.id);
        }
        notifyListeners();
      }
    });
  }

  void _handleTrackCompleted() {
    if (_isVideoMode) {
      // In video mode, completion and automatic track transition is driven by the video player
      return;
    }
    if (_repeatMode == AppRepeatMode.one) {
      seek(Duration.zero);
      _player.play();
    } else if (hasNext) {
      next();
    } else if (_repeatMode == AppRepeatMode.all && _queue.isNotEmpty) {
      playAtIndex(0);
    } else if (currentSong != null) {
      // Seamlessly keep the music vibe going with similar feelings songs
      final moreSimilar = _repository.getSimilarSongs(currentSong!);
      final fresh = moreSimilar.where((s) => !_queue.any((q) => q.id == s.id)).toList();
      if (fresh.isNotEmpty) {
        _queue.addAll(fresh);
        _originalQueue.addAll(fresh);
        next();
      } else {
        _player.stop();
      }
    } else {
      _player.stop();
    }
  }

  bool get hasNext => _player.hasNext || _currentIndex < _queue.length - 1;
  bool get hasPrevious => _player.hasPrevious || _currentIndex > 0;

  AudioSource _buildAudioSource(Song song) {
    final artUri = CoverCacheService.getMediaItemArtUri(song.thumbnailUrl);

    final mediaItem = MediaItem(
      id: song.id,
      album: song.album,
      title: song.title,
      artist: song.artist,
      artUri: artUri,
      duration: song.duration,
      displayTitle: song.title,
      displaySubtitle: song.artist,
      displayDescription: null,
    );

    // Fast check for local downloaded file without redundant scans
    if (!kIsWeb && song.isDownloaded && song.localFilePath != null) {
      final file = File(song.localFilePath!);
      if (file.existsSync()) {
        return AudioSource.file(
          file.path,
          tag: mediaItem,
        );
      }
    }

    return AudioSource.uri(
      Uri.parse(song.audioUrl),
      tag: mediaItem,
    );
  }

  /// Sync live song state (e.g. favorite or download) within active queue
  void syncSongState(String songId, {bool? isFavorite, bool? isDownloaded, String? localFilePath}) {
    bool changed = false;
    _queue = _queue.map((s) {
      if (s.id == songId) {
        changed = true;
        return s.copyWith(
          isFavorite: isFavorite ?? s.isFavorite,
          isDownloaded: isDownloaded ?? s.isDownloaded,
          localFilePath: localFilePath ?? s.localFilePath,
        );
      }
      return s;
    }).toList();

    _originalQueue = _originalQueue.map((s) {
      if (s.id == songId) {
        return s.copyWith(
          isFavorite: isFavorite ?? s.isFavorite,
          isDownloaded: isDownloaded ?? s.isDownloaded,
          localFilePath: localFilePath ?? s.localFilePath,
        );
      }
      return s;
    }).toList();

    if (changed) {
      notifyListeners();
    }
  }

  bool _isSameQueue(List<Song> a, List<Song> b) {
    if (a.length != b.length) return false;
    for (int i = 0; i < a.length; i++) {
      if (a[i].id != b[i].id) return false;
    }
    return true;
  }

  /// Play a specific song and update queue
  Future<void> playSong(Song song, {List<Song>? queue, bool autoPlay = true}) async {
    _errorMessage = null;
    _isVideoMode = !autoPlay;

    if (queue != null && queue.isNotEmpty) {
      _originalQueue = List.from(queue);
      _queue = List.from(queue);
      _currentIndex = _queue.indexWhere((s) => s.id == song.id);
      if (_currentIndex == -1) {
        _queue.insert(0, song);
        _currentIndex = 0;
      }
    } else {
      final all = _repository.songs;
      final songIndex = all.indexWhere((s) => s.id == song.id);
      if (songIndex != -1) {
        _queue = List.from(all);
        _originalQueue = List.from(all);
        _currentIndex = songIndex;
      } else {
        final similar = _repository.getSimilarSongs(song);
        _queue = [song, ...similar];
        _originalQueue = List.from(_queue);
        _currentIndex = 0;
      }
    }

    // Immediate 0ms tap feedback: UI shows track selected immediately
    _isBuffering = autoPlay;
    notifyListeners();

    // Fire cover extraction in the background without blocking playback
    unawaited(CoverCacheService.ensureCoverExtracted(song.thumbnailUrl));

    await _updatePlaylistAndPlay(targetIndex: _currentIndex, autoPlay: autoPlay);
  }

  /// Play a full queue starting from index
  Future<void> playQueue(List<Song> songs, {int initialIndex = 0}) async {
    if (songs.isEmpty) return;
    _isVideoMode = false;

    _originalQueue = List.from(songs);
    _queue = List.from(songs);
    _currentIndex = initialIndex.clamp(0, _queue.length - 1);

    if (_isShuffle) {
      _applyShuffle();
    }

    // Immediate 0ms tap feedback
    _isBuffering = true;
    notifyListeners();

    if (_currentIndex >= 0 && _currentIndex < _queue.length) {
      unawaited(CoverCacheService.ensureCoverExtracted(_queue[_currentIndex].thumbnailUrl));
    }

    await _updatePlaylistAndPlay(targetIndex: _currentIndex, autoPlay: true);
  }

  Future<void> _updatePlaylistAndPlay({int? targetIndex, bool? autoPlay}) async {
    final index = targetIndex ?? _currentIndex;
    if (_queue.isEmpty || index < 0 || index >= _queue.length) return;

    final shouldPlay = (autoPlay ?? true) && !_isVideoMode;

    final sessionId = ++_currentPlaySessionId;
    _currentIndex = index;
    final song = currentSong;
    if (song == null) return;

    _errorMessage = null;
    _isBuffering = true;
    _isSettingSource = true;
    notifyListeners();

    try {
      _repository.recordPlayback(song.id);
      unawaited(CoverCacheService.ensureCoverExtracted(song.thumbnailUrl));

      if (_player.audioSource != null && _isSameQueue(_queue, _lastLoadedQueue)) {
        // Fast instant track switch: 0ms reloading overhead
        await _player.seek(Duration.zero, index: _currentIndex);
        if (_currentPlaySessionId != sessionId) return;
        if (shouldPlay) {
          unawaited(_player.play());
        } else {
          await _player.pause();
        }
      } else {
        _lastLoadedQueue = List.from(_queue);

        final playlist = ConcatenatingAudioSource(
          useLazyPreparation: true,
          children: _queue.map((s) => _buildAudioSource(s)).toList(),
        );

        if (_currentPlaySessionId != sessionId) return;

        // Set audio source with immediate preload
        await _player.setAudioSource(
          playlist,
          initialIndex: _currentIndex,
          initialPosition: Duration.zero,
          preload: true,
        );

        if (_currentPlaySessionId != sessionId) return;

        if (shouldPlay) {
          unawaited(_player.play());
        } else {
          await _player.pause();
        }
      }

      if (_currentPlaySessionId == sessionId) {
        _isBuffering = false;
        notifyListeners();
        _preloadAdjacentTracks();
      }
    } catch (e) {
      if (_currentPlaySessionId == sessionId) {
        debugPrint('[AudioPlayerService] Playback error: $e');
        _errorMessage = 'Unable to stream audio: Please verify network ($e)';
        _isBuffering = false;
        notifyListeners();
      }
    } finally {
      if (_currentPlaySessionId == sessionId) {
        Future.delayed(const Duration(milliseconds: 150), () {
          _isSettingSource = false;
        });
      }
    }
  }

  void _preloadAdjacentTracks() {
    // Pre-warm local/disk cache of adjacent next track in queue
    if (_currentIndex + 1 < _queue.length) {
      final nextSong = _queue[_currentIndex + 1];
      CoverCacheService.ensureCoverExtracted(nextSong.thumbnailUrl);
    }
  }

  Future<void> togglePlayPause() async {
    if (_isVideoMode) return;
    if (_player.playing) {
      await _player.pause();
    } else {
      if (currentSong != null) {
        await _player.play();
      }
    }
    notifyListeners();
  }

  Future<void> resume() async {
    if (_isVideoMode) return;
    await _player.play();
    notifyListeners();
  }

  Future<void> play() => resume();

  Future<void> pause() async {
    await _player.pause();
    notifyListeners();
  }

  Future<void> seek(Duration position) async {
    await _player.seek(position);
  }

  Future<void> next({bool? autoPlay}) async {
    final shouldPlay = autoPlay ?? !_isVideoMode;
    if (_queue.isEmpty) return;
    int nextIdx = _currentIndex + 1;
    if (nextIdx >= _queue.length) {
      if (_repeatMode == AppRepeatMode.all) {
        nextIdx = 0;
      } else {
        return;
      }
    }

    _currentIndex = nextIdx;
    final song = currentSong;
    if (song != null) {
      _repository.recordPlayback(song.id);
    }
    notifyListeners();

    if (!shouldPlay) {
      await _player.pause();
    }

    if (_player.audioSource != null && _isSameQueue(_queue, _lastLoadedQueue)) {
      await _player.seek(Duration.zero, index: _currentIndex);
      if (shouldPlay) {
        unawaited(_player.play());
      } else {
        await _player.pause();
      }
    } else {
      await _updatePlaylistAndPlay(targetIndex: _currentIndex, autoPlay: shouldPlay);
    }
  }

  Future<void> previous({bool? autoPlay}) async {
    final shouldPlay = autoPlay ?? !_isVideoMode;
    if (_queue.isEmpty) return;
    if (_player.position.inSeconds > 3) {
      await seek(Duration.zero);
      return;
    }

    int prevIdx = _currentIndex - 1;
    if (prevIdx < 0) {
      if (_repeatMode == AppRepeatMode.all) {
        prevIdx = _queue.length - 1;
      } else {
        await seek(Duration.zero);
        return;
      }
    }

    _currentIndex = prevIdx;
    final song = currentSong;
    if (song != null) {
      _repository.recordPlayback(song.id);
    }
    notifyListeners();

    if (!shouldPlay) {
      await _player.pause();
    }

    if (_player.audioSource != null && _isSameQueue(_queue, _lastLoadedQueue)) {
      await _player.seek(Duration.zero, index: _currentIndex);
      if (shouldPlay) {
        unawaited(_player.play());
      } else {
        await _player.pause();
      }
    } else {
      await _updatePlaylistAndPlay(targetIndex: _currentIndex, autoPlay: shouldPlay);
    }
  }

  Future<void> playAtIndex(int index, {bool autoPlay = true}) async {
    if (index >= 0 && index < _queue.length) {
      _currentIndex = index;
      final song = currentSong;
      if (song != null) {
        _repository.recordPlayback(song.id);
      }
      notifyListeners();

      if (!autoPlay || _isVideoMode) {
        await _player.pause();
      }

      if (_player.audioSource != null && _queue.length == _originalQueue.length) {
        await _player.seek(Duration.zero, index: index);
        if (autoPlay && !_isVideoMode) {
          unawaited(_player.play());
        } else {
          await _player.pause();
        }
      } else {
        await _updatePlaylistAndPlay(targetIndex: index, autoPlay: autoPlay && !_isVideoMode);
      }
    }
  }

  void toggleShuffle() {
    _isShuffle = !_isShuffle;
    final current = currentSong;

    if (_isShuffle) {
      _applyShuffle();
    } else {
      _queue = List.from(_originalQueue);
      if (current != null) {
        _currentIndex = _queue.indexWhere((s) => s.id == current.id);
      }
    }

    if (_player.audioSource != null) {
      _player.setShuffleModeEnabled(_isShuffle);
    }
    notifyListeners();
  }

  void _applyShuffle() {
    final current = currentSong;
    final remaining = List<Song>.from(_originalQueue);
    if (current != null) {
      remaining.removeWhere((s) => s.id == current.id);
    }
    remaining.shuffle(Random());
    if (current != null) {
      _queue = [current, ...remaining];
      _currentIndex = 0;
    } else {
      _queue = remaining;
    }
  }

  void cycleRepeatMode() {
    switch (_repeatMode) {
      case AppRepeatMode.off:
        _repeatMode = AppRepeatMode.all;
        _player.setLoopMode(LoopMode.all);
        break;
      case AppRepeatMode.all:
        _repeatMode = AppRepeatMode.one;
        _player.setLoopMode(LoopMode.one);
        break;
      case AppRepeatMode.one:
        _repeatMode = AppRepeatMode.off;
        _player.setLoopMode(LoopMode.off);
        break;
    }
    notifyListeners();
  }

  void toggleRepeat() => cycleRepeatMode();

  void addToQueue(Song song) {
    if (!_queue.any((s) => s.id == song.id)) {
      _queue.add(song);
      _originalQueue.add(song);
      notifyListeners();
    }
  }

  void playNext(Song song) {
    _queue.removeWhere((s) => s.id == song.id);
    _originalQueue.removeWhere((s) => s.id == song.id);

    final insertIndex = (_currentIndex + 1).clamp(0, _queue.length);
    _queue.insert(insertIndex, song);
    _originalQueue.insert(insertIndex, song);
    notifyListeners();
  }

  void removeFromQueue(int index) {
    if (index >= 0 && index < _queue.length) {
      final removedSong = _queue.removeAt(index);
      _originalQueue.removeWhere((s) => s.id == removedSong.id);

      if (index < _currentIndex) {
        _currentIndex--;
      } else if (index == _currentIndex) {
        if (_queue.isEmpty) {
          _player.stop();
          _currentIndex = -1;
        } else {
          _currentIndex = _currentIndex.clamp(0, _queue.length - 1);
          _updatePlaylistAndPlay();
        }
      }
      notifyListeners();
    }
  }

  void reorderQueue(int oldIndex, int newIndex) {
    if (oldIndex < newIndex) {
      newIndex -= 1;
    }
    final song = _queue.removeAt(oldIndex);
    _queue.insert(newIndex, song);

    // Update currentIndex
    if (_currentIndex == oldIndex) {
      _currentIndex = newIndex;
    } else if (oldIndex < _currentIndex && newIndex >= _currentIndex) {
      _currentIndex--;
    } else if (oldIndex > _currentIndex && newIndex <= _currentIndex) {
      _currentIndex++;
    }
    notifyListeners();
  }

  void clearQueue() {
    _player.stop();
    _queue.clear();
    _originalQueue.clear();
    _currentIndex = -1;
    notifyListeners();
  }

  @visibleForTesting
  void setTestQueue(List<Song> songs, {int initialIndex = 0}) {
    _originalQueue = List.from(songs);
    _queue = List.from(songs);
    _currentIndex = songs.isEmpty ? -1 : initialIndex.clamp(0, _queue.length - 1);
    notifyListeners();
  }

  @override
  void dispose() {
    _becomingNoisySubscription?.cancel();
    _interruptionSubscription?.cancel();
    _playerStateSubscription?.cancel();
    _durationSubscription?.cancel();
    _currentIndexSubscription?.cancel();
    _player.dispose();
    super.dispose();
  }
}
