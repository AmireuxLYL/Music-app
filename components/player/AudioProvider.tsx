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
  queue: Song[];
  queueIndex: number;
  play: (song: Song, platform?: string) => void;
  playAll: (songs: Song[], startIndex?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  prev: () => void;
  next: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  volumeUp: () => void;
  volumeDown: () => void;
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
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const progressRef = useRef<number | null>(null);
  const queueRef = useRef<{ songs: Song[]; index: number }>({ songs: [], index: -1 });

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

  const stopProgress = useCallback(() => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  }, []);

  const playSong = useCallback((song: Song, platform?: string) => {
    const directUrl = song.sources?.[0]?.streamUrl;
    const isDirect = directUrl && (directUrl.startsWith('http://') || directUrl.startsWith('https://'));
    const url = isDirect && !song.id.startsWith('itunes-')
      ? directUrl
      : getStreamUrl(song, platform);

    stopProgress();
    audio.stop();
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
        // Auto-play next
        const q = queueRef.current;
        if (q.index < q.songs.length - 1) {
          const nextIdx = q.index + 1;
          queueRef.current.index = nextIdx;
          setQueueIndex(nextIdx);
          playSong(q.songs[nextIdx]);
        }
      },
    });
    setState((prev) => ({ ...prev, currentSong: song }));
  }, [state.volume, startProgress, stopProgress]);

  const play = useCallback((song: Song, platform?: string) => {
    setQueue([song]);
    setQueueIndex(0);
    queueRef.current = { songs: [song], index: 0 };
    playSong(song, platform);
  }, [playSong]);

  const playAll = useCallback((songs: Song[], startIndex: number = 0) => {
    if (songs.length === 0) return;
    setQueue(songs);
    setQueueIndex(startIndex);
    queueRef.current = { songs, index: startIndex };
    playSong(songs[startIndex]);
  }, [playSong]);

  const pause = useCallback(() => {
    audio.pause();
    setState((prev) => ({ ...prev, isPlaying: false }));
    stopProgress();
  }, [stopProgress]);

  const resume = useCallback(() => {
    audio.resume();
    setState((prev) => ({ ...prev, isPlaying: true }));
    startProgress();
  }, [startProgress]);

  const stop = useCallback(() => {
    audio.stop();
    setState((prev) => ({ ...prev, isPlaying: false, currentSong: null, currentTime: 0 }));
    stopProgress();
  }, [stopProgress]);

  const prev = useCallback(() => {
    const q = queueRef.current;
    if (q.songs.length === 0) return;
    const newIdx = q.index > 0 ? q.index - 1 : q.songs.length - 1;
    queueRef.current.index = newIdx;
    setQueueIndex(newIdx);
    playSong(q.songs[newIdx]);
  }, [playSong]);

  const next = useCallback(() => {
    const q = queueRef.current;
    if (q.songs.length === 0) return;
    const newIdx = q.index < q.songs.length - 1 ? q.index + 1 : 0;
    queueRef.current.index = newIdx;
    setQueueIndex(newIdx);
    playSong(q.songs[newIdx]);
  }, [playSong]);

  const seek = useCallback((time: number) => {
    audio.seek(time);
    setState((prev) => ({ ...prev, currentTime: time }));
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    audio.setVolume(clamped);
    setState((prev) => ({ ...prev, volume: clamped }));
  }, []);

  const volumeUp = useCallback(() => setVolume(state.volume + 0.1), [state.volume, setVolume]);
  const volumeDown = useCallback(() => setVolume(state.volume - 0.1), [state.volume, setVolume]);

  return (
    <AudioContext.Provider value={{
      ...state, queue, queueIndex,
      play, playAll, pause, resume, stop, prev, next, seek, setVolume, volumeUp, volumeDown,
    }}>
      {children}
    </AudioContext.Provider>
  );
}
