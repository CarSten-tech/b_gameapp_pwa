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
  playDTMF(key: string, duration: number = 0.2) {
    const ctx = this.init();
    
    // DTMF frequencies
    const freqMap: Record<string, [number, number]> = {
      '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
      '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
      '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
      '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
    };

    const freqs = freqMap[key];
    if (!freqs) return;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    gainNode.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freqs[0], ctx.currentTime);
    osc2.frequency.setValueAtTime(freqs[1], ctx.currentTime);

    osc1.connect(gainNode);
    osc2.connect(gainNode);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + duration);
    osc2.stop(ctx.currentTime + duration);
  }

  getDuration(id: number): number {
    return this.buffers.get(id)?.duration || 0;
  }

  isLoaded(id: number): boolean {
    return this.buffers.has(id);
  }
}

export const audioEngine = new AudioEngine();
