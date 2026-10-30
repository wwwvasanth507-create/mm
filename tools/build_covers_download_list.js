const fs = require('fs');
const path = require('path');
const d = require('../src/data/music.json');

const publicDir = path.resolve(__dirname, '../public/covers');
const publicCovers = new Set(fs.readdirSync(publicDir).map(f => f.toLowerCase()));

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// 1. Playlists
const playlistPlan = [];
d.playlists.forEach((p) => {
  const targetFilename = `${p.id}.jpg`;
  playlistPlan.push({
    id: p.id,
    name: p.name,
    currentUrl: p.coverUrl,
    targetFilename: targetFilename,
    alreadyInPublic: publicCovers.has(targetFilename)
  });
});

// 2. Known aliases for albums where a cover already exists in public/covers
const albumAliases = {
  'Leo': 'leo.jpg',
  'Jailer': 'jailer.jpg',
  'Varisu': 'varisu.jpg',
  'Thunivu': 'thunivu.jpg',
  'Joe': 'joe.jpg',
  'Dada': 'dada.jpg',
  'Vaathi': 'vaathi.jpg',
  'Pathu Thala': 'pathu-thala.jpg',
  'Maamannan': 'maamannan.jpg',
  'Rudhran': 'rudhran.jpg',
  'Mark Antony': 'mark-antony.jpg',
  'Viduthalai: Part 1': 'viduthalai.jpg',
  'Ponniyin Selvan: Part 2': 'ponniyin-selvan-2.jpg',
  'Ayothi': 'kaatrodu-pattam-pola.jpg',
  'Amaran': 'amara.jpg',
  'Madharaasi': 'thangapoovey.jpg',
  'Kanguva': 'thalaivane.jpg',
};

// 3. Songs
const songPlan = [];
const downloadItems = new Map(); // url -> filename

for (const s of d.songs) {
  const url = s.thumbnailUrl || '';
  const fname = path.basename(url.split('?')[0]).toLowerCase();

  // Case A: already pointing to a public cover
  if (url.includes('/public/covers/') && publicCovers.has(fname)) {
    songPlan.push({
      id: s.id,
      title: s.title,
      album: s.album,
      assignedFilename: fname,
      source: 'already_public'
    });
    continue;
  }

  // Case B: matches an existing alias in public/covers
  if (albumAliases[s.album] && publicCovers.has(albumAliases[s.album])) {
    songPlan.push({
      id: s.id,
      title: s.title,
      album: s.album,
      assignedFilename: albumAliases[s.album],
      source: 'existing_alias'
    });
    continue;
  }

  // Case C: remote URL needs to be downloaded
  let targetFilename;
  if (downloadItems.has(url)) {
    targetFilename = downloadItems.get(url);
  } else {
    let slug = slugify(s.album);
    if (!slug || slug === 'album' || slug === 'indie') {
      slug = slugify(s.title);
    }
    targetFilename = `${slug}.jpg`;
    downloadItems.set(url, targetFilename);
  }

  songPlan.push({
    id: s.id,
    title: s.title,
    album: s.album,
    assignedFilename: targetFilename,
    source: 'remote_download',
    downloadUrl: url
  });
}

// Consolidate unique downloads
const uniqueDownloads = [];

// Playlist downloads
playlistPlan.forEach(p => {
  uniqueDownloads.push({
    type: 'playlist',
    id: p.id,
    name: p.name,
    url: p.currentUrl,
    filename: p.targetFilename
  });
});

// Song downloads
for (const [url, filename] of downloadItems.entries()) {
  uniqueDownloads.push({
    type: 'song_album',
    url: url,
    filename: filename
  });
}

const manifest = {
  totalSongs: d.songs.length,
  totalPlaylists: d.playlists.length,
  playlistPlan,
  songPlan,
  uniqueDownloads,
  uniqueDownloadsCount: uniqueDownloads.length
};

fs.writeFileSync(path.resolve(__dirname, 'full_download_manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Manifest created! Total unique files to download: ${uniqueDownloads.length}`);
console.log(`- Playlists: ${playlistPlan.length}`);
console.log(`- Song album covers: ${downloadItems.size}`);
