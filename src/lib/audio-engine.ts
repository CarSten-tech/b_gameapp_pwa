'use client';

class AudioEngine {
  private context: AudioContext | null = null;
  private buffers: Map<number, AudioBuffer> = new Map();

  init() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.context;
  }

  /**
   * Unlocks AudioContext for iOS/Safari.
   * Call this on the first user interaction.
   */
  async unlock() {
    const ctx = this.init();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  async loadFromBlob(id: number, blob: Blob): Promise<AudioBuffer> {
    const ctx = this.init();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    this.buffers.set(id, audioBuffer);
    return audioBuffer;
  }

  play(id: number, onEnded?: () => void): number {
    const ctx = this.init();
    const buffer = this.buffers.get(id);
    if (!buffer) return 0;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    if (onEnded) {
      source.onended = onEnded;
    }

    source.start(0);
    return buffer.duration;
  }

  /**
   * Plays a DTMF (Dual-Tone Multi-Frequency) sound.
   * @param key 0-9, *, #
   * @param duration seconds
   */
  playDTMF(key: string, duration: number = 0.15) {
    const ctx = this.init();
    
    const freqMap: Record<string, [number, number]> = {
      '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
      '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
      '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
      '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
    };

    const freqs = freqMap[key];
    if (!freqs) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.12, now + 0.005); // Rapid attack
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    masterGain.connect(ctx.destination);

    // 1. DTMF Tones (Dual Sine)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freqs[0], now);
    osc2.frequency.setValueAtTime(freqs[1], now);

    // 2. Add subtle harmonics for an "analog" feel
    const oscHarmonic = ctx.createOscillator();
    const harmonicGain = ctx.createGain();
    oscHarmonic.type = 'sine';
    oscHarmonic.frequency.setValueAtTime(freqs[0] * 2, now);
    harmonicGain.gain.setValueAtTime(0.02, now);
    oscHarmonic.connect(harmonicGain);
    harmonicGain.connect(masterGain);

    // 3. Mechanical "Click" (High freq burst)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'square'; // Sharper sound
    clickOsc.frequency.setValueAtTime(2000, now);
    clickGain.gain.setValueAtTime(0.015, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);

    osc1.connect(masterGain);
    osc2.connect(masterGain);

    osc1.start(now);
    osc2.start(now);
    oscHarmonic.start(now);
    clickOsc.start(now);

    osc1.stop(now + duration);
    osc2.stop(now + duration);
    oscHarmonic.stop(now + duration);
    clickOsc.stop(now + 0.03);
  }

  getDuration(id: number): number {
    return this.buffers.get(id)?.duration || 0;
  }

  isLoaded(id: number): boolean {
    return this.buffers.has(id);
  }
}

export const audioEngine = new AudioEngine();
