import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'app.dart';
import 'core/cache/cache_config.dart';
import 'core/constants/app_colors.dart';
import 'data/services/cover_cache_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize centralized, device-aware caching architecture
  AppCacheConfig.init();

  // Initialize local cover cache for Android Lock Screen & Notification Shade
  CoverCacheService.init();

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: AppColors.background,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  // Initialize background audio playback service with custom notification channel on mobile
  if (!kIsWeb) {
    try {
      await JustAudioBackground.init(
        androidNotificationChannelId: 'in.wavemusic.premium.playback_v3',
        androidNotificationChannelName: 'Jalra Music Playback',
        androidNotificationChannelDescription: 'Music playback controls on Lock Screen, Notification Shade & Bluetooth',
        androidNotificationOngoing: true,
        androidNotificationIcon: 'drawable/ic_stat_music',
        androidStopForegroundOnPause: false,
      ).timeout(
        const Duration(milliseconds: 1500),
        onTimeout: () {
          debugPrint('[JustAudioBackground] init timed out - proceeding to runApp');
        },
      );
    } catch (e, st) {
      debugPrint('JustAudioBackground init note: $e\n$st');
    }
  }

  runApp(const JalraApp());
}
