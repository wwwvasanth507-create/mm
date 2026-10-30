import 'package:flutter_test/flutter_test.dart';
import 'package:wavemusic_premium/core/utilities/validators.dart';

void main() {
  group('AppValidators Tests', () {
    test('validateTitle checks for required non-empty input', () {
      expect(AppValidators.validateTitle(null), isNotNull);
      expect(AppValidators.validateTitle(''), isNotNull);
      expect(AppValidators.validateTitle('   '), isNotNull);
      expect(AppValidators.validateTitle('Midnight Drive'), isNull);
    });

    test('validateArtist checks for required non-empty input', () {
      expect(AppValidators.validateArtist(null), isNotNull);
      expect(AppValidators.validateArtist(''), isNotNull);
      expect(AppValidators.validateArtist('Synth Horizon'), isNull);
    });

    test('validateAudioUrl validates format and schemes', () {
      expect(AppValidators.validateAudioUrl(null), isNotNull);
      expect(AppValidators.validateAudioUrl(''), isNotNull);
      expect(AppValidators.validateAudioUrl('not-a-url'), isNotNull);
      expect(AppValidators.validateAudioUrl('ftp://example.com/audio.mp3'), isNotNull);
      expect(AppValidators.validateAudioUrl('file:///home/user/song.mp3'), isNotNull);

      // Valid HTTPS / HTTP URLs
      expect(AppValidators.validateAudioUrl('https://example.com/audio.mp3'), isNull);
      expect(AppValidators.validateAudioUrl('http://example.com/stream'), isNull);
    });

    test('validateThumbnailUrl allows empty and validates URLs if provided', () {
      expect(AppValidators.validateThumbnailUrl(null), isNull);
      expect(AppValidators.validateThumbnailUrl(''), isNull);
      expect(AppValidators.validateThumbnailUrl('invalid-image'), isNotNull);
      expect(AppValidators.validateThumbnailUrl('https://example.com/cover.png'), isNull);
    });

    test('validateReleaseYear validates reasonable year ranges', () {
      expect(AppValidators.validateReleaseYear(null), isNull);
      expect(AppValidators.validateReleaseYear(''), isNull);
      expect(AppValidators.validateReleaseYear('abc'), isNotNull);
      expect(AppValidators.validateReleaseYear('1800'), isNotNull);
      expect(AppValidators.validateReleaseYear('2024'), isNull);
      expect(AppValidators.validateReleaseYear('2026'), isNull);
    });
  });
}
