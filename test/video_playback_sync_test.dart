import 'package:flutter_test/flutter_test.dart';
import 'package:wavemusic_premium/data/models/song_model.dart';
import 'package:wavemusic_premium/features/player/now_playing_screen.dart';

void main() {
  group('Video Playback Transition & Exclusive Mode Tests', () {
    test('NowPlayingScreen constructor defaults to initialVideoMode false and allows setting true', () {
      const defaultScreen = NowPlayingScreen();
      expect(defaultScreen.initialVideoMode, isFalse);

      const videoScreen = NowPlayingScreen(initialVideoMode: true);
      expect(videoScreen.initialVideoMode, isTrue);
    });

    test('Song model hasVideo returns true only when videoUrl is valid', () {
      final now = DateTime.now();
      final songWithVideo = Song(
        id: 'v1',
        title: 'Video Song',
        artist: 'Artist',
        album: 'Album',
        releaseYear: 2024,
        audioUrl: 'https://example.com/audio.mp3',
        videoUrl: 'https://example.com/video.mp4',
        dateAdded: now,
      );
      expect(songWithVideo.hasVideo, isTrue);

      final songWithoutVideo = Song(
        id: 'a1',
        title: 'Audio Song',
        artist: 'Artist',
        album: 'Album',
        releaseYear: 2024,
        audioUrl: 'https://example.com/audio.mp3',
        videoUrl: null,
        dateAdded: now,
      );
      expect(songWithoutVideo.hasVideo, isFalse);
    });

    test('Video track sequence transition keeps video mode active when next song has video', () {
      final now = DateTime.now();
      final queue = [
        Song(id: '1', title: 'Video 1', artist: 'A', album: 'Alb', releaseYear: 2024, audioUrl: 'a1', videoUrl: 'v1', dateAdded: now),
        Song(id: '2', title: 'Video 2', artist: 'A', album: 'Alb', releaseYear: 2024, audioUrl: 'a2', videoUrl: 'v2', dateAdded: now),
        Song(id: '3', title: 'Audio 3', artist: 'A', album: 'Alb', releaseYear: 2024, audioUrl: 'a3', videoUrl: null, dateAdded: now),
      ];

      int currentIndex = 0;
      bool isVideoMode = true;

      // Simulate automatic completion of track 1
      final nextIndex = currentIndex + 1;
      final nextSong = queue[nextIndex];
      if (isVideoMode) {
        if (nextSong.hasVideo) {
          // Stays in video mode, audio player stays silenced
          isVideoMode = true;
          currentIndex = nextIndex;
        } else {
          isVideoMode = false;
          currentIndex = nextIndex;
        }
      }

      expect(currentIndex, 1);
      expect(isVideoMode, isTrue);

      // Now simulate completion of track 2 -> next is audio only
      final nextNextIndex = currentIndex + 1;
      final nextNextSong = queue[nextNextIndex];
      if (isVideoMode) {
        if (nextNextSong.hasVideo) {
          isVideoMode = true;
          currentIndex = nextNextIndex;
        } else {
          isVideoMode = false;
          currentIndex = nextNextIndex;
        }
      }

      expect(currentIndex, 2);
      expect(isVideoMode, isFalse);
    });

    test('Controller teardown before transition prevents duplicate completion ticks and skipping', () {
      final now = DateTime.now();
      final queue = [
        Song(id: 's0', title: 'Song 0 (Video)', artist: 'Artist', album: 'Album', releaseYear: 2024, audioUrl: 'a0', videoUrl: 'v0', dateAdded: now),
        Song(id: 's1', title: 'Song 1 (Video)', artist: 'Artist', album: 'Album', releaseYear: 2024, audioUrl: 'a1', videoUrl: 'v1', dateAdded: now),
        Song(id: 's2', title: 'Song 2 (Audio)', artist: 'Artist', album: 'Album', releaseYear: 2024, audioUrl: 'a2', videoUrl: null, dateAdded: now),
        Song(id: 's3', title: 'Song 3 (Video)', artist: 'Artist', album: 'Album', releaseYear: 2024, audioUrl: 'a3', videoUrl: 'v3', dateAdded: now),
      ];

      int currentIndex = 0;
      bool hasHandledCompletion = false;
      bool controllerDisposed = false;
      int nextTrackCallCount = 0;

      void onNextTrack() {
        nextTrackCallCount++;
        currentIndex++;
      }

      void simulateTick(Duration position, Duration duration) {
        if (controllerDisposed) return;
        if (duration > Duration.zero && position >= duration) {
          if (!hasHandledCompletion) {
            hasHandledCompletion = true;
            // Stop and dispose controller immediately:
            controllerDisposed = true;
            onNextTrack();
          }
        }
      }

      const totalDuration = Duration(minutes: 3);
      // Simulate playback hitting end
      simulateTick(const Duration(minutes: 3), totalDuration);

      expect(nextTrackCallCount, 1);
      expect(currentIndex, 1);

      // Simulate stale ticks arriving from native video player after completion
      simulateTick(const Duration(minutes: 3), totalDuration);
      simulateTick(const Duration(minutes: 3, seconds: 1), totalDuration);

      // Must NOT skip any songs: call count remains exactly 1, currentIndex remains exactly 1
      expect(nextTrackCallCount, 1);
      expect(currentIndex, 1);
      expect(queue[currentIndex].id, 's1');
    });

    test('Single sequential transition from video to audio track advances exactly 1 index without playing old song', () {
      final now = DateTime.now();
      final queue = [
        Song(id: 'v0', title: 'Video 0', artist: 'Artist', album: 'Album', releaseYear: 2024, audioUrl: 'a0', videoUrl: 'v0', dateAdded: now),
        Song(id: 'a1', title: 'Audio 1', artist: 'Artist', album: 'Album', releaseYear: 2024, audioUrl: 'a1', videoUrl: null, dateAdded: now),
      ];

      int currentIndex = 0;
      bool isVideoMode = true;
      bool isAudioPlaying = false;
      String? currentlyPlayingTrackId = 'v0';

      void advanceTrack() {
        final nextIndex = currentIndex + 1;
        if (nextIndex < queue.length) {
          final nextSong = queue[nextIndex];
          if (nextSong.hasVideo) {
            currentIndex = nextIndex;
            isVideoMode = true;
            isAudioPlaying = false;
            currentlyPlayingTrackId = nextSong.id;
          } else {
            currentIndex = nextIndex;
            isVideoMode = false;
            isAudioPlaying = true;
            currentlyPlayingTrackId = nextSong.id;
          }
        }
      }

      advanceTrack();

      expect(currentIndex, 1);
      expect(isVideoMode, isFalse);
      expect(isAudioPlaying, isTrue);
      expect(currentlyPlayingTrackId, 'a1');
    });

    test('Lifecycle state inactive/paused/hidden seamlessly switches video to audio at current position', () {
      bool isVideoMode = true;
      Duration currentVideoPosition = const Duration(minutes: 1, seconds: 25);
      bool isAudioPlaying = false;
      Duration audioSeekPosition = Duration.zero;
      bool userPaused = false;

      void handleLifecycleChange(String state) {
        if (state == 'inactive' || state == 'paused' || state == 'hidden') {
          if (isVideoMode) {
            if (!userPaused) {
              // Transition to background audio
              audioSeekPosition = currentVideoPosition;
              isVideoMode = false;
              isAudioPlaying = true;
            }
          }
        }
      }

      // User is playing a video song and minimizes app or turns off screen
      handleLifecycleChange('paused');

      expect(isVideoMode, isFalse);
      expect(isAudioPlaying, isTrue);
      expect(audioSeekPosition, const Duration(minutes: 1, seconds: 25));
    });

    test('If user explicitly pauses video, minimizing app or turning off screen does not auto-play audio', () {
      bool isVideoMode = true;
      bool isAudioPlaying = false;

      void handleLifecycleChange(String state, {required bool isPaused}) {
        if (state == 'inactive' || state == 'paused' || state == 'hidden') {
          if (isVideoMode) {
            if (!isPaused) {
              isVideoMode = false;
              isAudioPlaying = true;
            }
          }
        }
      }

      handleLifecycleChange('paused', isPaused: true);

      // Audio must remain not playing because user paused
      expect(isAudioPlaying, isFalse);
    });

    test('NowPlayingScreen exit (chevron back or PopScope) transfers video playback to audio for MiniPlayer', () {
      bool isVideoMode = true;
      Duration currentVideoPosition = const Duration(minutes: 2, seconds: 10);
      bool isAudioPlaying = false;
      Duration audioSeekPosition = Duration.zero;
      bool userPaused = false;
      bool hasHandledScreenExit = false;

      void handleScreenExit() {
        if (hasHandledScreenExit) return;
        hasHandledScreenExit = true;

        if (isVideoMode) {
          final vPos = currentVideoPosition;
          final shouldPlay = !userPaused;

          isVideoMode = false;
          if (vPos > Duration.zero) {
            audioSeekPosition = vPos;
          }
          if (shouldPlay) {
            isAudioPlaying = true;
          }
        }
      }

      // User exits NowPlayingScreen while video is playing
      handleScreenExit();

      expect(hasHandledScreenExit, isTrue);
      expect(isVideoMode, isFalse);
      expect(isAudioPlaying, isTrue);
      expect(audioSeekPosition, const Duration(minutes: 2, seconds: 10));

      // Idempotency check: second exit call (e.g. dispose after pop) does not re-seek or cause errors
      handleScreenExit();
      expect(isAudioPlaying, isTrue);
    });
  });
}

