'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useGameStore } from '@/store/game-store';
import { useAudioEngine } from '@/hooks/use-audio-engine';
import { cn } from '@/lib/utils';
import { BUTTON_REGIONS, SOUND_MAPPING } from '@/constants/board-config';
import { Bug } from 'lucide-react';

/**
 * Calculates the actual rendered bounds of an image displayed with object-cover.
 * Returns { x, y, width, height } in pixels relative to the container.
 */
function getRenderedImageBounds(
  containerW: number,
  containerH: number,
  imageNaturalW: number,
  imageNaturalH: number
) {
  const containerAR = containerW / containerH;
  const imageAR = imageNaturalW / imageNaturalH;

  let renderedW: number;
  let renderedH: number;

  if (imageAR > containerAR) {
    // Image is wider than container → height fills, width overflows
    renderedH = containerH;
    renderedW = containerH * imageAR;
  } else {
    // Image is taller than container → width fills, height overflows
    renderedW = containerW;
    renderedH = containerW / imageAR;
  }

  // object-cover centers the image
  const x = (containerW - renderedW) / 2;
  const y = (containerH - renderedH) / 2;

  return { x, y, width: renderedW, height: renderedH };
}

export const Nippelboard = () => {
  const { activeButtonIndex, setActiveButton } = useGameStore();

  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState(false);
  const [imageBounds, setImageBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ w: number; h: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const { loadSoundFromUrl, playSound, isLoaded, initContext } = useAudioEngine();

  // Load static sounds
  useEffect(() => {
    const loadSounds = async () => {
      try {
        const promises = Object.entries(SOUND_MAPPING).map(async ([id, filename]) => {
          try {
            await loadSoundFromUrl(parseInt(id), `/assets/audio/${filename}`);
          } catch (e) {
            console.error(`Failed to load sound ${id}:`, e);
          }
        });
        const timeout = new Promise((resolve) => setTimeout(resolve, 5000));
        await Promise.race([Promise.all(promises), timeout]);
      } catch (e) {
        console.error('Sound loading error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadSounds();
  }, [loadSoundFromUrl]);

  // Get natural image dimensions on mount
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = '/assets/images/board_off.webp';
  }, []);

  // Recalculate rendered image bounds on resize
  useEffect(() => {
    if (!imageNaturalSize) return;

    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const bounds = getRenderedImageBounds(
        el.clientWidth,
        el.clientHeight,
        imageNaturalSize.w,
        imageNaturalSize.h
      );
      setImageBounds(bounds);
    };

    update();

    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [imageNaturalSize]);

  const handleButtonClick = async (index: number) => {
    await initContext();
    if (!isLoaded(index)) return;
    setActiveButton(index);
    await playSound(index, () => setActiveButton(null));
  };

  // Clip-path using circle(), coordinates relative to the overlay div
  const getClipPath = (index: number | null) => {
    if (index === null || !imageBounds) return 'circle(0% at 0% 0%)';
    const r = BUTTON_REGIONS[index];
    const centerX = r.left + r.width / 2;
    const centerY = r.top + r.height / 2;
    const radius = Math.min(r.width, r.height) / 2;
    return `circle(${radius}% at ${centerX}% ${centerY}%)`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-black touch-none select-none"
    >
      {/* Layer 1: Base image (board_off) */}
      <img
        src="/assets/images/board_off.webp"
        alt="Board"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
      />

      {/* Layer 2: Glow image (board_on) — clipped to the active button circle */}
      {imageBounds && (
        <div
          className="absolute z-20 pointer-events-none transition-opacity duration-75"
          style={{
            left: imageBounds.x,
            top: imageBounds.y,
            width: imageBounds.width,
            height: imageBounds.height,
            opacity: activeButtonIndex !== null ? 1 : 0,
            clipPath: getClipPath(activeButtonIndex),
          }}
        >
          <img
            src="/assets/images/board_on.webp"
            alt="Board Glow"
            className="w-full h-full object-fill"
          />
        </div>
      )}

      {/* Layer 3: Interaction Hotspots — positioned over the rendered image */}
      {imageBounds && (
        <div
          className="absolute z-30"
          style={{
            left: imageBounds.x,
            top: imageBounds.y,
            width: imageBounds.width,
            height: imageBounds.height,
          }}
        >
          {BUTTON_REGIONS.map((region, i) => (
            <button
              key={i}
              onClick={() => handleButtonClick(i)}
              className={cn(
                'absolute rounded-full transition-transform active:scale-95 touch-manipulation outline-none',
                debug && 'bg-red-500/25 border-2 border-red-400',
                !isLoaded(i) && 'cursor-default'
              )}
              style={{
                top: `${region.top}%`,
                left: `${region.left}%`,
                width: `${region.width}%`,
                height: `${region.height}%`,
                WebkitTapHighlightColor: 'transparent',
              }}
              aria-label={`Pad ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Debug toggle */}
      <button
        onClick={() => setDebug(!debug)}
        className={cn(
          'absolute top-4 right-4 z-40 p-3 rounded-full shadow-lg transition-all border border-white/10',
          debug
            ? 'bg-blue-600 text-white'
            : 'bg-zinc-900/80 text-zinc-400 hover:text-white'
        )}
        aria-label="Toggle Debug Mode"
      >
        <Bug className="w-5 h-5" />
      </button>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-zinc-700 border-t-white rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium tracking-widest uppercase text-xs">
              Nippelboard lädt...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
