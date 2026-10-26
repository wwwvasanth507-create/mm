import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wavemusic_premium/shared/widgets/brand_logo.dart';
import 'package:wavemusic_premium/shared/widgets/empty_state.dart';

void main() {
  group('Widget Tests', () {
    testWidgets('BrandLogo renders icon and brand text spans', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: BrandLogo(size: 32),
          ),
        ),
      );

      // Verify Jalra text is present
      expect(find.text('Jalra'), findsOneWidget);
      // Verify icon image is present
      expect(find.byType(Image), findsOneWidget);
    });

    testWidgets('EmptyState renders message and triggers action button', (WidgetTester tester) async {
      bool buttonTapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyState(
              icon: Icons.music_note,
              title: 'No Songs Yet',
              message: 'Add songs using audio URLs to build your library.',
              actionText: 'Add Song',
              onAction: () {
                buttonTapped = true;
              },
            ),
          ),
        ),
      );

      expect(find.text('No Songs Yet'), findsOneWidget);
      expect(find.text('Add songs using audio URLs to build your library.'), findsOneWidget);
      expect(find.text('Add Song'), findsOneWidget);

      await tester.tap(find.text('Add Song'));
      await tester.pump();

      expect(buttonTapped, isTrue);
    });
  });
}
