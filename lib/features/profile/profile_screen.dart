import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/utilities/formatters.dart';
import '../../data/services/app_update_service.dart';
import '../../data/services/download_service.dart';
import '../../shared/widgets/brand_logo.dart';
import '../../shared/widgets/in_app_update_sheet.dart';

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
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 860),
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Profile & Settings', style: AppTypography.heading1),
                  const SizedBox(height: 20),

              // Cute & Premium Profile Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0xFF11171E),
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: const Color(0xFF1E293B), width: 1.0),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 58,
                      height: 58,
                      decoration: BoxDecoration(
                        gradient: AppColors.cutePinkLavender,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFFF6584).withOpacity(0.35),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Icon(Icons.person_rounded, size: 34, color: Colors.white),
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
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                                decoration: BoxDecoration(
                                  gradient: AppColors.cuteDockActive,
                                  borderRadius: BorderRadius.circular(6),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF76E035).withOpacity(0.3),
                                      blurRadius: 6,
                                      offset: const Offset(0, 1),
                                    ),
                                  ],
                                ),
                                child: const Text(
                                  'PRO ✨',
                                  style: TextStyle(
                                    color: Colors.black,
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 0.4,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text('Offline & Lossless Streaming Active', style: AppTypography.caption.copyWith(color: const Color(0xFF94A3B8))),
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
              Material(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  decoration: BoxDecoration(
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
                    ListTile(
                      leading: const Icon(Icons.graphic_eq_rounded, color: AppColors.accentEmerald),
                      title: const Text('Studio Clarity Engine™'),
                      subtitle: const Text('Built-in auto equalizer & anti-clipping headroom active'),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.accentEmerald.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.accentEmerald.withOpacity(0.3)),
                        ),
                        child: const Text(
                          'ACTIVE',
                          style: TextStyle(
                            color: AppColors.accentEmerald,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Jalra Audio Clarity Engine™ permanently optimizes every track with balanced acoustics and anti-clipping headroom.'),
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
                            const Expanded(
                              child: Row(
                                children: [
                                  Icon(Icons.storage_rounded, color: AppColors.accentEmerald, size: 24),
                                  SizedBox(width: 12),
                                  Flexible(
                                    child: Text('Local Offline Storage', overflow: TextOverflow.ellipsis),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
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

              // Permanent Android APK Download Card
              Container(
                margin: const EdgeInsets.only(bottom: 24),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF14241B), Color(0xFF101924)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.cuteMint.withOpacity(0.4)),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.cuteMint.withOpacity(0.08),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.cuteMint.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(Icons.android_rounded, color: AppColors.cuteMint, size: 24),
                        ),
                        const SizedBox(width: 14),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Jalra for Android',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Permanent Official APK (v1.0.4)',
                                style: TextStyle(color: AppColors.cuteMint, fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Experience continuous background playback, native Android lock screen controls, and lossless offline downloads.',
                      style: TextStyle(color: AppColors.textMuted, fontSize: 12, height: 1.4),
                    ),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.cuteMint,
                          foregroundColor: const Color(0xFF070B0E),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 0,
                        ),
                        onPressed: () {
                          launchUrl(
                            Uri.parse(AppUpdateService.permanentApkUrl),
                            mode: LaunchMode.externalApplication,
                          );
                        },
                        icon: const Icon(Icons.download_rounded, size: 18),
                        label: const Text(
                          'Download APK (Permanent Link)',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // In-App Updates Tile
              Consumer<AppUpdateService>(
                builder: (context, updateService, _) {
                  final hasUpdate = updateService.hasUpdate;
                  final isChecking =
                      updateService.status == UpdateDownloadStatus.checking;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 24),
                    child: Material(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: hasUpdate
                                ? AppColors.primary.withOpacity(0.5)
                                : AppColors.divider,
                          ),
                        ),
                        child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 4,
                      ),
                      leading: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: hasUpdate
                              ? AppColors.primary.withOpacity(0.15)
                              : Colors.white10,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          Icons.system_update_alt_rounded,
                          color: hasUpdate
                              ? AppColors.primary
                              : AppColors.textMuted,
                        ),
                      ),
                      title: Row(
                        children: [
                          const Flexible(
                            child: Text(
                              'Check for Updates',
                              style: TextStyle(fontWeight: FontWeight.w600),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (hasUpdate) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.accentCyan.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'NEW',
                                style: TextStyle(
                                  color: AppColors.accentCyan,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      subtitle: Text(
                        hasUpdate
                            ? 'New version v${updateService.latestUpdateInfo?.versionName} is ready'
                            : 'Current version: v${AppUpdateService.currentVersionName} (Build ${AppUpdateService.currentVersionCode})',
                        style: const TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 12,
                        ),
                      ),
                      trailing: isChecking
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  AppColors.primary,
                                ),
                              ),
                            )
                          : Icon(
                              Icons.chevron_right_rounded,
                              color: hasUpdate
                                  ? AppColors.primary
                                  : AppColors.textMuted,
                            ),
                      onTap: () async {
                        if (hasUpdate) {
                          showInAppUpdateDialog(context);
                        } else {
                          final info = await updateService.checkForUpdates(
                            silent: false,
                          );
                          if (context.mounted) {
                            if (info != null &&
                                info.versionCode >
                                    AppUpdateService.currentVersionCode) {
                              showInAppUpdateDialog(context);
                            } else {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    '🎉 Jalra is already on the latest version!',
                                  ),
                                  duration: Duration(seconds: 2),
                                  backgroundColor: Color(0xFF1B2338),
                                ),
                              );
                            }
                          }
                        }
                      },
                    ),
                  ),
                ),
              );
                },
              ),

              // Developer & Platform Feedback Section
              Text('Developer & Support', style: AppTypography.heading3),
              const SizedBox(height: 12),
              Container(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF142418), Color(0xFF101912)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppColors.primary.withOpacity(0.35),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.08),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Developer Info Row
                    Row(
                      children: [
                        Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            gradient: AppColors.primaryGradient,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withOpacity(0.35),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: const Center(
                            child: Icon(Icons.code_rounded, size: 28, color: Colors.black),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    'VASANTH V',
                                    style: AppTypography.heading3.copyWith(
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  const Icon(
                                    Icons.verified_rounded,
                                    size: 18,
                                    color: AppColors.primary,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 3),
                              Text(
                                'App Developer & Creator',
                                style: AppTypography.caption.copyWith(
                                  color: AppColors.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),
                    Container(
                      height: 1,
                      color: AppColors.primary.withOpacity(0.15),
                    ),
                    const SizedBox(height: 16),

                    // Platform Updates & Feedback description
                    Text(
                      'Platform Updates & Modifications',
                      style: AppTypography.body.copyWith(
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Have ideas for new features, modifications, or feedback? Message directly on WhatsApp to shape future updates of Jalra.',
                      style: AppTypography.caption.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // WhatsApp Contact Pill with copy action
                    InkWell(
                      borderRadius: BorderRadius.circular(10),
                      onTap: () {
                        Clipboard.setData(const ClipboardData(text: '+917358654720'));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('WhatsApp number copied: +91 7358654720'),
                            duration: Duration(seconds: 2),
                            backgroundColor: AppColors.surfaceHighlight,
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.black26,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.white12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.phone_iphone_rounded, size: 16, color: AppColors.primary),
                            const SizedBox(width: 8),
                            const Text(
                              '+91 7358654720',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Icon(Icons.copy_rounded, size: 14, color: AppColors.textMuted),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Quick Template Chips
                    Text(
                      'Choose a template or tap below to chat:',
                      style: AppTypography.caption.copyWith(
                        color: AppColors.textMuted,
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _buildTemplateChip(
                          icon: Icons.auto_awesome_rounded,
                          label: 'Platform Update',
                          onTap: () => _launchWhatsApp(category: 'Platform Update Request'),
                        ),
                        _buildTemplateChip(
                          icon: Icons.tune_rounded,
                          label: 'Modifications',
                          onTap: () => _launchWhatsApp(category: 'Modification Suggestion'),
                        ),
                        _buildTemplateChip(
                          icon: Icons.lightbulb_outline_rounded,
                          label: 'Feature Request',
                          onTap: () => _launchWhatsApp(category: 'New Feature Request'),
                        ),
                        _buildTemplateChip(
                          icon: Icons.rate_review_outlined,
                          label: 'Feedback',
                          onTap: () => _launchWhatsApp(category: 'Platform Feedback'),
                        ),
                      ],
                    ),

                    const SizedBox(height: 18),

                    // Primary WhatsApp CTA Button
                    Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () => _launchWhatsApp(category: 'Platform Updates, Modifications & Feedback'),
                        borderRadius: BorderRadius.circular(14),
                        child: Ink(
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF25D366), Color(0xFF128C7E)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(14),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF25D366).withOpacity(0.35),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.chat_bubble_rounded,
                                  size: 16,
                                  color: Color(0xFF25D366),
                                ),
                              ),
                              const SizedBox(width: 10),
                              const Flexible(
                                child: Text(
                                  'Chat on WhatsApp',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                    letterSpacing: 0.3,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Icon(
                                Icons.open_in_new_rounded,
                                size: 16,
                                color: Colors.white,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 28),

              // App Version & About
              Center(
                child: Column(
                  children: [
                    const BrandLogo(size: 28, showText: true, compact: true),
                    const SizedBox(height: 8),
                    Text(
                      'Jalra v${AppUpdateService.currentVersionName} (Build ${AppUpdateService.currentVersionCode})',
                      style: AppTypography.caption,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Developed by VASANTH V',
                      style: AppTypography.caption.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                        fontSize: 11,
                      ),
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
    ),
  ),
);
  }

  Widget _buildTemplateChip({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: AppColors.primary.withOpacity(0.25),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: AppColors.primary),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _launchWhatsApp({String category = 'Platform Updates, Modifications & Feedback'}) async {
    final String message = '''Hello Vasanth! 👋

I am using the Jalra Music App (v${AppUpdateService.currentVersionName}).

📌 Topic: $category
💬 My Suggestions / Feedback:
- 

---
Sent from Jalra Music App''';

    final String encoded = Uri.encodeComponent(message);
    final Uri nativeUri = Uri.parse('whatsapp://send?phone=917358654720&text=$encoded');
    final Uri webUri = Uri.parse('https://wa.me/917358654720?text=$encoded');

    try {
      final bool launched = await launchUrl(nativeUri, mode: LaunchMode.externalApplication);
      if (!launched) {
        await launchUrl(webUri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {
      try {
        await launchUrl(webUri, mode: LaunchMode.externalApplication);
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Could not open WhatsApp. Please ensure WhatsApp is installed or message +91 7358654720 directly.'),
              backgroundColor: AppColors.surfaceHighlight,
            ),
          );
        }
      }
    }
  }
}

