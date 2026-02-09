'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/game-store';
import { useAudioEngine } from '@/hooks/use-audio-engine';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';
import { BUTTON_REGIONS } from '@/constants/board-config';
import { Mic, X, Settings2, Scissors } from 'lucide-react';

const DEBUG = false; // Toggle this to show red rectangles

export const Nippelboard = () => {
  const { 
    activeButtonIndex, 
    setActiveButton, 
    isRecordingMode, 
    setRecordingMode 
  } = useGameStore();

  const [loading, setLoading] = useState(true);
  const [recordingId, setRecordingId] = useState<number | null>(null);
  const { loadSound, playSound, isLoaded, initContext } = useAudioEngine();
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // Initialize and load sounds from DB
  useEffect(() => {
    const loadSounds = async () => {
      try {
        const ids = await db.getAllSoundIds();
        for (const key of ids) {
          const id = parseInt(key.replace('sound_', ''));
          const blob = await db.getSound(id);
          if (blob) {
            await loadSound(id, blob);
          }
        }
      } catch (err) {
        console.error('Failed to load sounds:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSounds();
  }, [loadSound]);

  const handleButtonClick = async (index: number) => {
    // Ensure AudioContext is unlocked on first interaction
    await initContext();

    if (isRecordingMode) {
      if (recordingId === index) {
        stopRecording();
      } else {
        startRecording(index);
      }
      return;
    }

    if (!isLoaded(index)) return;

    setActiveButton(index);
    await playSound(index, () => {
      setActiveButton(null);
    });
  };

  const startRecording = async (index: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      audioChunks.current = [];

      recorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await db.saveSound(index, audioBlob);
        await loadSound(index, audioBlob);
        setRecordingId(null);
        setRecordingMode(false);
        // Instant playback for confirmation
        handleButtonClick(index);
      };

      recorder.start();
      setRecordingId(index);
    } catch (err) {
      console.error('Recording failed:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const getClipPath = (index: number | null) => {
    if (index === null) return 'inset(0 0 100% 100%)';
    const r = BUTTON_REGIONS[index];
    const top = r.top;
    const left = r.left;
    const right = 100 - (r.left + r.width);
    const bottom = 100 - (r.top + r.height);
    return `inset(${top}% ${right}% ${bottom}% ${left}%)`;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] touch-none select-none">
      
      {/* Board Container with 2532/1170 aspect ratio */}
      <div className="relative w-full max-w-[98vw] shadow-2xl overflow-hidden rounded-xl bg-black border-2 border-zinc-800" style={{ aspectRatio: '2532 / 1170' }}>
        
        {/* Layer 1: Base image (board_off) */}
        <div className="absolute inset-0 z-10">
           <img 
            src="/assets/images/board_off.webp" 
            alt="Board" 
            className="w-full h-full object-contain pointer-events-none"
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
            className="w-full h-full object-contain"
          />
        </div>

        {/* Layer 3: Interaction Grid (Hotspots) */}
        <div className="absolute inset-0 z-30">
          {BUTTON_REGIONS.map((region, i) => (
            <button
              key={i}
              onClick={() => handleButtonClick(i)}
              className={cn(
                "absolute transition-transform active:scale-95 touch-manipulation outline-none",
                DEBUG && "bg-red-500/30 border border-red-500",
                isRecordingMode && "hover:bg-red-500/10 cursor-pointer",
                recordingId === i && "animate-pulse bg-red-600/40"
              )}
              style={{
                top: `${region.top}%`,
                left: `${region.left}%`,
                width: `${region.width}%`,
                height: `${region.height}%`,
                WebkitTapHighlightColor: 'transparent'
              }}
              aria-label={`Pad ${i + 1}`}
            >
              {isRecordingMode && !recordingId && !isLoaded(i) && (
                <div className="w-full h-full flex items-center justify-center opacity-30">
                  <Mic className="w-6 h-6 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Floating UI Controls */}
      <div className="absolute top-4 right-4 z-40 flex gap-2 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)]">
        <button
          onClick={() => setRecordingMode(!isRecordingMode)}
          className={cn(
            "p-3 rounded-full shadow-lg transition-all border border-white/10",
            isRecordingMode ? "bg-red-600 text-white animate-pulse" : "bg-zinc-900/80 text-zinc-400 hover:text-white"
          )}
        >
          {isRecordingMode ? <X className="w-5 h-5" /> : <Settings2 className="w-5 h-5" />}
        </button>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
             <div className="w-10 h-10 border-4 border-zinc-700 border-t-white rounded-full animate-spin" />
             <p className="text-zinc-500 font-medium">Nippelboard lädt...</p>
          </div>
        </div>
      )}
    </div>
  );
};
