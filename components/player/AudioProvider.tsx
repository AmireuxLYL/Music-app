'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { Song } from '@/lib/types';
import * as audio from '@/lib/audio/howler';
import { addHistory, recordInteraction } from '@/lib/db/indexeddb';
import { getStreamUrl } from '@/lib/api/client';

interface AudioState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

interface AudioContextType extends AudioState {
  play: (song: Song, platform?: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function useAudioContext() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudioContext must be used within AudioProvider');
  return ctx;
}

export default function AudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AudioState>({
    currentSong: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
  });
  const progressRef = useRef<number | null>(null);

  const startProgress = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = window.setInterval(() => {
      setState((prev) => ({
        ...prev,
        currentTime: audio.getCurrentTime(),
        duration: audio.getDuration() || prev.duration,
      }));
    }, 250);
  }, []);

  const play = useCallback((song: Song, platform?: string) => {
    // Use direct URL from song sources if available (e.g. iTunes preview), otherwise proxy
    const directUrl = song.sources?.[0]?.streamUrl;
    const url = (directUrl && directUrl.startsWith('http'))
      ? directUrl
      : getStreamUrl(song.id, platform);
    audio.play({
      src: url,
      songId: song.id,
      duration: song.duration,
      volume: state.volume,
      onLoad: () => {
        setState((prev) => ({
          ...prev,
          currentSong: song,
          duration: audio.getDuration() || song.duration,
          isPlaying: true,
        }));
        startProgress();
      },
      onEnd: () => {
        setState((prev) => ({ ...prev, isPlaying: false }));
        addHistory(song.id, 0);
        recordInteraction(song.id, 'complete');
      },
    });
    setState((prev) => ({ ...prev, currentSong: song }));
  }, [state.volume, startProgress]);

  const pause = useCallback(() => {
    audio.pause();
    setState((prev) => ({ ...prev, isPlaying: false }));
    if (progressRef.current) clearInterval(progressRef.current);
  }, []);

  const resume = useCallback(() => {
    audio.resume();
    setState((prev) => ({ ...prev, isPlaying: true }));
    startProgress();
  }, [startProgress]);

  const stop = useCallback(() => {
    audio.stop();
    setState((prev) => ({ ...prev, isPlaying: false, currentSong: null, currentTime: 0 }));
    if (progressRef.current) clearInterval(progressRef.current);
  }, []);

  const seek = useCallback((time: number) => {
    audio.seek(time);
    setState((prev) => ({ ...prev, currentTime: time }));
  }, []);

  const setVolume = useCallback((v: number) => {
    audio.setVolume(v);
    setState((prev) => ({ ...prev, volume: v }));
  }, []);

  return (
    <AudioContext.Provider value={{ ...state, play, pause, resume, stop, seek, setVolume }}>
      {children}
    </AudioContext.Provider>
  );
}
