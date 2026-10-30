import 'package:flutter_test/flutter_test.dart';
import 'package:wavemusic_premium/data/models/song_model.dart';

void main() {
  group('Song Model Tests', () {
    test('Song model toMap and fromMap serialization', () {
      final now = DateTime.now();
      final song = Song(
        id: 'test_123',
        title: 'Neon Nights',
        artist: 'Wave Artists',
        album: 'Cyber Echoes',
        releaseYear: 2026,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        audioUrl: 'https://example.com/audio.mp3',
        description: 'Electronic synthwave track',
        dateAdded: now,
        isFavorite: true,
        isDownloaded: false,
        localFilePath: null,
        lyrics: 'Dancing in the neon rain...',
      );

      final map = song.toMap();
      expect(map['id'], 'test_123');
      expect(map['title'], 'Neon Nights');
      expect(map['artist'], 'Wave Artists');
      expect(map['is_favorite'], 1);
      expect(map['is_downloaded'], 0);
      expect(map['lyrics'], 'Dancing in the neon rain...');

      final deserialized = Song.fromMap(map);
      expect(deserialized.id, song.id);
      expect(deserialized.title, song.title);
      expect(deserialized.artist, song.artist);
      expect(deserialized.album, song.album);
      expect(deserialized.releaseYear, 2026);
      expect(deserialized.isFavorite, true);
      expect(deserialized.isDownloaded, false);
      expect(deserialized.localFilePath, isNull);
      expect(deserialized.lyrics, 'Dancing in the neon rain...');
    });

    test('Song playableSource prioritizes localFilePath when present', () {
      final streamingSong = Song(
        id: 'stream_1',
        title: 'Stream Song',
        artist: 'Artist',
        album: 'Album',
        releaseYear: 2025,
        audioUrl: 'https://example.com/stream.mp3',
        dateAdded: DateTime.now(),
        localFilePath: null,
      );
      expect(streamingSong.playableSource, 'https://example.com/stream.mp3');

      final downloadedSong = Song(
        id: 'downloaded_1',
        title: 'Downloaded Song',
        artist: 'Artist',
        album: 'Album',
        releaseYear: 2025,
        audioUrl: 'https://example.com/stream.mp3',
        dateAdded: DateTime.now(),
        isDownloaded: true,
        localFilePath: '/storage/emulated/0/WaveMusic/song.mp3',
      );
      expect(downloadedSong.playableSource, '/storage/emulated/0/WaveMusic/song.mp3');
    });

    test('Song copyWith produces updated instances', () {
      final song = Song(
        id: 'test_copy',
        title: 'Initial Title',
        artist: 'Initial Artist',
        album: 'Initial Album',
        releaseYear: 2024,
        audioUrl: 'https://example.com/initial.mp3',
        dateAdded: DateTime.now(),
        isFavorite: false,
      );

      final updated = song.copyWith(
        title: 'Updated Title',
        isFavorite: true,
        localFilePath: '/local/path.mp3',
      );

      expect(updated.id, 'test_copy');
      expect(updated.title, 'Updated Title');
      expect(updated.artist, 'Initial Artist');
      expect(updated.isFavorite, true);
      expect(updated.localFilePath, '/local/path.mp3');
    });

    test('Song videoUrl and hasVideo property', () {
      final songWithVideo = Song(
        id: 'coolie_monica',
        title: 'Monica',
        artist: 'Anirudh Ravichander',
        album: 'Coolie',
        audioUrl: 'https://example.com/audio.mp3',
        videoUrl: 'https://example.com/video.mp4',
        dateAdded: DateTime.now(),
      );
      expect(songWithVideo.hasVideo, true);
      expect(songWithVideo.videoUrl, 'https://example.com/video.mp4');

      final songWithoutVideo = Song(
        id: 'no_video',
        title: 'Audio Only',
        artist: 'Artist',
        album: 'Album',
        audioUrl: 'https://example.com/audio.mp3',
        dateAdded: DateTime.now(),
      );
      expect(songWithoutVideo.hasVideo, false);
      expect(songWithoutVideo.videoUrl, isNull);
    });
  });
}
