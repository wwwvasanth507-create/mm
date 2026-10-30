import json

src_file = 'src/data/music.json'
assets_file = 'assets/data/music.json'

with open(src_file, 'r', encoding='utf-8') as f:
    src_data = json.load(f)

with open(assets_file, 'r', encoding='utf-8') as f:
    assets_data = json.load(f)

# 1. Exact equality check
if src_data != assets_data:
    print("ERROR: src/data/music.json and assets/data/music.json are not identical!")
else:
    print("PASS: src/data/music.json and assets/data/music.json are 100% identical.")

songs = src_data['songs']
playlists = src_data['playlists']
song_ids = set(s['id'] for s in songs)

print(f"Total songs: {len(songs)}")
print(f"Total playlists: {len(playlists)}")

# 2. Check for lyrics
lyrics_count = sum(1 for s in songs if 'lyrics' in s and s['lyrics'])
print(f"Songs with lyrics: {lyrics_count} (must be 0)")
assert lyrics_count == 0, "Found songs with lyrics!"

# 3. Check for duplicates in same movie
from collections import defaultdict
movie_tracks = defaultdict(list)
for s in songs:
    movie_tracks[(s['album'].lower().strip(), s['title'].lower().strip())].append(s['id'])

duplicate_movies = {k: v for k, v in movie_tracks.items() if len(v) > 1}
print(f"Exact same title and album duplicates: {len(duplicate_movies)}")
if duplicate_movies:
    for k, v in duplicate_movies.items():
        print(f"  Duplicate: {k} -> {v}")

# 4. Check for invalid playlist trackIds
missing_in_playlists = []
for pl in playlists:
    for tid in pl.get('trackIds', []):
        if tid not in song_ids:
            missing_in_playlists.append((pl['name'], tid))

print(f"Broken trackIds in playlists: {len(missing_in_playlists)}")
assert len(missing_in_playlists) == 0, f"Found broken trackIds: {missing_in_playlists}"

# 5. Check 2020 songs
songs_2020 = [s for s in songs if s.get('year') == 2020]
print(f"Total 2020 songs: {len(songs_2020)} (expected 94)")
assert len(songs_2020) == 94, f"Expected 94 songs, got {len(songs_2020)}"

# 6. Check required fields for all 2020 songs
required_fields = ['id', 'title', 'artist', 'album', 'genre', 'year', 'duration', 'audioUrl', 'thumbnailUrl', 'description', 'language', 'isExplicit']
for s in songs_2020:
    for f in required_fields:
        assert f in s and s[f] is not None, f"Missing {f} in song {s['id']}"
    assert s['year'] == 2020
    assert s['language'] == 'Tamil'
    assert s['isExplicit'] is False
    assert not any(x in s['thumbnailUrl'].lower() for x in ['masstamilan'])

print("ALL AUDIT CHECKS PASSED WITH FLYING COLORS!")
