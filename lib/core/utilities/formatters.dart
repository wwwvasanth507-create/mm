import 'package:intl/intl.dart';

class AppFormatters {
  AppFormatters._();

  /// Formats duration to mm:ss or hh:mm:ss
  static String formatDuration(Duration? duration) {
    if (duration == null || duration.isNegative) {
      return '00:00';
    }

    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    final seconds = duration.inSeconds.remainder(60);

    final minStr = minutes.toString().padLeft(2, '0');
    final secStr = seconds.toString().padLeft(2, '0');

    if (hours > 0) {
      return '$hours:$minStr:$secStr';
    }
    return '$minStr:$secStr';
  }

  /// Formats byte size to human readable (KB, MB, GB)
  static String formatFileSize(int bytes) {
    if (bytes <= 0) return '0 B';
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(1)} KB';
    }
    if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }

  /// Formats DateTime to localized readable string (e.g., Oct 25, 2026)
  static String formatDate(DateTime? date) {
    if (date == null) return '';
    return DateFormat.yMMMd().format(date);
  }
}
