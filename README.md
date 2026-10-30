# WaveMusic Premium 🎵
> **Complete Native Android Music Streaming & Offline Player**
> Built with Flutter & Dart | Package: `in.wavemusic.premium`

WaveMusic Premium is a standalone, production-oriented native Android music streaming and offline player application featuring deep midnight aesthetics, neon coral accents, persistent SQLite storage, background playback with media notification controls, and offline audio downloads.

---

## 🌟 Key Features

### 🎧 Audio Playback Engine
- Real audio streaming powered by `just_audio`.
- Full playback controls: Play, Pause, Resume, Next, Previous, Seek.
- Dynamic duration and position tracking with real-time seek bar.
- Queue management: reorder tracks via drag-and-drop, delete items, instant jump.
- Playback modes: Shuffle, Repeat Off, Repeat All, Repeat One.
- Buffering state indicators and audio error recovery.
- Fallback from offline file to streaming URL if local file is missing.

### 📱 Background Audio & Android Media Notification
- Background audio service powered by `just_audio_background` and `audio_service`.
- Full lock-screen controls and status-bar media notification (`MediaItem` metadata: title, artist, album art).
- Media button receiver support (headphone buttons, bluetooth devices).
- Compliant with Android 14+ `FOREGROUND_SERVICE_MEDIA_PLAYBACK` requirements.

### ⚡ Zero-Lag Audio Playback Engine
- Reused ExoPlayer instance across track switches without decoder teardown or stop/start jitter.
- Low-latency `AndroidLoadControl` (150ms initial playback buffer, 300ms rebuffer).
- Immediate 0ms synchronous UI state & mini-player updates on user tap with session ID cancellation for rapid switching.
- Adjacent track cover art and metadata pre-extraction in background isolate.
- HTTP Range streaming request headers (`Accept: audio/*, application/octet-stream`).

### 💾 Optimized Local Catalogue & SQLite Storage
- Persistent relational database using SQLite (`sqflite`) in Write-Ahead Logging (`WAL`) mode with `synchronous = NORMAL`.
- High-efficiency query indexing (`idx_songs_date_added`) and fast cold-start count checks.
- Bypasses redundant JSON parsing and bulk database upserts on app startup when catalogue is already populated.
- Thread-safe in-memory LRU metadata cache (`AppCacheConfig`) with automatic invalidation on updates.
- Parallel catalogue loading (`Future.wait`) and O(1) favorite ID lookups via in-memory Set.

### 🧠 Device-Aware Multi-Tier Caching System
- Centralized `AppCacheConfig` with adaptive memory budgeting for low-RAM (2GB–4GB) and high-end devices.
- Dynamic Flutter `imageCache` sizing (80 images / 30MB for low-RAM devices; 150 images / 60MB for standard).
- Automatic cache eviction on Android OS memory pressure (`didHaveMemoryPressure`).
- Non-blocking deferred local asset cover extraction and 4-second delayed remote sync.

### ⬇️ Offline Downloads
- Resumable and cancellable audio download manager powered by `dio`.
- Download progress percentage indicators.
- Safe app-private storage management with automatic filename sanitization.
- Storage usage calculation and single-tap downloaded file cleanup.
- Offline playback works completely without an internet connection for downloaded tracks.

### 🔍 Debounced Search & Responsive Library
- Real-time search with 250ms debouncing and epoch-based request cancellation.
- Virtualized `ListView.builder` for instantaneous suggestion rendering without UI stalls.
- Optimized `cacheExtent` (250–300px) and isolated repaint boundaries preventing whole-list re-layouts.
- Four-tab Library view with `AutomaticKeepAliveClientMixin` preserving scroll states:
  - **Playlists**: Create custom playlists, reorder songs, rename, and play-all.
  - **Liked Songs**: Instant favorite toggle with O(1) state resolution.
  - **Downloads**: View all offline tracks with cached file size badges.
  - **History**: Deduplicated playback history sorted by most recent.

### 🎨 Visual Identity & UI/UX
- **Theme**: Deep midnight black (`#090A0F`), neon coral/magenta (`#FF416C`), cyan/violet gradients.
- **Typography**: Google Fonts (Outfit headings, Inter body text).
- **Widgets**:
  - Persistent bottom mini-player above navigation bar with live progress.
  - Full-screen Now Playing screen with glowing album artwork and isolated `ValueNotifier` seekbar.
  - Custom brand logo and waveform animation iconography.
  - Read-only synchronized lyrics viewer.
  - Sound quality badge (Dynamic / Source-based indicator).

---

## 📁 Project Architecture

```
lib/
├── app.dart                                # MultiProvider, persistent navigation & memory pressure hook
├── main.dart                               # App entry point, cache config init & JustAudioBackground setup
│
├── core/
│   ├── cache/
│   │   └── cache_config.dart               # Device-aware memory cache, imageCache budget, LRU metadata
│   ├── constants/
│   │   ├── app_colors.dart                 # Midnight & neon palette tokens
│   │   └── app_typography.dart             # Outfit & Inter typography hierarchy
│   ├── theme/
│   │   └── app_theme.dart                  # Material 3 dark theme with custom components
│   └── utilities/
│       ├── formatters.dart                 # Duration, file size, date formatters
│       ├── url_resolver.dart               # Asset and URL resolver
│       └── validators.dart                 # Title, artist, URL, year validators
│
├── data/
│   ├── database/
│   │   └── app_database.dart               # SQLite DB schemas, indexes, WAL pragma, LRU caching
│   ├── models/
│   │   ├── download_item_model.dart        # Download task model with status enum
│   │   ├── playlist_model.dart             # Playlist entity with track count
│   │   └── song_model.dart                 # Song model with playableSource prioritization
│   ├── repositories/
│   │   └── music_repository.dart           # Fast-boot catalogue, O(1) favorites, deferred sync
│   └── services/
│       ├── audio_player_service.dart       # Zero-lag playback engine, session cancellation, preload
│       ├── cover_cache_service.dart        # Deferred non-blocking local cover prewarming
│       └── download_service.dart           # Dio chunked downloader, storage calculator
│
├── features/
│   ├── home/
│   │   └── home_screen.dart                # Dashboard: scoped selectors, virtualized catalogue
│   ├── library/
│   │   └── library_screen.dart             # Keep-alive tabs: Playlists, Liked, Downloads, History
│   ├── player/
│   │   ├── now_playing_screen.dart         # Fullscreen player with isolated ValueNotifier seekbar
│   │   └── widgets/
│   │       ├── lyrics_sheet.dart           # Read-only clean lyrics viewer
│   │       └── queue_sheet.dart            # Drag-and-drop reorderable queue
│   ├── playlists/
│   │   ├── playlist_details_screen.dart    # Playlist view with play-all, shuffle, reorder
│   │   └── widgets/
│   │       └── add_to_playlist_dialog.dart # Add song to existing or new playlist
│   ├── profile/
│   │   └── profile_screen.dart             # App info, audio settings, storage usage
│   └── search/
│       └── search_screen.dart              # 250ms debounced search, epoch cancellation, virtualized
│
└── shared/
    └── widgets/
        ├── brand_logo.dart                 # Custom WaveMusic Premium logo
        ├── empty_state.dart                # Styled empty state with call-to-action
        ├── mini_player.dart                # Persistent floating bottom player
        └── song_tile.dart                  # Isolated download indicator & favorite button widgets
```

---

## 🛠️ Prerequisites & Setup

### Environment Requirements
- **Flutter SDK**: 3.47.8+ (channel stable)
- **Dart SDK**: 3.7.0+
- **Android SDK**: API 36 (Android 15+) or compatible
- **JDK**: Java 17 or Java 21
- **Platform**: Windows, macOS, or Linux

### Getting Started

1. Clone or navigate to the project directory:
   ```bash
   cd c:\projects\WAPP
   ```

2. Fetch all dependencies:
   ```bash
   flutter pub get
   ```

3. Run static analysis:
   ```bash
   flutter analyze
   ```
   *(Result: 0 issues found)*

4. Execute automated test suite:
   ```bash
   flutter test
   ```
   *(Result: 31 passing tests covering performance optimization, memory pressure eviction, LRU metadata, models, validators, formatters, database CRUD, queue logic, and widgets)*

---

## 📦 Build Instructions

### 1. Debug APK (for testing)
```bash
flutter build apk --debug
```
**Output**: `build/app/outputs/flutter-apk/app-debug.apk`

### 2. Release APK (for sideloading / distribution)
```bash
flutter build apk --release
```
**Output**: `build/app/outputs/flutter-apk/app-release.apk`

### 3. Android App Bundle (for Google Play Store)
```bash
flutter build appbundle --release
```
**Output**: `build/app/outputs/bundle/release/app-release.aab`

---

## 🔒 Release Signing Note

The project is currently configured with the debug signing key in `android/app/build.gradle.kts` for immediate testing and release builds. To produce a production signed bundle for the Google Play Store:
1. Generate a keystore:
   ```bash
   keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
2. Reference the keystore in `android/key.properties`.
3. Update `android/app/build.gradle.kts` to point `signingConfigs.release` to `key.properties`.

---

## 🧪 Automated Test Suite

The test suite in `test/` validates all core business logic and performance optimizations:
- `test/performance_optimization_test.dart`: Device-aware cache config, memory pressure eviction, fast database count query, read-only LyricsSheet validation, and 250ms debounced search controller simulation.
- `test/song_model_test.dart`: Serialization, `toMap`, `fromMap`, `copyWith`, and `playableSource` prioritization.
- `test/validators_test.dart`: Song title, artist, audio URL protocol/format, thumbnail URL, and release year validation.
- `test/formatters_test.dart`: Duration (mm:ss and hh:mm:ss) and byte file size formatting.
- `test/database_test.dart`: SQLite CRUD, foreign key cascade, playlist track associations, and history deduplication.
- `test/queue_logic_test.dart`: Queue manipulation, item removal, reordering, repeat cycles, and search filtering.
- `test/widget_test.dart`: Brand logo and empty state widget rendering and interaction.

---

## 📋 Known Limitations & Technical Notes

1. **Cleartext HTTP**: Cleartext HTTP URLs are permitted only when explicitly supplied by the user, but HTTPS is strictly preferred. Some network providers may block plain HTTP streams.
2. **Dynamic Audio Streams**: Formats supported depend on native Android codecs (MP3, AAC, OGG, WAV, FLAC). Obscure or DRM-protected streams are not supported.
3. **Background Notification Customization**: Android 13+ requires the user to grant `POST_NOTIFICATIONS` permission to see playback controls in the status shade.
