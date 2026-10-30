import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'core/cache/cache_config.dart';
import 'core/constants/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'data/repositories/music_repository.dart';
import 'data/services/app_update_service.dart';
import 'data/services/audio_player_service.dart';
import 'data/services/download_service.dart';
import 'features/home/home_screen.dart';
import 'features/library/library_screen.dart';
import 'features/profile/profile_screen.dart';
import 'features/search/search_screen.dart';
import 'shared/widgets/desktop_player_bar.dart';
import 'shared/widgets/desktop_sidebar.dart';
import 'shared/widgets/in_app_update_sheet.dart';
import 'shared/widgets/mini_player.dart';

class JalraApp extends StatelessWidget {
  const JalraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<MusicRepository>(
          create: (_) => MusicRepository()..initializeAndSync(),
        ),
        ChangeNotifierProxyProvider<MusicRepository, AudioPlayerService>(
          create: (ctx) => AudioPlayerService(
            repository: ctx.read<MusicRepository>(),
          ),
          update: (ctx, repository, previous) =>
              previous ?? AudioPlayerService(repository: repository),
        ),
        ChangeNotifierProxyProvider<MusicRepository, DownloadService>(
          create: (ctx) => DownloadService(
            repository: ctx.read<MusicRepository>(),
          ),
          update: (ctx, repository, previous) =>
              previous ?? DownloadService(repository: repository),
        ),
        ChangeNotifierProvider<AppUpdateService>(
          create: (_) => AppUpdateService()
            ..startPeriodicChecks()
            ..checkForUpdates(silent: true),
        ),
      ],
      child: MaterialApp(
        title: 'Jalra 🎵 - High Quality Tamil Music Streaming',
        theme: AppTheme.darkTheme,
        debugShowCheckedModeBanner: false,
        home: const MainNavigationScreen(),
      ),
    );
  }
}

/// Backwards compatibility alias for tests and existing references
typedef WaveMusicApp = JalraApp;

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> with WidgetsBindingObserver {
  int _currentIndex = 0;
  bool _notificationDenied = false;
  bool _mobileWebBannerDismissed = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _requestNotificationPermission();
    });
  }

  Future<void> _requestNotificationPermission() async {
    try {
      if (!kIsWeb && Platform.isAndroid) {
        await Future.delayed(const Duration(milliseconds: 600));
        if (!mounted) return;
        var status = await Permission.notification.status;
        if (!status.isGranted) {
          status = await Permission.notification.request();
        }
        if (mounted) {
          setState(() {
            _notificationDenied = !status.isGranted;
          });
        }
      }
    } catch (e) {
      debugPrint('[Permission] Notification permission note: $e');
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      if (!kIsWeb && Platform.isAndroid) {
        Permission.notification.status.then((status) {
          if (mounted && _notificationDenied != !status.isGranted) {
            setState(() {
              _notificationDenied = !status.isGranted;
            });
          }
        }).catchError((_) {});
      }
      try {
        context.read<AppUpdateService>().checkForUpdates(silent: true);
      } catch (_) {}
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didHaveMemoryPressure() {
    super.didHaveMemoryPressure();
    AppCacheConfig.onLowMemory();
  }

  final List<Widget> _screens = const [
    HomeScreen(),
    SearchScreen(),
    LibraryScreen(),
    ProfileScreen(),
  ];

  Widget _buildMobileWebApkBanner() {
    if (_mobileWebBannerDismissed) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF101923),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.cuteMint.withOpacity(0.35)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: AppColors.cuteMint.withOpacity(0.18),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.android_rounded, color: AppColors.cuteMint, size: 18),
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Get Jalra Android App',
                  style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                ),
                Text(
                  '24/7 background audio & offline downloads',
                  style: TextStyle(color: AppColors.textMuted, fontSize: 10),
                ),
              ],
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.cuteMint,
              foregroundColor: const Color(0xFF070B0E),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () {
              launchUrl(
                Uri.parse(AppUpdateService.permanentApkUrl),
                mode: LaunchMode.externalApplication,
              );
            },
            child: const Text('APK', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: () => setState(() => _mobileWebBannerDismissed = true),
            child: const Padding(
              padding: EdgeInsets.all(4),
              child: Icon(Icons.close_rounded, color: Colors.white54, size: 16),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isDesktop = screenWidth >= 800;

    // Desktop & PC Wide Layout
    if (isDesktop) {
      return Scaffold(
        body: Column(
          children: [
            Expanded(
              child: Row(
                children: [
                  DesktopSidebar(
                    selectedIndex: _currentIndex,
                    onDestinationSelected: (idx) {
                      setState(() {
                        _currentIndex = idx;
                      });
                    },
                  ),
                  Expanded(
                    child: Stack(
                      children: [
                        IndexedStack(
                          index: _currentIndex,
                          children: _screens,
                        ),
                        // In-app live update banner if any
                        Positioned(
                          top: 16,
                          left: 24,
                          right: 24,
                          child: const InAppUpdateBanner(),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const DesktopPlayerBar(),
          ],
        ),
      );
    }

    // Mobile & Phone Layout
    return PopScope(
      canPop: _currentIndex == 0,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) {
          setState(() {
            _currentIndex = 0;
          });
        }
      },
      child: Scaffold(
        body: Stack(
          children: [
            // Screen contents
            Positioned.fill(
              child: IndexedStack(
                index: _currentIndex,
                children: _screens,
              ),
            ),

            // Web APK direct download banner on mobile web
            if (kIsWeb)
              Positioned(
                top: MediaQuery.of(context).padding.top + 6,
                left: 12,
                right: 12,
                child: _buildMobileWebApkBanner(),
              ),

            // Notification permission banner if disabled on Android
            if (_notificationDenied)
              Positioned(
                top: MediaQuery.of(context).padding.top + (kIsWeb ? 54 : 8),
                left: 16,
                right: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E2230),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.amber.withOpacity(0.6)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.5),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.notifications_active_rounded, color: Colors.amber, size: 22),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Text(
                          'Allow notifications to enable lockscreen & quick settings music player',
                          style: TextStyle(color: Colors.white, fontSize: 12, height: 1.3),
                        ),
                      ),
                      const SizedBox(width: 8),
                      TextButton(
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          backgroundColor: Colors.amber.withOpacity(0.2),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        onPressed: () => openAppSettings(),
                        child: const Text(
                          'ENABLE',
                          style: TextStyle(color: Colors.amber, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 4),
                      GestureDetector(
                        onTap: () => setState(() => _notificationDenied = false),
                        child: const Icon(Icons.close, color: Colors.white54, size: 18),
                      ),
                    ],
                  ),
                ),
              ),

            // In-app live update banner (gracefully floats at the top while playing songs)
            Positioned(
              top: MediaQuery.of(context).padding.top + 8,
              left: 14,
              right: 14,
              child: const InAppUpdateBanner(),
            ),

            // Persistent MiniPlayer & Bottom Nav
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const MiniPlayer(),
                  _buildBottomNavigationBar(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomNavigationBar() {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF0B0F14), // Sleek, modern dark surface
        border: Border(
          top: BorderSide(
            color: Color(0xFF1B2330), // Delicate hairline divider
            width: 1.0,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black54,
            blurRadius: 16,
            offset: Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        bottom: true,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(
                index: 0,
                icon: Icons.home_rounded,
                unselectedIcon: Icons.home_outlined,
                label: 'Home',
              ),
              _buildNavItem(
                index: 1,
                icon: Icons.search_rounded,
                unselectedIcon: Icons.search_rounded,
                label: 'Search',
              ),
              _buildNavItem(
                index: 2,
                icon: Icons.library_music_rounded,
                unselectedIcon: Icons.library_music_outlined,
                label: 'Library',
              ),
              _buildNavItem(
                index: 3,
                icon: Icons.person_rounded,
                unselectedIcon: Icons.person_outline_rounded,
                label: 'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required int index,
    required IconData icon,
    required IconData unselectedIcon,
    required String label,
  }) {
    final isSelected = _currentIndex == index;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        if (_currentIndex != index) {
          HapticFeedback.selectionClick();
          setState(() {
            _currentIndex = index;
          });
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        padding: isSelected
            ? const EdgeInsets.symmetric(horizontal: 14, vertical: 5)
            : const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          gradient: isSelected ? AppColors.cuteDockActive : null,
          color: isSelected ? null : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF76E035).withOpacity(0.35),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSelected ? icon : unselectedIcon,
              size: isSelected ? 19 : 20,
              color: isSelected ? const Color(0xFF070B0E) : const Color(0xFF94A3B8),
            ),
            const SizedBox(height: 1.5),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? const Color(0xFF070B0E) : const Color(0xFF94A3B8),
                fontSize: 9.8,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                letterSpacing: isSelected ? 0.2 : 0,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
