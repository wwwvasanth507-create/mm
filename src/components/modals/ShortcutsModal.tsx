import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause audio' },
    { key: '→', desc: 'Seek forward 5 seconds (Shift + → for 15s)' },
    { key: '←', desc: 'Seek backward 5 seconds (Shift + ← for 15s)' },
    { key: '↑', desc: 'Volume up 5%' },
    { key: '↓', desc: 'Volume down 5%' },
    { key: 'M', desc: 'Mute / Unmute' },
    { key: 'N', desc: 'Next track' },
    { key: 'P', desc: 'Previous track (or restart current)' },
    { key: 'S', desc: 'Toggle shuffle' },
    { key: 'R', desc: 'Cycle repeat (Off → All → One)' },
    { key: 'L', desc: 'Toggle like / favorite current track' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#161620] border border-white/10 rounded-2xl shadow-2xl p-6 text-white animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)]">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Keyboard Shortcuts</h3>
            <p className="text-xs text-gray-400">Control playback instantly without your mouse</p>
          </div>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-xs"
            >
              <span className="text-gray-300">{item.desc}</span>
              <kbd className="px-2 py-1 rounded bg-black/50 border border-white/20 font-mono text-[11px] font-semibold text-white shadow-sm">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-white/10 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
