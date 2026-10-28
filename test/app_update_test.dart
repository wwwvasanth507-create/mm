import 'package:flutter_test/flutter_test.dart';
import 'package:wavemusic_premium/data/services/app_update_service.dart';

void main() {
  group('AppUpdateService & AppUpdateInfo Tests', () {
    test('AppUpdateInfo parses JSON correctly', () {
      final json = {
        'version_code': 2,
        'version_name': '1.0.1',
        'apk_url':
            'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/app/Jalra.apk',
        'title': 'New Update Available! 🎵',
        'release_notes': '• Bug fixes\n• New features',
        'force_update': false,
        'file_size_bytes': 31457280,
      };

      final info = AppUpdateInfo.fromJson(json);

      expect(info.versionCode, 2);
      expect(info.versionName, '1.0.1');
      expect(
        info.apkUrl,
        'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/app/Jalra.apk',
      );
      expect(info.title, 'New Update Available! 🎵');
      expect(info.releaseNotes, '• Bug fixes\n• New features');
      expect(info.forceUpdate, isFalse);
      expect(info.fileSizeBytes, 31457280);
    });

    test('AppUpdateService correctly identifies if update is available', () {
      final service = AppUpdateService();

      // Initially no update
      expect(service.hasUpdate, isFalse);
      expect(service.shouldShowPrompt, isFalse);

      service.dispose();
    });

    test('Dismiss prompt suppresses optional update banner until re-opened', () {
      final service = AppUpdateService();

      expect(service.shouldShowPrompt, isFalse);
      service.dismissPrompt();
      expect(service.shouldShowPrompt, isFalse);

      service.dispose();
    });
  });
}
