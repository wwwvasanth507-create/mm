import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Settings,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Volume2,
  Sliders,
  Palette,
  HardDrive,
  FileCode2,
  Plus,
  Copy,
  Check,
  Zap,
  Shield,
  Cloud,
  Wifi,
} from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { AUDIO_PRESETS } from '@/config/audio';
import { AudioPresetId } from '@/types/music';
import {
  testAudioUrl,
  AudioDiagnosticResult,
  getUserPlaylists,
  getFavourites,
  getAllTracks,
  getCatalogueUrl,
  setCatalogueUrl,
  resetCatalogueUrl,
  fetchRemoteCatalogue,
  getLastCatalogueSyncTime,
  getUserTracks,
} from '@/services/musicService';
import {
  getTotalStorageUsed,
  isWifiOnlyDownloads,
  setWifiOnlyDownloads,
  clearAllDownloads,
} from '@/services/downloadService';

export const SettingsPage: React.FC = () => {
  const { onOpenAddSongModal } = useOutletContext<{ onOpenAddSongModal?: () => void }>() || {};
  const {
    activeAccent,
    setActiveAccent,
    volume,
    setVolume,
    clearHistory,
    isDolbyEnabled,
    toggleDolby,
    audioPreset,
    setAudioPreset,
    is24HourNonStop,
    toggle24HourNonStop,
  } = useAudio();

  const [copiedCatalog, setCopiedCatalog] = useState(false);
  const allTracks = getAllTracks();
  const userTracks = getUserTracks();

  // Remote Catalogue Sync State
  const [catalogueUrlInput, setCatalogueUrlInput] = useState(() => getCatalogueUrl());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(() => getLastCatalogueSyncTime());

  // Offline Storage State
  const [storageInfo, setStorageInfo] = useState({ bytes: 0, formatted: '0 MB', count: 0 });
  const [wifiOnly, setWifiOnly] = useState(() => isWifiOnlyDownloads());

  useEffect(() => {
    let isMounted = true;
    getTotalStorageUsed().then((info) => {
      if (isMounted) setStorageInfo(info);
    });

    const refreshStorage = () => {
      getTotalStorageUsed().then((info) => {
        if (isMounted) setStorageInfo(info);
      });
    };

    window.addEventListener('wavemusic_download_completed', refreshStorage);
    window.addEventListener('wavemusic_download_deleted', refreshStorage);
    window.addEventListener('wavemusic_downloads_cleared', refreshStorage);

    return () => {
      isMounted = false;
      window.removeEventListener('wavemusic_download_completed', refreshStorage);
      window.removeEventListener('wavemusic_download_deleted', refreshStorage);
      window.removeEventListener('wavemusic_downloads_cleared', refreshStorage);
    };
  }, []);

  const handleSyncCatalogue = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetchRemoteCatalogue(true);
      setLastSyncTime(Date.now());
      setSyncStatus(
        res.success
          ? `Synced ${res.count} songs successfully!`
          : `Sync status: ${res.message}`
      );
    } catch {
      setSyncStatus('Network error while checking for song updates.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveCatalogueUrl = () => {
    if (setCatalogueUrl(catalogueUrlInput)) {
      setSyncStatus('Remote Catalogue URL updated.');
      handleSyncCatalogue();
    } else {
      alert('Please enter a valid HTTPS URL.');
    }
  };

  const handleResetCatalogueUrl = () => {
    resetCatalogueUrl();
    const def = getCatalogueUrl();
    setCatalogueUrlInput(def);
    setSyncStatus('Reset to default GitHub raw manifest URL.');
    handleSyncCatalogue();
  };

  const handleToggleWifiOnly = () => {
    const next = !wifiOnly;
    setWifiOnly(next);
    setWifiOnlyDownloads(next);
  };

  const handleClearOfflineStorage = async () => {
    if (window.confirm('Delete all downloaded offline songs? This will free device storage.')) {
      await clearAllDownloads();
      setStorageInfo({ bytes: 0, formatted: '0 MB', count: 0 });
      alert('Offline storage cleared.');
    }
  };

  // Audio Stream URL Diagnostic State
  const [testUrlInput, setTestUrlInput] = useState<string>(
    'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.mp3'
  );
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<AudioDiagnosticResult | null>(null);

  const handleRunDiagnostic = async () => {
    if (!testUrlInput.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testAudioUrl(testUrlInput.trim());
      setTestResult(res);
    } catch {
      setTestResult({
        success: false,
        message: 'Unexpected test failure. Check browser network tab for details.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleExportMusicJson = () => {
    const data = {
      songs: getAllTracks(),
      playlists: getUserPlaylists(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'music.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMusicJson = () => {
    const data = {
      songs: getAllTracks(),
      playlists: getUserPlaylists(),
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedCatalog(true);
    setTimeout(() => setCopiedCatalog(false), 2000);
  };

  const handleExportData = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      userPlaylists: getUserPlaylists(),
      favourites: getFavourites(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wavemusic-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.userPlaylists && Array.isArray(parsed.userPlaylists)) {
          localStorage.setItem('wavemusic_playlists_v1', JSON.stringify(parsed.userPlaylists));
        }
        if (parsed.favourites && Array.isArray(parsed.favourites)) {
          localStorage.setItem('wavemusic_favourites_v1', JSON.stringify(parsed.favourites));
        }
        alert('Library data imported successfully! Reloading...');
        window.location.reload();
      } catch {
        alert('Failed to parse backup file. Please ensure it is valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-1">
          <Settings className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Configuration</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Settings & Audio Diagnostics
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage dynamic catalogue sync, offline storage, background audio, and themes
        </p>
      </div>

      {/* Dynamic Song Catalogue & Remote Cloud Sync */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#0c141d]/90 via-[#121217] to-[#121217] space-y-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Remote Song Catalogue Sync</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold">
                  NO APP REBUILD NEEDED
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Update songs on GitHub or manifest without rebuilding or reinstalling the APK
              </p>
            </div>
          </div>

          <button
            onClick={handleSyncCatalogue}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 disabled:opacity-50 text-black font-bold text-xs flex items-center gap-2 self-start sm:self-auto shadow-[0_0_16px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Checking Updates...' : 'Check for Song Updates'}</span>
          </button>
        </div>

        {/* Sync Status Banner */}
        {syncStatus && (
          <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs flex items-center justify-between animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>{syncStatus}</span>
            </div>
            {lastSyncTime && (
              <span className="text-[10px] text-gray-400 font-mono">
                {new Date(lastSyncTime).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}

        {/* Remote Manifest URL Configuration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
            <span>Remote Catalogue Manifest URL</span>
            <button
              onClick={handleResetCatalogueUrl}
              className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
            >
              Reset to Default
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={catalogueUrlInput}
              onChange={(e) => setCatalogueUrlInput(e.target.value)}
              placeholder="https://raw.githubusercontent.com/.../music.json"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-gray-500 font-mono focus:border-cyan-400 outline-none"
            />
            <button
              onClick={handleSaveCatalogueUrl}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors flex-shrink-0 cursor-pointer"
            >
              Save URL
            </button>
          </div>
        </div>

        {/* Statistics Pill Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <p className="text-gray-400 text-[11px]">Active Songs in Library</p>
            <p className="text-xl font-black text-white">{allTracks.length} tracks</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <p className="text-gray-400 text-[11px]">User Added / Edited</p>
            <p className="text-xl font-black text-cyan-300">{userTracks.length} custom</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <p className="text-gray-400 text-[11px]">Offline Downloaded</p>
            <p className="text-xl font-black text-emerald-400">{storageInfo.count} songs</p>
          </div>
        </div>
      </section>

      {/* Offline Downloads & Storage Management */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Offline Downloads & Storage</h2>
              <p className="text-xs text-gray-400">
                Manage downloaded songs for offline playback without internet
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/10 text-emerald-300 font-bold">
            {storageInfo.formatted}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5">
            <div className="flex items-center gap-3">
              <Wifi className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-semibold text-white">Wi-Fi Only Downloads</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Prevent mobile data usage when downloading songs
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleWifiOnly}
              className={`relative inline-flex h-7 w-13 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                wifiOnly ? 'bg-emerald-500' : 'bg-gray-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  wifiOnly ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5">
            <div>
              <p className="text-sm font-semibold text-white">Device Offline Storage</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {storageInfo.count} songs stored offline ({storageInfo.formatted})
              </p>
            </div>
            <button
              onClick={handleClearOfflineStorage}
              disabled={storageInfo.count === 0}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 self-start sm:self-auto cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Clear Downloads</span>
            </button>
          </div>
        </div>
      </section>

      {/* 24/7 Unlimited Non-Stop Continuous Playback */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-[#0c1814]/80 via-[#121217] to-[#121217] space-y-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">24/7 Unlimited Non-Stop Mode</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Infinite looping, screen sleep prevention, and 24-hour uninterrupted streaming
              </p>
            </div>
          </div>

          <button
            onClick={toggle24HourNonStop}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer ${
              is24HourNonStop
                ? 'bg-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.4)]'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <span>{is24HourNonStop ? '24/7 Mode Enabled' : 'Enable 24/7 Mode'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span> No Sleep / WakeLock
            </p>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              Screen Wake Lock API prevents mobile screens and laptops from timing out or sleeping during playback.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span> Infinite Loop
            </p>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              When the queue reaches the end of the catalog, it seamlessly restarts from track 1 without ever stopping.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span> Network Auto-Recovery
            </p>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              If an audio stream encounters a network glitch or timeout, playback automatically recovers within 1.5s.
            </p>
          </div>
        </div>
      </section>

      {/* Manual Song Management Guide Card */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
          <div className="w-11 h-11 rounded-2xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)]">
            <FileCode2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Song Metadata Management</h2>
            <p className="text-xs text-gray-400">
              Add new tracks or export catalog JSON for backup
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => onOpenAddSongModal?.()}
            className="px-5 py-2.5 rounded-full bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 text-white font-bold text-xs inline-flex items-center gap-2 shadow-[0_0_16px_var(--accent-glow)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Song to Library</span>
          </button>

          <button
            onClick={handleExportMusicJson}
            className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download music.json</span>
          </button>

          <button
            onClick={handleCopyMusicJson}
            className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedCatalog ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCatalog ? 'Copied to Clipboard!' : 'Copy music.json'}</span>
          </button>
        </div>
      </section>

      {/* Generic Audio Stream URL Diagnostic Tester */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Audio Stream Diagnostic Tool
              </h2>
              <p className="text-xs text-gray-400">
                Test any audio URL for HTTP 206 Partial Content range seeking, latency, and CORS compatibility
              </p>
            </div>
          </div>

          <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-gray-300 font-mono hidden sm:inline-block">
            HTTP Range Tester
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={testUrlInput}
              onChange={(e) => setTestUrlInput(e.target.value)}
              placeholder="https://example.com/audio/song.mp3"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-gray-500 font-mono focus:border-sky-400 outline-none"
            />
            <button
              onClick={handleRunDiagnostic}
              disabled={isTesting || !testUrlInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all flex-shrink-0 cursor-pointer"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Test URL</span>
                </>
              )}
            </button>
          </div>

          {testResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in duration-200 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  {testResult.success ? 'Stream Validated' : 'Stream Inaccessible'}
                </span>
                {testResult.latencyMs !== undefined && (
                  <span className="font-mono text-[11px] opacity-80">
                    Latency: {testResult.latencyMs}ms
                  </span>
                )}
              </div>

              <p className="leading-relaxed">{testResult.message}</p>
            </div>
          )}
        </div>
      </section>

      {/* Visual Design & Theme Preferences */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Visual Theme & Accents</h2>
            <p className="text-xs text-gray-400">
              Customize the glowing accents and interface palette
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { id: 'coral', name: 'Apple Coral', color: '#fa2d48', desc: 'Vibrant signature red' },
            { id: 'purple', name: 'Electric Purple', color: '#a855f7', desc: 'Deep synthwave glow' },
            { id: 'cyan', name: 'Ocean Cyan', color: '#06b6d4', desc: 'Crisp aquatic teal' },
            { id: 'amber', name: 'Warm Amber', color: '#f59e0b', desc: 'Golden analog tone' },
          ].map((theme) => {
            const isSelected = activeAccent === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => setActiveAccent(theme.id as any)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white/15 border-white shadow-xl scale-[1.02]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full mb-3 shadow-md flex items-center justify-center"
                  style={{ backgroundColor: theme.color }}
                />
                <h4 className="font-bold text-sm text-white">{theme.name}</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">{theme.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Dolby Atmos & Audio Mastering Settings */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#0c141d]/70 via-[#101018] to-[#121217] space-y-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Dolby Atmos & Spatial Audio</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Apple Music Lossless
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Studio-grade mastering with 3D spatial room expansion, vocal separation, and dynamic limiting
              </p>
            </div>
          </div>

          <button
            onClick={toggleDolby}
            className={`relative inline-flex h-7 w-13 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isDolbyEnabled ? 'bg-gradient-to-r from-cyan-500 to-purple-600' : 'bg-gray-700'
            }`}
            title="Toggle Dolby Atmos Spatial Audio"
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isDolbyEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
            Active Sound Mastering Profile
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(AUDIO_PRESETS) as AudioPresetId[]).map((pid) => {
              if (pid === 'custom') return null;
              const p = AUDIO_PRESETS[pid];
              const isSelected = audioPreset === pid;

              return (
                <button
                  key={pid}
                  onClick={() => setAudioPreset(pid)}
                  className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-br from-white/15 to-white/5 border-white/30 text-white shadow-[0_0_16px_rgba(6,182,212,0.25)]'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-400'
                  }`}
                >
                  <p className="text-xs font-bold text-white flex items-center justify-between">
                    <span>{p.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 leading-snug">{p.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Audio Playback Preferences */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Audio Engine Preferences</h2>
            <p className="text-xs text-gray-400">Configure playback volume and buffering rules</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5">
            <div>
              <p className="text-sm font-semibold text-white">Default Volume</p>
              <p className="text-xs text-gray-400 mt-0.5">Initial volume when launching the app</p>
            </div>
            <div className="flex items-center gap-3 w-48">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1.5"
              />
              <span className="font-mono text-xs w-9 text-right text-gray-300">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Local Storage & Library Backup */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Backup & Data Management</h2>
            <p className="text-xs text-gray-400">
              Export and import your custom playlists and favourites as JSON
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleExportData}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center text-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs font-bold text-white">Export Backup JSON</p>
              <p className="text-[10px] text-gray-400">Save playlists & favourites</p>
            </div>
          </button>

          <label className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center text-center gap-2 transition-colors cursor-pointer">
            <Upload className="w-5 h-5 text-sky-400" />
            <div>
              <p className="text-xs font-bold text-white">Import Backup JSON</p>
              <p className="text-[10px] text-gray-400">Restore from file</p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (window.confirm('Clear all listening history?')) {
                clearHistory();
                alert('History cleared.');
              }
            }}
            className="p-4 rounded-2xl bg-white/5 hover:bg-rose-500/15 border border-white/10 flex flex-col items-center text-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-5 h-5 text-rose-400" />
            <div>
              <p className="text-xs font-bold text-rose-300">Clear History</p>
              <p className="text-[10px] text-gray-400">Reset recently played</p>
            </div>
          </button>
        </div>
      </section>

      {/* System Info */}
      <footer className="text-center py-6 text-xs text-gray-500 space-y-1">
        <p>WaveMusic Premium • Native Android & Progressive Web Experience</p>
        <p className="font-mono text-[11px] text-gray-600">
          React 19 • Vite • Capacitor 8 • MediaSession & Background Service
        </p>
      </footer>
    </div>
  );
};