import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import {
  testAudioUrl,
  AudioDiagnosticResult,
  getUserPlaylists,
  getFavourites,
  getAllTracks,
} from '@/services/musicService';

export const SettingsPage: React.FC = () => {
  const { onOpenAddSongModal } = useOutletContext<{ onOpenAddSongModal?: () => void }>() || {};
  const {
    activeAccent,
    setActiveAccent,
    volume,
    setVolume,
    clearHistory,
  } = useAudio();

  const [copiedCatalog, setCopiedCatalog] = useState(false);
  const allTracks = getAllTracks();

  // Audio Stream URL Diagnostic State
  const [testUrlInput, setTestUrlInput] = useState<string>(
    'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.mp3'
  );
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<AudioDiagnosticResult | null>(null);

  // Run live diagnostic test on audio URL
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

  // Export Catalog as music.json for Git Commits
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

  // Export User Library (Playlists + Favourites)
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

  // Import User Library
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
          Manage playback preferences, verify direct audio stream URLs, and customize visual themes
        </p>
      </div>

      {/* Manual Song Management Guide Card */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
          <div className="w-11 h-11 rounded-2xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)]">
            <FileCode2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Manual Song Management</h2>
            <p className="text-xs text-gray-400">
              Add, edit, or delete songs directly in <code className="text-white font-mono">src/data/music.json</code>
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          WaveMusic plays audio directly from any HTTPS audio URL you supply. Albums and artist profiles are automatically derived from song metadata.
        </p>

        <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-gray-300 overflow-x-auto leading-relaxed">
{`// Example song entry in src/data/music.json:
{
  "id": "my-song-01",
  "title": "My Tamil Song",
  "artist": "My Favourite Artist",
  "album": "My Album",
  "genre": "Melody",
  "year": 2025,
  "duration": 240,
  "audioUrl": "https://your-host.com/audio/song.mp3",
  "thumbnailUrl": "https://your-host.com/images/cover.jpg",
  "description": "Tamil melody song",
  "language": "Tamil",
  "isExplicit": false
}`}
        </pre>

        {/* Action Controls for Catalog */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => onOpenAddSongModal?.()}
            className="px-5 py-2.5 rounded-full bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 text-white font-bold text-xs inline-flex items-center gap-2 shadow-[0_0_16px_var(--accent-glow)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Song to Catalog</span>
          </button>

          <button
            onClick={handleExportMusicJson}
            className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download music.json</span>
          </button>

          <button
            onClick={handleCopyMusicJson}
            className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
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
          <p className="text-xs text-gray-400">
            Paste any direct HTTPS audio URL to verify that it supports progressive seeking and can be streamed by web browsers.
          </p>

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
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all flex-shrink-0"
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

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
            <span>Sample URLs:</span>
            <button
              onClick={() => {
                setTestUrlInput('https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.mp3');
                setTestResult(null);
              }}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
            >
              Google Storage MP3
            </button>
            <button
              onClick={() => {
                setTestUrlInput('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
                setTestResult(null);
              }}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
            >
              SoundHelix MP3
            </button>
            {allTracks[0]?.audioUrl && (
              <button
                onClick={() => {
                  setTestUrlInput(allTracks[0].audioUrl);
                  setTestResult(null);
                }}
                className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
              >
                First Catalog Song URL
              </button>
            )}
          </div>

          {/* Diagnostic Result Card */}
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

              {testResult.success && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-500/20 text-[11px] font-mono">
                  <div>
                    <span className="text-gray-400 block">HTTP Status:</span>
                    <span className="text-white font-bold">{testResult.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Byte-Ranges (206):</span>
                    <span className={testResult.byteRangeSupport ? 'text-emerald-300' : 'text-amber-300'}>
                      {testResult.byteRangeSupport ? 'Supported' : 'Not Detected'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Content-Type:</span>
                    <span className="text-white truncate block">{testResult.contentType || 'audio/mpeg'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">CORS Headers:</span>
                    <span className="text-emerald-300">Accepted</span>
                  </div>
                </div>
              )}
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
                className={`p-4 rounded-2xl border text-left transition-all ${
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

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5">
            <div>
              <p className="text-sm font-semibold text-white">Preload Strategy</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Set to <code className="text-sky-300 font-mono">metadata</code> for fast responsiveness without downloading entire files upfront
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-white/10 text-xs font-mono text-gray-300">
              metadata (progressive)
            </span>
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
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center text-center gap-2 transition-colors"
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
            className="p-4 rounded-2xl bg-white/5 hover:bg-rose-500/15 border border-white/10 flex flex-col items-center text-center gap-2 transition-colors"
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
        <p>WaveMusic • High Fidelity Manual Audio Streaming</p>
        <p className="font-mono text-[11px] text-gray-600">
          React 19 • Vite • Tailwind CSS • HTML5 Web Audio API
        </p>
      </footer>
    </div>
  );
};
