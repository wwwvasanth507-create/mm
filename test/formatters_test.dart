import 'package:flutter_test/flutter_test.dart';
import 'package:wavemusic_premium/core/utilities/formatters.dart';

void main() {
  group('AppFormatters Tests', () {
    test('formatDuration formats null and zero correctly', () {
      expect(AppFormatters.formatDuration(null), '00:00');
      expect(AppFormatters.formatDuration(Duration.zero), '00:00');
    });

    test('formatDuration formats minutes and seconds', () {
      expect(AppFormatters.formatDuration(const Duration(seconds: 45)), '00:45');
      expect(AppFormatters.formatDuration(const Duration(minutes: 3, seconds: 20)), '03:20');
      expect(AppFormatters.formatDuration(const Duration(minutes: 12, seconds: 5)), '12:05');
    });

    test('formatDuration formats hours, minutes, and seconds', () {
      expect(
        AppFormatters.formatDuration(const Duration(hours: 1, minutes: 15, seconds: 30)),
        '1:15:30',
      );
    });

    test('formatFileSize formats B, KB, MB, GB properly', () {
      expect(AppFormatters.formatFileSize(0), '0 B');
      expect(AppFormatters.formatFileSize(512), '512 B');
      expect(AppFormatters.formatFileSize(1024), '1.0 KB');
      expect(AppFormatters.formatFileSize(5 * 1024 * 1024), '5.0 MB');
      expect(AppFormatters.formatFileSize(2 * 1024 * 1024 * 1024), '2.00 GB');
    });
  });
}
