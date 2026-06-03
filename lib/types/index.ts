export type SongType = 'original' | 'instrumental' | 'pure_music' | 'cover';
export type Platform = 'youtube' | 'soundcloud' | 'jamendo' | 'other';
export type Quality = '128' | '320' | 'flac';
export type InteractionAction = 'like' | 'skip' | 'share' | 'download' | 'complete';

export interface Source {
  platform: Platform;
  streamUrl: string;
  downloadUrl: string;
  quality: Quality;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  type: SongType;
  duration: number;
  sources: Source[];
  tags: string[];
  popularity: number;
  /** Display label for the audio source, e.g. "完整", "试听30s" */
  sourceLabel?: string;
}

export interface DownloadItem {
  songId: string;
  songInfo: Song;
  blob: Blob;
  quality: Quality;
  downloadedAt: number;
}

export interface HistoryItem {
  songId: string;
  playedAt: number;
  progress: number;
}

export interface Interaction {
  songId: string;
  action: InteractionAction;
  timestamp: number;
}

export interface UserLibrary {
  favorites: string[];
  downloads: DownloadItem[];
  history: HistoryItem[];
  interactions: Interaction[];
}

export interface SearchResponse {
  results: Song[];
  total: number;
  page: number;
}

export interface RecommendResponse {
  songs: Song[];
  cursor: string | null;
}
