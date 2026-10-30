import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:wavemusic_premium/core/theme/app_theme.dart';
import 'package:wavemusic_premium/data/database/app_database.dart';
import 'package:wavemusic_premium/data/models/song_model.dart';
import 'package:wavemusic_premium/data/repositories/music_repository.dart';
import 'package:wavemusic_premium/data/services/app_update_service.dart';
import 'package:wavemusic_premium/data/services/audio_player_service.dart';
import 'package:wavemusic_premium/data/services/download_service.dart';
import 'package:wavemusic_premium/features/player/now_playing_screen.dart';

void main() {
  final testSong = Song(
    id: 'test_song_1',
    title: 'Kadharalz',
    artist: 'Anirudh Ravichander',
    album: 'Vikram',
    genre: 'Tamil',
    releaseYear: 2022,
    durationMs: 215000,
    audioUrl: 'https://example.com/audio.mp3',
    thumbnailUrl: 'https://example.com/cover.jpg',
    dateAdded: DateTime(2022, 6, 3),
    lyrics: 'Kadharalz song lyrics line 1\nLine 2 of song lyrics\nTamil beat drops',
  );

  testWidgets('NowPlayingScreen renders desktop studio split layout on PC and laptop dimensions', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1280, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final musicRepo = MusicRepository(db: AppDatabase.instance);
    final audioService = AudioPlayerService(repository: musicRepo);
    final downloadService = DownloadService(repository: musicRepo);
    final updateService = AppUpdateService();

    // Set active song and queue
    audioService.setTestQueue([testSong], initialIndex: 0);

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
          home: const NowPlayingScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Check desktop studio layout elements
    expect(find.text('STUDIO HI-FI NOW PLAYING'), findsOneWidget);
    expect(find.text('Kadharalz'), findsWidgets);
    expect(find.text('Anirudh Ravichander'), findsWidgets);
    expect(find.text('LOSSLESS 320 KBPS'), findsOneWidget);
    expect(find.text('Lyrics'), findsOneWidget);
    expect(find.textContaining('Up Next'), findsOneWidget);

    // Switch tab to Up Next Queue
    await tester.tap(find.textContaining('Up Next'));
    await tester.pumpAndSettle();

    // Switch tab back to Lyrics
    await tester.tap(find.text('Lyrics'));
    await tester.pumpAndSettle();
    expect(find.textContaining('Kadharalz song lyrics'), findsOneWidget);
  });

  testWidgets('NowPlayingScreen renders mobile layout without overflow on phone dimensions', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final musicRepo = MusicRepository(db: AppDatabase.instance);
    final audioService = AudioPlayerService(repository: musicRepo);
    final downloadService = DownloadService(repository: musicRepo);
    final updateService = AppUpdateService();

    audioService.setTestQueue([testSong], initialIndex: 0);

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
          home: const NowPlayingScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Kadharalz'), findsOneWidget);
    expect(find.text('Anirudh Ravichander'), findsOneWidget);
  });
}
