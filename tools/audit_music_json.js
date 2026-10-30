const fs = require('fs');

const src = fs.readFileSync('src/data/music.json', 'utf8');
const assets = fs.readFileSync('assets/data/music.json', 'utf8');

console.log('src matches assets exactly:', src === assets);

const data = JSON.parse(src);
console.log('Total songs:', data.songs.length);
console.log('Total playlists:', data.playlists.length);

// 1. Check for lyrics
let lyricsCount = 0;
for (const s of data.songs) {
  for (const k of Object.keys(s)) {
    if (k.toLowerCase().includes('lyric')) lyricsCount++;
  }
}
console.log('Songs with any lyrics property:', lyricsCount);

// 2. Check for duplicate IDs or duplicate audioUrls
const ids = new Set();
const urls = new Set();
let dupIds = 0;
let dupUrls = 0;
for (const s of data.songs) {
  if (ids.has(s.id)) dupIds++;
  ids.add(s.id);
  if (urls.has(s.audioUrl)) dupUrls++;
  urls.add(s.audioUrl);
}
console.log('Duplicate IDs:', dupIds);
console.log('Duplicate Audio URLs:', dupUrls);

// 3. Check thumbnails
let masstamilanThumbs = 0;
let emptyThumbs = 0;
for (const s of data.songs) {
  if (!s.thumbnailUrl) emptyThumbs++;
  if (s.thumbnailUrl && s.thumbnailUrl.toLowerCase().includes('masstamilan')) masstamilanThumbs++;
}
for (const p of data.playlists) {
  if (!p.coverUrl) emptyThumbs++;
  if (p.coverUrl && p.coverUrl.toLowerCase().includes('masstamilan')) masstamilanThumbs++;
}
console.log('MassTamilan thumbnails:', masstamilanThumbs);
console.log('Empty thumbnails:', emptyThumbs);

// 4. Check playlists integrity
let orphanTracks = 0;
let plDupTracks = 0;
for (const p of data.playlists) {
  const plSet = new Set();
  for (const tid of p.trackIds) {
    if (!ids.has(tid)) orphanTracks++;
    if (plSet.has(tid)) plDupTracks++;
    plSet.add(tid);
  }
}
console.log('Orphan track IDs across playlists:', orphanTracks);
console.log('Duplicate track IDs within playlists:', plDupTracks);

// 5. Check all song required fields
let missingFieldCount = 0;
for (const s of data.songs) {
  if (!s.id || !s.title || !s.artist || !s.album || !s.genre || !s.year || !s.duration || !s.audioUrl || !s.thumbnailUrl) {
    missingFieldCount++;
    console.log('Missing field in song:', s.id);
  }
}
console.log('Songs missing required fields:', missingFieldCount);

// 6. Print playlists summary
console.log('\n--- PLAYLISTS SUMMARY ---');
for (const p of data.playlists) {
  console.log(`- ${p.name} (${p.id}): ${p.trackIds.length} tracks`);
}
