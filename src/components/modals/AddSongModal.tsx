import React, { useState } from 'react';
import { X, Music, Check, Copy, RefreshCw, AlertCircle, Image, Sparkles, Film } from 'lucide-react';
import { Track } from '@/types/music';
import { saveUserTrack, testAudioUrl, isDirectVideoUrl } from '@/services/musicService';

interface AddSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackAdded?: (track: Track) => void;
}

export const AddSongModal: React.FC<AddSongModalProps> = ({ isOpen, onClose, onTrackAdded }) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('Melody');
  const [language, setLanguage] = useState('Tamil');
  const [audioUrl, setAudioUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [duration, setDuration] = useState<number>(180);
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleTestAudio = async () => {
    if (!audioUrl.trim()) {
      setErrorMsg('Please enter an audio stream URL first.');
      return;
    }
    setErrorMsg('');
    setIsTestingUrl(true);
    setTestResult(null);

    // Try testing via HTML5 Audio to get real duration & confirm playability
    try {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.src = audioUrl.trim();

      const durationPromise = new Promise<number>((resolve) => {
        audio.onloadedmetadata = () => {
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            resolve(Math.round(audio.duration));
          } else {
            resolve(0);
          }
        };
        audio.onerror = () => resolve(0);
        setTimeout(() => resolve(0), 4000);
      });

      const [diag, detectedDuration] = await Promise.all([
        testAudioUrl(audioUrl.trim()),
        durationPromise,
      ]);

      if (detectedDuration > 0) {
        setDuration(detectedDuration);
      }

      setTestResult({
        success: diag.success || detectedDuration > 0,
        message: diag.success
          ? `Audio verified! ${detectedDuration > 0 ? `Duration: ${Math.floor(detectedDuration / 60)}:${String(detectedDuration % 60).padStart(2, '0')}` : 'Ready to stream.'}`
          : 'Stream test finished. Check URL format.',
      });
    } catch {
      setTestResult({
        success: false,
        message: 'Could not test audio stream. Ensure HTTPS and CORS headers are allowed.',
      });
    } finally {
      setIsTestingUrl(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim() || !audioUrl.trim()) {
      setErrorMsg('Title, Artist, and Audio URL are required.');
      return;
    }

    if (videoUrl.trim()) {
      const vLower = videoUrl.trim().toLowerCase();
      if (vLower.includes('youtube.com') || vLower.includes('youtu.be') || vLower.includes('vimeo.com')) {
        setErrorMsg('YouTube & Vimeo links are not supported. Only direct video stream URLs (e.g. Cloudflare R2, MP4, WebM) are allowed.');
        return;
      }
      if (!isDirectVideoUrl(videoUrl.trim())) {
        setErrorMsg('Invalid direct video URL. Please provide a direct HTTPS video link (e.g. .mp4, .webm, or Cloudflare stream).');
        return;
      }
    }

    const cleanVideoUrl = isDirectVideoUrl(videoUrl.trim()) ? videoUrl.trim() : undefined;

    const newTrack: Track = {
      id: `song-${Date.now()}`,
      title: title.trim(),
      artist: artist.trim(),
      album: album.trim() || 'Singles',
      genre: genre.trim() || 'Melody',
      year: new Date().getFullYear(),
      duration: Number(duration) || 180,
      audioUrl: audioUrl.trim(),
      videoUrl: cleanVideoUrl,
      hasVideo: Boolean(cleanVideoUrl),
      thumbnailUrl: thumbnailUrl.trim() || '',
      artworkUrl: thumbnailUrl.trim() || '',
      language: language.trim() || 'Tamil',
      isExplicit: false,
    };

    saveUserTrack(newTrack);
    if (onTrackAdded) {
      onTrackAdded(newTrack);
    }

    // Reset and close
    setTitle('');
    setArtist('');
    setAlbum('');
    setAudioUrl('');
    setVideoUrl('');
    setThumbnailUrl('');
    setTestResult(null);
    setErrorMsg('');
    onClose();
  };

  const handleCopyJson = () => {
    const cleanVideoUrl = isDirectVideoUrl(videoUrl.trim()) ? videoUrl.trim() : undefined;
    const jsonSnippet = JSON.stringify(
      {
        id: `song-${Date.now()}`,
        title: title.trim() || 'Your Song Title',
        artist: artist.trim() || 'Artist Name',
        album: album.trim() || 'Album Name',
        genre: genre || 'Melody',
        year: new Date().getFullYear(),
        duration: Number(duration) || 240,
        audioUrl: audioUrl.trim() || 'https://example.com/song.mp3',
        ...(cleanVideoUrl ? { videoUrl: cleanVideoUrl, hasVideo: true } : {}),
        thumbnailUrl: thumbnailUrl.trim() || 'https://example.com/cover.jpg',
        language: language || 'Tamil',
        isExplicit: false,
      },
      null,
      2
    );

    navigator.clipboard.writeText(jsonSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#14141c] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 sm:p-7 text-white max-h-[92vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 flex items-center justify-center text-[var(--accent-primary)]">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Add Song Manually</h3>
              <p className="text-xs text-gray-400">Stream directly from any audio URL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Song Title & Artist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Song Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Kanmani Anbodu"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[var(--accent-primary)] outline-none text-xs sm:text-sm text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Artist / Singer *
              </label>
              <input
                type="text"
                required
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. S.P. Balasubrahmanyam"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[var(--accent-primary)] outline-none text-xs sm:text-sm text-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* Audio Stream URL & Test Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-300">
                Direct Audio Stream URL *
              </label>
              <button
                type="button"
                onClick={handleTestAudio}
                disabled={isTestingUrl || !audioUrl.trim()}
                className="text-[11px] text-[var(--accent-primary)] hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                {isTestingUrl ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>Test & Detect Duration</span>
              </button>
            </div>
            <input
              type="url"
              required
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              placeholder="https://example.com/audio/song.mp3"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[var(--accent-primary)] outline-none text-xs font-mono text-white placeholder-gray-500"
            />
            {testResult && (
              <p
                className={`text-[11px] mt-1.5 flex items-center gap-1 font-mono ${
                  testResult.success ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {testResult.success ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {testResult.message}
              </p>
            )}
          </div>

          {/* Direct Video Stream URL (Cloudflare R2 / MP4 - Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-rose-500" />
                <span>Direct Video URL (Cloudflare R2 / MP4 - Optional)</span>
              </label>
              <span className="text-[10px] text-gray-400">Direct media files only (No YouTube)</span>
            </div>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://pub-xxxxxx.r2.dev/videos/song.mp4"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-rose-500 outline-none text-xs font-mono text-white placeholder-gray-500"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Plays in native video player. Only direct video links are supported (Cloudflare R2, MP4, WebM). YouTube is disallowed.
            </p>
          </div>

          {/* Album & Genre */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Album / Movie
              </label>
              <input
                type="text"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder="e.g. Gunaa (or Singles)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[var(--accent-primary)] outline-none text-xs sm:text-sm text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Genre
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. Melody, Classical"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[var(--accent-primary)] outline-none text-xs sm:text-sm text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Language
              </label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. Tamil"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[var(--accent-primary)] outline-none text-xs sm:text-sm text-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* Cover Artwork URL & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Cover Image URL (Optional)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[var(--accent-primary)] outline-none text-xs text-white placeholder-gray-500"
                />
                <Image className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Duration (seconds)
              </label>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                placeholder="240"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[var(--accent-primary)] outline-none text-xs sm:text-sm text-white font-mono"
              />
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCopyJson}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors font-medium"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied JSON!' : 'Copy JSON for music.json'}</span>
            </button>

            <div className="w-full sm:w-auto flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 text-white font-bold text-xs shadow-lg transition-all"
              >
                Add Song
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
