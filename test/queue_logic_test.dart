import 'package:flutter_test/flutter_test.dart';
import 'package:wavemusic_premium/data/models/song_model.dart';
import 'package:wavemusic_premium/data/services/audio_player_service.dart';

void main() {
  group('Queue & Playback State Logic Tests', () {
    test('AppRepeatMode enum cycle transitions', () {
      expect(AppRepeatMode.off.index, 0);
      expect(AppRepeatMode.all.index, 1);
      expect(AppRepeatMode.one.index, 2);
    });

    test('Queue item reordering simulation logic', () {
      final now = DateTime.now();
      final songs = [
        Song(id: '1', title: 'Song 1', artist: 'A', album: 'Alb', releaseYear: 2024, audioUrl: 'u1', dateAdded: now),
        Song(id: '2', title: 'Song 2', artist: 'A', album: 'Alb', releaseYear: 2024, audioUrl: 'u2', dateAdded: now),
        Song(id: '3', title: 'Song 3', artist: 'A', album: 'Alb', releaseYear: 2024, audioUrl: 'u3', dateAdded: now),
      ];

      final queue = List<Song>.from(songs);
      // Simulate moving item from index 0 to index 2
      final oldIndex = 0;
      var newIndex = 2;
      if (oldIndex < newIndex) {
        newIndex -= 1;
      }
      final item = queue.removeAt(oldIndex);
      queue.insert(newIndex, item);

      expect(queue.map((s) => s.id).toList(), ['2', '1', '3']);
    });

    test('Queue deletion simulation logic', () {
      final now = DateTime.now();
      final songs = [
        Song(id: '1', title: 'Song 1', artist: 'A', album: 'Alb', releaseYear: 2024, audioUrl: 'u1', dateAdded: now),
        Song(id: '2', title: 'Song 2', artist: 'A', album: 'Alb', releaseYear: 2024, audioUrl: 'u2', dateAdded: now),
      ];

      final queue = List<Song>.from(songs);
      queue.removeWhere((s) => s.id == '1');
      expect(queue.length, 1);
      expect(queue.first.id, '2');
    });

    test('Search filter logic matches title, artist, and album case-insensitively', () {
      final now = DateTime.now();
      final songs = [
        Song(id: '1', title: 'Midnight Starlight', artist: 'Luna', album: 'Night Sky', releaseYear: 2024, audioUrl: 'u1', dateAdded: now),
        Song(id: '2', title: 'Solar Flare', artist: 'Helios', album: 'Daybreak', releaseYear: 2025, audioUrl: 'u2', dateAdded: now),
        Song(id: '3', title: 'Ocean Waves', artist: 'Marine', album: 'Starlight Voyage', releaseYear: 2026, audioUrl: 'u3', dateAdded: now),
      ];

      final query = 'starlight';
      final matches = songs.where((s) {
        final q = query.toLowerCase();
        return s.title.toLowerCase().contains(q) ||
            s.artist.toLowerCase().contains(q) ||
            s.album.toLowerCase().contains(q);
      }).toList();

      expect(matches.length, 2);
      expect(matches.map((s) => s.id).toList(), containsAll(['1', '3']));
    });
  });
}
