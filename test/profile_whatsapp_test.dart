import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:wavemusic_premium/data/services/app_update_service.dart';
import 'package:wavemusic_premium/data/services/download_service.dart';
import 'package:wavemusic_premium/features/profile/profile_screen.dart';

class FakeDownloadService extends ChangeNotifier implements DownloadService {
  @override
  Future<int> getTotalDownloadSize() async => 2048000;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('Profile Screen & WhatsApp Feedback Tests', () {
    test('App version matches 1.0.2+3', () {
      expect(AppUpdateService.currentVersionName, '1.0.2');
      expect(AppUpdateService.currentVersionCode, 3);
    });

    test('WhatsApp URL and pre-filled message template validation', () {
      const phoneNumber = '917358654720';
      const category = 'Platform Updates, Modifications & Feedback';
      final String message = '''Hello Vasanth! 👋

I am using the Jalra Music App (v${AppUpdateService.currentVersionName}).

📌 Topic: $category
💬 My Suggestions / Feedback:
- 

---
Sent from Jalra Music App''';

      final String encoded = Uri.encodeComponent(message);
      final Uri nativeUri = Uri.parse('whatsapp://send?phone=$phoneNumber&text=$encoded');
      final Uri webUri = Uri.parse('https://wa.me/$phoneNumber?text=$encoded');

      expect(nativeUri.scheme, 'whatsapp');
      expect(nativeUri.queryParameters['phone'], phoneNumber);
      expect(nativeUri.queryParameters['text'], contains('v${AppUpdateService.currentVersionName}'));
      expect(nativeUri.queryParameters['text'], contains('Platform Updates, Modifications & Feedback'));

      expect(webUri.scheme, 'https');
      expect(webUri.host, 'wa.me');
      expect(webUri.path, '/$phoneNumber');
      expect(webUri.queryParameters['text'], contains('Hello Vasanth!'));
    });

    testWidgets('ProfileScreen renders Developer credit and WhatsApp feedback actions', (WidgetTester tester) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider<DownloadService>(
              create: (_) => FakeDownloadService(),
            ),
            ChangeNotifierProvider<AppUpdateService>(
              create: (_) => AppUpdateService(),
            ),
          ],
          child: const MaterialApp(
            home: ProfileScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify Developer Credit
      expect(find.text('VASANTH V'), findsOneWidget); // In Developer Card
      expect(find.text('Developed by VASANTH V'), findsOneWidget); // In Footer
      expect(find.text('App Developer & Creator'), findsOneWidget);

      // Verify Contact Phone Number
      expect(find.text('+91 7358654720'), findsOneWidget);

      // Verify Platform Updates, Modifications & Feedback text
      expect(find.text('Platform Updates & Modifications'), findsOneWidget);

      // Verify Quick Template Chips
      expect(find.text('Platform Update'), findsOneWidget);
      expect(find.text('Modifications'), findsOneWidget);
      expect(find.text('Feature Request'), findsOneWidget);
      expect(find.text('Feedback'), findsOneWidget);

      // Verify WhatsApp CTA Button
      expect(find.text('Chat on WhatsApp'), findsOneWidget);

      // Verify Updated App Version
      expect(
        find.text(
          'Jalra v${AppUpdateService.currentVersionName} (Build ${AppUpdateService.currentVersionCode})',
        ),
        findsOneWidget,
      );
    });
  });
}
