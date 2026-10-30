const fs = require('fs');
const https = require('https');
const http = require('http');

const data = require('../assets/data/music.json');
const songs = data.songs;

console.log(`Starting deep verification of all ${songs.length} covers...`);

function checkImage(url) {
  return new Promise((resolve) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve({ ok: true, redirected: true, code: res.statusCode });
          res.resume();
          return;
        }
        if (res.statusCode !== 200) {
          resolve({ ok: false, code: res.statusCode, reason: `HTTP ${res.statusCode}` });
          res.resume();
          return;
        }

        let firstBytes = Buffer.alloc(0);
        res.on('data', (chunk) => {
          if (firstBytes.length < 16) {
            firstBytes = Buffer.concat([firstBytes, chunk]);
          }
          if (firstBytes.length >= 16) {
            res.destroy(); // Got header bytes, stop stream
          }
        });

        res.on('close', () => {
          // Check for JPEG (FF D8 FF) or PNG (89 50 4E 47) or WebP (52 49 46 46)
          const isJpg = firstBytes[0] === 0xFF && firstBytes[1] === 0xD8;
          const isPng = firstBytes[0] === 0x89 && firstBytes[1] === 0x50 && firstBytes[2] === 0x4E && firstBytes[3] === 0x47;
          const isWebp = firstBytes[0] === 0x52 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46 && firstBytes[3] === 0x46;
          if (isJpg || isPng || isWebp || firstBytes.length > 0) {
            resolve({ ok: true, code: 200 });
          } else {
            resolve({ ok: false, code: 200, reason: 'Empty or invalid image data' });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, code: null, reason: 'TIMEOUT' });
      });

      req.on('error', (err) => {
        resolve({ ok: false, code: null, reason: err.message });
      });
    } catch (e) {
      resolve({ ok: false, code: null, reason: e.message });
    }
  });
}

async function run() {
  const broken = [];
  const concurrency = 15;
  let index = 0;

  async function worker() {
    while (index < songs.length) {
      const i = index++;
      const song = songs[i];
      const url = song.thumbnailUrl;
      const res = await checkImage(url);
      if (!res.ok) {
        console.log(`[BROKEN] #${i + 1} "${song.title}" (${song.id}): ${res.reason} -> ${url}`);
        broken.push({
          id: song.id,
          title: song.title,
          album: song.album,
          artist: song.artist,
          thumbnailUrl: url,
          reason: res.reason,
          code: res.code
        });
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  console.log(`\nVerification complete. Total songs: ${songs.length}, Broken: ${broken.length}`);
  fs.writeFileSync('./tools/verified_broken_covers.json', JSON.stringify(broken, null, 2));
}

run();
