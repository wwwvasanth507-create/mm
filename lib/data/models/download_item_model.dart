enum DownloadStatus {
  pending,
  downloading,
  completed,
  failed,
  cancelled,
}

class DownloadItem {
  final String id;
  final String songId;
  final String downloadUrl;
  final String localPath;
  final DownloadStatus status;
  final double progress;
  final int fileSizeBytes;
  final String? errorMessage;
  final DateTime createdAt;

  DownloadItem({
    required this.id,
    required this.songId,
    required this.downloadUrl,
    required this.localPath,
    this.status = DownloadStatus.pending,
    this.progress = 0.0,
    this.fileSizeBytes = 0,
    this.errorMessage,
    required this.createdAt,
  });

  DownloadItem copyWith({
    String? id,
    String? songId,
    String? downloadUrl,
    String? localPath,
    DownloadStatus? status,
    double? progress,
    int? fileSizeBytes,
    String? errorMessage,
    DateTime? createdAt,
  }) {
    return DownloadItem(
      id: id ?? this.id,
      songId: songId ?? this.songId,
      downloadUrl: downloadUrl ?? this.downloadUrl,
      localPath: localPath ?? this.localPath,
      status: status ?? this.status,
      progress: progress ?? this.progress,
      fileSizeBytes: fileSizeBytes ?? this.fileSizeBytes,
      errorMessage: errorMessage ?? this.errorMessage,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'song_id': songId,
      'download_url': downloadUrl,
      'local_path': localPath,
      'status': status.name,
      'progress': progress,
      'file_size_bytes': fileSizeBytes,
      'error_message': errorMessage,
      'created_at': createdAt.toIso8601String(),
    };
  }

  factory DownloadItem.fromMap(Map<String, dynamic> map) {
    return DownloadItem(
      id: map['id'] as String,
      songId: map['song_id'] as String,
      downloadUrl: map['download_url'] as String,
      localPath: map['local_path'] as String,
      status: DownloadStatus.values.firstWhere(
        (e) => e.name == (map['status'] as String? ?? 'pending'),
        orElse: () => DownloadStatus.pending,
      ),
      progress: (map['progress'] as num?)?.toDouble() ?? 0.0,
      fileSizeBytes: (map['file_size_bytes'] as int?) ?? 0,
      errorMessage: map['error_message'] as String?,
      createdAt: map['created_at'] != null
          ? DateTime.tryParse(map['created_at'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
