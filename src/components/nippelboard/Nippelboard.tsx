'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/store/game-store';
import { useAudioEngine } from '@/hooks/use-audio-engine';
import { cn } from '@/lib/utils';
import { BUTTON_REGIONS, LABEL_REGIONS, SOUND_MAPPING, SOUND_LABELS } from '@/constants/board-config';
import { Bug, ArrowLeft } from 'lucide-react';

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

interface NippelboardProps {
  onBack?: () => void;
}

export const Nippelboard = ({ onBack }: NippelboardProps) => {
  const { activeButtonIndex, setActiveButton, debugMode, toggleDebug, isAssetsLoaded } = useGameStore();

  // === RECORDING STATE ===
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const [recordingBtnIndex, setRecordingBtnIndex] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // ... (image bounds state) ...
  const [imageBounds, setImageBounds] = useState<{
    x: number; y: number; width: number; height: number;
  } | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{
    w: number; h: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const { loadSound, loadSoundFromUrl, playSound, isLoaded, initContext } = useAudioEngine();

  // === LOAD SOUNDS (Static + Custom) ===
  useEffect(() => {
    const load = async () => {
      if (!isAssetsLoaded) return;
      
      try {
        // 1. Load default static sounds
        const staticPromises = Object.entries(SOUND_MAPPING).map(async ([id, fn]) => {
          try {
            await loadSoundFromUrl(parseInt(id), `/assets/audio/${fn}`);
          } catch (e) {
            console.error(`Failed to load default sound ${id}:`, e);
          }
        });
        await Promise.all(staticPromises);

        // 2. Load custom recordings from DB (overrides defaults)
        const { db } = await import('@/lib/db');
        const customIds = await db.getAllSoundIds();
        
        for (const storageKey of customIds) {
          const id = parseInt(storageKey.replace('sound_', ''));
          if (!isNaN(id)) {
            const blob = await db.getSound(id);
            if (blob) {
              await loadSound(id, blob);
              console.log(`Loaded custom sound for button ${id}`);
            }
          }
        }

      } catch (e) {
        console.error('Sound loading error:', e);
      }
    };
    load();
  }, [loadSound, loadSoundFromUrl, isAssetsLoaded]);

  // ... (Image bounds effects remain unchanged) ...
  // Get natural image dimensions
  useEffect(() => {
    const img = new window.Image();
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

  // === RECORDING LOGIC ===
  const startRecording = async (index: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        // Save to DB
        const { db } = await import('@/lib/db');
        await db.saveSound(index, blob);
        // Load into engine immediately
        await loadSound(index, blob);
        console.log(`Saved recording for button ${index}`);
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecordingBtnIndex(index);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Mikrofon-Zugriff verweigert oder nicht verfügbar.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecordingBtnIndex(null);
      mediaRecorderRef.current = null;
    }
  };

  const handleButtonClick = async (index: number) => {
    await initContext();

    if (isRecordingMode) {
      // Toggle recording
      if (recordingBtnIndex === index) {
        stopRecording();
      } else if (recordingBtnIndex === null) {
        startRecording(index);
      } else {
        // Stop current and start new? For now just block.
        console.warn('Finish current recording first.');
      }
    } else {
      // Play mode (Intro + Sound)
      console.log(`Activating button ${index} with Intro`);
      setActiveButton(index);
      
      // Check if both intro(999) and sound(index) are loaded
      if (isLoaded(999) && isLoaded(index)) {
        await playSequence([999, index], () => {
          console.log(`Sequence ended for ${index}, checking active state...`);
          const current = useGameStore.getState().activeButtonIndex;
          if (current === index) {
            setActiveButton(null);
          }
        });
      } else if (isLoaded(index)) {
        // Fallback if intro missing: just play sound
        console.warn("Intro not loaded, playing sound only");
        await playSound(index, () => {
             const current = useGameStore.getState().activeButtonIndex;
             if (current === index) setActiveButton(null);
        });
      } else {
        console.warn(`Sound ${index} not loaded?`);
        setTimeout(() => setActiveButton(null), 200);
      }
    }
  };

  // ... (getGlowMask unchanged) ...
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
      WebkitMaskImage: `radial-gradient(circle at ${cx}% ${cy}%, white 0%, white ${radius * 0.6}%, transparent ${radius}%)`,
      maskImage: `radial-gradient(circle at ${cx}% ${cy}%, white 0%, white ${radius * 0.6}%, transparent ${radius}%)`,
      pointerEvents: 'none',
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-black touch-none select-none"
    >
      {/* Layer 0: Blurred background to fill screen */}
      <Image
        src="/assets/images/board_off.webp"
        alt=""
        fill
        priority
        className="object-cover blur-3xl scale-110 opacity-40 z-0 pointer-events-none"
      />

      {/* Layer 1: Base image (Full visibility) */}
      <Image
        src="/assets/images/board_off.webp"
        alt="Board"
        fill
        priority
        className="object-contain pointer-events-none z-10"
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
            pointerEvents: 'none',
          }}
        >
          <Image
            src="/assets/images/board_on.webp"
            alt="Board Glow"
            fill
            priority
            className="object-contain pointer-events-none"
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
          {/* 1. Button Hitboxes */}
          {BUTTON_REGIONS.map((region, i) => (
            <button
              key={`btn-${i}`}
              onPointerDown={() => handleButtonClick(i)}
              // Removed onPointerUp/Leave to keep glow during playback
              className={cn(
                'absolute rounded-full transition-transform touch-manipulation outline-none scale-[0.72]',
                activeButtonIndex === i ? 'scale-[0.68] brightness-125' : 'scale-[0.72]',
                isRecordingMode && 'cursor-pointer',
                recordingBtnIndex === i && 'animate-pulse bg-red-500/50', // Visual feedback for recording
                debugMode && 'bg-red-500/25 border-2 border-red-400',
                !isLoaded(i) && !isRecordingMode && 'cursor-default'
              )}
              style={{
                top: `${region.top}%`,
                left: `${region.left}%`,
                width: `${region.width}%`,
                height: `${region.height}%`,
                WebkitTapHighlightColor: 'transparent',
              }}
              aria-label={`Pad ${i + 1}`}
            >
              {debugMode && (
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-[min(3vw,24px)] pointer-events-none">
                  {i + 1}
                  {isRecordingMode && recordingBtnIndex === i && (
                    <span className="absolute -top-4 text-xs text-red-500">REC</span>
                  )}
                </span>
              )}
            </button>
          ))}

          {/* 2. Decoupled Labels */}
          {LABEL_REGIONS.map((region, i) => (
            <div
              key={`lbl-${i}`}
              className={cn(
                "absolute pointer-events-none flex items-center justify-center",
                debugMode && "border border-red-500 bg-red-400/20"
              )}
              style={{
                top: `${region.top}%`,
                left: `${region.left}%`,
                width: `${region.width}%`,
                height: `${region.height}%`, 
              }}
            >
              {SOUND_LABELS[i] && (
                <span 
                  className="text-zinc-900/95 -rotate-1 select-none text-center w-full"
                  style={{
                    fontFamily: 'var(--font-rock-salt), cursive',
                    fontSize: 'min(2.0vw, 2.0vh)',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                    lineHeight: 1,
                    textShadow: '0.2px 0.2px 0px rgba(0,0,0,0.2)'
                  }}
                >
                  {SOUND_LABELS[i]}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-40 p-3 rounded-full bg-zinc-900/80 text-zinc-400 hover:text-white shadow-lg transition-all border border-white/10"
          aria-label="Zurück zum Schreibtisch"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {/* Record Switch / Toggle (Replaces Debug) */}
      <button
        onClick={() => {
          if (isRecordingMode) {
            if (recordingBtnIndex !== null) stopRecording();
            setIsRecordingMode(false);
          } else {
            setIsRecordingMode(true);
          }
        }}
        className={cn(
          'absolute top-4 right-4 z-40 px-4 py-2 rounded-full shadow-lg transition-all border border-white/10 font-bold text-sm',
          isRecordingMode 
            ? 'bg-red-600 text-white animate-pulse' 
            : 'bg-zinc-900/80 text-zinc-400 hover:text-white'
        )}
      >
        {isRecordingMode ? '● REC' : 'REC'}
      </button>

      {/* Loading overlay removed - handled globally by GameContainer */}
    </div>
  );
};
