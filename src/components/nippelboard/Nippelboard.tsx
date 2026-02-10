'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/game-store';
import { useAudioEngine } from '@/hooks/use-audio-engine';
import { cn } from '@/lib/utils';
import { BUTTON_REGIONS, SOUND_MAPPING, SOUND_LABELS } from '@/constants/board-config';
import { Bug } from 'lucide-react';

/**
 * Calculates where object-cover actually renders the image.
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
    // Image is "wider" than container -> width fills container, height is letterboxed
    renderedW = containerW;
    renderedH = containerW / imageAR;
  } else {
    // Image is "taller" than container -> height fills container, width is pillarboxed
    renderedH = containerH;
    renderedW = containerH * imageAR;
  }

  const x = (containerW - renderedW) / 2;
  const y = (containerH - renderedH) / 2;

  return { x, y, width: renderedW, height: renderedH };
}

export const Nippelboard = () => {
  const { activeButtonIndex, setActiveButton } = useGameStore();

  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState(false);
  const [imageBounds, setImageBounds] = useState<{
    x: number; y: number; width: number; height: number;
  } | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{
    w: number; h: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const { loadSoundFromUrl, playSound, isLoaded, initContext } = useAudioEngine();

  // Load static sounds
  useEffect(() => {
    const load = async () => {
      try {
        const promises = Object.entries(SOUND_MAPPING).map(async ([id, fn]) => {
          try {
            await loadSoundFromUrl(parseInt(id), `/assets/audio/${fn}`);
          } catch (e) {
            console.error(`Failed to load sound ${id}:`, e);
          }
        });
        const timeout = new Promise((r) => setTimeout(r, 5000));
        await Promise.race([Promise.all(promises), timeout]);
      } catch (e) {
        console.error('Sound loading error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [loadSoundFromUrl]);

  // Get natural image dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = '/assets/images/board_off.webp';
  }, []);

  // Recalculate rendered image bounds on resize
  useEffect(() => {
    if (!imageNaturalSize) return;
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      setImageBounds(
        getRenderedImageBounds(el.clientWidth, el.clientHeight, imageNaturalSize.w, imageNaturalSize.h)
      );
    };
    update();
    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [imageNaturalSize]);

  const handleButtonClick = async (index: number) => {
    await initContext();

    setActiveButton(index);

    if (isLoaded(index)) {
      // Play the sound and turn off glow when it ends
      await playSound(index, () => setActiveButton(null));
    } else {
      // No sound mapped — just show glow for 300ms
      setTimeout(() => setActiveButton(null), 300);
    }
  };

  /**
   * Build a soft radial-gradient mask centered on the active button.
   * This creates a natural, feathered glow instead of a hard circle edge.
   */
  const getGlowMask = (index: number | null): React.CSSProperties => {
    if (index === null || !imageBounds) {
      return { opacity: 0 };
    }

    const r = BUTTON_REGIONS[index];
    // Center of the button in percentages of the overlay
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    // Radius: use the smaller dimension to keep it circular
    const radius = Math.min(r.width, r.height) * 0.55; // slightly larger than 0.5 for soft bleed

    return {
      opacity: 1,
      WebkitMaskImage: `radial-gradient(circle at ${cx}% ${cy}%, black 0%, black ${radius * 0.6}%, transparent ${radius}%)`,
      maskImage: `radial-gradient(circle at ${cx}% ${cy}%, black 0%, black ${radius * 0.6}%, transparent ${radius}%)`,
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-black touch-none select-none"
    >
      {/* Layer 0: Blurred background to fill screen */}
      <img
        src="/assets/images/board_off.webp"
        alt=""
        className="absolute inset-0 w-full h-full object-cover blur-3xl scale-110 opacity-40 z-0 pointer-events-none"
      />

      {/* Layer 1: Base image (Full visibility) */}
      <img
        src="/assets/images/board_off.webp"
        alt="Board"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
      />

      {/* Layer 2: Glow image with soft radial mask */}
      {imageBounds && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: imageBounds.x,
            top: imageBounds.y,
            width: imageBounds.width,
            height: imageBounds.height,
            ...getGlowMask(activeButtonIndex),
          }}
        >
          <img
            src="/assets/images/board_on.webp"
            alt="Board Glow"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Layer 3: Interaction Hotspots & Labels */}
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
            <React.Fragment key={i}>
              {/* Button Hitbox */}
              <button
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
              
              {/* Label Text */}
              {SOUND_LABELS[i] && (
                <div
                  className={cn(
                    "absolute pointer-events-none flex items-center justify-center",
                    debug && "border border-red-500 bg-red-400/20"
                  )}
                  style={{
                    top: `${region.top + region.height * 1.08}%`, // Start just below the circular button
                    left: `${region.left + region.width * 0.05}%`, // Center horizontally within the button width
                    width: `${region.width * 0.9}%`,
                    height: `${region.height * 0.24}%`, // Height of the white label field
                  }}
                >
                  <span 
                    className="text-zinc-900/95 -rotate-1 select-none text-center w-full"
                    style={{
                      fontFamily: 'var(--font-rock-salt), cursive',
                      fontSize: 'min(2.8vw, 2.8vh)',
                      fontWeight: 400,
                      letterSpacing: '-0.01em',
                      lineHeight: 1,
                      textShadow: '0.2px 0.2px 0px rgba(0,0,0,0.2)'
                    }}
                  >
                    {SOUND_LABELS[i]}
                  </span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Debug toggle */}
      <button
        onClick={() => setDebug(!debug)}
        className={cn(
          'absolute top-4 right-4 z-40 p-3 rounded-full shadow-lg transition-all border border-white/10',
          debug ? 'bg-blue-600 text-white' : 'bg-zinc-900/80 text-zinc-400 hover:text-white'
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
