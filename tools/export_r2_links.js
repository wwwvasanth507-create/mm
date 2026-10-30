const fs = require('fs');
const path = require('path');

const data = require('../r2_all_links.json');

// Map filename -> R2 URL
const thumbMap = new Map();
data.thumbnails.forEach(t => {
  if (t.r2Url) {
    thumbMap.set(t.filename.toLowerCase(), t.r2Url);
  }
});

// 1. Text file with all thumbnail links (one per line)
const thumbLines = data.thumbnails
  .filter(t => t.r2Url)
  .map(t => t.r2Url);
fs.writeFileSync(path.resolve(__dirname, '../r2_thumbnail_links.txt'), thumbLines.join('\n') + '\n', 'utf8');

// 2. Text file with all song audio links (one per line)
const songLines = data.songs
  .map(s => s.r2AudioUrl);
fs.writeFileSync(path.resolve(__dirname, '../r2_song_links.txt'), songLines.join('\n') + '\n', 'utf8');

// 3. Formatted list pairing title -> Song Audio URL & R2 Thumbnail URL
const pairLines = data.songs.map(s => {
  const fname = path.basename(s.currentThumbnailUrl.split('?')[0]).toLowerCase();
  const r2Thumb = thumbMap.get(fname) || s.currentThumbnailUrl;
  return `${s.index}. ${s.title} (${s.album})\n   Audio R2:     ${s.r2AudioUrl}\n   Thumbnail R2: ${r2Thumb}`;
});
fs.writeFileSync(path.resolve(__dirname, '../r2_songs_catalog.txt'), pairLines.join('\n\n') + '\n', 'utf8');

console.log('Successfully generated:');
console.log(`- r2_thumbnail_links.txt (${thumbLines.length} links)`);
console.log(`- r2_song_links.txt (${songLines.length} links)`);
console.log(`- r2_songs_catalog.txt (${pairLines.length} songs with paired R2 audio & thumbnail links)`);
