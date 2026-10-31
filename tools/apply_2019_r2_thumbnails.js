/**
 * Helper to update 2019 thumbnail URLs to Cloudflare R2 bucket URLs
 * Run with: node tools/apply_2019_r2_thumbnails.js [r2_folder_prefix]
 * Default prefix: https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/thumbnalis/2019/
 */
const fs = require('fs');
const path = require('path');

const srcPath = path.resolve(__dirname, '../src/data/music.json');
const assetsPath = path.resolve(__dirname, '../assets/data/music.json');

const r2Prefix = process.argv[2] || 'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/thumbnalis/2019/';

const d = JSON.parse(fs.readFileSync(srcPath, 'utf8'));

let updatedSongs = 0;
let updatedPlaylists = 0;

for (const p of d.playlists) {
  if (p.id === 'playlist-2019-blockbusters') {
    p.coverUrl = `${r2Prefix.replace(/\/$/, '')}/playlist-2019-blockbusters.jpg`;
    updatedPlaylists++;
  }
}

for (const s of d.songs) {
  if (s.year === 2019) {
    const filename = path.basename(s.thumbnailUrl.split('?')[0]);
    s.thumbnailUrl = `${r2Prefix.replace(/\/$/, '')}/${filename}`;
    updatedSongs++;
  }
}

const out = JSON.stringify(d, null, 2) + '\n';
fs.writeFileSync(srcPath, out, 'utf8');
fs.writeFileSync(assetsPath, out, 'utf8');

console.log(`Successfully verified/applied R2 URLs for 2019 songs!`);
console.log(`- Songs updated: ${updatedSongs}`);
console.log(`- Playlists updated: ${updatedPlaylists}`);
console.log(`- Using R2 Prefix: ${r2Prefix}`);
