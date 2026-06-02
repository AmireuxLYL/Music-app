import { Howl } from 'howler';

let currentHowl: Howl | null = null;
let currentSongId: string | null = null;
let preloadCache: Map<string, Howl> = new Map();

export interface PlayOptions {
  src: string;
  songId: string;
  volume?: number;
  onEnd?: () => void;
  onLoad?: () => void;
  onPlay?: () => void;
}

export function play(options: PlayOptions): Howl {
  if (currentHowl) {
    currentHowl.stop();
    currentHowl.unload();
  }

  const howl = new Howl({
    src: [options.src],
    html5: true,
    volume: options.volume ?? 0.7,
    onend: options.onEnd,
    onload: options.onLoad,
    onplay: options.onPlay,
  });

  howl.play();
  currentHowl = howl;
  currentSongId = options.songId;

  return howl;
}

export function pause(): void {
  currentHowl?.pause();
}

export function resume(): void {
  currentHowl?.play();
}

export function stop(): void {
  currentHowl?.stop();
  currentHowl?.unload();
  currentHowl = null;
  currentSongId = null;
}

export function seek(position: number): void {
  currentHowl?.seek(position);
}

export function getCurrentTime(): number {
  return (currentHowl?.seek() as number) ?? 0;
}

export function getDuration(): number {
  return currentHowl?.duration() ?? 0;
}

export function isPlaying(): boolean {
  return currentHowl?.playing() ?? false;
}

export function getCurrentSongId(): string | null {
  return currentSongId;
}

export function setVolume(volume: number): void {
  currentHowl?.volume(volume);
}

export function preload(songId: string, src: string): void {
  if (preloadCache.has(songId)) return;
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

export function getPreloadCacheSize(): number {
  return preloadCache.size;
}
