'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/game-store';
import { HotspotLayer } from './HotspotLayer';
import { audioEngine } from '@/lib/audio-engine';
import { cn } from '@/lib/utils';
import { Bug, ArrowLeft } from 'lucide-react';
import { useDTMF } from '@/hooks/use-dtmf';
import { PhoneLCD } from './PhoneLCD';

// Phone directory: number → audio file
const PHONE_DIRECTORY: Record<string, string> = {
  '110': '/assets/audio/110_bitte_helfen_sie_mir.mp3',
};

export const TelefonSzene = () => {
  const { 
    showPhone, togglePhone, 
    dialedNumber, dialKey, resetDialedNumber, deleteLastDigit, 
    callStatus, setCallStatus,
    debugMode, toggleDebug 
  } = useGameStore();
  const { playKey } = useDTMF();

  // Refs for cleanup
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ringbackNodesRef = useRef<{ oscs: OscillatorNode[]; gain: GainNode; ctx: AudioContext } | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // === CLEANUP: Stop all audio ===
  const stopAllAudio = useCallback(() => {
    // Stop main audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    // Stop ringback tone
    if (ringbackNodesRef.current) {
      try {
        ringbackNodesRef.current.oscs.forEach(osc => {
          try { osc.stop(); } catch { /* already stopped */ }
        });
        ringbackNodesRef.current.gain.disconnect();
      } catch { /* ignore */ }
      ringbackNodesRef.current = null;
    }
    // Clear timeout
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    setCallStatus('idle');
  }, [setCallStatus]);

  // === RINGBACK TONE (425 Hz, German standard) ===
  const playRingbackTone = useCallback(() => {
    const ctx = audioEngine.init();
    const now = ctx.currentTime;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.connect(ctx.destination);

    // German ringback: 425 Hz, 1s on / 4s off pattern
    // We play 2 full "ring" bursts in 2 seconds: 0-0.8s on, 0.8-1.2s off, 1.2-2.0s on
    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.setValueAtTime(0.08, now + 0.8);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.85);
    gainNode.gain.setValueAtTime(0, now + 1.2);
    gainNode.gain.linearRampToValueAtTime(0.08, now + 1.25);
    gainNode.gain.setValueAtTime(0.08, now + 2.0);
    gainNode.gain.linearRampToValueAtTime(0, now + 2.05);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(425, now);
    osc.connect(gainNode);
    osc.start(now);
    osc.stop(now + 2.1);

    ringbackNodesRef.current = { oscs: [osc], gain: gainNode, ctx };
  }, []);

  // === CALL SEQUENCE ===
  const handleCall = useCallback((number: string) => {
    const audioFile = PHONE_DIRECTORY[number];
    if (!audioFile) return;

    // Start dialing phase
    setCallStatus('dialing');
    playRingbackTone();

    // After 2 seconds: stop ringback, play actual audio
    callTimeoutRef.current = setTimeout(() => {
      // Clean up ringback
      if (ringbackNodesRef.current) {
        try {
          ringbackNodesRef.current.gain.disconnect();
        } catch { /* ignore */ }
        ringbackNodesRef.current = null;
      }

      // Transition to connected
      setCallStatus('connected');

      // Play the actual audio file
      const audio = new Audio(audioFile);
      audioRef.current = audio;
      audio.play().catch(() => { /* autoplay blocked */ });

      // When audio ends, hang up
      audio.addEventListener('ended', () => {
        setCallStatus('idle');
        resetDialedNumber();
        audioRef.current = null;
      });
    }, 2000);
  }, [setCallStatus, playRingbackTone, resetDialedNumber]);

  // === CHECK FOR KNOWN NUMBERS ===
  useEffect(() => {
    if (callStatus !== 'idle') return; // Don't check while in a call
    if (dialedNumber.length >= 3) {
      // Check phone directory
      if (PHONE_DIRECTORY[dialedNumber]) {
        handleCall(dialedNumber);
        return;
      }
      // Legacy 666 easter egg
      if (dialedNumber.endsWith('666')) {
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
        setTimeout(resetDialedNumber, 2000);
      }
    }
  }, [dialedNumber, callStatus, handleCall, resetDialedNumber]);

  // === CLEANUP on scene exit ===
  useEffect(() => {
    if (!showPhone) {
      stopAllAudio();
      resetDialedNumber();
    }
  }, [showPhone, stopAllAudio, resetDialedNumber]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAllAudio();
  }, [stopAllAudio]);

  // === KEY HANDLERS (locked during calls) ===
  const handleKeyPress = (key: string) => {
    if (callStatus !== 'idle') return; // Keys locked during call

    playKey(key);

    if (key === '*' || key === '#') {
      resetDialedNumber();
      return;
    }

    setTimeout(() => {
      dialKey(key);
    }, 50);
  };

  const handleDelete = () => {
    if (callStatus !== 'idle') return; // Keys locked during call
    playKey('#');
    deleteLastDigit();
  };

  // === BACK BUTTON ===
  const handleBack = () => {
    stopAllAudio();
    togglePhone(false);
  };

  return (
    <AnimatePresence>
      {showPhone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
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

            {/* LCD Display */}
            <PhoneLCD number={dialedNumber} callStatus={callStatus} debugMode={debugMode} />

            {/* Hotspot Layer for Buttons */}
            <HotspotLayer>
              {/* Row 1 */}
              <PhoneButton x={45.3} y={48} label="1" width="3.8%" height="5.5%" debugMode={debugMode} onPointerDown={() => handleKeyPress('1')} disabled={callStatus !== 'idle'} />
              <PhoneButton x={50.2} y={48} label="2" width="3.8%" height="5.5%" debugMode={debugMode} onPointerDown={() => handleKeyPress('2')} disabled={callStatus !== 'idle'} />
              <PhoneButton x={56.1} y={47.5} label="3" debugMode={debugMode} onPointerDown={() => handleKeyPress('3')} disabled={callStatus !== 'idle'} />

              {/* Row 2 */}
              <PhoneButton x="calc(47% - 5mm)" y="calc(56% - 0.5mm)" label="4" width="3.8%" height="5.5%" debugMode={debugMode} onPointerDown={() => handleKeyPress('4')} disabled={callStatus !== 'idle'} />
              <PhoneButton x={50.2} y={55.2} label="5" width="3.8%" height="5.5%" debugMode={debugMode} onPointerDown={() => handleKeyPress('5')} disabled={callStatus !== 'idle'} />
              <PhoneButton x={55.9} y={55.5} label="6" width="3.6%" height="3.7%" debugMode={debugMode} onPointerDown={() => handleKeyPress('6')} disabled={callStatus !== 'idle'} />

              {/* Row 3 */}
              <PhoneButton x={44} y={62.4} label="7" width="4.4%" height="5.8%" debugMode={debugMode} onPointerDown={() => handleKeyPress('7')} disabled={callStatus !== 'idle'} />
              <PhoneButton x={50.2} y={62.4} label="8" width="4.4%" height="5.8%" debugMode={debugMode} onPointerDown={() => handleKeyPress('8')} disabled={callStatus !== 'idle'} />
              <PhoneButton x={56.5} y={62.4} label="9" width="3.6%" height="4.8%" debugMode={debugMode} onPointerDown={() => handleKeyPress('9')} disabled={callStatus !== 'idle'} />

              {/* Row 4 */}
              <PhoneButton x={44} y={70} label="*" width="3.6%" height="6.1%" debugMode={debugMode} onPointerDown={() => handleKeyPress('*')} disabled={callStatus !== 'idle'} />
              <PhoneButton x={50.9} y={69.9} label="0" width="3.6%" height="6.1%" debugMode={debugMode} onPointerDown={() => handleKeyPress('0')} disabled={callStatus !== 'idle'} />
              <PhoneButton x={57.1} y={69.5} label="#" debugMode={debugMode} onPointerDown={() => handleKeyPress('#')} disabled={callStatus !== 'idle'} />

              {/* Delete Button */}
              <PhoneButton x="calc(61% + 9mm)" y="calc(56% + 15.5mm)" label="←" width="4.2%" height="6%" debugMode={debugMode} onPointerDown={handleDelete} disabled={callStatus !== 'idle'} />
            </HotspotLayer>

            {/* Back Button */}
            <button
              onClick={handleBack}
              className="absolute top-4 left-4 z-[110] p-3 rounded-full shadow-lg transition-all border border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800/90 active:scale-95"
              aria-label="Zurück"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

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
  x: number | string;
  y: number | string;
  label: string;
  debugMode: boolean;
  onPointerDown: () => void;
  width?: string;
  height?: string;
  disabled?: boolean;
}

const PhoneButton = ({ x, y, label, debugMode, onPointerDown, width = '3%', height, disabled }: PhoneButtonProps) => {
  return (
    <motion.button
      whileTap={disabled ? undefined : { 
        scale: 0.95, 
        filter: 'brightness(0.8)',
        x: [0, -1, 1, -1, 0],
      }}
      onPointerDown={disabled ? undefined : onPointerDown}
      className={cn(
        "absolute cursor-pointer flex items-center justify-center group transition-colors touch-none",
        debugMode ? "border-2 border-dashed border-red-500 bg-red-500/20" : "border-none bg-transparent",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      style={{
        left: typeof x === 'number' ? `${x}%` : x,
        top: typeof y === 'number' ? `${y}%` : y,
        width: width,
        height: height || undefined,
        aspectRatio: height ? undefined : '1 / 1',
        WebkitTapHighlightColor: 'transparent',
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
