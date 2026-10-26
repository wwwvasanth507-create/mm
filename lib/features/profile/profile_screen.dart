import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/utilities/formatters.dart';
import '../../data/services/download_service.dart';
import '../../shared/widgets/brand_logo.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _gaplessPlayback = true;
  bool _normalizeVolume = false;

  @override
  Widget build(BuildContext context) {
    final downloadService = context.watch<DownloadService>();

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Profile & Settings', style: AppTypography.heading1),
              const SizedBox(height: 20),

              // Premium Profile Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: AppColors.cardGlowGradient,
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.primary.withOpacity(0.3), width: 1.2),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: const BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(Icons.person_rounded, size: 36, color: Colors.white),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text('Jalra User', style: AppTypography.heading3),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  gradient: AppColors.neonCyanViolet,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  'PRO',
                                  style: TextStyle(
                                    color: Colors.black,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text('Offline & Streaming Enabled', style: AppTypography.caption),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Audio Quality & Playback
              Text('Audio & Playback', style: AppTypography.heading3),
              const SizedBox(height: 12),
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.divider),
                ),
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.high_quality_rounded, color: AppColors.accentCyan),
                      title: const Text('Streaming Quality'),
                      subtitle: const Text('Original Source Bitrate (Up to 320 kbps / FLAC)'),
                      trailing: const Icon(Icons.lock_outline_rounded, size: 18, color: AppColors.textMuted),
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Audio stream quality is determined directly by source URL.'),
                            backgroundColor: AppColors.surfaceHighlight,
                          ),
                        );
                      },
                    ),
                    const Divider(color: AppColors.divider, height: 1),
                    SwitchListTile(
                      secondary: const Icon(Icons.album_rounded, color: AppColors.primary),
                      title: const Text('Gapless Playback'),
                      subtitle: const Text('Seamless transition between consecutive tracks'),
                      value: _gaplessPlayback,
                      activeColor: AppColors.primary,
                      onChanged: (val) => setState(() => _gaplessPlayback = val),
                    ),
                    const Divider(color: AppColors.divider, height: 1),
                    SwitchListTile(
                      secondary: const Icon(Icons.volume_up_rounded, color: AppColors.accentViolet),
                      title: const Text('Volume Normalization'),
                      subtitle: const Text('Balance volume across different audio streams'),
                      value: _normalizeVolume,
                      activeColor: AppColors.primary,
                      onChanged: (val) => setState(() => _normalizeVolume = val),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Storage & Offline Cache
              Text('Storage & Downloads', style: AppTypography.heading3),
              const SizedBox(height: 12),
              FutureBuilder<int>(
                future: downloadService.getTotalDownloadSize(),
                builder: (context, snapshot) {
                  final totalSize = snapshot.data ?? 0;
                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.divider),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.storage_rounded, color: AppColors.accentEmerald, size: 24),
                                SizedBox(width: 12),
                                Text('Local Offline Storage'),
                              ],
                            ),
                            Text(
                              AppFormatters.formatFileSize(totalSize),
                              style: AppTypography.title.copyWith(color: AppColors.accentEmerald),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Downloads are stored privately in app storage and verified before playback.',
                          style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                        ),
                      ],
                    ),
                  );
                },
              ),

              const SizedBox(height: 24),

              // Background Service & System Integration
              Text('Background Integration', style: AppTypography.heading3),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.divider),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.accentCyan.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.notification_important_rounded, color: AppColors.accentCyan),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Media Notification & Lock Screen', style: TextStyle(fontWeight: FontWeight.w600)),
                          SizedBox(height: 2),
                          Text(
                            'Active: continues playback in background and lock screen with Android MediaSession',
                            style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // App Version & About
              Center(
                child: Column(
                  children: [
                    const BrandLogo(size: 28, showText: true, compact: true),
                    const SizedBox(height: 8),
                    Text(
                      'Jalra v1.0.0 (Build 1)',
                      style: AppTypography.caption,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Powered by just_audio & Flutter Native Audio Engine',
                      style: AppTypography.caption.copyWith(color: AppColors.textMuted, fontSize: 10),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 80),
            ],
          ),
        ),
      ),
    );
  }
}
