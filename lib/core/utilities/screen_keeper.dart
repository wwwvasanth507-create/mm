import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Helper to keep the device screen on during active video playback
class ScreenKeeper {
  static const MethodChannel _channel = MethodChannel('in.wavemusic.premium/screen');
  static bool _isCurrentlyKeptOn = false;

  /// Enable or disable keeping the screen awake
  static Future<void> setKeepScreenOn(bool enable) async {
    if (_isCurrentlyKeptOn == enable) return;
    _isCurrentlyKeptOn = enable;
    try {
      await _channel.invokeMethod('keepScreenOn', {'enable': enable});
    } catch (e) {
      debugPrint('[ScreenKeeper] Unable to set keepScreenOn($enable): $e');
    }
  }
}
