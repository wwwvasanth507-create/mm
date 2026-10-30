const fs = require('fs');
const path = require('path');
const manifest = require('./full_download_manifest.json');

const srcPath = path.resolve(__dirname, '../src/data/music.json');
const assetsPath = path.resolve(__dirname, '../assets/data/music.json');
const publicDir = path.resolve(__dirname, '../public/covers');
const assetsDir = path.resolve(__dirname, '../assets/covers');

const publicFiles = new Set(fs.readdirSync(publicDir).map(f => f.toLowerCase()));
const assetsFiles = new Set(fs.readdirSync(assetsDir).map(f => f.toLowerCase()));

const rawBase = 'https://raw.githubusercontent.com/wwwvasanth507-create/mm/main/public/covers';

const d = JSON.parse(fs.readFileSync(srcPath, 'utf8'));

// 1. Map songId -> assignedFilename
const songFileMap = new Map();
manifest.songPlan.forEach(sp => {
  songFileMap.set(sp.id, sp.assignedFilename);
});

// 2. Map playlistId -> filename
const plFileMap = new Map();
manifest.playlistPlan.forEach(pp => {
  plFileMap.set(pp.id, pp.targetFilename);
});

let updatedSongs = 0;
let updatedPlaylists = 0;

for (const p of d.playlists) {
  const target = plFileMap.get(p.id) || `${p.id}.jpg`;
  if (!publicFiles.has(target.toLowerCase())) {
    throw new Error(`Playlist cover file not found in public/covers: ${target}`);
  }
  if (!assetsFiles.has(target.toLowerCase())) {
    throw new Error(`Playlist cover file not found in assets/covers: ${target}`);
  }
  p.coverUrl = `${rawBase}/${target}`;
  updatedPlaylists++;
}

for (const s of d.songs) {
  const target = songFileMap.get(s.id);
  if (!target) {
    throw new Error(`No cover assigned for song: ${s.id}`);
  }
  if (!publicFiles.has(target.toLowerCase())) {
    throw new Error(`Song cover file not found in public/covers: ${target} (song ${s.id})`);
  }
  if (!assetsFiles.has(target.toLowerCase())) {
    throw new Error(`Song cover file not found in assets/covers: ${target} (song ${s.id})`);
  }
  s.thumbnailUrl = `${rawBase}/${target}`;
  updatedSongs++;
}

const outputJson = JSON.stringify(d, null, 2) + '\n';
fs.writeFileSync(srcPath, outputJson, 'utf8');
fs.writeFileSync(assetsPath, outputJson, 'utf8');

console.log(`Successfully updated music.json!`);
console.log(`- Playlists updated: ${updatedPlaylists}`);
console.log(`- Songs updated: ${updatedSongs}`);
console.log(`- Files written: ${srcPath} and ${assetsPath}`);
