const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const manifest = require('./full_download_manifest.json');
const publicDir = path.resolve(__dirname, '../public/covers');
const assetsDir = path.resolve(__dirname, '../assets/covers');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

function downloadFile(url, destPublic, destAssets, retries = 3) {
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
            timeout: 15000
          },
          (res) => {
            // Handle redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              res.resume();
              return tryFetch(res.headers.location, attempt);
            }

            if (res.statusCode !== 200) {
              res.resume();
              if (attempt < retries) {
                setTimeout(() => tryFetch(currentUrl, attempt + 1), 1000);
              } else {
                reject(new Error(`HTTP ${res.statusCode} from ${currentUrl}`));
              }
              return;
            }

            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
              const buffer = Buffer.concat(chunks);
              if (buffer.length < 500) {
                if (attempt < retries) {
                  setTimeout(() => tryFetch(currentUrl, attempt + 1), 1000);
                } else {
                  reject(new Error(`Downloaded buffer too small (${buffer.length} bytes)`));
                }
                return;
              }

              fs.writeFileSync(destPublic, buffer);
              fs.writeFileSync(destAssets, buffer);
              resolve({ size: buffer.length });
            });
          }
        );

        req.on('timeout', () => {
          req.destroy();
          if (attempt < retries) {
            setTimeout(() => tryFetch(currentUrl, attempt + 1), 1000);
          } else {
            reject(new Error(`Timeout downloading ${currentUrl}`));
          }
        });

        req.on('error', (err) => {
          if (attempt < retries) {
            setTimeout(() => tryFetch(currentUrl, attempt + 1), 1000);
          } else {
            reject(err);
          }
        });
      } catch (err) {
        if (attempt < retries) {
          setTimeout(() => tryFetch(currentUrl, attempt + 1), 1000);
        } else {
          reject(err);
        }
      }
    }

    tryFetch(url, 1);
  });
}

async function run() {
  console.log(`Starting download of ${manifest.uniqueDownloads.length} covers...`);

  // First sync existing files between public/covers and assets/covers
  const publicFiles = fs.readdirSync(publicDir);
  for (const f of publicFiles) {
    const src = path.join(publicDir, f);
    const dest = path.join(assetsDir, f);
    if (!fs.existsSync(dest) && fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest);
      console.log(`Synced existing: ${f} -> assets/covers/`);
    }
  }

  let success = 0;
  let failed = 0;
  const errors = [];

  // Concurrency pool
  const concurrency = 8;
  let index = 0;

  async function worker() {
    while (index < manifest.uniqueDownloads.length) {
      const i = index++;
      const item = manifest.uniqueDownloads[i];
      const destPublic = path.join(publicDir, item.filename);
      const destAssets = path.join(assetsDir, item.filename);

      try {
        const res = await downloadFile(item.url, destPublic, destAssets);
        success++;
        console.log(`[${success + failed}/${manifest.uniqueDownloads.length}] Downloaded ${item.filename} (${(res.size / 1024).toFixed(1)} KB)`);
      } catch (err) {
        failed++;
        console.error(`[FAILED] ${item.filename} from ${item.url}: ${err.message}`);
        errors.push({ item, error: err.message });
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  console.log('\n=== DOWNLOAD COMPLETE ===');
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  if (errors.length > 0) {
    fs.writeFileSync(path.resolve(__dirname, 'failed_downloads.json'), JSON.stringify(errors, null, 2));
    console.log('Saved failures to tools/failed_downloads.json');
  }
}

run();
