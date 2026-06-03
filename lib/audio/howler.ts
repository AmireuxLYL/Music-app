import { Howl } from 'howler';
import { synthPlay, synthSetVolume } from './synth';

let currentHowl: Howl | null = null;
let currentSynth: ReturnType<typeof synthPlay> | null = null;
let currentSongId: string | null = null;
let preloadCache: Map<string, Howl> = new Map();
let isUsingSynth = false;
let currentVolume = 0.7;
let onEndCallback: (() => void) | null = null;
let onLoadCallback: (() => void) | null = null;

export interface PlayOptions {
  src: string;
  songId: string;
  duration?: number;
  volume?: number;
  onEnd?: () => void;
  onLoad?: () => void;
  onPlay?: () => void;
}

export function play(options: PlayOptions): void {
  stop();

  currentVolume = options.volume ?? 0.7;
  onEndCallback = options.onEnd || null;
  onLoadCallback = options.onLoad || null;

  const url = options.src;
  const isRealUrl = url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:'));

  if (isRealUrl) {
    try {
      // Determine format: force mp3 for Chinese CDN URLs that lack extension
      const ext = url.includes('.m4a') ? 'm4a' :
                  url.includes('.flac') ? 'flac' :
                  url.includes('.mp3') ? 'mp3' :
                  'mp3'; // default for generic CDN URLs

      const howl = new Howl({
        src: [url],
        format: [ext],
        html5: true,
        volume: currentVolume,
        preload: 'metadata',
        onend: () => {
          isUsingSynth = false;
          onEndCallback?.();
        },
        onload: () => {
          isUsingSynth = false;
          onLoadCallback?.();
        },
        onplayerror: (_id, err) => {
          // Browser blocked autoplay or CORS issue — retry with user gesture
          console.warn('Howler play error:', err);
        },
        onloaderror: (_id, err) => {
          console.warn('Howler load error for:', url, err);
          useSynthFallback(options);
        },
      });
      howl.play();
      currentHowl = howl;
      currentSynth = null;
      isUsingSynth = false;
      currentSongId = options.songId;
      return;
    } catch (err) {
      console.warn('Howler creation error:', err);
    }
  }

  // Use synth
  useSynthFallback(options);
}

function useSynthFallback(options: PlayOptions) {
  const duration = options.duration || 200;
  const synth = synthPlay(options.songId, duration, currentVolume);
  currentSynth = synth;
  currentHowl = null;
  isUsingSynth = true;
  currentSongId = options.songId;

  onLoadCallback?.();
  options.onPlay?.();

  // Schedule end callback
  setTimeout(() => {
    if (currentSynth === synth && isUsingSynth) {
      onEndCallback?.();
    }
  }, duration * 1000);
}

export function pause(): void {
  if (currentHowl) {
    currentHowl.pause();
  }
  if (currentSynth) {
    currentSynth.pause();
  }
}

export function resume(): void {
  if (currentHowl) {
    currentHowl.play();
  }
  if (currentSynth) {
    currentSynth.resume();
  }
}

export function stop(): void {
  if (currentHowl) {
    currentHowl.stop();
    currentHowl.unload();
    currentHowl = null;
  }
  if (currentSynth) {
    currentSynth.stop();
    currentSynth = null;
  }
  isUsingSynth = false;
  currentSongId = null;
}

export function seek(position: number): void {
  if (currentHowl) {
    currentHowl.seek(position);
    return;
  }
  if (currentSynth) {
    currentSynth.seek(position);
  }
}

export function getCurrentTime(): number {
  if (currentHowl) return currentHowl.seek() as number ?? 0;
  if (currentSynth) return currentSynth.getTime();
  return 0;
}

export function getDuration(): number {
  if (currentHowl) return currentHowl.duration() ?? 0;
  if (currentSynth) return currentSynth.getDuration();
  return 0;
}

export function isPlaying(): boolean {
  if (currentHowl) return currentHowl.playing() ?? false;
  if (currentSynth) return true;
  return false;
}

export function getCurrentSongId(): string | null {
  return currentSongId;
}

export function setVolume(volume: number): void {
  currentVolume = volume;
  if (currentHowl) {
    currentHowl.volume(volume);
  }
  if (currentSynth) {
    synthSetVolume(volume);
  }
}

export function preload(songId: string, src: string): void {
  if (preloadCache.has(songId)) return;
  if (!src || (!src.startsWith('http') && !src.startsWith('blob:'))) return;
  const howl = new Howl({
    src: [src],
    html5: true,
    preload: true,
    volume: 0,
  });
  preloadCache.set(songId, howl);
}

export function clearPreloadCache(): void {
  preloadCache.forEach((h) => h.unload());
  preloadCache.clear();
}
