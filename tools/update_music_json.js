const fs = require('fs');
const path = require('path');

const srcPath = path.resolve('src/data/music.json');
const assetsPath = path.resolve('assets/data/music.json');
const newSongsPath = path.resolve('scratch_new_2021_songs.json');

const originalData = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
const newSongs = JSON.parse(fs.readFileSync(newSongsPath, 'utf8'));

console.log('Original songs count:', originalData.songs.length);
console.log('Original playlists count:', originalData.playlists.length);
console.log('New songs to add:', newSongs.length);

// 1. Remove lyrics from all existing songs
const lyricsKeys = ['lyrics', 'lyricsUrl', 'lrc', 'syncedLyrics', 'lyric'];
for (const s of originalData.songs) {
  for (const k of Object.keys(s)) {
    if (lyricsKeys.includes(k) || k.toLowerCase().includes('lyric')) {
      delete s[k];
    }
  }
}

// 2. Remove lyrics from all new songs
for (const s of newSongs) {
  for (const k of Object.keys(s)) {
    if (lyricsKeys.includes(k) || k.toLowerCase().includes('lyric')) {
      delete s[k];
    }
  }
}

// 3. Combine songs and verify uniqueness
const combinedSongs = [...originalData.songs, ...newSongs];
const songIdMap = new Map();
const songUrlMap = new Map();

for (const s of combinedSongs) {
  if (songIdMap.has(s.id)) {
    console.error(`Duplicate song ID detected: ${s.id}`);
  }
  songIdMap.set(s.id, s);

  if (songUrlMap.has(s.audioUrl)) {
    console.error(`Duplicate audioUrl detected: ${s.audioUrl}`);
  }
  songUrlMap.set(s.audioUrl, s);
}

console.log('Combined total songs:', combinedSongs.length);

// 4. Define new playlists
const newPlaylists = [
  {
    id: "playlist-2021-blockbusters",
    name: "2021 Tamil Mega Blockbusters",
    description: "The absolute biggest chartbusters, mass anthems, and viral sensations of 2021 including Master, Doctor, Karnan, Sarpatta Parambarai, Pushpa, Maanaadu & more",
    coverUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/44/22/e1/4422e1e0-c3d5-e41c-b258-00a293fcb6eb/190296791166.jpg/600x600bb.jpg",
    trackIds: [
      "song-vaathi-coming",
      "song-master-the-blaster",
      "song-kutti-story",
      "song-vaathi-raid",
      "song-vaathi-kabaddi",
      "song-polakatum-para-para",
      "song-quit-pannuda",
      "song-chellamma",
      "song-so-baby",
      "song-nenjame",
      "song-enjoy-enjaami",
      "song-kandaa-vara-sollunga",
      "song-manjanathi-puranam",
      "song-uttradheenga-yeppov",
      "song-thattaan-thattaan",
      "song-neeye-oli",
      "song-vambula-thumbula",
      "song-dancing-rose",
      "song-oo-solriya-oo-oo-solriya",
      "song-saami-saami",
      "song-srivalli",
      "song-eyy-beta-idhu-en-patta",
      "song-meherezylaa",
      "song-per-vachaalum-vaikkaama",
      "song-mudhal-nee-mudivum-nee-title",
      "song-tum-tum",
      "song-little-india",
      "song-jai-sulthan",
      "song-yaaraiyum-ivlo-azhaga",
      "song-marandhaye",
      "song-nanbiye",
      "song-en-iniya-thanimaye",
      "song-theeraanadhi",
      "song-kaathirundhen",
      "song-yaar-azhaippadhu",
      "song-thala-kodhum",
      "song-sendumalli",
      "song-polladha-ulagathiley",
      "song-annaatthe-annaatthe",
      "song-a-for-annaatthe",
      "song-marudhaani",
      "song-saara-kaattrae",
      "song-adi-penne-duet",
      "song-kutty-pattas",
      "song-bodhai-kaname",
      "song-kaathodu-kaathanen",
      "song-adiye-bachelor",
      "song-puli-manga-pulip"
    ],
    createdAt: "2025-01-01"
  },
  {
    id: "playlist-sana-rustic-vibes",
    name: "Santhosh Narayanan: Raw, Rustic & Folk Soul",
    description: "Uncompromising folk rhythms, revolutionary anthems, and rustic percussion by Santhosh Narayanan (Karnan, Sarpatta Parambarai, Enjoy Enjaami & Parris Jeyaraj)",
    coverUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/05/29/ce/0529ce45-1dd4-fc12-ea82-8bc96d4ce03f/cover.jpg/600x600bb.jpg",
    trackIds: [
      "song-kandaa-vara-sollunga",
      "song-manjanathi-puranam",
      "song-uttradheenga-yeppov",
      "song-thattaan-thattaan",
      "song-karnan-purappadu",
      "song-karnan-kodai",
      "song-neeye-oli",
      "song-vambula-thumbula",
      "song-dancing-rose",
      "song-enjoy-enjaami",
      "song-puli-manga-pulip"
    ],
    createdAt: "2025-01-01"
  },
  {
    id: "playlist-romantic-escapes",
    name: "Tamil Romantic Escapes & Love Melodies",
    description: "Heartwarming melodies and soulful serenades that capture the tender essence of love",
    coverUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/6b/fb/8e/6bfb8e92-36c5-4a62-fa55-1e37bc6bc752/190296531380.jpg/600x600bb.jpg",
    trackIds: [
      "song-bodhai-kaname",
      "song-marandhaye",
      "song-nanbiye",
      "song-mudhal-nee-mudivum-nee-title",
      "song-theeraanadhi",
      "song-kaathirundhen",
      "song-oh-azhage",
      "song-oru-arai-unathu",
      "song-yaar-azhaippadhu",
      "song-sendumalli",
      "song-thala-kodhum",
      "song-yaaraiyum-ivlo-azhaga",
      "song-tum-tum",
      "song-orey-naan-orey-nee",
      "song-saara-kaattrae",
      "song-marudhaani",
      "song-kaadhal-kanmani",
      "song-adi-penne-duet",
      "song-kaathodu-kaathanen",
      "song-srivalli",
      "song-so-baby",
      "song-chellamma",
      "song-idhuvum-kadandhu-pogum",
      "song-idhuvum-kadandhu-pogum-reprise",
      "song-adiye-bachelor",
      "song-life-of-bachelor",
      "song-nesamaguren"
    ],
    createdAt: "2025-01-01"
  },
  {
    id: "playlist-unplugged-karaoke-chill",
    name: "Acoustic, Unplugged & Instrumental Lounge",
    description: "Relaxing acoustic renditions, karaoke versions, soothing instrumental themes, and peaceful background vibes",
    coverUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/da/f2/80/daf280df-4a65-188b-dc54-7dc4bcf08cfa/190296684062.jpg/600x600bb.jpg",
    trackIds: [
      "song-marandhaye-unplugged",
      "song-marandhaye-karaoke",
      "song-nanbiye-karaoke",
      "song-en-iniya-thanimaye-karaoke",
      "song-idhuvum-kadandhu-pogum-reprise",
      "song-beat-of-master-instrumental",
      "song-harmonica-sizzles",
      "song-photographic-memory",
      "song-soul-of-doctor-theme",
      "song-neel-koadugaal",
      "song-pudhidhaai",
      "song-veezhaadhae",
      "song-kaatrilae",
      "song-search-of-soul",
      "song-maara-paaru",
      "song-karnan-purappadu",
      "song-karnan-kodai"
    ],
    createdAt: "2025-01-01"
  }
];

// 5. Update existing playlists with 2021 songs
const updatesMap = {
  "playlist-featured": [
    "song-vaathi-coming",
    "song-master-the-blaster",
    "song-kutti-story",
    "song-chellamma",
    "song-so-baby",
    "song-enjoy-enjaami",
    "song-kandaa-vara-sollunga",
    "song-neeye-oli",
    "song-oo-solriya-oo-oo-solriya",
    "song-saami-saami",
    "song-srivalli",
    "song-meherezylaa",
    "song-tum-tum",
    "song-marandhaye",
    "song-mudhal-nee-mudivum-nee-title",
    "song-adi-penne-duet",
    "song-kutty-pattas"
  ],
  "playlist-anirudh-vibes": [
    "song-vaathi-coming",
    "song-master-the-blaster",
    "song-kutti-story",
    "song-vaathi-raid",
    "song-vaathi-kabaddi",
    "song-polakatum-para-para",
    "song-quit-pannuda",
    "song-beat-of-master-instrumental",
    "song-chellamma",
    "song-so-baby",
    "song-nenjame",
    "song-soul-of-doctor-theme"
  ],
  "playlist-mass-kuthu": [
    "song-vaathi-coming",
    "song-polakatum-para-para",
    "song-vaathi-raid",
    "song-vaathi-kabaddi",
    "song-chellamma",
    "song-per-vachaalum-vaikkaama",
    "song-oo-solriya-oo-oo-solriya",
    "song-saami-saami",
    "song-annaatthe-annaatthe",
    "song-a-for-annaatthe",
    "song-jai-sulthan",
    "song-puli-manga-pulip",
    "song-kutty-pattas",
    "song-pudhu-saththam"
  ],
  "playlist-pure-melodies": [
    "song-nenjame",
    "song-so-baby",
    "song-bodhai-kaname",
    "song-marandhaye",
    "song-nanbiye",
    "song-en-iniya-thanimaye",
    "song-mudhal-nee-mudivum-nee-title",
    "song-theeraanadhi",
    "song-kaathirundhen",
    "song-oh-azhage",
    "song-oru-arai-unathu",
    "song-yaar-azhaippadhu",
    "song-thala-kodhum",
    "song-sendumalli",
    "song-saara-kaattrae",
    "song-marudhaani",
    "song-yaaraiyum-ivlo-azhaga",
    "song-tum-tum",
    "song-adiye-bachelor",
    "song-idhuvum-kadandhu-pogum",
    "song-idhuvum-kadandhu-pogum-reprise",
    "song-kaathodu-kaathanen",
    "song-adi-penne-duet",
    "song-srivalli"
  ],
  "playlist-late-night-chill": [
    "song-marandhaye",
    "song-marandhaye-unplugged",
    "song-en-iniya-thanimaye",
    "song-bodhai-kaname",
    "song-theeraanadhi",
    "song-yaar-azhaippadhu",
    "song-kaathirundhen",
    "song-thala-kodhum",
    "song-mudhal-nee-mudivum-nee-title",
    "song-neel-koadugaal",
    "song-pudhidhaai",
    "song-kaatrilae",
    "song-veezhaadhae",
    "song-saara-kaattrae",
    "song-kaadhal-kanmani",
    "song-adiye-bachelor"
  ],
  "playlist-soulful-heartbreak": [
    "song-nenjame",
    "song-marandhaye",
    "song-marandhaye-unplugged",
    "song-en-iniya-thanimaye",
    "song-life-of-bachelor",
    "song-adiye-bachelor",
    "song-kaatrilae",
    "song-veezhaadhae",
    "song-yedhum-solladhe",
    "song-po-nilladhe"
  ],
  "playlist-folk-roots": [
    "song-kandaa-vara-sollunga",
    "song-manjanathi-puranam",
    "song-uttradheenga-yeppov",
    "song-thattaan-thattaan",
    "song-karnan-purappadu",
    "song-karnan-kodai",
    "song-enjoy-enjaami",
    "song-vettakaara-kootam",
    "song-polladha-ulagathiley",
    "song-sonthamulla-vazhkkai",
    "song-anney-yaaranney",
    "song-othapana-kaatteri",
    "song-pachigalam-paravaigalam",
    "song-pudhu-saththam",
    "song-eppadi-iruntha-naanga",
    "song-manja-colouru-kuruvi",
    "song-cycle-wheela-pola",
    "song-puli-manga-pulip",
    "song-uchanthala-regaiyile"
  ],
  "playlist-blockbuster-themes": [
    "song-beat-of-master-instrumental",
    "song-soul-of-doctor-theme",
    "song-harmonica-sizzles",
    "song-photographic-memory",
    "song-search-of-soul",
    "song-maara-paaru",
    "song-neel-koadugaal",
    "song-karnan-purappadu",
    "song-karnan-kodai"
  ],
  "playlist-workout-adrenaline": [
    "song-vaathi-raid",
    "song-vaathi-kabaddi",
    "song-vaathi-coming",
    "song-neeye-oli",
    "song-vambula-thumbula",
    "song-dancing-rose",
    "song-jai-sulthan",
    "song-little-india",
    "song-pathala",
    "song-power-jai-bhim",
    "song-eyy-beta-idhu-en-patta",
    "song-ratatapata"
  ],
  "playlist-yuvan-drugs": [
    "song-meherezylaa",
    "song-tum-tum",
    "song-little-india",
    "song-pathala",
    "song-orey-naan-orey-nee"
  ]
};

// Apply updates to existing playlists
for (const playlist of originalData.playlists) {
  if (updatesMap[playlist.id]) {
    const existingSet = new Set(playlist.trackIds);
    for (const trackId of updatesMap[playlist.id]) {
      if (!existingSet.has(trackId)) {
        playlist.trackIds.push(trackId);
        existingSet.add(trackId);
      }
    }
  }
}

// Combine playlists: insert the new playlists right after 2022 blockbusters or at strategic positions
const updatedPlaylists = [
  originalData.playlists[0], // playlist-featured
  newPlaylists[0],          // playlist-2021-blockbusters
  originalData.playlists[1], // playlist-2022-blockbusters
  originalData.playlists[2], // playlist-pure-melodies
  newPlaylists[2],          // playlist-romantic-escapes
  originalData.playlists[3], // playlist-mass-kuthu
  originalData.playlists[4], // playlist-anirudh-vibes
  newPlaylists[1],          // playlist-sana-rustic-vibes
  originalData.playlists[5], // playlist-arr-classics
  originalData.playlists[6], // playlist-yuvan-drugs
  originalData.playlists[7], // playlist-sita-ramam
  originalData.playlists[8], // playlist-ponniyin-selvan
  originalData.playlists[9], // playlist-late-night-chill
  newPlaylists[3],          // playlist-unplugged-karaoke-chill
  originalData.playlists[10], // playlist-soulful-heartbreak
  originalData.playlists[11], // playlist-folk-roots
  originalData.playlists[12], // playlist-blockbuster-themes
  originalData.playlists[13], // playlist-workout-adrenaline
  originalData.playlists[14]  // playlist-ayothi
];

// Validate all trackIds in all playlists
const allSongIds = new Set(combinedSongs.map(s => s.id));
for (const pl of updatedPlaylists) {
  for (const tid of pl.trackIds) {
    if (!allSongIds.has(tid)) {
      throw new Error(`Playlist ${pl.id} references non-existent song ID: ${tid}`);
    }
  }
}

console.log('All playlists and trackIds validated successfully!');
console.log('Total playlists:', updatedPlaylists.length);
console.log('Total songs:', combinedSongs.length);

const outputJson = {
  playlists: updatedPlaylists,
  songs: combinedSongs
};

const jsonString = JSON.stringify(outputJson, null, 2);

fs.writeFileSync(srcPath, jsonString, 'utf8');
console.log('Updated:', srcPath);

fs.writeFileSync(assetsPath, jsonString, 'utf8');
console.log('Updated:', assetsPath);

console.log('Done!');
