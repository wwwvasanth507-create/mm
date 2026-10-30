const fs = require('fs');
const https = require('https');
const http = require('http');

const data = JSON.parse(fs.readFileSync('assets/data/music.json', 'utf8'));
const songs = data.songs || [];
console.log(`Checking all ${songs.length} songs for broken/expired thumbnails...`);

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
        resolve({ statusCode: res.statusCode, error: null });
      });
      req.on('error', (err) => resolve({ statusCode: null, error: err.message }));
      req.on('timeout', () => { req.destroy(); resolve({ statusCode: null, error: 'TIMEOUT' }); });
      req.end();
    } catch (e) {
      resolve({ statusCode: null, error: e.message });
    }
  });
}

async function run() {
  const failed = [];
  const batchSize = 25;
  for (let i = 0; i < songs.length; i += batchSize) {
    const chunk = songs.slice(i, i + batchSize);
    const results = await Promise.all(chunk.map(async (s) => {
      if (!s.thumbnailUrl) return { song: s, statusCode: null, error: 'EMPTY' };
      const res = await checkUrl(s.thumbnailUrl);
      return { song: s, ...res };
    }));

    for (const r of results) {
      if (r.statusCode !== 200 && r.statusCode !== 301 && r.statusCode !== 302) {
        failed.push({
          id: r.song.id,
          title: r.song.title,
          album: r.song.album,
          artist: r.song.artist,
          thumbnailUrl: r.song.thumbnailUrl,
          statusCode: r.statusCode,
          error: r.error
        });
      }
    }
    process.stdout.write(`Processed ${Math.min(i + batchSize, songs.length)}/${songs.length} (Failed: ${failed.length})\r`);
  }

  console.log(`\n\nTotal failed or expired thumbnails: ${failed.length}`);
  fs.writeFileSync('tools/failed_thumbnails.json', JSON.stringify(failed, null, 2));
  console.log('Saved failed thumbnails to tools/failed_thumbnails.json');
}

run();
