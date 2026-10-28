import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../data/services/app_update_service.dart';
import 'brand_logo.dart';

/// Non-intrusive floating live update banner that sits gracefully at the top
/// without interfering with song playback or user navigation.
class InAppUpdateBanner extends StatelessWidget {
  const InAppUpdateBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final updateService = context.watch<AppUpdateService>();

    if (!updateService.shouldShowPrompt &&
        updateService.status != UpdateDownloadStatus.downloading) {
      return const SizedBox.shrink();
    }

    final info = updateService.latestUpdateInfo;
    if (info == null) return const SizedBox.shrink();

    final isDownloading =
        updateService.status == UpdateDownloadStatus.downloading;

    return Material(
      color: Colors.transparent,
      child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1B2338), Color(0xFF121624)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: AppColors.primary.withOpacity(0.55),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withOpacity(0.25),
                blurRadius: 18,
                spreadRadius: 1,
                offset: const Offset(0, 6),
              ),
              BoxShadow(
                color: Colors.black.withOpacity(0.6),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.system_update_alt_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              'Update Available',
                              style: AppTypography.bodySecondary.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.accentCyan.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'v${info.versionName}',
                                style: const TextStyle(
                                  color: AppColors.accentCyan,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          isDownloading
                              ? updateService.downloadProgressText
                              : 'Tap to update while continuing your music',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: isDownloading
                                ? AppColors.accentCyan
                                : AppColors.textMuted,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (!isDownloading) ...[
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      onPressed: () {
                        showInAppUpdateDialog(context);
                      },
                      child: const Text(
                        'UPDATE',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    if (!info.forceUpdate) ...[
                      const SizedBox(width: 6),
                      GestureDetector(
                        onTap: () => updateService.dismissPrompt(),
                        child: const Padding(
                          padding: EdgeInsets.all(4.0),
                          child: Icon(
                            Icons.close_rounded,
                            color: Colors.white60,
                            size: 18,
                          ),
                        ),
                      ),
                    ],
                  ] else ...[
                    IconButton(
                      icon: const Icon(
                        Icons.cancel_rounded,
                        color: Colors.white54,
                        size: 20,
                      ),
                      onPressed: () => updateService.cancelDownload(),
                      constraints: const BoxConstraints(),
                      padding: EdgeInsets.zero,
                    ),
                  ],
                ],
              ),
              if (isDownloading) ...[
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: updateService.downloadProgress > 0
                        ? updateService.downloadProgress
                        : null,
                    backgroundColor: Colors.white12,
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      AppColors.accentCyan,
                    ),
                    minHeight: 5,
                  ),
                ),
              ],
            ],
          ),
        ),
      );
  }
}

/// Full interactive glassmorphic dialog with changelog details & download progress
void showInAppUpdateDialog(BuildContext context) {
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (ctx) => const InAppUpdateDialogWidget(),
  );
}

class InAppUpdateDialogWidget extends StatelessWidget {
  const InAppUpdateDialogWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final updateService = context.watch<AppUpdateService>();
    final info = updateService.latestUpdateInfo;
    final isDownloading =
        updateService.status == UpdateDownloadStatus.downloading;
    final isCompleted =
        updateService.status == UpdateDownloadStatus.downloadCompleted ||
        updateService.status == UpdateDownloadStatus.installing;
    final hasError = updateService.status == UpdateDownloadStatus.error;

    if (info == null) {
      return const SizedBox.shrink();
    }

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          color: const Color(0xFF131722),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: AppColors.primary.withOpacity(0.4),
            width: 1.4,
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.2),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
            BoxShadow(
              color: Colors.black.withOpacity(0.8),
              blurRadius: 30,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with App Icon and Version Pill
            Row(
              children: [
                const BrandLogo(size: 34, showText: false),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        info.title,
                        style: AppTypography.heading3.copyWith(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Text(
                            'v${AppUpdateService.currentVersionName}  →  ',
                            style: AppTypography.caption.copyWith(
                              color: AppColors.textMuted,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 1.5,
                            ),
                            decoration: BoxDecoration(
                              gradient: AppColors.neonCyanViolet,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              'v${info.versionName}',
                              style: const TextStyle(
                                color: Colors.black,
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                if (!info.forceUpdate && !isDownloading)
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: Colors.white54),
                    onPressed: () {
                      updateService.dismissPrompt();
                      Navigator.of(context, rootNavigator: true).pop();
                    },
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
              ],
            ),

            const SizedBox(height: 18),

            // Release Notes / Changelog
            Text(
              "What's New:",
              style: AppTypography.bodySecondary.copyWith(
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 6),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF1B2030),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white10),
              ),
              child: Text(
                info.releaseNotes,
                style: const TextStyle(
                  color: Color(0xFFD4D8E8),
                  fontSize: 12.5,
                  height: 1.45,
                ),
              ),
            ),

            const SizedBox(height: 14),

            // Helpful note that song playback will continue
            Row(
              children: [
                const Icon(
                  Icons.music_note_rounded,
                  color: AppColors.accentCyan,
                  size: 16,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Songs will keep playing seamlessly while downloading',
                    style: TextStyle(
                      color: AppColors.accentCyan.withOpacity(0.9),
                      fontSize: 11,
                    ),
                  ),
                ),
              ],
            ),

            if (isDownloading) ...[
              const SizedBox(height: 18),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Downloading Update...',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    updateService.downloadProgressText,
                    style: const TextStyle(
                      color: AppColors.accentCyan,
                      fontSize: 11.5,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: updateService.downloadProgress > 0
                      ? updateService.downloadProgress
                      : null,
                  backgroundColor: Colors.white12,
                  valueColor: const AlwaysStoppedAnimation<Color>(
                    AppColors.accentCyan,
                  ),
                  minHeight: 7,
                ),
              ),
            ],

            if (isCompleted) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.green.withOpacity(0.4)),
                ),
                child: const Row(
                  children: [
                    Icon(
                      Icons.check_circle_rounded,
                      color: Colors.greenAccent,
                      size: 20,
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Download complete. Please tap "Install" on the Android screen.',
                        style: TextStyle(color: Colors.white, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            if (hasError) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.red.withOpacity(0.4)),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.error_outline_rounded,
                      color: Colors.redAccent,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        updateService.errorMessage ?? 'An error occurred',
                        style: const TextStyle(
                          color: Colors.redAccent,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 22),

            // Action Buttons
            Row(
              children: [
                if (!info.forceUpdate && !isDownloading) ...[
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.textMuted,
                        side: const BorderSide(color: Colors.white24),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: () {
                        updateService.dismissPrompt();
                        Navigator.of(context, rootNavigator: true).pop();
                      },
                      child: const Text('LATER'),
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  flex: isDownloading ? 1 : 2,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 4,
                      shadowColor: AppColors.primary.withOpacity(0.5),
                    ),
                    onPressed: isDownloading
                        ? () => updateService.cancelDownload()
                        : () => updateService.downloadAndInstall(),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          isDownloading
                              ? Icons.cancel_rounded
                              : Icons.download_rounded,
                          size: 18,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          isDownloading
                              ? 'CANCEL'
                              : (isCompleted ? 'RE-INSTALL' : 'UPDATE NOW'),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
