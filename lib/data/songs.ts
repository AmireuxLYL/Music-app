import type { Song } from '@/lib/types';

export const ALL_SONGS: Song[] = [
  { id: '1', title: 'Blinding Lights', artist: 'The Weeknd', coverUrl: '', type: 'original', duration: 200, sources: [{ platform: 'soundcloud', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['pop', 'synthwave', '2019'], popularity: 95 },
  { id: '2', title: '晴天', artist: '周杰伦', coverUrl: '', type: 'original', duration: 269, sources: [{ platform: 'jamendo', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['pop', 'mandopop', 'classic'], popularity: 98 },
  { id: '3', title: 'Shape of You', artist: 'Ed Sheeran', coverUrl: '', type: 'original', duration: 234, sources: [{ platform: 'soundcloud', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['pop', 'dance'], popularity: 90 },
  { id: '4', title: '起风了', artist: '买辣椒也用券', coverUrl: '', type: 'original', duration: 312, sources: [{ platform: 'jamendo', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['pop', 'mandopop', 'ballad'], popularity: 88 },
  { id: '5', title: 'Dance Monkey', artist: 'Tones and I', coverUrl: '', type: 'original', duration: 210, sources: [{ platform: 'soundcloud', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['pop', 'indie'], popularity: 85 },
  { id: '6', title: '告白气球', artist: '周杰伦', coverUrl: '', type: 'original', duration: 203, sources: [{ platform: 'jamendo', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['pop', 'mandopop', 'love'], popularity: 92 },
  { id: '7', title: 'Bad Guy', artist: 'Billie Eilish', coverUrl: '', type: 'original', duration: 194, sources: [{ platform: 'soundcloud', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['pop', 'dark pop'], popularity: 87 },
  { id: '8', title: '孤勇者', artist: '陈奕迅', coverUrl: '', type: 'original', duration: 227, sources: [{ platform: 'jamendo', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['pop', 'mandopop', 'motivational'], popularity: 96 },
  { id: '9', title: 'Stay', artist: 'The Kid LAROI & Justin Bieber', coverUrl: '', type: 'original', duration: 142, sources: [{ platform: 'soundcloud', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['pop', 'synthpop'], popularity: 91 },
  { id: '10', title: '夜曲', artist: '周杰伦', coverUrl: '', type: 'original', duration: 226, sources: [{ platform: 'jamendo', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['pop', 'mandopop', 'classic'], popularity: 94 },
  { id: '11', title: '晴天 (伴奏)', artist: 'Various Artists', coverUrl: '', type: 'instrumental', duration: 269, sources: [{ platform: 'jamendo', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['instrumental', 'mandopop'], popularity: 75 },
  { id: '12', title: '晴天 (钢琴版)', artist: 'Piano Cover', coverUrl: '', type: 'pure_music', duration: 280, sources: [{ platform: 'jamendo', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['piano', 'cover'], popularity: 60 },
  { id: '13', title: 'Blinding Lights (Instrumental)', artist: 'Karaoke Version', coverUrl: '', type: 'instrumental', duration: 200, sources: [{ platform: 'soundcloud', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['instrumental', 'karaoke'], popularity: 55 },
  { id: '14', title: '起风了 (伴奏)', artist: 'Various Artists', coverUrl: '', type: 'instrumental', duration: 312, sources: [{ platform: 'jamendo', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['instrumental', 'ballad'], popularity: 65 },
  { id: '15', title: '夜曲 (伴奏)', artist: 'Various Artists', coverUrl: '', type: 'instrumental', duration: 226, sources: [{ platform: 'jamendo', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['instrumental', 'classic'], popularity: 50 },
  { id: '16', title: '告白气球 (纯音乐)', artist: 'Piano Cover', coverUrl: '', type: 'pure_music', duration: 210, sources: [{ platform: 'jamendo', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['piano', 'love'], popularity: 45 },
  { id: '17', title: '孤勇者 (伴奏)', artist: 'Various Artists', coverUrl: '', type: 'instrumental', duration: 227, sources: [{ platform: 'jamendo', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['instrumental', 'motivational'], popularity: 58 },
  { id: '18', title: 'Stay (Instrumental)', artist: 'Karaoke Version', coverUrl: '', type: 'instrumental', duration: 142, sources: [{ platform: 'soundcloud', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['instrumental', 'karaoke'], popularity: 40 },
  { id: '19', title: 'Bad Guy (Cover)', artist: 'Cover Artist', coverUrl: '', type: 'cover', duration: 198, sources: [{ platform: 'soundcloud', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['cover', 'dark pop'], popularity: 35 },
  { id: '20', title: 'Dance Monkey (伴奏)', artist: 'Karaoke Version', coverUrl: '', type: 'instrumental', duration: 210, sources: [{ platform: 'soundcloud', streamUrl: '', downloadUrl: '', quality: '320' }], tags: ['instrumental', 'indie'], popularity: 42 },
];

export function getSongById(id: string): Song | undefined {
  return ALL_SONGS.find((s) => s.id === id);
}

export function searchSongs(query: string, type?: string): Song[] {
  const q = query.toLowerCase();
  return ALL_SONGS.filter((song) => {
    const matchQuery =
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q) ||
      song.tags.some((t) => t.toLowerCase().includes(q));
    const matchType = !type || song.type === type;
    return matchQuery && matchType;
  });
}

export function getTrendingSongs(): Song[] {
  return [...ALL_SONGS].sort(() => Math.random() - 0.5).slice(0, 10);
}

export function getRecommendPage(cursor: string | null, pageSize: number = 10) {
  const shuffled = [...ALL_SONGS].sort(() => Math.random() - 0.5);
  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const page = shuffled.slice(startIndex, startIndex + pageSize);
  const nextIndex = startIndex + pageSize;
  return {
    songs: page,
    cursor: nextIndex < shuffled.length ? String(nextIndex) : null,
  };
}
