class Playlist {
  final String id;
  final String name;
  final String? description;
  final String? thumbnailUrl;
  final DateTime createdAt;
  final int songCount;

  Playlist({
    required this.id,
    required this.name,
    this.description,
    this.thumbnailUrl,
    required this.createdAt,
    this.songCount = 0,
  });

  Playlist copyWith({
    String? id,
    String? name,
    String? description,
    String? thumbnailUrl,
    DateTime? createdAt,
    int? songCount,
  }) {
    return Playlist(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      createdAt: createdAt ?? this.createdAt,
      songCount: songCount ?? this.songCount,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'thumbnail_url': thumbnailUrl,
      'created_at': createdAt.toIso8601String(),
    };
  }

  factory Playlist.fromMap(Map<String, dynamic> map, {int songCount = 0}) {
    return Playlist(
      id: map['id'] as String,
      name: map['name'] as String,
      description: map['description'] as String?,
      thumbnailUrl: (map['resolved_thumbnail'] ?? map['thumbnail_url']) as String?,
      createdAt: map['created_at'] != null
          ? DateTime.tryParse(map['created_at'] as String) ?? DateTime.now()
          : DateTime.now(),
      songCount: (map['song_count'] as int?) ?? songCount,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is Playlist && other.id == id);

  @override
  int get hashCode => id.hashCode;
}
