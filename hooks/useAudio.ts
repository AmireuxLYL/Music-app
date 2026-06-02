'use client';

import { useAudioContext } from '@/components/player/AudioProvider';

export function useAudio() {
  return useAudioContext();
}
