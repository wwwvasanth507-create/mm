import React, { useState, useEffect } from 'react';
import { X, Music, Check, Copy, RefreshCw, AlertCircle, Sparkles, Trash2 } from 'lucide-react';
import { Track } from '@/types/music';
import { saveUserTrack, deleteUserTrack, testAudioUrl, isDirectVideoUrl } from '@/services/musicService';

interface AddSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackAdded?: (track: Track) => void;
  trackToEdit?: Track | null;
}

export const AddSongModal: React.FC<AddSongModalProps> = ({
  isOpen,
  onClose,
  onTrackAdded,
  trackToEdit,
}) => {
  const isEditing = Boolean(trackToEdit);

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

  // Pre-fill fields when editing
  useEffect(() => {
    if (trackToEdit) {
      setTitle(trackToEdit.title || '');
      setArtist(trackToEdit.artist || '');
      setAlbum(trackToEdit.album || '');
      setGenre(trackToEdit.genre || 'Melody');
      setLanguage(trackToEdit.language || 'Tamil');
      setAudioUrl(trackToEdit.audioUrl || '');
      setVideoUrl(trackToEdit.videoUrl || '');
      setThumbnailUrl(trackToEdit.thumbnailUrl || trackToEdit.artworkUrl || '');
      setDuration(trackToEdit.duration || 180);
    } else {
      setTitle('');
      setArtist('');
      setAlbum('');
      setGenre('Melody');
      setLanguage('Tamil');
      setAudioUrl('');
      setVideoUrl('');
      setThumbnailUrl('');
      setDuration(180);
    }
    setTestResult(null);
    setErrorMsg('');
  }, [trackToEdit, isOpen]);

  if (!isOpen) return null;

  const handleTestAudio = async () => {
    if (!audioUrl.trim()) {
      setErrorMsg('Please enter an audio stream URL first.');
      return;
    }
    setErrorMsg('');
    setIsTestingUrl(true);
    setTestResult(null);

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
          ? `Audio verified! ${
              detectedDuration > 0
                ? `Duration: ${Math.floor(detectedDuration / 60)}:${String(
                    detectedDuration % 60
                  ).padStart(2, '0')}`
                : 'Ready to stream.'
            }`
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
      if (
        vLower.includes('youtube.com') ||
        vLower.includes('youtu.be') ||
        vLower.includes('vimeo.com')
      ) {
        setErrorMsg(
          'YouTube & Vimeo links are not supported. Only direct video stream URLs (e.g. Cloudflare R2, MP4, WebM) are allowed.'
        );
        return;
      }
      if (!isDirectVideoUrl(videoUrl.trim())) {
        setErrorMsg(
          'Invalid direct video URL. Please provide a direct HTTPS video link (e.g. .mp4, .webm, or Cloudflare stream).'
        );
        return;
      }
    }

    const cleanVideoUrl = isDirectVideoUrl(videoUrl.trim()) ? videoUrl.trim() : undefined;

    const trackId = isEditing && trackToEdit ? trackToEdit.id : `song-${Date.now()}`;

    const updatedTrack: Track = {
      ...(trackToEdit || {}),
      id: trackId,
      title: title.trim(),
      artist: artist.trim(),
      album: album.trim() || 'Singles',
      genre: genre.trim() || 'Melody',
      year: trackToEdit?.year || new Date().getFullYear(),
      duration: Number(duration) || 180,
      audioUrl: audioUrl.trim(),
      videoUrl: cleanVideoUrl,
      hasVideo: Boolean(cleanVideoUrl),
      thumbnailUrl: thumbnailUrl.trim() || '',
      artworkUrl: thumbnailUrl.trim() || '',
      language: language.trim() || 'Tamil',
      isExplicit: trackToEdit?.isExplicit || false,
    };

    saveUserTrack(updatedTrack);
    if (onTrackAdded) {
      onTrackAdded(updatedTrack);
    }

    onClose();
  };

  const handleDelete = () => {
    if (!trackToEdit) return;
    if (window.confirm(`Are you sure you want to remove "${trackToEdit.title}"?`)) {
      deleteUserTrack(trackToEdit.id);
      onClose();
    }
  };

  const handleCopyJson = () => {
    const cleanVideoUrl = isDirectVideoUrl(videoUrl.trim()) ? videoUrl.trim() : undefined;
    const jsonSnippet = JSON.stringify(
      {
        id: isEditing && trackToEdit ? trackToEdit.id : `song-${Date.now()}`,
        title: title.trim() || 'Your Song Title',
        artist: artist.trim() || 'Artist Name',
        album: album.trim() || 'Album Name',
        genre: genre || 'Melody',
        year: trackToEdit?.year || new Date().getFullYear(),
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
              <h3 className="font-bold text-base text-white">
                {isEditing ? 'Edit Song Metadata' : 'Add Song to Library'}
              </h3>
              <p className="text-xs text-gray-400">
                {isEditing
                  ? 'Update track details and direct audio URL'
                  : 'Add direct audio URL to stream instantly'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title & Artist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 font-medium mb-1.5">
                Song Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Enna Sona"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-[var(--accent-primary)] outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 font-medium mb-1.5">
                Artist / Singer <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. A.R. Rahman"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-[var(--accent-primary)] outline-none"
              />
            </div>
          </div>

          {/* Album, Genre, Language */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-400 font-medium mb-1.5">Album / Movie</label>
              <input
                type="text"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder="Album name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-[var(--accent-primary)] outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 font-medium mb-1.5">Genre</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. Melody, Pop"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-[var(--accent-primary)] outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 font-medium mb-1.5">Language</label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. Tamil"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-[var(--accent-primary)] outline-none"
              />
            </div>
          </div>

          {/* Audio Stream URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-gray-400 font-medium">
                Direct Audio Stream URL <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleTestAudio}
                disabled={isTestingUrl || !audioUrl.trim()}
                className="text-[11px] font-semibold text-[var(--accent-primary)] hover:underline flex items-center gap-1 disabled:opacity-50"
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
              placeholder="https://example.com/stream.mp3"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 font-mono focus:border-[var(--accent-primary)] outline-none"
            />
          </div>

          {/* Test Feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-200'
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Thumbnail / Cover Art URL */}
          <div>
            <label className="block text-gray-400 font-medium mb-1.5">
              Album Artwork URL (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 font-mono focus:border-[var(--accent-primary)] outline-none"
              />
              {thumbnailUrl && (
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-black/40">
                  <img
                    src={thumbnailUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Direct Video URL (Optional) */}
          <div>
            <label className="block text-gray-400 font-medium mb-1.5">
              Direct Video Stream URL (Optional, .mp4 / .webm / Cloudflare R2)
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://example.com/video.mp4"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 font-mono focus:border-[var(--accent-primary)] outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyJson}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied JSON!' : 'Copy JSON'}</span>
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 text-white font-bold transition-all shadow-[0_0_16px_var(--accent-glow)]"
              >
                {isEditing ? 'Save Changes' : 'Add Song'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};