import { FlyerStoryboard } from './flyerAdService';

export class FlyerAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private activeNodes: Array<{ stop?: () => void; disconnect: () => void }> = [];

  constructor() {
    // Lazy initialize on user interaction
  }

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // ============================================================================
  // PROCEDURAL SOUND EFFECT SYNTHESIZERS
  // ============================================================================

  public playWhoosh(ctx: BaseAudioContext = this.getAudioContext(), time = ctx.currentTime, volume = 0.25) {
    const bufferSize = ctx.sampleRate * 0.35;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, time);
    filter.frequency.exponentialRampToValueAtTime(3500, time + 0.15);
    filter.frequency.exponentialRampToValueAtTime(400, time + 0.35);
    filter.Q.value = 3.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.36);
  }

  public playPop(ctx: BaseAudioContext = this.getAudioContext(), time = ctx.currentTime, volume = 0.28) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, time);
    osc.frequency.exponentialRampToValueAtTime(140, time + 0.09);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.11);
  }

  public playDing(ctx: BaseAudioContext = this.getAudioContext(), time = ctx.currentTime, volume = 0.22) {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, time); // A6
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2640, time); // E7

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.7);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc2.start(time);
    osc.stop(time + 0.75);
    osc2.stop(time + 0.75);
  }

  public playImpact(ctx: BaseAudioContext = this.getAudioContext(), time = ctx.currentTime, volume = 0.35) {
    // Low sub kick
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.4);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.65);

    // Click snap
    this.playPop(ctx, time, volume * 0.6);
  }

  public playRiser(ctx: BaseAudioContext = this.getAudioContext(), time = ctx.currentTime, duration = 1.4, volume = 0.22) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, time);
    osc.frequency.exponentialRampToValueAtTime(880, time + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, time);
    filter.frequency.exponentialRampToValueAtTime(6000, time + duration);

    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(volume, time + duration - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  public playTick(ctx: BaseAudioContext = this.getAudioContext(), time = ctx.currentTime, volume = 0.15) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(2200, time);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.035);
  }

  public playShimmer(ctx: BaseAudioContext = this.getAudioContext(), time = ctx.currentTime, volume = 0.2) {
    const freqs = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, time + idx * 0.08);

      gain.gain.setValueAtTime(0.001, time + idx * 0.08);
      gain.gain.linearRampToValueAtTime(volume * 0.5, time + idx * 0.08 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + idx * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time + idx * 0.08);
      osc.stop(time + idx * 0.08 + 1.25);
    });
  }

  // ============================================================================
  // PROCEDURAL MULTI-MOOD MUSIC BED SYNTHESIS
  // ============================================================================

  public scheduleMusicBed(
    ctx: BaseAudioContext,
    storyboard: FlyerStoryboard,
    hasVoiceover: boolean = false,
    startTime = ctx.currentTime
  ) {
    const masterGain = ctx.createGain();
    const baseVolume = hasVoiceover ? 0.07 : 0.18; // Duck 9 dB under speech per Core Rule 4
    masterGain.gain.setValueAtTime(baseVolume, startTime);

    // Fade out over last 1.5 seconds per spec
    const totalDuration = storyboard.totalDuration;
    const fadeOutStart = startTime + Math.max(0, totalDuration - 1.5);
    masterGain.gain.setValueAtTime(baseVolume, fadeOutStart);
    masterGain.gain.linearRampToValueAtTime(0.0001, startTime + totalDuration);

    masterGain.connect(ctx.destination);

    // Chord progressions for moods:
    // C major, A minor, F major, G major
    const chords = [
      [261.63, 329.63, 392.0], // C4, E4, G4 (Hopeful/Triumphant)
      [220.0, 261.63, 329.63], // A3, C4, E4 (Mysterious)
      [174.61, 220.0, 261.63], // F3, A3, C4 (Warm/Energetic)
      [196.0, 246.94, 293.66]  // G3, B3, D4 (Anthem)
    ];

    const bpm = 120;
    const beatSec = 60 / bpm; // 0.5s per beat
    const totalBeats = Math.floor(totalDuration / beatSec);

    for (let beat = 0; beat < totalBeats; beat++) {
      const beatTime = startTime + beat * beatSec;
      const bar = Math.floor(beat / 4);
      const beatInBar = beat % 4;

      // Determine mood by active scene
      const currentTimeInStory = beat * beatSec;
      const currentScene = storyboard.scenes.find(s => currentTimeInStory >= s.start && currentTimeInStory < s.end);
      const mood = currentScene?.musicMood || 'hopeful';

      let chordIndex = 0;
      if (mood === 'mysterious') chordIndex = 1;
      else if (mood === 'hopeful') chordIndex = (bar % 2 === 0) ? 0 : 2;
      else if (mood === 'triumphant') chordIndex = (bar % 2 === 0) ? 3 : 0;
      else chordIndex = bar % 4;

      const chord = chords[chordIndex];

      // Bass pad on beat 0
      if (beatInBar === 0) {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(chord[0] / 2, beatTime);

        bassGain.gain.setValueAtTime(0.12, beatTime);
        bassGain.gain.exponentialRampToValueAtTime(0.001, beatTime + beatSec * 3.8);

        bassOsc.connect(bassGain);
        bassGain.connect(masterGain);
        bassOsc.start(beatTime);
        bassOsc.stop(beatTime + beatSec * 4);
      }

      // Arpeggio note on every beat
      const arpNote = chord[beatInBar % chord.length];
      const arpOsc = ctx.createOscillator();
      const arpGain = ctx.createGain();
      arpOsc.type = mood === 'mysterious' ? 'sine' : 'triangle';
      arpOsc.frequency.setValueAtTime(arpNote * (mood === 'triumphant' ? 2 : 1), beatTime);

      arpGain.gain.setValueAtTime(0.06, beatTime);
      arpGain.gain.exponentialRampToValueAtTime(0.001, beatTime + beatSec * 0.85);

      arpOsc.connect(arpGain);
      arpGain.connect(masterGain);
      arpOsc.start(beatTime);
      arpOsc.stop(beatTime + beatSec * 0.9);

      // Simple drum groove: Kick on beats 0 & 2, Hi-hat on every beat, Snare on beats 1 & 3
      if (beatInBar === 0 || beatInBar === 2) {
        // Kick
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, beatTime);
        kickOsc.frequency.exponentialRampToValueAtTime(45, beatTime + 0.15);

        kickGain.gain.setValueAtTime(0.18, beatTime);
        kickGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.2);

        kickOsc.connect(kickGain);
        kickGain.connect(masterGain);
        kickOsc.start(beatTime);
        kickOsc.stop(beatTime + 0.22);
      }

      if (beatInBar === 1 || beatInBar === 3) {
        // Snare noise
        const snareBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
        const data = snareBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const snareSource = ctx.createBufferSource();
        snareSource.buffer = snareBuffer;

        const snareFilter = ctx.createBiquadFilter();
        snareFilter.type = 'highpass';
        snareFilter.frequency.setValueAtTime(1200, beatTime);

        const snareGain = ctx.createGain();
        snareGain.gain.setValueAtTime(0.12, beatTime);
        snareGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.12);

        snareSource.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(masterGain);

        snareSource.start(beatTime);
        snareSource.stop(beatTime + 0.13);
      }
    }

    // Schedule timed SFX cues from storyboard
    storyboard.scenes.forEach(scene => {
      scene.sfxCues.forEach(cue => {
        const cueAbsoluteTime = startTime + scene.start + cue.time;
        if (cueAbsoluteTime < startTime + totalDuration) {
          switch (cue.type) {
            case 'whoosh':
              this.playWhoosh(ctx, cueAbsoluteTime, 0.2);
              break;
            case 'pop':
              this.playPop(ctx, cueAbsoluteTime, 0.22);
              break;
            case 'ding':
              this.playDing(ctx, cueAbsoluteTime, 0.2);
              break;
            case 'impact':
              this.playImpact(ctx, cueAbsoluteTime, 0.3);
              break;
            case 'riser':
              this.playRiser(ctx, cueAbsoluteTime, 1.2, 0.2);
              break;
            case 'tick':
              this.playTick(ctx, cueAbsoluteTime, 0.14);
              break;
            case 'shimmer':
              this.playShimmer(ctx, cueAbsoluteTime, 0.2);
              break;
          }
        }
      });
    });
  }

  // ============================================================================
  // OFFLINE AUDIO RENDERING FOR EXPORT
  // ============================================================================

  public async renderOfflineAudioBuffer(storyboard: FlyerStoryboard, hasVoiceover = false): Promise<AudioBuffer> {
    const sampleRate = 44100;
    const duration = Math.max(1, storyboard.totalDuration);
    const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

    this.scheduleMusicBed(offlineCtx, storyboard, hasVoiceover, 0);

    return await offlineCtx.startRendering();
  }
}

export const flyerAudio = new FlyerAudioEngine();
