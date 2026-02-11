'use client';

import { useState, useCallback, useRef } from 'react';

export const useAudioEngine = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const buffers = useRef<Map<number, AudioBuffer>>(new Map());

  const initContext = useCallback(async () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContext.current.state === 'suspended') {
      await audioContext.current.resume();
    }
    return audioContext.current;
  }, []);

  const loadSound = useCallback(async (id: number, blob: Blob) => {
    const ctx = await initContext();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    buffers.current.set(id, audioBuffer);
    return audioBuffer;
  }, [initContext]);

  const loadSoundFromUrl = useCallback(async (id: number, url: string) => {
    const ctx = await initContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    buffers.current.set(id, audioBuffer);
    return audioBuffer;
  }, [initContext]);

  const playSound = useCallback(async (id: number, onEnded?: () => void) => {
    const ctx = await initContext();
    const buffer = buffers.current.get(id);
    if (!buffer) return 0;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    if (onEnded) {
      source.addEventListener('ended', () => {
        console.log(`Sound finished: ${id}`);
        onEnded();
      });
    }

    source.start(0);
    console.log(`Playing sound ${id}, duration: ${buffer.duration}`);
    return buffer.duration;
    return buffer.duration;
  }, [initContext]);

  const playSequence = useCallback(async (ids: number[], onEnded?: () => void) => {
    const ctx = await initContext();
    let startTime = ctx.currentTime + 0.05; // Small offset to ensure clean start
    
    // 1. Verify all buffers exist
    for (const id of ids) {
      if (!buffers.current.has(id)) {
        console.warn(`Cannot play sequence: sound ${id} missing`);
        if (onEnded) onEnded();
        return;
      }
    }

    // 2. Schedule
    ids.forEach((id, index) => {
      const buffer = buffers.current.get(id)!;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      
      source.start(startTime);
      console.log(`Scheduled sound ${id} at ${startTime}`);
      startTime += buffer.duration;

      // Only last sound triggers onEnded
      if (index === ids.length - 1 && onEnded) {
        source.addEventListener('ended', () => {
          console.log(`Sequence finished at sound ${id}`);
          onEnded();
        });
      }
    });

  }, [initContext]);

  const isLoaded = useCallback((id: number) => {
    return buffers.current.has(id);
  }, []);

  return {
    loadSound,
    loadSoundFromUrl,
    playSound,
    playSequence, // Exported
    isLoaded,
    initContext
  };
};
