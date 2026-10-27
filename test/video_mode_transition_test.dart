import 'package:flutter_test/flutter_test.dart';
import 'package:wavemusic_premium/data/models/song_model.dart';

void main() {
  group('Video Mode & Transition Integrity Tests', () {
    final now = DateTime.now();
    final songWithVideo = Song(
      id: 'song-v1',
      title: 'Monica',
      artist: 'Anirudh Ravichander',
      album: 'Coolie',
      audioUrl: 'https://example.com/monica.mp3',
      videoUrl: 'https://example.com/monica.mp4',
      dateAdded: now,
    );

    final songWithoutVideo = Song(
      id: 'song-a1',
      title: 'Powerhouse',
      artist: 'Anirudh Ravichander',
      album: 'Coolie',
      audioUrl: 'https://example.com/powerhouse.mp3',
      dateAdded: now,
    );

    test('Song model correctly identifies presence of video', () {
      expect(songWithVideo.hasVideo, isTrue);
      expect(songWithoutVideo.hasVideo, isFalse);
    });

    test('Video completion logic only triggers transition once when position >= duration', () {
      bool handledCompletion = false;
      int transitionTriggerCount = 0;

      void onTick(Duration position, Duration duration) {
        if (duration > Duration.zero && position >= duration) {
          if (!handledCompletion) {
            handledCompletion = true;
            transitionTriggerCount++;
          }
        } else {
          if (handledCompletion &&
              duration > const Duration(seconds: 1) &&
              position < duration - const Duration(seconds: 1)) {
            handledCompletion = false;
          }
        }
      }

      const duration = Duration(minutes: 3);

      // Playing before end
      onTick(const Duration(minutes: 2, seconds: 58), duration);
      expect(transitionTriggerCount, 0);
      expect(handledCompletion, isFalse);

      // Reached completion
      onTick(duration, duration);
      expect(transitionTriggerCount, 1);
      expect(handledCompletion, isTrue);

      // Subsequent frame at end must not trigger again
      onTick(duration, duration);
      onTick(duration + const Duration(milliseconds: 100), duration);
      expect(transitionTriggerCount, 1);

      // Only resets when actively playing well before duration in a new video
      onTick(const Duration(seconds: 10), duration);
      expect(handledCompletion, isFalse);
    });

    test('Session ID isolation prevents stale asynchronous video initialization from playing', () {
      int activeSessionId = 0;
      final playedSessions = <int>[];

      Future<void> simulateVideoInit(int sessionId, bool isStale) async {
        // Simulated network init delay
        await Future.delayed(const Duration(milliseconds: 5));
        if (sessionId != activeSessionId) {
          // Stale session discarded
          return;
        }
        playedSessions.add(sessionId);
      }

      // First video init begins
      activeSessionId = 1;
      final f1 = simulateVideoInit(1, false);

      // Rapid transition triggers second video init before first finishes
      activeSessionId = 2;
      final f2 = simulateVideoInit(2, false);

      return Future.wait([f1, f2]).then((_) {
        // Only session 2 should have played, session 1 was discarded
        expect(playedSessions, [2]);
      });
    });
  });
}
