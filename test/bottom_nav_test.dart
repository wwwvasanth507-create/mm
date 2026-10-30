import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:wavemusic_premium/app.dart';
import 'package:wavemusic_premium/core/theme/app_theme.dart';
import 'package:wavemusic_premium/data/database/app_database.dart';
import 'package:wavemusic_premium/data/repositories/music_repository.dart';
import 'package:wavemusic_premium/data/services/app_update_service.dart';
import 'package:wavemusic_premium/data/services/audio_player_service.dart';
import 'package:wavemusic_premium/data/services/download_service.dart';

void main() {
  testWidgets('Bottom navigation bar renders solid high-visibility items and changes tab on tap', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(400, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final musicRepo = MusicRepository(db: AppDatabase.instance);
    final audioService = AudioPlayerService(repository: musicRepo);
    final downloadService = DownloadService(repository: musicRepo);
    final updateService = AppUpdateService();

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider<MusicRepository>.value(value: musicRepo),
          ChangeNotifierProvider<AudioPlayerService>.value(value: audioService),
          ChangeNotifierProvider<DownloadService>.value(value: downloadService),
          ChangeNotifierProvider<AppUpdateService>.value(value: updateService),
        ],
        child: MaterialApp(
          theme: AppTheme.darkTheme,
          home: const MainNavigationScreen(),
        ),
      ),
    );

    await tester.pump();

    // Verify all 4 bottom navigation items are rendered
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Search'), findsOneWidget);
    expect(find.text('Library'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);

    // Tap Search
    await tester.tap(find.text('Search'));
    await tester.pumpAndSettle();

    // Tap Profile
    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();

    // Verify Profile screen is shown
    expect(find.text('VASANTH V'), findsOneWidget);
  });
}
