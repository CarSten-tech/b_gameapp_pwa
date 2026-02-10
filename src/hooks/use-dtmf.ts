'use client';

import { useState, useCallback, useRef } from 'react';

const DTMF_FREQUENCIES: Record<string, [number, number]> = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
};

export function useDTMF() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playKey = useCallback((key: string, duration: number = 0.12) => {
    const freqs = DTMF_FREQUENCIES[key];
    if (!freqs) return;

    const ctx = initAudio();
    const now = ctx.currentTime;

    // Create a gain node for smooth entry/exit
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.005); // Tiny attack for "click"
    gainNode.gain.setValueAtTime(0.1, now + duration - 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    gainNode.connect(ctx.destination);

    // Create the two oscillators for DTMF
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freqs[0], now);
    osc2.frequency.setValueAtTime(freqs[1], now);

    osc1.connect(gainNode);
    osc2.connect(gainNode);

    osc1.start(now);
    osc2.start(now);

    // Auto-stop
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }, [initAudio]);

  return { playKey };
}
