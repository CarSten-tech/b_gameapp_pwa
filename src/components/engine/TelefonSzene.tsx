'use client';

import React, { useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/game-store';
import { HotspotLayer } from './HotspotLayer';
import { audioEngine } from '@/lib/audio-engine';
import { cn } from '@/lib/utils';
import { Bug } from 'lucide-react';

export const TelefonSzene = () => {
  const { showPhone, togglePhone, dialedNumber, dialKey, debugMode, toggleDebug } = useGameStore();

  const checkNumber = useCallback((number: string) => {
    if (number.endsWith('666')) {
      const ctx = audioEngine.init();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 2);
    }
  }, []);

  useEffect(() => {
    if (dialedNumber.length >= 3) {
      checkNumber(dialedNumber);
    }
  }, [dialedNumber, checkNumber]);

  const handleKeyClick = (key: string) => {
    audioEngine.playDTMF(key);
    dialKey(key);
  };

  return (
    <AnimatePresence>
      {showPhone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
          onClick={() => togglePhone(false)}
        >
          <div 
            className="relative w-full h-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main Phone Image */}
            <Image
              src="/assets/images/telefon_szene.jpeg"
              alt="Wählscheibe"
              fill
              className="object-contain"
              priority
            />

            {/* Hotspot Layer for Buttons */}
            <HotspotLayer>
              {/* 
              Tighter button mapping shifted left and down.
              x: 44, 49, 54
              y: 48, 54, 60, 66
            */}
            
            {/* Row 1 */}
            <PhoneButton x={45.3} y={48} label="1" width="3.8%" height="5.5%" debugMode={debugMode} onClick={() => handleKeyClick('1')} />
            <PhoneButton x={50.2} y={48} label="2" width="3.8%" height="5.5%" debugMode={debugMode} onClick={() => handleKeyClick('2')} />
            <PhoneButton x={56.1} y={47.5} label="3" debugMode={debugMode} onClick={() => handleKeyClick('3')} />

            {/* Row 2 */}
            <PhoneButton x={44} y={54} label="4" width="3.8%" height="5.5%" debugMode={debugMode} onClick={() => handleKeyClick('4')} />
            <PhoneButton x={50.2} y={55.2} label="5" width="3.8%" height="5.5%" debugMode={debugMode} onClick={() => handleKeyClick('5')} />
            <PhoneButton x={55.9} y={55.5} label="6" width="3.6%" height="3.7%" debugMode={debugMode} onClick={() => handleKeyClick('6')} />

            {/* Row 3 */}
            <PhoneButton x={44} y={60} label="7" width="4.4%" height="5.8%" debugMode={debugMode} onClick={() => handleKeyClick('7')} />
            <PhoneButton x={50.2} y={62.4} label="8" width="4.4%" height="5.8%" debugMode={debugMode} onClick={() => handleKeyClick('8')} />
            <PhoneButton x={56.5} y={62.4} label="9" width="3.6%" height="4.8%" debugMode={debugMode} onClick={() => handleKeyClick('9')} />

            {/* Row 4 */}
            <PhoneButton x={44} y={66} label="*" width="3.6%" height="6.1%" debugMode={debugMode} onClick={() => handleKeyClick('*')} />
            <PhoneButton x={50.9} y={69.9} label="0" width="3.6%" height="6.1%" debugMode={debugMode} onClick={() => handleKeyClick('0')} />
            <PhoneButton x={57.1} y={69.5} label="#" debugMode={debugMode} onClick={() => handleKeyClick('#')} />
            </HotspotLayer>

            {/* Debug toggle inside Phone Scene */}
            <button
              onClick={toggleDebug}
              className={cn(
                'absolute bottom-4 right-4 z-[110] p-3 rounded-full shadow-lg transition-all border border-white/10',
                debugMode ? 'bg-blue-600 text-white' : 'bg-zinc-900/80 text-zinc-400 hover:text-white'
              )}
              aria-label="Toggle Debug Mode"
            >
              <Bug className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface PhoneButtonProps {
  x: number;
  y: number;
  label: string;
  debugMode: boolean;
  onClick: () => void;
  width?: string;
  height?: string;
}

const PhoneButton = ({ x, y, label, debugMode, onClick, width = '3%', height }: PhoneButtonProps) => {
  return (
    <motion.button
      whileTap={{ 
        scale: 0.95, 
        filter: 'brightness(0.8)',
        x: [0, -1, 1, -1, 0],
      }}
      onClick={onClick}
      className={cn(
        "absolute cursor-pointer flex items-center justify-center group transition-colors",
        debugMode ? "border-2 border-dashed border-red-500 bg-red-500/20" : "border-none bg-transparent"
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: width,
        height: height || undefined,
        aspectRatio: height ? undefined : '1 / 1',
      }}
      aria-label={`Taste ${label}`}
    >
      {debugMode && (
        <span className="absolute text-white text-[10px] font-bold pointer-events-none drop-shadow-md">
          {label}
        </span>
      )}
    </motion.button>
  );
};
