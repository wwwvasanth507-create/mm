class Song {
  final String id;
  final String title;
  final String artist;
  final String album;
  final int? releaseYear;
  final String? thumbnailUrl;
  final String audioUrl;
  final String? description;
  final DateTime dateAdded;
  final bool isFavorite;
  final bool isDownloaded;
  final String? localFilePath;
  final int? durationMs;
  final String? lyrics;
  final String? videoUrl;
  final String? genre;

  Song({
    required this.id,
    required this.title,
    required this.artist,
    required this.album,
    this.releaseYear,
    this.thumbnailUrl,
    required this.audioUrl,
    this.description,
    required this.dateAdded,
    this.isFavorite = false,
    this.isDownloaded = false,
    this.localFilePath,
    this.durationMs,
    this.lyrics,
    this.videoUrl,
    this.genre,
  });

  bool get hasVideo => videoUrl != null && videoUrl!.trim().isNotEmpty;

  /// The effective playable URL - prefers local file path if downloaded and file exists
  String get playableSource =>
      (isDownloaded && localFilePath != null && localFilePath!.isNotEmpty)
          ? localFilePath!
          : audioUrl;

  Duration? get duration =>
      durationMs != null ? Duration(milliseconds: durationMs!) : null;

  Song copyWith({
    String? id,
    String? title,
    String? artist,
    String? album,
    int? releaseYear,
    String? thumbnailUrl,
    String? audioUrl,
    String? description,
    DateTime? dateAdded,
    bool? isFavorite,
    bool? isDownloaded,
    String? localFilePath,
    int? durationMs,
    String? lyrics,
    String? videoUrl,
    String? genre,
  }) {
    return Song(
      id: id ?? this.id,
      title: title ?? this.title,
      artist: artist ?? this.artist,
      album: album ?? this.album,
      releaseYear: releaseYear ?? this.releaseYear,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      audioUrl: audioUrl ?? this.audioUrl,
      description: description ?? this.description,
      dateAdded: dateAdded ?? this.dateAdded,
      isFavorite: isFavorite ?? this.isFavorite,
      isDownloaded: isDownloaded ?? this.isDownloaded,
      localFilePath: localFilePath ?? this.localFilePath,
      durationMs: durationMs ?? this.durationMs,
      lyrics: lyrics ?? this.lyrics,
      videoUrl: videoUrl ?? this.videoUrl,
      genre: genre ?? this.genre,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'artist': artist,
      'album': album,
      'release_year': releaseYear,
      'thumbnail_url': thumbnailUrl,
      'audio_url': audioUrl,
      'description': description,
      'date_added': dateAdded.toIso8601String(),
      'is_favorite': isFavorite ? 1 : 0,
      'is_downloaded': isDownloaded ? 1 : 0,
      'local_file_path': localFilePath,
      'duration_ms': durationMs,
      'lyrics': lyrics,
      'video_url': videoUrl,
      'genre': genre,
    };
  }

  factory Song.fromMap(Map<String, dynamic> map) {
    return Song(
      id: map['id'] as String,
      title: map['title'] as String,
      artist: (map['artist'] as String?) ?? 'Unknown Artist',
      album: (map['album'] as String?) ?? 'Single',
      releaseYear: map['release_year'] as int?,
      thumbnailUrl: map['thumbnail_url'] as String?,
      audioUrl: map['audio_url'] as String,
      description: map['description'] as String?,
      dateAdded: map['date_added'] != null
          ? DateTime.tryParse(map['date_added'] as String) ?? DateTime.now()
          : DateTime.now(),
      isFavorite: (map['is_favorite'] as int? ?? 0) == 1,
      isDownloaded: (map['is_downloaded'] as int? ?? 0) == 1,
      localFilePath: map['local_file_path'] as String?,
      durationMs: map['duration_ms'] as int?,
      lyrics: map['lyrics'] as String?,
      videoUrl: map['video_url'] as String?,
      genre: map['genre'] as String?,
    );
  }

  factory Song.fromJson(Map<String, dynamic> json) {
    final rawDuration = json['duration'];
    int? durationMs;
    if (rawDuration is int) {
      durationMs = rawDuration * 1000;
    } else if (rawDuration is num) {
      durationMs = (rawDuration * 1000).toInt();
    }

    final rawThumb = json['thumbnailUrl'] ?? json['artworkUrl'] ?? json['thumbnail_url'];
    final rawAudio = json['audioUrl'] ?? json['url'] ?? json['audio_url'] ?? '';
    final rawVideo = json['videoUrl'] ?? json['video_url'] ?? json['video'];
    final rawGenre = json['genre'];

    return Song(
      id: (json['id'] as String?)?.trim() ?? 'song-${DateTime.now().millisecondsSinceEpoch}',
      title: (json['title'] as String?)?.trim() ?? 'Untitled Track',
      artist: (json['artist'] as String?)?.trim() ?? 'Unknown Artist',
      album: (json['album'] as String?)?.trim() ?? 'Single',
      releaseYear: json['year'] is int
          ? json['year'] as int
          : (json['releaseYear'] as int? ?? json['release_year'] as int?),
      thumbnailUrl: rawThumb is String && rawThumb.isNotEmpty ? rawThumb.trim() : null,
      audioUrl: rawAudio is String ? rawAudio.trim() : '',
      description: json['description'] as String?,
      dateAdded: json['dateAdded'] != null
          ? DateTime.tryParse(json['dateAdded'] as String) ?? DateTime.now()
          : (json['date_added'] != null
              ? DateTime.tryParse(json['date_added'] as String) ?? DateTime.now()
              : DateTime.now()),
      isFavorite: json['isFavorite'] == true || json['is_favorite'] == 1,
      isDownloaded: json['isDownloaded'] == true || json['is_downloaded'] == 1,
      localFilePath: json['localFilePath'] as String? ?? json['local_file_path'] as String?,
      durationMs: durationMs ?? (json['durationMs'] as int? ?? json['duration_ms'] as int?),
      lyrics: json['lyrics'] as String?,
      videoUrl: rawVideo is String && rawVideo.trim().isNotEmpty ? rawVideo.trim() : null,
      genre: rawGenre is String && rawGenre.trim().isNotEmpty ? rawGenre.trim() : null,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is Song && other.id == id);

  @override
  int get hashCode => id.hashCode;
}
