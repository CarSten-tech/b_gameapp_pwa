'use client';

import React from 'react';
import Image from 'next/image';
import { useGameStore } from '@/store/game-store';
import { Hotspot, HotspotLayer } from './HotspotLayer';
import { Bug } from 'lucide-react';
import { cn } from '@/lib/utils';
import { audioEngine } from '@/lib/audio-engine';

export const SchreibtischSzene = () => {
  const { setView, debugMode, toggleDebug, togglePhone } = useGameStore();

  const handlePhoneClick = async () => {
    console.log('Phone hotspot clicked');
    // Crucial for iOS: Unlock audio context on first interaction
    await audioEngine.unlock();
    togglePhone(true);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Background Image */}
      <Image
        src="/assets/images/schreibtisch_szene.jpeg"
        alt="Schreibtisch"
        fill
        priority
        className="object-contain pointer-events-none"
      />

      {/* Interactive Hotspot Layer */}
      <HotspotLayer>
        {/* 
          Hotspot for the Nippelboard. 
        */}
        <Hotspot
          x={34}
          y={75}
          width={32}
          height={20}
          onClick={() => setView('nippelboard')}
          label="Zum Nippelboard zoomen"
        />

        {/* Hotspot for the Telephone */}
        <Hotspot
          x={13}
          y={72}
          width={18}
          height={22}
          onClick={handlePhoneClick}
          label="Telefon anschauen"
        />
      </HotspotLayer>

      {/* Debug toggle */}
      <button
        onClick={toggleDebug}
        className={cn(
          'absolute top-4 right-4 z-40 p-3 rounded-full shadow-lg transition-all border border-white/10',
          debugMode ? 'bg-blue-600 text-white' : 'bg-zinc-900/80 text-zinc-400 hover:text-white'
        )}
        aria-label="Toggle Debug Mode"
      >
        <Bug className="w-5 h-5" />
      </button>

      {/* iOS Tap Highlight Fix & General Styling */}
      <style jsx global>{`
        button {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
};
