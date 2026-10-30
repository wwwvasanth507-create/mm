const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function run(cmd, opts = {}) {
  console.log(`[Cloudflare Build] > ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

function findFlutter() {
  const isWin = process.platform === 'win32';
  const defaultBin = isWin ? 'flutter.bat' : 'flutter';

  // 1. Check if defaultBin works in PATH
  try {
    const test = isWin
      ? spawnSync('cmd.exe', ['/c', defaultBin, '--version'])
      : spawnSync(defaultBin, ['--version']);
    if (test.status === 0) {
      return defaultBin;
    }
  } catch (_) {}

  // 2. Check known paths
  const possibleDirs = [
    'C:\\software\\flutter\\bin',
    path.join(process.cwd(), 'flutter-sdk', 'bin'),
    path.join(process.cwd(), 'flutter', 'bin'),
    path.join(os.homedir(), 'flutter', 'bin'),
    '/opt/flutter/bin',
    '/usr/local/flutter/bin',
  ];

  for (const dir of possibleDirs) {
    const binPath = path.join(dir, defaultBin);
    if (fs.existsSync(binPath)) {
      return binPath;
    }
  }

  return null;
}

function main() {
  console.log('=== Jalra Cloudflare Web Build Pipeline ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Working Directory: ${process.cwd()}`);
  console.log(`Platform: ${process.platform} (${process.arch})`);

  // Ensure git safe directory in container environments
  try {
    run('git config --global --add safe.directory "*"');
  } catch (_) {}

  let flutterCmd = findFlutter();

  if (!flutterCmd) {
    console.log('[Cloudflare Build] Flutter SDK not detected. Installing stable Flutter SDK...');
    const sdkTarget = path.join(process.cwd(), 'flutter-sdk');
    if (!fs.existsSync(sdkTarget)) {
      run(`git clone --depth 1 -b stable https://github.com/flutter/flutter.git "${sdkTarget}"`);
    }

    const binDir = path.join(sdkTarget, 'bin');
    process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH}`;
    const defaultBin = process.platform === 'win32' ? 'flutter.bat' : 'flutter';
    flutterCmd = path.join(binDir, defaultBin);
  }

  const cmdPrefix = flutterCmd.includes(' ') ? `"${flutterCmd}"` : flutterCmd;

  try {
    run(`${cmdPrefix} config --no-analytics`);
    run(`${cmdPrefix} config --enable-web`);
  } catch (e) {
    console.warn('[Cloudflare Build] Notice during flutter config:', e.message);
  }

  console.log('[Cloudflare Build] Resolving Flutter pub dependencies...');
  run(`${cmdPrefix} pub get`);

  console.log('[Cloudflare Build] Building Flutter web (release)...');
  run(`${cmdPrefix} build web --release`);

  const webDir = path.join(process.cwd(), 'build', 'web');
  const distDir = path.join(process.cwd(), 'dist');

  if (fs.existsSync(webDir)) {
    console.log('[Cloudflare Build] Copying build/web -> dist for dual directory compatibility...');
    fs.cpSync(webDir, distDir, { recursive: true });
    console.log('[Cloudflare Build] Static web assets ready in build/web and dist!');
  } else {
    throw new Error('Flutter web build completed but build/web was not generated.');
  }

  console.log('=== Jalra Web Build Succeeded! ===');
}

main();
