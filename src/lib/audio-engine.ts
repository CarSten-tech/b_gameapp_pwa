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

  getDuration(id: number): number {
    return this.buffers.get(id)?.duration || 0;
  }

  isLoaded(id: number): boolean {
    return this.buffers.has(id);
  }
}

export const audioEngine = new AudioEngine();
