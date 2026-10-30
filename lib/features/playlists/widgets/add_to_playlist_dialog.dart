import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../data/models/song_model.dart';
import '../../../data/repositories/music_repository.dart';
import '../../../shared/widgets/playlist_artwork.dart';

class AddToPlaylistDialog extends StatelessWidget {
  final Song song;

  const AddToPlaylistDialog({super.key, required this.song});

  @override
  Widget build(BuildContext context) {
    final repository = context.watch<MusicRepository>();
    final playlists = repository.playlists;

    return AlertDialog(
      backgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text('Add to Playlist', style: AppTypography.heading3),
          IconButton(
            icon: const Icon(Icons.add_rounded, color: AppColors.primary),
            tooltip: 'New Playlist',
            onPressed: () {
              Navigator.pop(context);
              _showCreatePlaylistDialog(context, repository);
            },
          ),
        ],
      ),
      content: SizedBox(
        width: double.maxFinite,
        child: playlists.isEmpty
            ? Padding(
                padding: const EdgeInsets.symmetric(vertical: 20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.playlist_play_rounded, size: 40, color: AppColors.textMuted),
                    const SizedBox(height: 12),
                    Text('No playlists created yet', style: AppTypography.bodySecondary),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _showCreatePlaylistDialog(context, repository);
                      },
                      child: const Text('Create New Playlist'),
                    ),
                  ],
                ),
              )
            : ListView.builder(
                shrinkWrap: true,
                itemCount: playlists.length,
                itemBuilder: (context, index) {
                  final playlist = playlists[index];
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: PlaylistArtwork(
                      thumbnailUrl: playlist.thumbnailUrl,
                      size: 44,
                      borderRadius: 8,
                    ),
                    title: Text(playlist.name, style: AppTypography.title.copyWith(fontSize: 14)),
                    subtitle: Text('${playlist.songCount} songs', style: AppTypography.caption),
                    onTap: () async {
                      await repository.addSongToPlaylist(playlist.id, song.id);
                      if (context.mounted) {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Added "${song.title}" to ${playlist.name}'),
                            backgroundColor: AppColors.accentEmerald,
                          ),
                        );
                      }
                    },
                  );
                },
              ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
        ),
      ],
    );
  }

  void _showCreatePlaylistDialog(BuildContext context, MusicRepository repo) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('New Playlist'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'Playlist Name (e.g. Night Vibes)',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              final name = controller.text.trim();
              if (name.isNotEmpty) {
                Navigator.pop(ctx);
                await repo.createPlaylist(name);
                // Also add this song
                final updatedPlaylists = repo.playlists;
                if (updatedPlaylists.isNotEmpty) {
                  final newPl = updatedPlaylists.first;
                  await repo.addSongToPlaylist(newPl.id, song.id);
                }
              }
            },
            child: const Text('Create & Add'),
          ),
        ],
      ),
    );
  }
}
