import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import '../../data/models/song_model.dart';

/// Centralized, device-aware caching architecture for Jalra Music App.
/// Dynamically budgets memory for low-end (2GB-3GB RAM) and standard devices.
class AppCacheConfig {
  AppCacheConfig._();

  static bool _initialized = false;
  static bool _isLowMemoryDevice = false;

  // In-memory LRU metadata cache for rapid 0ms lookups
  static final Map<String, Song> _songMetadataCache = {};
  static const int _maxMetadataCacheSize = 300;

  /// Check if the device is low-memory or constrained
  static bool get isLowMemoryDevice => _isLowMemoryDevice;

  /// Initialize image and system cache limits tailored to device profile
  static void init() {
    if (_initialized) return;
    _initialized = true;

    // Detect environment / low-memory profile
    _detectDeviceProfile();

    // Configure Flutter painting imageCache
    final imageCache = PaintingBinding.instance.imageCache;
    if (_isLowMemoryDevice) {
      // Low-end devices (<=3GB RAM): strictly limit decoded bitmaps
      imageCache.maximumSize = 80; // Max 80 images
      imageCache.maximumSizeBytes = 30 * 1024 * 1024; // 30 MB
    } else {
      // Standard devices: conservative high-performance limits
      imageCache.maximumSize = 150; // Max 150 images
      imageCache.maximumSizeBytes = 60 * 1024 * 1024; // 60 MB
    }

    debugPrint(
      '[AppCacheConfig] Initialized with lowMem=$_isLowMemoryDevice, '
      'maxImageCount=${imageCache.maximumSize}, '
      'maxImageBytes=${imageCache.maximumSizeBytes ~/ (1024 * 1024)}MB',
    );
  }

  static void _detectDeviceProfile() {
    // In Android environments, we check processor count and available hints
    if (!kIsWeb && Platform.isAndroid) {
      final processors = Platform.numberOfProcessors;
      if (processors <= 4) {
        _isLowMemoryDevice = true;
      }
    }
  }

  /// Called when Android sends onTrimMemory or didHaveMemoryPressure
  static void onLowMemory() {
    debugPrint('[AppCacheConfig] Memory pressure detected. Evicting caches...');
    try {
      PaintingBinding.instance.imageCache.clear();
      PaintingBinding.instance.imageCache.clearLiveImages();
      _songMetadataCache.clear();
    } catch (e) {
      debugPrint('[AppCacheConfig] Error during low memory eviction: $e');
    }
  }

  // ==================== SONG METADATA LRU CACHE ====================

  static void cacheSong(Song song) {
    if (_songMetadataCache.length >= _maxMetadataCacheSize) {
      // Evict oldest entry (first key in map)
      final oldestKey = _songMetadataCache.keys.first;
      _songMetadataCache.remove(oldestKey);
    }
    _songMetadataCache[song.id] = song;
  }

  static void cacheSongs(Iterable<Song> songs) {
    for (final song in songs) {
      cacheSong(song);
    }
  }

  static Song? getCachedSong(String id) {
    final song = _songMetadataCache.remove(id);
    if (song != null) {
      // Re-insert at the end to maintain LRU recency
      _songMetadataCache[id] = song;
    }
    return song;
  }

  static void invalidateSong(String id) {
    _songMetadataCache.remove(id);
  }

  static void clearMetadataCache() {
    _songMetadataCache.clear();
  }
}
