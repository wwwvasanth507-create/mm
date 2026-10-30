import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../data/models/song_model.dart';
import '../../data/repositories/music_repository.dart';
import '../../data/services/audio_player_service.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/song_tile.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();
  List<Song> _searchResults = [];
  bool _isSearching = false;
  String _selectedFilter = 'All'; // All, Songs, Artists, Albums
  Timer? _debounceTimer;
  int _searchEpoch = 0;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    final query = _searchController.text.trim();
    _debounceTimer?.cancel();

    if (query.isEmpty) {
      _searchEpoch++;
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }

    // Debounce search input by 250ms to eliminate SQLite query storms
    _debounceTimer = Timer(const Duration(milliseconds: 250), () {
      _performSearch(query);
    });
  }

  Future<void> _performSearch(String query) async {
    final currentEpoch = ++_searchEpoch;
    setState(() => _isSearching = true);

    final repo = context.read<MusicRepository>();
    final results = await repo.search(query);

    // Cancel / discard obsolete search result if user kept typing
    if (!mounted || currentEpoch != _searchEpoch) return;

    setState(() {
      if (_selectedFilter == 'Artists') {
        _searchResults = results
            .where((s) => s.artist.toLowerCase().contains(query.toLowerCase()))
            .toList();
      } else if (_selectedFilter == 'Albums') {
        _searchResults = results
            .where((s) => s.album.toLowerCase().contains(query.toLowerCase()))
            .toList();
      } else if (_selectedFilter == 'Songs') {
        _searchResults = results
            .where((s) => s.title.toLowerCase().contains(query.toLowerCase()))
            .toList();
      } else {
        _searchResults = results;
      }
      _isSearching = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final playerService = context.read<AudioPlayerService>();
    final query = _searchController.text.trim();

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1280),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
            // Search Input Header
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text('Search', style: AppTypography.heading1),
            ),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: TextField(
                controller: _searchController,
                style: AppTypography.body,
                decoration: InputDecoration(
                  filled: true,
                  fillColor: const Color(0xFF11171E),
                  hintText: 'Search songs, artists, albums... ✨',
                  hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 13.5),
                  prefixIcon: const Icon(Icons.search_rounded, color: AppColors.cuteMint, size: 22),
                  suffixIcon: query.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded, color: AppColors.textMuted, size: 20),
                          onPressed: () {
                            _searchController.clear();
                          },
                        )
                      : null,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 13),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(22),
                    borderSide: const BorderSide(color: Color(0xFF1E293B)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(22),
                    borderSide: const BorderSide(color: Color(0xFF1E293B)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(22),
                    borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
                  ),
                ),
              ),
            ),

            // Cute Filter Chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: ['All', 'Songs', 'Artists', 'Albums'].map((filter) {
                  final isSelected = _selectedFilter == filter;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(filter),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() => _selectedFilter = filter);
                        if (query.isNotEmpty) _performSearch(query);
                      },
                      backgroundColor: const Color(0xFF11171E),
                      selectedColor: const Color(0xFF76E035).withOpacity(0.18),
                      checkmarkColor: AppColors.primary,
                      labelStyle: TextStyle(
                        color: isSelected ? AppColors.primary : const Color(0xFF94A3B8),
                        fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                        fontSize: 12.5,
                      ),
                      side: BorderSide(
                        color: isSelected ? AppColors.primary : const Color(0xFF1E293B),
                        width: isSelected ? 1.2 : 0.8,
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 8),

            // Results / Suggestions Body
            Expanded(
              child: _isSearching
                  ? const Center(
                      child: CircularProgressIndicator(color: AppColors.primary),
                    )
                  : query.isEmpty
                      ? _buildSuggestions(playerService)
                      : _searchResults.isEmpty
                          ? EmptyState(
                              icon: Icons.search_off_rounded,
                              title: 'No results found',
                              message: 'No matches found for "$query". Try searching by another keyword.',
                            )
                          : ListView.builder(
                              physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                              cacheExtent: 250.0,
                              itemExtent: 68.0,
                              addAutomaticKeepAlives: true,
                              addRepaintBoundaries: true,
                              itemCount: _searchResults.length,
                              padding: const EdgeInsets.only(bottom: 90),
                              itemBuilder: (context, index) {
                                final song = _searchResults[index];
                                return SongTile(
                                  song: song,
                                  onTap: () => playerService.playSong(
                                    song,
                                    queue: _searchResults,
                                  ),
                                );
                              },
                            ),
            ),
          ],
        ),
      ),
    ),
  ),
);
  }

  Widget _buildSuggestions(AudioPlayerService player) {
    return Selector<MusicRepository, (List<Song>, List<Song>)>(
      selector: (_, repo) => (
        repo.recentSongs.take(5).toList(),
        repo.songs.take(12).toList(),
      ),
      builder: (context, data, _) {
        final recentSongs = data.$1;
        final allSongs = data.$2;

        if (allSongs.isEmpty) {
          return const EmptyState(
            icon: Icons.library_music_rounded,
            title: 'Library is empty',
            message: 'Sync catalogue from Home to start exploring music.',
          );
        }

        final totalItems = (recentSongs.isNotEmpty ? recentSongs.length + 1 : 0) + allSongs.length + 1;

        return ListView.builder(
          physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
          cacheExtent: 250.0,
          padding: const EdgeInsets.only(bottom: 90),
          itemCount: totalItems,
          itemBuilder: (context, index) {
            if (recentSongs.isNotEmpty) {
              if (index == 0) {
                return Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Text('Recent Searches & History', style: AppTypography.heading3),
                );
              } else if (index <= recentSongs.length) {
                final song = recentSongs[index - 1];
                return SongTile(
                  song: song,
                  onTap: () => player.playSong(song, queue: recentSongs),
                );
              } else if (index == recentSongs.length + 1) {
                return Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Text('Recommended in Catalogue', style: AppTypography.heading3),
                );
              } else {
                final songIndex = index - (recentSongs.length + 2);
                final song = allSongs[songIndex];
                return SongTile(
                  song: song,
                  onTap: () => player.playSong(song, queue: allSongs),
                );
              }
            } else {
              if (index == 0) {
                return Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Text('Recommended in Catalogue', style: AppTypography.heading3),
                );
              } else {
                final song = allSongs[index - 1];
                return SongTile(
                  song: song,
                  onTap: () => player.playSong(song, queue: allSongs),
                );
              }
            }
          },
        );
      },
    );
  }
}
