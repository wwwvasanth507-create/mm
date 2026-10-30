import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/utilities/formatters.dart';
import '../../data/models/playlist_model.dart';
import '../../data/models/song_model.dart';
import '../../data/repositories/music_repository.dart';
import '../../data/services/audio_player_service.dart';
import '../../data/services/download_service.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/playlist_artwork.dart';
import '../../shared/widgets/song_tile.dart';
import '../playlists/playlist_details_screen.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1280),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
            // Header with Remote Sync Action
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Your Library', style: AppTypography.heading1),
                  IconButton(
                    icon: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.divider),
                      ),
                      child: const Icon(Icons.sync_rounded, color: AppColors.textSecondary, size: 20),
                    ),
                    tooltip: 'Sync Playlists & Songs from Repo',
                    onPressed: () async {
                      final repo = context.read<MusicRepository>();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Syncing songs & playlists from GitHub repository...'),
                          duration: Duration(seconds: 1),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                      await repo.syncWithRemoteCatalogue();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Synced ${repo.songs.length} songs & ${repo.playlists.length} playlists!'),
                            backgroundColor: AppColors.accentEmerald,
                            duration: const Duration(seconds: 2),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      }
                    },
                  ),
                ],
              ),
            ),

            // Cute Floating Tab bar
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              padding: const EdgeInsets.all(3.5),
              decoration: BoxDecoration(
                color: const Color(0xFF11171E),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFF1E293B), width: 0.8),
              ),
              child: TabBar(
                controller: _tabController,
                indicator: BoxDecoration(
                  gradient: AppColors.cuteDockActive,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF76E035).withOpacity(0.35),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                labelColor: Colors.black,
                unselectedLabelColor: const Color(0xFF94A3B8),
                labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11.5),
                dividerColor: Colors.transparent,
                tabs: const [
                  Tab(text: 'Playlists'),
                  Tab(text: 'Liked'),
                  Tab(text: 'Downloads'),
                  Tab(text: 'History'),
                ],
              ),
            ),

            // Tab Views
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: const [
                  _PlaylistsTab(),
                  _LikedSongsTab(),
                  _DownloadsTab(),
                  _HistoryTab(),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  ),
);
  }
}

// ==================== PLAYLISTS TAB ====================
class _PlaylistsTab extends StatefulWidget {
  const _PlaylistsTab();

  @override
  State<_PlaylistsTab> createState() => _PlaylistsTabState();
}

class _PlaylistsTabState extends State<_PlaylistsTab> with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final repo = context.read<MusicRepository>();

    return Selector<MusicRepository, List<Playlist>>(
      selector: (_, r) => r.playlists,
      builder: (context, playlists, _) {
        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('${playlists.length} playlists', style: AppTypography.caption),
                  TextButton.icon(
                    onPressed: () => _showCreatePlaylistDialog(context, repo),
                    icon: const Icon(Icons.add_rounded, size: 20, color: AppColors.primary),
                    label: const Text('New Playlist', style: TextStyle(color: AppColors.primary)),
                  ),
                ],
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                color: AppColors.primary,
                onRefresh: () => repo.syncWithRemoteCatalogue(),
                child: playlists.isEmpty
                    ? SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        child: Padding(
                          padding: const EdgeInsets.only(top: 80),
                          child: EmptyState(
                            icon: Icons.queue_music_rounded,
                            title: 'No playlists yet',
                            message: 'Create custom playlists or sync from your GitHub repository.',
                            actionText: 'Create Playlist',
                            onAction: () => _showCreatePlaylistDialog(context, repo),
                          ),
                        ),
                      )
                    : ListView.builder(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.only(bottom: 90),
                        cacheExtent: 250.0,
                        itemCount: playlists.length,
                        itemBuilder: (context, index) {
                          final playlist = playlists[index];
                          return ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                            leading: PlaylistArtwork(
                              thumbnailUrl: playlist.thumbnailUrl,
                              size: 50,
                              borderRadius: 10,
                            ),
                            title: Text(playlist.name, style: AppTypography.title),
                            subtitle: Text('${playlist.songCount} tracks', style: AppTypography.caption),
                            trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => PlaylistDetailsScreen(playlist: playlist),
                                ),
                              );
                            },
                          );
                        },
                      ),
              ),
            ),
          ],
        );
      },
    );
  }

  void _showCreatePlaylistDialog(BuildContext context, MusicRepository repo) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Create Playlist'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Playlist Name'),
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
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
}

// ==================== LIKED SONGS TAB ====================
class _LikedSongsTab extends StatefulWidget {
  const _LikedSongsTab();

  @override
  State<_LikedSongsTab> createState() => _LikedSongsTabState();
}

class _LikedSongsTabState extends State<_LikedSongsTab> with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final playerService = context.read<AudioPlayerService>();

    return Selector<MusicRepository, List<Song>>(
      selector: (_, repo) => repo.favoriteSongs,
      builder: (context, favorites, _) {
        if (favorites.isEmpty) {
          return const EmptyState(
            icon: Icons.favorite_border_rounded,
            title: 'No liked songs',
            message: 'Tap the heart icon on any track to add it to your Liked Songs collection.',
          );
        }

        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('${favorites.length} liked tracks', style: AppTypography.caption),
                  ElevatedButton.icon(
                    onPressed: () => playerService.playQueue(favorites, initialIndex: 0),
                    icon: const Icon(Icons.play_arrow_rounded, size: 20),
                    label: const Text('Play All'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      textStyle: AppTypography.caption.copyWith(fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                itemExtent: 68.0,
                cacheExtent: 250.0,
                addAutomaticKeepAlives: true,
                addRepaintBoundaries: true,
                padding: const EdgeInsets.only(bottom: 90),
                itemCount: favorites.length,
                itemBuilder: (context, index) {
                  final song = favorites[index];
                  return SongTile(
                    song: song,
                    onTap: () => playerService.playSong(song, queue: favorites),
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }
}

// ==================== DOWNLOADS TAB ====================
class _DownloadsTab extends StatefulWidget {
  const _DownloadsTab();

  @override
  State<_DownloadsTab> createState() => _DownloadsTabState();
}

class _DownloadsTabState extends State<_DownloadsTab> with AutomaticKeepAliveClientMixin {
  int _downloadSize = 0;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _fetchDownloadSize();
  }

  Future<void> _fetchDownloadSize() async {
    final size = await context.read<DownloadService>().getTotalDownloadSize();
    if (mounted) setState(() => _downloadSize = size);
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final playerService = context.read<AudioPlayerService>();

    return Selector<MusicRepository, List<Song>>(
      selector: (_, repo) => repo.downloadedSongs,
      builder: (context, downloadedSongs, _) {
        return Column(
          children: [
            // Storage usage card
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.divider),
              ),
              child: Row(
                children: [
                  const Icon(Icons.offline_pin_rounded, color: AppColors.accentEmerald, size: 26),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Offline Music Storage', style: AppTypography.title.copyWith(fontSize: 14)),
                        Text(
                          '${downloadedSongs.length} songs downloaded (${AppFormatters.formatFileSize(_downloadSize)})',
                          style: AppTypography.caption,
                        ),
                      ],
                    ),
                  ),
                  if (downloadedSongs.isNotEmpty)
                    ElevatedButton(
                      onPressed: () => playerService.playQueue(downloadedSongs, initialIndex: 0),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        backgroundColor: AppColors.accentEmerald,
                      ),
                      child: const Text('Play Offline', style: TextStyle(color: Colors.black, fontSize: 12)),
                    ),
                ],
              ),
            ),

            Expanded(
              child: downloadedSongs.isEmpty
                  ? const EmptyState(
                      icon: Icons.download_done_rounded,
                      title: 'No downloaded songs',
                      message: 'Download songs from your library to listen offline without internet.',
                    )
                  : ListView.builder(
                      physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                      itemExtent: 68.0,
                      cacheExtent: 250.0,
                      addAutomaticKeepAlives: true,
                      addRepaintBoundaries: true,
                      padding: const EdgeInsets.only(bottom: 90),
                      itemCount: downloadedSongs.length,
                      itemBuilder: (context, index) {
                        final song = downloadedSongs[index];
                        return SongTile(
                          song: song,
                          onTap: () => playerService.playSong(song, queue: downloadedSongs),
                        );
                      },
                    ),
            ),
          ],
        );
      },
    );
  }
}

// ==================== HISTORY TAB ====================
class _HistoryTab extends StatefulWidget {
  const _HistoryTab();

  @override
  State<_HistoryTab> createState() => _HistoryTabState();
}

class _HistoryTabState extends State<_HistoryTab> with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final repo = context.read<MusicRepository>();
    final playerService = context.read<AudioPlayerService>();

    return Selector<MusicRepository, List<Song>>(
      selector: (_, r) => r.recentSongs,
      builder: (context, recentSongs, _) {
        if (recentSongs.isEmpty) {
          return const EmptyState(
            icon: Icons.history_rounded,
            title: 'No playback history',
            message: 'Songs you play will appear here in reverse chronological order.',
          );
        }

        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('${recentSongs.length} recently played tracks', style: AppTypography.caption),
                  TextButton.icon(
                    onPressed: () => _confirmClearHistory(context, repo),
                    icon: const Icon(Icons.clear_all_rounded, size: 18, color: AppColors.error),
                    label: const Text('Clear History', style: TextStyle(color: AppColors.error)),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                itemExtent: 68.0,
                cacheExtent: 250.0,
                addAutomaticKeepAlives: true,
                addRepaintBoundaries: true,
                padding: const EdgeInsets.only(bottom: 90),
                itemCount: recentSongs.length,
                itemBuilder: (context, index) {
                  final song = recentSongs[index];
                  return SongTile(
                    song: song,
                    onTap: () => playerService.playSong(song, queue: recentSongs),
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }

  void _confirmClearHistory(BuildContext context, MusicRepository repo) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Clear Listening History'),
        content: const Text(
          'Are you sure you want to clear your listening history? This cannot be undone.',
          style: TextStyle(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              repo.clearHistory();
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }
}
