// Client-side audio synthesizer — generates pleasant tones when no real audio stream is available.
// Uses Web Audio API oscillators to create music.

let audioCtx: AudioContext | null = null;
let currentOscillators: OscillatorNode[] = [];
let currentGain: GainNode | null = null;
let isPlaying = false;
let startTime = 0;
let pausedAt = 0;
let totalDuration = 0;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

// Note frequencies (scientific pitch notation)
const NOTES: Record<string, number> = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00,
};

// Melody patterns based on song ID (different for each song)
const MELODY_PATTERNS: Record<string, [string, number][]> = {
  // Pop / upbeat
  pop: [
    ['C4', 0.4], ['E4', 0.3], ['G4', 0.3], ['C5', 0.4], ['G4', 0.3], ['E4', 0.3],
    ['D4', 0.4], ['F4', 0.3], ['A4', 0.3], ['D5', 0.4], ['A4', 0.3], ['F4', 0.3],
    ['E4', 0.4], ['G4', 0.3], ['C5', 0.3], ['E5', 0.5], ['D5', 0.3], ['C5', 0.4],
  ],
  // Ballad / emotional
  ballad: [
    ['A4', 0.5], ['C5', 0.4], ['E5', 0.5], ['D5', 0.3], ['C5', 0.4],
    ['G4', 0.5], ['A4', 0.4], ['C5', 0.6], ['A4', 0.3], ['G4', 0.5],
    ['F4', 0.5], ['A4', 0.4], ['D5', 0.5], ['C5', 0.4], ['A4', 0.6],
  ],
  // Bright / energetic
  bright: [
    ['C5', 0.3], ['D5', 0.3], ['E5', 0.3], ['G5', 0.4],
    ['E5', 0.3], ['D5', 0.3], ['C5', 0.4], ['A4', 0.3],
    ['G4', 0.3], ['C5', 0.4], ['D5', 0.3], ['E5', 0.5],
  ],
};

function pickMelody(songId: string): [string, number][] {
  // Use song ID to deterministically pick a pattern
  const hash = songId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const keys = Object.keys(MELODY_PATTERNS);
  const key = keys[hash % keys.length];
  return MELODY_PATTERNS[key];
}

// Also pick a waveform based on song type
function pickWaveform(songId: string): OscillatorType {
  const types: OscillatorType[] = ['sine', 'triangle', 'sine'];
  const hash = songId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return types[hash % types.length];
}

export function synthPlay(
  songId: string,
  duration: number,
  volume: number = 0.5
): { seek: (t: number) => void; pause: () => void; resume: () => void; stop: () => void; getTime: () => number; getDuration: () => number } {
  const ctx = getCtx();

  // Resume context if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  stopSynth();

  const melody = pickMelody(songId);
  const waveform = pickWaveform(songId);

  // Calculate total duration based on melody pattern repetitions
  const oneLoop = melody.reduce((sum, [, d]) => sum + d, 0);
  const loops = Math.ceil(duration / oneLoop);
  totalDuration = oneLoop * loops;

  // Create gain node for volume
  const masterGain = ctx.createGain();
  masterGain.gain.value = volume;
  masterGain.connect(ctx.destination);
  currentGain = masterGain;

  // Schedule oscillators for each note in the melody
  const now = ctx.currentTime;
  startTime = now - pausedAt;
  let timeOffset = 0;

  for (let loop = 0; loop < loops; loop++) {
    for (const [note, noteDuration] of melody) {
      const freq = NOTES[note] || 440;

      // Main oscillator
      const osc = ctx.createOscillator();
      osc.type = waveform;
      osc.frequency.value = freq;

      // Sub oscillator (one octave down, quieter) for richness
      const subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.value = freq / 2;

      // Note envelope
      const noteGain = ctx.createGain();
      noteGain.gain.value = 0;
      const attackTime = 0.02;
      const releaseTime = Math.min(0.08, noteDuration * 0.3);
      noteGain.gain.setValueAtTime(0, now + timeOffset);
      noteGain.gain.linearRampToValueAtTime(0.35, now + timeOffset + attackTime);
      noteGain.gain.setValueAtTime(0.35, now + timeOffset + noteDuration - releaseTime);
      noteGain.gain.linearRampToValueAtTime(0, now + timeOffset + noteDuration);

      const subGain = ctx.createGain();
      subGain.gain.value = 0;
      subGain.gain.setValueAtTime(0, now + timeOffset);
      subGain.gain.linearRampToValueAtTime(0.1, now + timeOffset + attackTime);
      subGain.gain.setValueAtTime(0.1, now + timeOffset + noteDuration - releaseTime);
      subGain.gain.linearRampToValueAtTime(0, now + timeOffset + noteDuration);

      noteGain.connect(masterGain);
      subGain.connect(masterGain);
      osc.connect(noteGain);
      subOsc.connect(subGain);

      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + noteDuration + 0.05);
      subOsc.start(now + timeOffset);
      subOsc.stop(now + timeOffset + noteDuration + 0.05);

      currentOscillators.push(osc, subOsc);
      timeOffset += noteDuration;
    }
  }

  isPlaying = true;

  return {
    seek: (time: number) => {
      stopSynth();
      pausedAt = time;
      // Restart from seek position
      const result = synthPlay(songId, duration - time, volume);
      return result;
    },
    pause: () => {
      ctx.suspend();
      isPlaying = false;
      pausedAt = ctx.currentTime - startTime;
    },
    resume: () => {
      ctx.resume();
      isPlaying = true;
      startTime = ctx.currentTime - pausedAt;
    },
    stop: () => {
      stopSynth();
    },
    getTime: () => {
      if (isPlaying) {
        return ctx.currentTime - startTime;
      }
      return pausedAt;
    },
    getDuration: () => totalDuration,
  };
}

function stopSynth() {
  currentOscillators.forEach((osc) => {
    try { osc.stop(); } catch {}
  });
  currentOscillators = [];
  if (currentGain) {
    currentGain.disconnect();
    currentGain = null;
  }
  isPlaying = false;
  pausedAt = 0;
}

export function synthSetVolume(volume: number) {
  if (currentGain) {
    currentGain.gain.value = volume;
  }
}
