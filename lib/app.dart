import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';
import 'core/cache/cache_config.dart';
import 'core/theme/app_theme.dart';
import 'data/repositories/music_repository.dart';
import 'data/services/app_update_service.dart';
import 'data/services/audio_player_service.dart';
import 'data/services/download_service.dart';
import 'features/home/home_screen.dart';
import 'features/library/library_screen.dart';
import 'features/profile/profile_screen.dart';
import 'features/search/search_screen.dart';
import 'shared/widgets/in_app_update_sheet.dart';
import 'shared/widgets/mini_player.dart';

class WaveMusicApp extends StatelessWidget {
  const WaveMusicApp({super.key});

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
        title: 'Jalra',
        theme: AppTheme.darkTheme,
        debugShowCheckedModeBanner: false,
        home: const MainNavigationScreen(),
      ),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> with WidgetsBindingObserver {
  int _currentIndex = 0;
  bool _notificationDenied = false;

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

  @override
  Widget build(BuildContext context) {
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

            // Notification permission banner if disabled on Android
            if (_notificationDenied)
              Positioned(
                top: MediaQuery.of(context).padding.top + 8,
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
        color: Color(0xFF0F131D), // 100% Solid Dark Obsidian, zero glass/translucency
        border: Border(
          top: BorderSide(
            color: Color(0xFF222B3D), // High-definition crisp top divider
            width: 1.5,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black,
            blurRadius: 20,
            offset: Offset(0, -6),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        bottom: true,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
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
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        padding: isSelected
            ? const EdgeInsets.symmetric(horizontal: 18, vertical: 8)
            : const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF00E676) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF00E676).withOpacity(0.38),
                    blurRadius: 12,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSelected ? icon : unselectedIcon,
              size: isSelected ? 22 : 24,
              color: isSelected ? Colors.black : const Color(0xFFCBD4E1),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.black : const Color(0xFFCBD4E1),
                fontSize: 11.5,
                fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
                letterSpacing: isSelected ? 0.2 : 0,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
