import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/utilities/url_resolver.dart';
import '../../data/models/song_model.dart';
import '../../data/models/playlist_model.dart';
import '../../data/repositories/music_repository.dart';
import '../../data/services/audio_player_service.dart';
import '../../shared/widgets/brand_logo.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/song_tile.dart';
import '../playlists/playlist_details_screen.dart';
import '../playlists/widgets/add_to_playlist_dialog.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning ✨';
    if (hour < 17) return 'Good afternoon ☀️';
    return 'Good evening 🌙';
  }

  @override
  Widget build(BuildContext context) {
    final repository = context.read<MusicRepository>();
    final playerService = context.read<AudioPlayerService>();

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1280),
            child: RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () => repository.syncWithRemoteCatalogue(),
              child: CustomScrollView(
            cacheExtent: 300.0,
            physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
            slivers: [
              // Top Bar
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const BrandLogo(size: 34),
                      IconButton(
                        icon: Container(
                          padding: const EdgeInsets.all(7),
                          decoration: BoxDecoration(
                            color: const Color(0xFF131A15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFF223226)),
                          ),
                          child: const Icon(Icons.sync_rounded, color: AppColors.cuteMint, size: 20),
                        ),
                        tooltip: 'Sync Songs from Repo',
                        onPressed: () async {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Syncing songs from repository...'),
                              duration: Duration(seconds: 1),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                          await repository.syncWithRemoteCatalogue();
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Synced ${repository.songs.length} songs successfully!'),
                                backgroundColor: AppColors.primary,
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
              ),

              // Cute Greeting Header
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 6, 16, 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_getGreeting(), style: AppTypography.heading1),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                            decoration: BoxDecoration(
                              color: AppColors.cuteMint.withOpacity(0.14),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: AppColors.cuteMint.withOpacity(0.35),
                                width: 0.8,
                              ),
                            ),
                            child: const Text(
                              'STUDIO HI-FI',
                              style: TextStyle(
                                color: AppColors.cuteMint,
                                fontSize: 9.5,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.6,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Pure lossless sound & offline vibes',
                              style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // Cute Quick Category Shortcuts (Liked, Downloads, Playlists)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Selector<MusicRepository, (int, int, List<Playlist>)>(
                    selector: (_, repo) => (
                      repo.favoriteSongs.length,
                      repo.downloadedSongs.length,
                      repo.playlists,
                    ),
                    builder: (context, data, _) {
                      final favCount = data.$1;
                      final dlCount = data.$2;
                      final playlists = data.$3;

                      return Row(
                        children: [
                          Expanded(
                            child: _buildQuickCard(
                              title: 'Liked',
                              count: '$favCount tracks',
                              icon: Icons.favorite_rounded,
                              gradient: AppColors.cutePinkLavender,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => PlaylistDetailsScreen(
                                      playlist: Playlist(
                                        id: 'liked-songs',
                                        name: 'Liked Songs',
                                        description: 'Your favorite tracks in one place',
                                        createdAt: DateTime.now(),
                                        songCount: favCount,
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _buildQuickCard(
                              title: 'Offline',
                              count: '$dlCount tracks',
                              icon: Icons.offline_pin_rounded,
                              gradient: AppColors.cuteMintCyan,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => PlaylistDetailsScreen(
                                      playlist: Playlist(
                                        id: 'downloaded-songs',
                                        name: 'Offline Downloads',
                                        description: 'Downloaded songs ready for offline playback',
                                        createdAt: DateTime.now(),
                                        songCount: dlCount,
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _buildQuickCard(
                              title: 'Playlists',
                              count: '${playlists.length} mixes',
                              icon: Icons.queue_music_rounded,
                              gradient: AppColors.cuteSunset,
                              onTap: () {
                                if (playlists.isNotEmpty) {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => PlaylistDetailsScreen(playlist: playlists.first),
                                    ),
                                  );
                                }
                              },
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
              ),

              // ==================== TOP PLAYLISTS SECTION ====================
              Selector<MusicRepository, List<Playlist>>(
                selector: (_, repo) => repo.playlists,
                builder: (context, playlists, _) {
                  if (playlists.isEmpty) {
                    return const SliverToBoxAdapter(child: SizedBox.shrink());
                  }

                  return SliverMainAxisGroup(
                    slivers: [
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 26, 16, 12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Text('Top Playlists', style: AppTypography.heading3),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                                    decoration: BoxDecoration(
                                      gradient: AppColors.neonCyanViolet,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Text(
                                      'HOT',
                                      style: TextStyle(
                                        color: Colors.black,
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              TextButton(
                                onPressed: () {
                                  if (playlists.isNotEmpty) {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => PlaylistDetailsScreen(playlist: playlists.first),
                                      ),
                                    );
                                  }
                                },
                                child: const Text(
                                  'Explore All',
                                  style: TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.w600),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: SizedBox(
                          height: 226,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: playlists.length,
                            cacheExtent: 350.0,
                            itemBuilder: (context, index) {
                              final playlist = playlists[index];
                              return _buildPlaylistCard(context, playlist, playerService);
                            },
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),

              // ==================== CONTINUE LISTENING ====================
              Selector<MusicRepository, List<Song>>(
                selector: (_, repo) => repo.recentSongs,
                builder: (context, recentSongs, _) {
                  if (recentSongs.isEmpty) {
                    return const SliverToBoxAdapter(child: SizedBox.shrink());
                  }
                  return SliverMainAxisGroup(
                    slivers: [
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Continue Listening', style: AppTypography.heading3),
                              Text(
                                '${recentSongs.length} played',
                                style: AppTypography.caption.copyWith(color: AppColors.textMuted),
                              ),
                            ],
                          ),
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: SizedBox(
                          height: 175,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: recentSongs.length,
                            cacheExtent: 240.0,
                            itemBuilder: (context, index) {
                              final song = recentSongs[index];
                              return _buildSongCard(context, song, recentSongs, playerService);
                            },
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),

              // ==================== RECENTLY ADDED ====================
              Selector<MusicRepository, List<Song>>(
                selector: (_, repo) => repo.songs.take(12).toList(),
                builder: (context, topSongs, _) {
                  if (topSongs.isEmpty) {
                    return const SliverToBoxAdapter(child: SizedBox.shrink());
                  }
                  return SliverMainAxisGroup(
                    slivers: [
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Trending in Jalra', style: AppTypography.heading3),
                              Text(
                                'Featured Tracks',
                                style: AppTypography.caption.copyWith(color: AppColors.textMuted),
                              ),
                            ],
                          ),
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: SizedBox(
                          height: 175,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: topSongs.length,
                            cacheExtent: 240.0,
                            itemBuilder: (context, index) {
                              final song = topSongs[index];
                              return _buildSongCard(context, song, topSongs, playerService);
                            },
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),

              // ==================== ALL SONGS HEADER ====================
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Text('All Songs', style: AppTypography.heading3),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.shuffle_rounded, size: 12, color: AppColors.primary),
                                SizedBox(width: 4),
                                Text(
                                  'SHUFFLED',
                                  style: TextStyle(
                                    color: AppColors.primary,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      Selector<MusicRepository, int>(
                        selector: (_, repo) => repo.shuffledSongs.length,
                        builder: (context, songCount, _) {
                          if (songCount == 0) return const SizedBox.shrink();
                          return TextButton.icon(
                            onPressed: () {
                              final all = context.read<MusicRepository>().shuffledSongs;
                              playerService.playQueue(all, initialIndex: 0);
                            },
                            icon: const Icon(Icons.play_circle_filled_rounded, color: AppColors.primary, size: 20),
                            label: const Text('Play All', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),

              // ==================== ALL SONGS VIRTUALIZED LIST ====================
              Selector<MusicRepository, List<Song>>(
                selector: (_, repo) => repo.shuffledSongs,
                builder: (context, allSongs, _) {
                  if (allSongs.isEmpty) {
                    return SliverToBoxAdapter(
                      child: EmptyState(
                        icon: Icons.music_note_rounded,
                        title: 'Your Catalogue is Empty',
                        message: 'Sync your catalogue to stream music and download tracks.',
                        actionText: 'Sync Now',
                        onAction: () => repository.syncWithRemoteCatalogue(),
                      ),
                    );
                  }

                  return SliverFixedExtentList(
                    itemExtent: 68.0,
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final song = allSongs[index];
                        return SongTile(
                          song: song,
                          onTap: () => playerService.playSong(song, queue: allSongs),
                          onAddToPlaylist: () {
                            showDialog(
                              context: context,
                              builder: (_) => AddToPlaylistDialog(song: song),
                            );
                          },
                        );
                      },
                      childCount: allSongs.length,
                      addAutomaticKeepAlives: true,
                      addRepaintBoundaries: true,
                    ),
                  );
                },
              ),

              // Bottom padding for persistent MiniPlayer + BottomNav
              const SliverToBoxAdapter(
                child: SizedBox(height: 120),
              ),
            ],
          ),
        ),
      ),
    ),
  ),
);
  }

  Widget _buildQuickCard({
    required String title,
    required String count,
    required IconData icon,
    required Gradient gradient,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFF111713),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF1E2D22), width: 0.9),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.2),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(7.5),
              decoration: BoxDecoration(
                gradient: gradient,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.25),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(icon, color: Colors.white, size: 17),
            ),
            const SizedBox(height: 8),
            Text(title, style: AppTypography.title.copyWith(fontSize: 13, fontWeight: FontWeight.w700)),
            Text(count, style: AppTypography.caption.copyWith(fontSize: 10.5, color: const Color(0xFF94A3B8))),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaylistCard(
    BuildContext context,
    Playlist playlist,
    AudioPlayerService playerService,
  ) {
    final assetPath = AppUrls.getLocalAssetCoverPath(playlist.thumbnailUrl);
    final resolvedUrl = AppUrls.resolveThumbnailUrl(playlist.thumbnailUrl);

    Widget artwork;
    if (assetPath != null) {
      artwork = Image.asset(
        assetPath,
        fit: BoxFit.cover,
        cacheWidth: 320,
        cacheHeight: 320,
        errorBuilder: (_, __, ___) => resolvedUrl != null
            ? CachedNetworkImage(
                imageUrl: resolvedUrl,
                fit: BoxFit.cover,
                memCacheWidth: 320,
                memCacheHeight: 320,
                maxWidthDiskCache: 350,
                maxHeightDiskCache: 350,
                errorWidget: (_, __, ___) => const Center(
                  child: Icon(Icons.queue_music_rounded, color: Colors.white, size: 40),
                ),
              )
            : const Center(
                child: Icon(Icons.queue_music_rounded, color: Colors.white, size: 40),
              ),
      );
    } else if (resolvedUrl != null) {
      artwork = CachedNetworkImage(
        imageUrl: resolvedUrl,
        fit: BoxFit.cover,
        memCacheWidth: 320,
        memCacheHeight: 320,
        maxWidthDiskCache: 350,
        maxHeightDiskCache: 350,
        errorWidget: (_, __, ___) => const Center(
          child: Icon(Icons.queue_music_rounded, color: Colors.white, size: 40),
        ),
      );
    } else {
      artwork = const Center(
        child: Icon(Icons.queue_music_rounded, color: Colors.white, size: 40),
      );
    }

    return RepaintBoundary(
      child: GestureDetector(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => PlaylistDetailsScreen(playlist: playlist),
            ),
          );
        },
        child: Container(
          width: 155,
          margin: const EdgeInsets.only(right: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Cover Artwork with Play button overlay
              Stack(
                children: [
                  Container(
                    width: 155,
                    height: 155,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.35),
                          blurRadius: 10,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        decoration: const BoxDecoration(gradient: AppColors.waveGradient),
                        child: artwork,
                      ),
                    ),
                  ),

                  // Bottom subtle gradient shadow
                  Positioned.fill(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.black.withOpacity(0.4),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Quick Play Floating Circle Button
                  Positioned(
                    right: 8,
                    bottom: 8,
                    child: GestureDetector(
                      onTap: () async {
                        final repo = context.read<MusicRepository>();
                        final songs = await repo.getPlaylistSongs(playlist.id);
                        if (songs.isNotEmpty) {
                          playerService.playQueue(songs, initialIndex: 0);
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          gradient: AppColors.cuteDockActive,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF76E035).withOpacity(0.45),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.play_arrow_rounded,
                          color: Colors.black,
                          size: 20,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Title
              Text(
                playlist.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.title.copyWith(fontSize: 13.5, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 2),

              // Subtitle
              Text(
                '${playlist.songCount} tracks • Featured',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.caption.copyWith(color: AppColors.textMuted, fontSize: 11),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSongCard(
    BuildContext context,
    Song song,
    List<Song> queue,
    AudioPlayerService playerService,
  ) {
    final assetPath = AppUrls.getLocalAssetCoverPath(song.thumbnailUrl);
    final resolvedUrl = AppUrls.resolveThumbnailUrl(song.thumbnailUrl);

    Widget artwork;
    if (assetPath != null) {
      artwork = Image.asset(
        assetPath,
        fit: BoxFit.cover,
        cacheWidth: 200,
        cacheHeight: 200,
        errorBuilder: (_, __, ___) => resolvedUrl != null
            ? CachedNetworkImage(
                imageUrl: resolvedUrl,
                fit: BoxFit.cover,
                memCacheWidth: 200,
                memCacheHeight: 200,
                maxWidthDiskCache: 250,
                maxHeightDiskCache: 250,
                errorWidget: (_, __, ___) => const Center(
                  child: Icon(Icons.music_note_rounded, color: Colors.white, size: 40),
                ),
              )
            : const Center(
                child: Icon(Icons.music_note_rounded, color: Colors.white, size: 40),
              ),
      );
    } else if (resolvedUrl != null) {
      artwork = CachedNetworkImage(
        imageUrl: resolvedUrl,
        fit: BoxFit.cover,
        memCacheWidth: 200,
        memCacheHeight: 200,
        maxWidthDiskCache: 250,
        maxHeightDiskCache: 250,
        errorWidget: (_, __, ___) => const Center(
          child: Icon(Icons.music_note_rounded, color: Colors.white, size: 40),
        ),
      );
    } else {
      artwork = const Center(
        child: Icon(Icons.music_note_rounded, color: Colors.white, size: 40),
      );
    }

    return RepaintBoundary(
      child: GestureDetector(
        onTap: () => playerService.playSong(song, queue: queue),
        child: Container(
          width: 120,
          margin: const EdgeInsets.only(right: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Artwork
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    decoration: const BoxDecoration(gradient: AppColors.waveGradient),
                    child: artwork,
                  ),
                ),
              ),
              const SizedBox(height: 8),

              // Title
              Text(
                song.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.title.copyWith(fontSize: 13),
              ),

              // Artist
              Text(
                song.artist,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.caption,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
