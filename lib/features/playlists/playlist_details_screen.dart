import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../data/models/playlist_model.dart';
import '../../data/models/song_model.dart';
import '../../data/repositories/music_repository.dart';
import '../../data/services/audio_player_service.dart';
import '../../data/services/download_service.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/mini_player.dart';
import '../../shared/widgets/playlist_artwork.dart';
import '../../shared/widgets/song_tile.dart';

class PlaylistDetailsScreen extends StatefulWidget {
  final Playlist playlist;

  const PlaylistDetailsScreen({super.key, required this.playlist});

  @override
  State<PlaylistDetailsScreen> createState() => _PlaylistDetailsScreenState();
}

class _PlaylistDetailsScreenState extends State<PlaylistDetailsScreen> {
  List<Song> _songs = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPlaylistSongs();
  }

  Future<void> _loadPlaylistSongs() async {
    final repo = context.read<MusicRepository>();
    if (widget.playlist.id == 'liked-songs') {
      if (mounted) {
        setState(() {
          _songs = repo.favoriteSongs;
          _isLoading = false;
        });
      }
      return;
    }
    if (widget.playlist.id == 'downloaded-songs') {
      if (mounted) {
        setState(() {
          _songs = repo.downloadedSongs;
          _isLoading = false;
        });
      }
      return;
    }

    var songs = await repo.getPlaylistSongs(widget.playlist.id);
    if (songs.isEmpty) {
      // Re-query catalogue if songs were populated in background
      await repo.loadCatalogue();
      songs = await repo.getPlaylistSongs(widget.playlist.id);
    }
    if (mounted) {
      setState(() {
        _songs = songs;
        _isLoading = false;
      });
    }
  }

  void _showRenameDialog(BuildContext context, MusicRepository repo) {
    final controller = TextEditingController(text: widget.playlist.name);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Rename Playlist'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'New Playlist Name'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              final newName = controller.text.trim();
              if (newName.isNotEmpty) {
                Navigator.pop(ctx);
                await repo.renamePlaylist(widget.playlist.id, newName);
                if (mounted) setState(() {});
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final repo = context.watch<MusicRepository>();
    final playerService = context.read<AudioPlayerService>();

    // Current playlist instance from repo
    final currentPlaylist = repo.playlists.firstWhere(
      (p) => p.id == widget.playlist.id,
      orElse: () => widget.playlist,
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(currentPlaylist.name, style: AppTypography.heading3),
        actions: [
          if (!widget.playlist.id.contains('liked') &&
              !widget.playlist.id.contains('download') &&
              !widget.playlist.id.startsWith('playlist-'))
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              tooltip: 'Rename Playlist',
              onPressed: () => _showRenameDialog(context, repo),
            ),
        ],
      ),
      bottomNavigationBar: const SafeArea(
        top: false,
        child: MiniPlayer(),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : Column(
              children: [
                // Playlist Header Card
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.divider),
                  ),
                  child: Row(
                    children: [
                      PlaylistArtwork(
                        thumbnailUrl: currentPlaylist.thumbnailUrl ??
                            (_songs.isNotEmpty ? _songs.first.thumbnailUrl : null),
                        size: 72,
                        borderRadius: 16,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(currentPlaylist.name, style: AppTypography.heading3),
                            const SizedBox(height: 4),
                            Text(
                              '${_songs.length} tracks',
                              style: AppTypography.caption,
                            ),
                            if (currentPlaylist.description != null &&
                                currentPlaylist.description!.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                currentPlaylist.description!,
                                style: AppTypography.bodySecondary.copyWith(fontSize: 12),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Play All & Shuffle Buttons
                if (_songs.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () {
                              playerService.playQueue(_songs, initialIndex: 0);
                            },
                            icon: const Icon(Icons.play_arrow_rounded),
                            label: const Text('Play All'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {
                              playerService.playQueue(_songs, initialIndex: 0);
                              if (!playerService.isShuffle) {
                                playerService.toggleShuffle();
                              }
                            },
                            icon: const Icon(Icons.shuffle_rounded, color: AppColors.primary),
                            label: const Text('Shuffle', style: TextStyle(color: Colors.white)),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: AppColors.divider),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 8),

                // Song List (Reorderable)
                Expanded(
                  child: _songs.isEmpty
                      ? const EmptyState(
                          icon: Icons.music_off_rounded,
                          title: 'Playlist is empty',
                          message: 'Add songs to this playlist from your library or search.',
                        )
                      : ReorderableListView.builder(
                          physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                          itemExtent: 68.0,
                          cacheExtent: 250.0,
                          itemCount: _songs.length,
                          padding: const EdgeInsets.only(bottom: 24),
                          onReorder: (oldIndex, newIndex) async {
                            if (oldIndex < newIndex) newIndex -= 1;
                            final song = _songs.removeAt(oldIndex);
                            _songs.insert(newIndex, song);
                            setState(() {});
                            if (!widget.playlist.id.contains('liked') &&
                                !widget.playlist.id.contains('download')) {
                              await repo.reorderPlaylist(
                                widget.playlist.id,
                                _songs.map((s) => s.id).toList(),
                              );
                            }
                          },
                          itemBuilder: (context, index) {
                            final song = _songs[index];
                            return Dismissible(
                              key: ValueKey(song.id),
                              direction: DismissDirection.endToStart,
                              background: Container(
                                alignment: Alignment.centerRight,
                                padding: const EdgeInsets.only(right: 20),
                                color: AppColors.error,
                                child: const Icon(Icons.delete_rounded, color: Colors.white),
                              ),
                              onDismissed: (_) async {
                                final removedSong = _songs.removeAt(index);
                                setState(() {});
                                if (widget.playlist.id == 'liked-songs') {
                                  await repo.toggleFavorite(removedSong.id);
                                } else if (widget.playlist.id == 'downloaded-songs') {
                                  await context.read<DownloadService>().deleteDownload(removedSong);
                                } else {
                                  await repo.removeSongFromPlaylist(widget.playlist.id, removedSong.id);
                                }
                              },
                              child: SongTile(
                                song: song,
                                onTap: () => playerService.playSong(song, queue: _songs),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }
}
