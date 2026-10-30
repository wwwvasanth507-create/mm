const fs = require('fs');
const path = require('path');

const srcPath = path.resolve(__dirname, '../src/data/music.json');
const assetsPath = path.resolve(__dirname, '../assets/data/music.json');
const r2Data = require('../r2_all_links.json');

// Map filename -> R2 URL
const thumbMap = new Map();
r2Data.thumbnails.forEach(t => {
  if (t.r2Url) {
    thumbMap.set(t.filename.toLowerCase(), t.r2Url);
  }
});

const d = JSON.parse(fs.readFileSync(srcPath, 'utf8'));

let updatedSongs = 0;
let updatedPlaylists = 0;

for (const p of d.playlists) {
  const target = `${p.id}.jpg`.toLowerCase();
  const r2Url = thumbMap.get(target);
  if (r2Url) {
    p.coverUrl = r2Url;
    updatedPlaylists++;
  }
}

for (const s of d.songs) {
  const current = s.thumbnailUrl || '';
  const fname = path.basename(current.split('?')[0]).toLowerCase();
  const r2Url = thumbMap.get(fname);
  if (r2Url) {
    s.thumbnailUrl = r2Url;
    updatedSongs++;
  }
}

const outputJson = JSON.stringify(d, null, 2) + '\n';
fs.writeFileSync(srcPath, outputJson, 'utf8');
fs.writeFileSync(assetsPath, outputJson, 'utf8');

console.log(`Successfully applied R2 thumbnail URLs!`);
console.log(`- Playlists updated: ${updatedPlaylists} / ${d.playlists.length}`);
console.log(`- Songs updated: ${updatedSongs} / ${d.songs.length}`);
console.log(`- Written to: ${srcPath} and ${assetsPath}`);
