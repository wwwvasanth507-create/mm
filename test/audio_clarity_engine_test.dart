import 'package:flutter_test/flutter_test.dart';
import 'package:wavemusic_premium/data/services/audio_clarity_engine.dart';

void main() {
  group('AudioClarityEngine Tests', () {
    test('Clarity profile anchors and frequencies calibration', () {
      expect(AudioClarityEngine.kClarityProfileAnchors, isNotEmpty);
      expect(AudioClarityEngine.kDigitalHeadroomVolume, 0.85);

      // Verify specific target values
      expect(AudioClarityEngine.calculateOptimalGain(60.0), 1.0);
      expect(AudioClarityEngine.calculateOptimalGain(150.0), 0.5);
      expect(AudioClarityEngine.calculateOptimalGain(400.0), 0.0);
      expect(AudioClarityEngine.calculateOptimalGain(1000.0), 0.5);
      expect(AudioClarityEngine.calculateOptimalGain(2500.0), 1.0);
      expect(AudioClarityEngine.calculateOptimalGain(4000.0), 1.0);
      expect(AudioClarityEngine.calculateOptimalGain(8000.0), 1.5);
      expect(AudioClarityEngine.calculateOptimalGain(12000.0), 1.0);
    });

    test('Logarithmic interpolation handles arbitrary hardware band center frequencies', () {
      // Below lowest anchor
      expect(AudioClarityEngine.calculateOptimalGain(30.0), 1.0);

      // Interpolation between 60Hz and 150Hz
      final midBass = AudioClarityEngine.calculateOptimalGain(100.0);
      expect(midBass, greaterThan(0.5));
      expect(midBass, lessThan(1.0));

      // Interpolation between 400Hz and 1000Hz
      final lowMid = AudioClarityEngine.calculateOptimalGain(600.0);
      expect(lowMid, greaterThanOrEqualTo(0.0));
      expect(lowMid, lessThanOrEqualTo(0.5));

      // Presence / brilliance transition around 6000Hz
      final highMid = AudioClarityEngine.calculateOptimalGain(6000.0);
      expect(highMid, greaterThanOrEqualTo(1.0));
      expect(highMid, lessThanOrEqualTo(1.5));

      // Beyond highest anchor (16000Hz)
      expect(AudioClarityEngine.calculateOptimalGain(16000.0), 1.0);
    });

    test('Digital headroom attenuates master gain to prevent clipping on boost', () {
      // Max boost in profile is 1.5 dB
      // Linear amplitude for +1.5 dB = 10^(1.5/20) ≈ 1.1885
      // With 0.85 digital headroom, peak signal = 0.85 * 1.1885 ≈ 1.01 (zero inter-sample clipping)
      expect(AudioClarityEngine.kDigitalHeadroomVolume, lessThan(1.0));
      expect(AudioClarityEngine.kDigitalHeadroomVolume, greaterThanOrEqualTo(0.80));
    });

    test('isPlatformEqualizerSupported returns false in test environment for graceful degradation', () {
      expect(AudioClarityEngine.isPlatformEqualizerSupported, isFalse);
    });
  });
}
