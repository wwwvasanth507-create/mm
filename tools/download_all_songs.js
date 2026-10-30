const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const d = require('../src/data/music.json');
const songs = d.songs || [];

const outputDir = path.resolve(__dirname, '../songs');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function getFilenameForSong(song) {
  // Extract filename from URL or build from song title and id
  try {
    const u = new URL(song.audioUrl);
    const base = path.basename(u.pathname);
    const decoded = decodeURIComponent(base);
    if (decoded && decoded.endsWith('.mp3')) {
      return decoded;
    }
  } catch (_) {}
  const safeTitle = song.title.replace(/[\\/:*?"<>|]/g, '_');
  return `${safeTitle}-${song.id}.mp3`;
}

function downloadSong(song, destPath, retries = 3) {
  return new Promise((resolve, reject) => {
    function tryFetch(currentUrl, attempt) {
      try {
        const client = currentUrl.startsWith('https') ? https : http;
        const req = client.get(
          currentUrl,
          {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 60000
          },
          (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              res.resume();
              return tryFetch(res.headers.location, attempt);
            }

            if (res.statusCode !== 200) {
              res.resume();
              if (attempt < retries) {
                setTimeout(() => tryFetch(currentUrl, attempt + 1), 1500);
              } else {
                reject(new Error(`HTTP ${res.statusCode} from ${currentUrl}`));
              }
              return;
            }

            const fileStream = fs.createWriteStream(destPath);
            res.pipe(fileStream);

            fileStream.on('finish', () => {
              fileStream.close(() => {
                const stat = fs.statSync(destPath);
                if (stat.size < 10000) {
                  fs.unlinkSync(destPath);
                  if (attempt < retries) {
                    setTimeout(() => tryFetch(currentUrl, attempt + 1), 1500);
                  } else {
                    reject(new Error(`File too small (${stat.size} bytes)`));
                  }
                } else {
                  resolve({ size: stat.size });
                }
              });
            });

            fileStream.on('error', (err) => {
              try { fs.unlinkSync(destPath); } catch (_) {}
              if (attempt < retries) {
                setTimeout(() => tryFetch(currentUrl, attempt + 1), 1500);
              } else {
                reject(err);
              }
            });
          }
        );

        req.on('timeout', () => {
          req.destroy();
          try { fs.unlinkSync(destPath); } catch (_) {}
          if (attempt < retries) {
            setTimeout(() => tryFetch(currentUrl, attempt + 1), 1500);
          } else {
            reject(new Error(`Timeout downloading ${currentUrl}`));
          }
        });

        req.on('error', (err) => {
          try { fs.unlinkSync(destPath); } catch (_) {}
          if (attempt < retries) {
            setTimeout(() => tryFetch(currentUrl, attempt + 1), 1500);
          } else {
            reject(err);
          }
        });
      } catch (err) {
        if (attempt < retries) {
          setTimeout(() => tryFetch(currentUrl, attempt + 1), 1500);
        } else {
          reject(err);
        }
      }
    }

    tryFetch(song.audioUrl, 1);
  });
}

async function run() {
  console.log(`Starting song downloader for ${songs.length} songs...`);
  console.log(`Target directory: ${outputDir}`);

  const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : songs.length;
  const targetSongs = songs.slice(0, limit);

  let downloadedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let totalBytes = 0;
  let index = 0;
  const concurrency = 6;

  async function worker() {
    while (index < targetSongs.length) {
      const i = index++;
      const song = targetSongs[i];
      const filename = getFilenameForSong(song);
      const destPath = path.join(outputDir, filename);

      if (fs.existsSync(destPath) && fs.statSync(destPath).size > 100000) {
        skippedCount++;
        totalBytes += fs.statSync(destPath).size;
        continue;
      }

      try {
        const res = await downloadSong(song, destPath);
        downloadedCount++;
        totalBytes += res.size;
        console.log(
          `[${downloadedCount + skippedCount + failedCount}/${targetSongs.length}] (${(totalBytes / 1024 / 1024).toFixed(1)} MB) Downloaded: ${filename}`
        );
      } catch (err) {
        failedCount++;
        console.error(`[FAILED] #${i + 1} "${song.title}": ${err.message}`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  console.log('\n=== SONG DOWNLOAD SUMMARY ===');
  console.log(`Total target songs: ${targetSongs.length}`);
  console.log(`Downloaded: ${downloadedCount}`);
  console.log(`Skipped (already exists): ${skippedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Total Size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
}

if (require.main === module) {
  run();
}

module.exports = { downloadSong, getFilenameForSong };
