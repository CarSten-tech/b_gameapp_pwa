'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/store/game-store';
import { useAudioEngine } from '@/hooks/use-audio-engine';
import { cn } from '@/lib/utils';
import { BUTTON_REGIONS, SOUND_MAPPING } from '@/constants/board-config';
import { Play } from 'lucide-react';

const DEBUG_MODE_DEFAULT = false;

export const Nippelboard = () => {
  const { 
    activeButtonIndex, 
    setActiveButton, 
  } = useGameStore();

  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState(DEBUG_MODE_DEFAULT);
  const { loadSoundFromUrl, playSound, isLoaded, initContext } = useAudioEngine();

  // Load static sounds from public/assets/audio/
  useEffect(() => {
    const loadSounds = async () => {
      console.log('Nippelboard: Starting to load sounds...', SOUND_MAPPING);
      try {
        const loadPromises = Object.entries(SOUND_MAPPING).map(async ([id, filename]) => {
          try {
            const url = `/assets/audio/${filename}`;
            console.log(`Nippelboard: Loading sound ${id} from ${url}`);
            await loadSoundFromUrl(parseInt(id), url);
            console.log(`Nippelboard: Successfully loaded sound ${id}`);
          } catch (soundErr) {
            console.error(`Nippelboard: Failed to load sound ${id} (${filename}):`, soundErr);
          }
        });
        
        // Use a timeout to ensure the app doesn't hang forever
        const timeout = new Promise((resolve) => setTimeout(resolve, 5000));
        await Promise.race([Promise.all(loadPromises), timeout]);
      } catch (err) {
        console.error('Nippelboard: Critical error during sound loading sequence:', err);
      } finally {
        console.log('Nippelboard: Loading sequence finished.');
        setLoading(false);
      }
    };
    loadSounds();
  }, [loadSoundFromUrl]);

  const handleButtonClick = async (index: number) => {
    // Ensure AudioContext is unlocked (required for iOS)
    await initContext();

    if (!isLoaded(index)) {
      console.log(`Sound for button ${index} not loaded or mapped.`);
      return;
    }

    setActiveButton(index);
    await playSound(index, () => {
      setActiveButton(null);
    });
  };

  const getClipPath = (index: number | null) => {
    if (index === null) return 'circle(0% at 0% 0%)';
    const r = BUTTON_REGIONS[index];
    const centerX = r.left + r.width / 2;
    const centerY = r.top + r.height / 2;
    // Using width/2 as radius for a circular glow. 
    // We additive a tiny bit (0.5%) for a softer bleed if needed, 
    // but user asked for "exakt", so we stay precise.
    const radius = r.width / 2; 
    return `circle(${radius}% at ${centerX}% ${centerY}%)`;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black touch-none select-none">
      
      {/* Board Container - Fullscreen */}
      <div className="relative w-full h-full overflow-hidden">
        
        {/* Layer 1: Base image (board_off) */}
        <div className="absolute inset-0 z-10">
           <img 
            src="/assets/images/board_off.webp" 
            alt="Board" 
            className="w-full h-full object-cover pointer-events-none"
           />
        </div>

        {/* Layer 2: Glow image (board_on) with clipping */}
        <div 
          className="absolute inset-0 z-20 transition-opacity duration-75 pointer-events-none"
          style={{ 
            opacity: activeButtonIndex !== null ? 1 : 0,
            clipPath: getClipPath(activeButtonIndex)
          }}
        >
          <img 
            src="/assets/images/board_on.webp" 
            alt="Board Glow" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Layer 3: Interaction Grid (Hotspots) */}
        <div className="absolute inset-0 z-30">
          {BUTTON_REGIONS.map((region, i) => (
            <button
              key={i}
              onClick={() => handleButtonClick(i)}
              className={cn(
                "absolute transition-transform active:scale-95 touch-manipulation outline-none rounded-full",
                debug && "bg-red-500/20 border border-red-500/50 z-50",
                !isLoaded(i) && "cursor-default"
              )}
              style={{
                top: `${region.top}%`,
                left: `${region.left}%`,
                width: `${region.width}%`,
                height: `${region.height}%`,
                WebkitTapHighlightColor: 'transparent'
              }}
              aria-label={`Pad ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Floating UI Controls */}
      <div className="absolute top-4 right-4 z-40 flex gap-2 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)]">
        <button
          onClick={() => setDebug(!debug)}
          className={cn(
            "p-3 rounded-full shadow-lg transition-all border border-white/10",
            debug ? "bg-blue-600 text-white" : "bg-zinc-900/80 text-zinc-400 hover:text-white"
          )}
          title="Debug Modus"
          aria-label="Toggle Debug Mode"
        >
          <Play className="w-5 h-5" />
        </button>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
             <div className="w-10 h-10 border-4 border-zinc-700 border-t-white rounded-full animate-spin" />
             <p className="text-zinc-500 font-medium tracking-widest uppercase text-xs">Nippelboard lädt...</p>
          </div>
        </div>
      )}
    </div>
  );
};
