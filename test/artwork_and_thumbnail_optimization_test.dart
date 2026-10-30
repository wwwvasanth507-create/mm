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

    test('AppUrls.getLocalAssetCoverPath resolves explicit local asset paths and null for R2 CDN', () {
      // 1. Explicit asset path
      expect(AppUrls.getLocalAssetCoverPath('assets/covers/custom.jpg'), equals('assets/covers/custom.jpg'));

      // 2. Cloudflare R2 hosted URLs return null to stream via CachedNetworkImage
      expect(
        AppUrls.getLocalAssetCoverPath(
            'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/thumbnalis/30-10-2026-1/aasa-orave.jpg'),
        isNull,
      );

      // 3. Apple Music / non-bundled URLs return null
      expect(
        AppUrls.getLocalAssetCoverPath(
            'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ee/dc/5a/eedc5a0e-6653-c941-f1d8-9ba695502e97/8901854085958.jpg/600x600bb.jpg'),
        isNull,
      );

      expect(AppUrls.getLocalAssetCoverPath(null), isNull);
      expect(AppUrls.getLocalAssetCoverPath(''), isNull);
    });
  });

  group('AppArtworkImage Widget Tests', () {
    testWidgets('AppArtworkImage renders Image.asset directly when explicit asset path is passed',
        (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AppArtworkImage(
              url: 'assets/covers/custom.jpg',
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
      expect(assetImage.assetName, equals('assets/covers/custom.jpg'));
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
              url: 'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/thumbnalis/30-10-2026-1/aasa-orave.jpg',
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

    test('All songs and playlists in music.json resolve to 100% Cloudflare R2 CDN URLs', () {
      final file = File('assets/data/music.json');
      expect(file.existsSync(), isTrue);

      final data = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
      final songs = data['songs'] as List<dynamic>;
      final playlists = data['playlists'] as List<dynamic>;

      expect(songs.length, equals(503));
      expect(playlists.length, equals(20));

      for (final song in songs) {
        final url = song['thumbnailUrl'] as String?;
        expect(url, isNotNull);
        expect(
          url!.startsWith('https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/thumbnalis/'),
          isTrue,
          reason: 'Song ${song['id']} must use verified Cloudflare R2 URL, got: $url',
        );
      }

      for (final playlist in playlists) {
        final url = playlist['coverUrl'] as String?;
        expect(url, isNotNull);
        expect(
          url!.startsWith('https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/thumbnalis/'),
          isTrue,
          reason: 'Playlist ${playlist['id']} must use verified Cloudflare R2 URL, got: $url',
        );
      }
    });
  });
}


