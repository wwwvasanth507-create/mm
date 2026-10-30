import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wavemusic_premium/core/utilities/url_resolver.dart';
import 'package:wavemusic_premium/shared/widgets/app_artwork_image.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AppUrls & Thumbnail Optimization Tests', () {
    test('AppUrls.getOptimizedThumbnailUrl optimizes mzstatic.com dimension', () {
      const appleUrl =
          'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ee/dc/5a/eedc5a0e-6653-c941-f1d8-9ba695502e97/8901854085958.jpg/600x600bb.jpg';

      final optimized150 = AppUrls.getOptimizedThumbnailUrl(appleUrl, width: 150);
      expect(optimized150, contains('/150x150bb.jpg'));

      final optimized300 = AppUrls.getOptimizedThumbnailUrl(appleUrl, width: 300);
      expect(optimized300, contains('/300x300bb.jpg'));

      // Outside bounds are clamped between 100 and 600
      final optimizedClamped = AppUrls.getOptimizedThumbnailUrl(appleUrl, width: 20);
      expect(optimizedClamped, contains('/100x100bb.jpg'));
    });

    test('AppUrls.getOptimizedThumbnailUrl keeps standard URLs intact', () {
      const r2Url =
          'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/thumbnalis/kaatrodu-pattam-pola.jpg';
      final res = AppUrls.getOptimizedThumbnailUrl(r2Url, width: 200);
      expect(res, equals(r2Url));
    });

    test('AppUrls.getLocalAssetCoverPath resolves bundled covers with 0ms offline path', () {
      // 1. Direct filename
      expect(AppUrls.getLocalAssetCoverPath('ponniyin-selvan-2.jpg'), equals('assets/covers/ponniyin-selvan-2.jpg'));
      expect(AppUrls.getLocalAssetCoverPath('raayan-rumble.jpg'), equals('assets/covers/raayan-rumble.jpg'));

      // 2. Relative covers path
      expect(AppUrls.getLocalAssetCoverPath('covers/pushpa-the-rise.jpg'), equals('assets/covers/pushpa-the-rise.jpg'));
      expect(AppUrls.getLocalAssetCoverPath('/covers/powerhouse.jpg'), equals('assets/covers/powerhouse.jpg'));

      // 3. Full GitHub raw URL
      expect(
        AppUrls.getLocalAssetCoverPath(
            'https://raw.githubusercontent.com/wwwvasanth507-create/mm/main/public/covers/pushpa-pushpa.jpg'),
        equals('assets/covers/pushpa-pushpa.jpg'),
      );

      // 4. Query params & percent encoded
      expect(
        AppUrls.getLocalAssetCoverPath('https://example.com/covers/ponniyin-selvan-part-1-ps1.jpg?v=2#hash'),
        equals('assets/covers/ponniyin-selvan-part-1-ps1.jpg'),
      );
    });

    test('AppUrls.getLocalAssetCoverPath returns null for non-bundled covers', () {
      expect(
        AppUrls.getLocalAssetCoverPath(
            'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ee/dc/5a/eedc5a0e-6653-c941-f1d8-9ba695502e97/8901854085958.jpg/600x600bb.jpg'),
        isNull,
      );
      // R2 hosted cover that is not bundled locally
      expect(
        AppUrls.getLocalAssetCoverPath(
            'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/thumbnalis/30-10-2026-1/aasa-orave.jpg'),
        isNull,
      );
      expect(AppUrls.getLocalAssetCoverPath(null), isNull);
      expect(AppUrls.getLocalAssetCoverPath(''), isNull);
    });
  });

  group('AppArtworkImage Widget Tests', () {
    testWidgets('AppArtworkImage renders Image.asset directly when bundled cover is recognized',
        (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AppArtworkImage(
              url: 'covers/ponniyin-selvan-2.jpg',
              width: 52,
              height: 52,
            ),
          ),
        ),
      );

      // Finds the Image widget with AssetImage
      final imageFinder = find.byType(Image);
      expect(imageFinder, findsOneWidget);

      final imageWidget = tester.widget<Image>(imageFinder);
      expect(imageWidget.image, isA<ResizeImage>());
      final resizeImage = imageWidget.image as ResizeImage;
      expect(resizeImage.imageProvider, isA<AssetImage>());
      final assetImage = resizeImage.imageProvider as AssetImage;
      expect(assetImage.assetName, equals('assets/covers/ponniyin-selvan-2.jpg'));
    });

    testWidgets('AppArtworkImage renders fallback icon placeholder on null or empty url',
        (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AppArtworkImage(
              url: null,
              width: 48,
              height: 48,
              placeholderIcon: Icons.queue_music_rounded,
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.queue_music_rounded), findsOneWidget);
    });

    testWidgets('AppArtworkImage applies ClipRRect when borderRadius is specified',
        (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppArtworkImage(
              url: 'covers/raayan-rumble.jpg',
              width: 60,
              height: 60,
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      );

      final clipFinder = find.byType(ClipRRect);
      expect(clipFinder, findsOneWidget);
      final clipWidget = tester.widget<ClipRRect>(clipFinder);
      expect(clipWidget.borderRadius, equals(BorderRadius.circular(12)));
    });

    test('All songs and playlists in music.json resolve to valid covers (bundled assets or R2 CDN)', () {
      final file = File('assets/data/music.json');
      expect(file.existsSync(), isTrue);

      final data = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
      final songs = data['songs'] as List<dynamic>;
      final playlists = data['playlists'] as List<dynamic>;

      expect(songs.length, equals(409));
      expect(playlists.length, equals(19));

      int bundledCount = 0;
      int r2Count = 0;

      for (final song in songs) {
        final url = song['thumbnailUrl'] as String?;
        expect(url, isNotNull);
        final localPath = AppUrls.getLocalAssetCoverPath(url);
        if (localPath != null) {
          expect(File(localPath).existsSync(), isTrue, reason: 'Asset file $localPath does not exist on disk');
          bundledCount++;
        } else {
          expect(url!.startsWith('https://'), isTrue, reason: 'Song ${song['id']} must have a valid network URL');
          r2Count++;
        }
      }

      for (final playlist in playlists) {
        final url = playlist['coverUrl'] as String?;
        expect(url, isNotNull);
        final localPath = AppUrls.getLocalAssetCoverPath(url);
        if (localPath != null) {
          expect(File(localPath).existsSync(), isTrue, reason: 'Asset file $localPath does not exist on disk');
          bundledCount++;
        } else {
          expect(url!.startsWith('https://'), isTrue, reason: 'Playlist ${playlist['id']} must have a valid network URL');
          r2Count++;
        }
      }

      expect(bundledCount, greaterThan(0));
      expect(r2Count, greaterThan(0));
    });
  });
}


