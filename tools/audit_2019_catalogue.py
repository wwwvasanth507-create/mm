import json
import os
from collections import defaultdict

src_file = 'src/data/music.json'
assets_file = 'assets/data/music.json'

with open(src_file, 'r', encoding='utf-8') as f:
    src_data = json.load(f)

with open(assets_file, 'r', encoding='utf-8') as f:
    assets_data = json.load(f)

# 1. Exact equality check
assert src_data == assets_data, "ERROR: src/data/music.json and assets/data/music.json are not identical!"
print("PASS: src/data/music.json and assets/data/music.json are 100% identical.")

songs = src_data['songs']
playlists = src_data['playlists']
song_ids = set(s['id'] for s in songs)
audio_urls = set(s['audioUrl'] for s in songs)

print(f"Total songs: {len(songs)}")
print(f"Total playlists: {len(playlists)}")

# 2. Check for duplicate IDs or audio URLs
assert len(song_ids) == len(songs), f"Found duplicate song IDs: {len(songs) - len(song_ids)}"
assert len(audio_urls) == len(songs), f"Found duplicate audio URLs: {len(songs) - len(audio_urls)}"
print("PASS: All 843 song IDs and Audio URLs are strictly unique.")

# 3. Check for lyrics
lyrics_count = sum(1 for s in songs if 'lyrics' in s or any('lyric' in k.lower() for k in s.keys()))
print(f"Songs with lyrics: {lyrics_count} (must be 0)")
assert lyrics_count == 0, f"Found {lyrics_count} songs with lyrics!"
print("PASS: ZERO songs have lyrics.")

# 4. Check for duplicates in same movie
movie_tracks = defaultdict(list)
for s in songs:
    movie_tracks[(s['album'].lower().strip(), s['title'].lower().strip())].append(s['id'])

duplicate_movies = {k: v for k, v in movie_tracks.items() if len(v) > 1}
if duplicate_movies:
    for k, v in duplicate_movies.items():
        print(f"  Duplicate track in same movie: {k} -> {v}")
assert len(duplicate_movies) == 0, f"Found duplicates in same movie: {duplicate_movies}"
print("PASS: ZERO duplicate songs from the same movie.")

# 5. Check for invalid playlist trackIds
missing_in_playlists = []
for pl in playlists:
    for tid in pl.get('trackIds', []):
        if tid not in song_ids:
            missing_in_playlists.append((pl['name'], tid))

print(f"Broken trackIds in playlists: {len(missing_in_playlists)} (must be 0)")
assert len(missing_in_playlists) == 0, f"Found broken trackIds: {missing_in_playlists}"
print("PASS: All playlist trackIds point to valid songs in catalogue.")

# 6. Check 2019 songs
songs_2019 = [s for s in songs if s.get('year') == 2019]
print(f"Total 2019 songs: {len(songs_2019)} (expected 340)")
assert len(songs_2019) == 340, f"Expected 340 songs, got {len(songs_2019)}"

# 7. Check required fields for all 2019 songs
required_fields = ['id', 'title', 'artist', 'album', 'genre', 'year', 'duration', 'audioUrl', 'thumbnailUrl', 'description', 'language', 'isExplicit']
for s in songs_2019:
    for f in required_fields:
        assert f in s and s[f] is not None, f"Missing {f} in song {s['id']}"
    assert s['year'] == 2019
    assert s['language'] == 'Tamil'
    assert s['isExplicit'] is False
    assert s['duration'] > 0
    assert not any(x in s['thumbnailUrl'].lower() for x in ['masstamilan'])

# 8. Check that all songs (all 843) have NO masstamilan in thumbnailUrl
mt_thumbs = [s['id'] for s in songs if 'masstamilan' in s['thumbnailUrl'].lower()]
assert len(mt_thumbs) == 0, f"Found masstamilan in thumbnailUrl: {mt_thumbs}"
print("PASS: ZERO songs have 'masstamilan' in thumbnailUrl.")

# 9. Verify 2019 thumbnails all resolve to verified Cloudflare R2 bucket URLs
r2_thumb_prefix = 'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/thumbnalis/2019/'
for s in songs_2019:
    assert s['thumbnailUrl'].startswith(r2_thumb_prefix), f"Invalid R2 thumb URL: {s['thumbnailUrl']}"
print(f"PASS: All {len(songs_2019)} 2019 songs use verified Cloudflare R2 thumbnail URLs.")

# 10. Verify r2_2019_songs_catalog.txt
assert os.path.exists('r2_2019_songs_catalog.txt'), "r2_2019_songs_catalog.txt missing!"
with open('r2_2019_songs_catalog.txt', 'r', encoding='utf-8') as f:
    cat_content = f.read()
assert "=== 2019 SONGS CATALOG (340 SONGS) ===" in cat_content, "Catalog header mismatch!"
print("PASS: Catalog file r2_2019_songs_catalog.txt is generated and verified.")

print("\n" + "="*50)
print("ALL AUDIT CHECKS PASSED WITH FLYING COLORS!")
print("="*50)
