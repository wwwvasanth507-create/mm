import React from 'react';

interface AmbientAudioGlowProps {
  className?: string;
  intensity?: 'subtle' | 'full';
}

export const AmbientAudioGlow: React.FC<AmbientAudioGlowProps> = () => {
  // Ambient lighting completely disabled per user preference
  return null;
};
