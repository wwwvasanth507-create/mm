import React, { useState, useEffect } from 'react';
import { X, Smartphone, Download, Check, Sparkles, ShieldCheck } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
}

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      } finally {
        setInstalling(false);
        deferredPrompt = null;
      }
    } else {
      // Trigger prompt hint or direct download
      alert(
        'To install WaveMusic on Android Chrome:\n\n1. Tap the 3 dots (⋮) in Chrome at top right.\n2. Tap "Install app" or "Add to Home screen".\n3. Open WaveMusic from your home screen for the native Spotify/Apple Music lock screen player!'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0f0f15] border border-white/15 p-6 shadow-2xl text-white overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-purple-600/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-[var(--accent-primary)]/25 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--accent-primary)] to-purple-600 flex items-center justify-center shadow-lg">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-tight">
                Native App Experience
              </h3>
              <p className="text-xs text-gray-400">Like Spotify & Apple Music</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-4 relative z-10 text-xs">
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-start gap-3">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <p className="font-bold text-sm">WaveMusic is Already Installed!</p>
                <p className="text-[11px] text-emerald-200/80 mt-1">
                  Open WaveMusic from your home screen app icon to see the WaveMusic logo on your lock screen instead of Chrome.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/25 space-y-2">
                <p className="font-bold text-purple-300 flex items-center gap-1.5 text-sm">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Remove Chrome Badge on Lock Screen
                </p>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  When playing inside Chrome browser tabs, Android shows the Chrome logo. Installing WaveMusic replaces Chrome with the official <strong>WaveMusic App Logo</strong> on your lock screen & notification shade, exactly like Apple Music and Spotify!
                </p>
              </div>

              <div className="space-y-2 text-gray-300">
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>24/7 Unlimited Background Audio (Zero Sleep Timeouts)</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Full-Screen Immersive Player without URL bar</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                  <ShieldCheck className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>Custom App Icon & Native Lock Screen Controls</span>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2.5">
            {!isInstalled && (
              <button
                onClick={handleInstallClick}
                disabled={installing}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[var(--accent-primary)] via-purple-600 to-cyan-500 hover:opacity-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(168,85,247,0.4)] active:scale-95 transition-all"
              >
                <Smartphone className="w-4 h-4" />
                <span>{installing ? 'Installing...' : 'Install WaveMusic App'}</span>
              </button>
            )}

            <a
              href="/WaveMusic.apk"
              download="WaveMusic.apk"
              className="w-full py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-gray-200 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span>Download Direct Android APK</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
