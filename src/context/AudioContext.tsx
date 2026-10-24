import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  Track,
  Playlist,
  PlaybackHistoryItem,
  RepeatMode,
  ThemeAccent,
  AudioContextType,
  AudioPresetId,
  EqualizerSettings,
} from '@/types/music';
import {
  AUDIO_CONFIG,
  STORAGE_KEYS,
  AUDIO_PRESETS,
} from '@/config/audio';
import { audioDsp } from '@/services/audioDspService';
import {
  getAllTracks,
  resolveAudioUrl,
  resolveArtworkUrl,
  getFavourites as fetchFavourites,
  toggleFavourite as svcToggleFavourite,
  getUserPlaylists as fetchUserPlaylists,
  createUserPlaylist as svcCreateUserPlaylist,
  updateUserPlaylist as svcUpdateUserPlaylist,
  deleteUserPlaylist as svcDeleteUserPlaylist,
  addTrackToPlaylist as svcAddTrackToPlaylist,
  removeTrackFromPlaylist as svcRemoveTrackFromPlaylist,
  getPlaybackHistory as fetchHistory,
  addToPlaybackHistory as svcAddToHistory,
  clearPlaybackHistory as svcClearHistory,
} from '@/services/musicService';

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistent Audio Element Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Playback state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [playbackRate, setPlaybackRateState] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  // Dolby Atmos & Equalizer State
  const [isDolbyEnabled, setIsDolbyEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(STORAGE_KEYS.DOLBY_ENABLED);
    return saved !== null ? saved === 'true' : true;
  });

  const [audioPreset, setAudioPresetState] = useState<AudioPresetId>(() => {
    if (typeof window === 'undefined') return 'dolby-atmos';
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIO_PRESET) as AudioPresetId;
    return saved && AUDIO_PRESETS[saved] ? saved : 'dolby-atmos';
  });

  const [eqSettings, setEqSettings] = useState<EqualizerSettings>(() => {
    if (typeof window === 'undefined') return AUDIO_PRESETS['dolby-atmos'].settings;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EQ_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return AUDIO_PRESETS['dolby-atmos'].settings;
  });

  // Volume & Mute
  const [volume, setVolumeState] = useState<number>(() => {
    if (typeof window === 'undefined') return AUDIO_CONFIG.defaultVolume;
    const saved = localStorage.getItem(STORAGE_KEYS.VOLUME);
    return saved !== null ? parseFloat(saved) : AUDIO_CONFIG.defaultVolume;
  });
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.MUTED) === 'true';
  });

  // 24/7 Unlimited Non-Stop Playback (No Sleep, Infinite Loop)
  const [is24HourNonStop, setIs24HourNonStop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(STORAGE_KEYS.NON_STOP_24H);
    return saved !== null ? saved === 'true' : true;
  });

  const toggle24HourNonStop = useCallback(() => {
    setIs24HourNonStop((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.NON_STOP_24H, String(next));
      }
      return next;
    });
  }, []);

  // Playback modes (Default to 'all' so continuous looping is active by default)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(() => {
    if (typeof window === 'undefined') return 'all';
    const saved = localStorage.getItem(STORAGE_KEYS.REPEAT);
    return saved === 'one' || saved === 'all' || saved === 'off' ? saved : 'all';
  });
  const [shuffle, setShuffle] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.SHUFFLE) === 'true';
  });

  // Theme Accent
  const [activeAccent, setActiveAccentState] = useState<ThemeAccent>(() => {
    if (typeof window === 'undefined') return 'coral';
    const saved = localStorage.getItem(STORAGE_KEYS.THEME_ACCENT) as ThemeAccent;
    return saved || 'coral';
  });

  // Queue state (Load full catalog so non-stop 24/7 playback flows seamlessly through all tracks)
  const [queue, setQueue] = useState<Track[]>(() => {
    const all = getAllTracks();
    return all;
  });
  const [queueIndex, setQueueIndex] = useState<number>(0);

  // User library collections
  const [favourites, setFavourites] = useState<string[]>(() => fetchFavourites());
  const [history, setHistory] = useState<PlaybackHistoryItem[]>(() => fetchHistory());
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>(() => fetchUserPlaylists());

  // Keep audioRef volume & muted in sync with state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Synchronize Audio DSP whenever EQ settings or Dolby Atmos state change
  useEffect(() => {
    audioDsp.applySettings(eqSettings, isDolbyEnabled);
  }, [eqSettings, isDolbyEnabled]);

  // Apply theme accent CSS variables on document root
  useEffect(() => {
    const root = document.documentElement;
    if (activeAccent === 'coral') {
      root.style.setProperty('--accent-primary', '#fa2d48');
      root.style.setProperty('--accent-glow', 'rgba(250, 45, 72, 0.35)');
    } else if (activeAccent === 'purple') {
      root.style.setProperty('--accent-primary', '#a855f7');
      root.style.setProperty('--accent-glow', 'rgba(168, 85, 247, 0.35)');
    } else if (activeAccent === 'cyan') {
      root.style.setProperty('--accent-primary', '#06b6d4');
      root.style.setProperty('--accent-glow', 'rgba(6, 182, 212, 0.35)');
    } else if (activeAccent === 'amber') {
      root.style.setProperty('--accent-primary', '#f59e0b');
      root.style.setProperty('--accent-glow', 'rgba(245, 158, 11, 0.35)');
    }
    localStorage.setItem(STORAGE_KEYS.THEME_ACCENT, activeAccent);
  }, [activeAccent]);

  const nextTrackRef = useRef<() => void>(() => {});
  // Rolling memory of recently played IDs to prevent immediate song repetition
  const recentPlayedIdsRef = useRef<string[]>([]);

  // Initialize single persistent Audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    // @ts-ignore
    audio.playsInline = true;
    audio.volume = isMuted ? 0 : volume;
    audio.muted = isMuted;
    audioRef.current = audio;
    audioDsp.attach(audio);

    const onPlay = () => {
      setIsPlaying(true);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    };

    const onPause = () => {
      setIsPlaying(false);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    };

    const onEnded = () => {
      console.log('[WaveMusic] Song finished naturally, advancing to next unique track...');
      nextTrackRef.current?.();
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Update media session position
      if ('mediaSession' in navigator && audio.duration && !isNaN(audio.duration)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: audio.currentTime,
          });
        } catch {
          // Ignore unsupported browser edge cases
        }
      }
    };

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
      setIsBuffering(false);
      setError(null);
    };

    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onPlaying = () => setIsBuffering(false);

    const onError = () => {
      setIsBuffering(false);
      const mediaErr = audio.error;
      let msg = 'Failed to load audio stream.';
      if (mediaErr) {
        if (mediaErr.code === 1) msg = 'Audio playback aborted.';
        else if (mediaErr.code === 2) msg = 'Network error downloading audio.';
        else if (mediaErr.code === 3) msg = 'Audio decoding error or unsupported format.';
        else if (mediaErr.code === 4)
          msg = 'Audio source unavailable or CORS blocked. Verify that audioUrl is accessible.';
      }
      console.warn('[WaveMusic Audio Error - 24/7 Auto Recovery]', msg, audio.src);
      setError(msg);

      // 24/7 Non-Stop Auto-Recovery: Don't stop! Auto-advance to next song after 1.5 seconds!
      if (is24HourNonStop) {
        setTimeout(() => {
          console.log('[WaveMusic 24/7 Engine] Auto-recovering: advancing to next track...');
          nextTrackRef.current?.();
        }, 1500);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.src = '';
    };
  }, [is24HourNonStop]);

  // Update MediaSession Metadata when current track changes
  useEffect(() => {
    if (!currentTrack || typeof window === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }

    const artwork = resolveArtworkUrl(currentTrack);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album,
      artwork: [
        { src: artwork, sizes: '96x96', type: 'image/jpeg' },
        { src: artwork, sizes: '128x128', type: 'image/jpeg' },
        { src: artwork, sizes: '256x256', type: 'image/jpeg' },
        { src: artwork, sizes: '512x512', type: 'image/jpeg' },
      ],
    });
  }, [currentTrack]);

  // Load and play track
  const loadAndPlayTrack = useCallback(
    async (track: Track) => {
      const audio = audioRef.current;
      if (!audio) return;

      const streamUrl = resolveAudioUrl(track);
      if (!streamUrl) {
        setError(`Unable to resolve audio stream for "${track.title}". Please verify its audioUrl.`);
        return;
      }

      setError(null);
      setIsBuffering(true);
      setCurrentTime(0);
      setDuration(track.duration || 0);
      setCurrentTrack(track);

      // Register into rolling recent memory to guarantee no immediate song repetition
      recentPlayedIdsRef.current = [
        track.id,
        ...recentPlayedIdsRef.current.filter((id) => id !== track.id),
      ].slice(0, 6);

      // Record to history
      const updatedHistory = svcAddToHistory(track);
      setHistory(updatedHistory);

      // Remove crossOrigin attribute to ensure browser never blocks or silences direct playback
      audio.removeAttribute('crossOrigin');
      audio.src = streamUrl;
      audio.load();

      // Ensure volume is properly applied to audio element
      audio.volume = isMuted ? 0 : volume;
      audio.muted = isMuted;

      // Update Audio DSP state & visualization
      audioDsp.attach(audio);
      audioDsp.applySettings(eqSettings, isDolbyEnabled);

      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (errorMsg.includes('NotAllowedError')) {
          console.warn('[WaveMusic] Autoplay policy prevented playback. User interaction required.');
          setIsPlaying(false);
        } else {
          console.error('[WaveMusic Playback Error]', err);
          setError(`Playback failed: ${errorMsg}`);
          setIsPlaying(false);
        }
      } finally {
        setIsBuffering(false);
      }
    },
    [eqSettings, isDolbyEnabled]
  );

  // Next Track Logic (Strict Non-Repeating & 24/7 Unlimited Looping)
  const nextTrack = useCallback(() => {
    let currentQueue = queue;
    if (currentQueue.length === 0) {
      currentQueue = getAllTracks();
      setQueue(currentQueue);
    }
    if (currentQueue.length === 0) return;

    // Filter out the currently playing song so it CANNOT play immediately again in any mode
    const differentCandidates = currentQueue
      .map((t, idx) => ({ track: t, idx }))
      .filter(
        (item) =>
          item.track.id !== currentTrack?.id &&
          item.track.audioUrl !== currentTrack?.audioUrl
      );

    if (differentCandidates.length === 0) {
      // If queue has only 1 track total in the entire list
      const singleTrack = currentQueue[0];
      if (singleTrack) loadAndPlayTrack(singleTrack);
      return;
    }

    // Prefer candidates that were NOT recently played
    const freshCandidates = differentCandidates.filter(
      (item) => !recentPlayedIdsRef.current.includes(item.track.id)
    );
    const pool = freshCandidates.length > 0 ? freshCandidates : differentCandidates;

    let chosenItem: { track: Track; idx: number };

    if (shuffle) {
      // Pick randomly from non-repeating candidates
      const randIdx = Math.floor(Math.random() * pool.length);
      chosenItem = pool[randIdx];
    } else {
      // Sequential: find next candidate after current queueIndex
      const nextInLine = pool.find((item) => item.idx > queueIndex);
      if (nextInLine) {
        chosenItem = nextInLine;
      } else {
        // Wrap around to start of queue with distinct track
        chosenItem = pool[0];
      }
    }

    setQueueIndex(chosenItem.idx);
    loadAndPlayTrack(chosenItem.track);
  }, [queue, queueIndex, shuffle, currentTrack, loadAndPlayTrack]);

  // Keep nextTrackRef updated for auto-recovery
  useEffect(() => {
    nextTrackRef.current = nextTrack;
  }, [nextTrack]);

  // Screen Wake Lock API to prevent screen and CPU sleep during 24/7 playback
  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = useCallback(async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && is24HourNonStop) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('[WaveMusic] 24/7 Screen WakeLock acquired');
      } catch (err) {
        // Silently ignore if not supported or granted
      }
    }
  }, [is24HourNonStop]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {}
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPlaying && is24HourNonStop) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
  }, [isPlaying, is24HourNonStop, requestWakeLock, releaseWakeLock]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying && is24HourNonStop) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisChange);
    return () => document.removeEventListener('visibilitychange', handleVisChange);
    function handleVisChange() {
      handleVisibilityChange();
    }
  }, [isPlaying, is24HourNonStop, requestWakeLock]);

  // Previous Track Logic
  const previousTrack = useCallback(() => {
    if (!audioRef.current || queue.length === 0) return;

    // If track has been playing for more than 3 seconds, restart it
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = repeatMode === 'all' ? queue.length - 1 : 0;
    }

    setQueueIndex(prevIdx);
    const prevSong = queue[prevIdx];
    if (prevSong) {
      loadAndPlayTrack(prevSong);
    }
  }, [queue, queueIndex, repeatMode, loadAndPlayTrack]);

  // Audio 'ended' listener
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      nextTrack();
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [nextTrack]);

  // Setup MediaSession Action Handlers
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    const ms = navigator.mediaSession;

    ms.setActionHandler('play', () => {
      if (audioRef.current && currentTrack) {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    });

    ms.setActionHandler('pause', () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    });

    ms.setActionHandler('previoustrack', () => {
      previousTrack();
    });

    ms.setActionHandler('nexttrack', () => {
      nextTrack();
    });

    ms.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined && audioRef.current) {
        audioRef.current.currentTime = details.seekTime;
        setCurrentTime(details.seekTime);
      }
    });

    ms.setActionHandler('seekforward', (details) => {
      if (audioRef.current) {
        const offset = details.seekOffset || 10;
        audioRef.current.currentTime = Math.min(
          audioRef.current.duration || 0,
          audioRef.current.currentTime + offset
        );
      }
    });

    ms.setActionHandler('seekbackward', (details) => {
      if (audioRef.current) {
        const offset = details.seekOffset || 10;
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - offset);
      }
    });
  }, [currentTrack, nextTrack, previousTrack]);

  // Play a specific track (and optionally supply a new queue)
  const playTrack = useCallback(
    (track: Track, newQueue?: Track[]) => {
      if (newQueue && newQueue.length > 0) {
        setQueue(newQueue);
        const idx = newQueue.findIndex((t) => t.id === track.id);
        setQueueIndex(idx >= 0 ? idx : 0);
      } else {
        // If not in current queue, prepend or append
        const existingIdx = queue.findIndex((t) => t.id === track.id);
        if (existingIdx !== -1) {
          setQueueIndex(existingIdx);
        } else {
          setQueue((prev) => [track, ...prev]);
          setQueueIndex(0);
        }
      }
      loadAndPlayTrack(track);
    },
    [queue, loadAndPlayTrack]
  );

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack) {
      if (queue.length > 0) {
        playTrack(queue[0]);
      }
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.volume = isMuted ? 0 : volume;
      audio.muted = isMuted;
      audioDsp.attach(audio);
      audioDsp.applySettings(eqSettings, isDolbyEnabled);
      audio.play().catch((err) => {
        console.error('Play failed:', err);
      });
      setIsPlaying(true);
    }
  }, [currentTrack, isPlaying, queue, playTrack, isMuted, volume, eqSettings, isDolbyEnabled]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.muted = isMuted;
      audioDsp.attach(audioRef.current);
      audioDsp.applySettings(eqSettings, isDolbyEnabled);
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [currentTrack, isMuted, volume, eqSettings, isDolbyEnabled]);

  // Dolby Atmos & Equalizer Control Handlers
  const setAudioPreset = useCallback(
    (preset: AudioPresetId) => {
      setAudioPresetState(preset);
      localStorage.setItem(STORAGE_KEYS.AUDIO_PRESET, preset);
      if (AUDIO_PRESETS[preset]) {
        const newSettings = { ...AUDIO_PRESETS[preset].settings };
        setEqSettings(newSettings);
        localStorage.setItem(STORAGE_KEYS.EQ_SETTINGS, JSON.stringify(newSettings));
        audioDsp.applySettings(newSettings, isDolbyEnabled);
      }
    },
    [isDolbyEnabled]
  );

  const toggleDolby = useCallback(() => {
    setIsDolbyEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEYS.DOLBY_ENABLED, String(next));
      audioDsp.applySettings(eqSettings, next);
      return next;
    });
  }, [eqSettings]);

  const setEqBand = useCallback(
    (band: keyof EqualizerSettings, value: number) => {
      setAudioPresetState('custom');
      localStorage.setItem(STORAGE_KEYS.AUDIO_PRESET, 'custom');
      setEqSettings((prev) => {
        const next = { ...prev, [band]: value };
        localStorage.setItem(STORAGE_KEYS.EQ_SETTINGS, JSON.stringify(next));
        audioDsp.applySettings(next, isDolbyEnabled);
        return next;
      });
    },
    [isDolbyEnabled]
  );

  const resetEq = useCallback(() => {
    setAudioPreset('dolby-atmos');
  }, [setAudioPreset]);

  const getFrequencyData = useCallback(() => {
    return audioDsp.getFrequencyData();
  }, []);

  // Seek to specific timestamp
  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Volume & Mute handlers
  const setVolume = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolumeState(clamped);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.VOLUME, String(clamped));
    }
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
      localStorage.setItem(STORAGE_KEYS.MUTED, 'false');
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.MUTED, String(next));
      }
      return next;
    });
  }, []);

  // Shuffle & Repeat handlers
  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.SHUFFLE, String(next));
      }
      return next;
    });
  }, []);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      let next: RepeatMode = 'off';
      if (prev === 'off') next = 'all';
      else if (prev === 'all') next = 'one';
      else next = 'off';

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.REPEAT, next);
      }
      return next;
    });
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      setPlaybackRateState(rate);
    }
  }, []);

  // Queue manipulations
  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const addNextInQueue = useCallback(
    (track: Track) => {
      setQueue((prev) => {
        const nextQ = [...prev];
        nextQ.splice(queueIndex + 1, 0, track);
        return nextQ;
      });
    },
    [queueIndex]
  );

  const removeFromQueue = useCallback(
    (index: number) => {
      setQueue((prev) => {
        const nextQ = prev.filter((_, i) => i !== index);
        if (index < queueIndex) {
          setQueueIndex((qi) => Math.max(0, qi - 1));
        } else if (index === queueIndex && nextQ.length > 0) {
          // If removing currently playing track, load the next or previous
          const newIdx = Math.min(queueIndex, nextQ.length - 1);
          setQueueIndex(newIdx);
          loadAndPlayTrack(nextQ[newIdx]);
        }
        return nextQ;
      });
    },
    [queueIndex, loadAndPlayTrack]
  );

  const clearQueue = useCallback(() => {
    setQueue(currentTrack ? [currentTrack] : []);
    setQueueIndex(0);
  }, [currentTrack]);

  const reorderQueue = useCallback((startIndex: number, endIndex: number) => {
    setQueue((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  // Favourites
  const toggleFavourite = useCallback((trackId: string) => {
    svcToggleFavourite(trackId);
    setFavourites(fetchFavourites());
  }, []);

  const isFavourite = useCallback(
    (trackId: string) => favourites.includes(trackId),
    [favourites]
  );

  // History
  const clearHistory = useCallback(() => {
    svcClearHistory();
    setHistory([]);
  }, []);

  // User Playlists
  const createPlaylist = useCallback((name: string, description?: string) => {
    const pl = svcCreateUserPlaylist(name, description);
    setUserPlaylists(fetchUserPlaylists());
    return pl;
  }, []);

  const updatePlaylist = useCallback((id: string, updates: Partial<Playlist>) => {
    svcUpdateUserPlaylist(id, updates);
    setUserPlaylists(fetchUserPlaylists());
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    svcDeleteUserPlaylist(id);
    setUserPlaylists(fetchUserPlaylists());
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, trackId: string) => {
    svcAddTrackToPlaylist(playlistId, trackId);
    setUserPlaylists(fetchUserPlaylists());
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    svcRemoveTrackFromPlaylist(playlistId, trackId);
    setUserPlaylists(fetchUserPlaylists());
  }, []);


  const setActiveAccent = useCallback((accent: ThemeAccent) => {
    setActiveAccentState(accent);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (audioRef.current) {
            const seekAmt = e.shiftKey ? 15 : 5;
            seek(Math.min(duration, audioRef.current.currentTime + seekAmt));
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (audioRef.current) {
            const seekAmt = e.shiftKey ? 15 : 5;
            seek(Math.max(0, audioRef.current.currentTime - seekAmt));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(volume + 0.05);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(volume - 0.05);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyN':
          e.preventDefault();
          nextTrack();
          break;
        case 'KeyP':
          e.preventDefault();
          previousTrack();
          break;
        case 'KeyS':
          e.preventDefault();
          toggleShuffle();
          break;
        case 'KeyR':
          e.preventDefault();
          cycleRepeatMode();
          break;
        case 'KeyL':
          if (currentTrack) {
            e.preventDefault();
            toggleFavourite(currentTrack.id);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    seek,
    duration,
    volume,
    setVolume,
    toggleMute,
    nextTrack,
    previousTrack,
    toggleShuffle,
    cycleRepeatMode,
    toggleFavourite,
    currentTrack,
  ]);

  const value: AudioContextType = {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isBuffering,
    repeatMode,
    shuffle,
    playbackRate,
    error,
    isDolbyEnabled,
    audioPreset,
    eqSettings,
    setAudioPreset,
    toggleDolby,
    setEqBand,
    resetEq,
    getFrequencyData,
    queue,
    queueIndex,
    playTrack,
    togglePlay,
    pause,
    resume,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    setPlaybackRate,
    addToQueue,
    addNextInQueue,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    favourites,
    toggleFavourite,
    isFavourite,
    history,
    clearHistory,
    userPlaylists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    activeAccent,
    setActiveAccent,
    is24HourNonStop,
    toggle24HourNonStop,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
