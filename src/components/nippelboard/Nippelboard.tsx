'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/game-store';
import { audioEngine } from '@/lib/audio-engine';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';
import { Mic, Play, X } from 'lucide-react';

const BUTTON_ROWS = 3;
const BUTTON_COLS = 5;
const TOTAL_BUTTONS = BUTTON_ROWS * BUTTON_COLS;

// Precision tuning based on user screenshot (Board is ~82% of total width/height internally)
const INNER_PADDING = {
  top: 13,    // % (Pushes grid down)
  bottom: 11, // % (Pushes grid up)
  left: 10,   // % (Shrinks from left)
  right: 10   // % (Shrinks from right)
};
const GRID_GAP = '0.5%'; 

export const Nippelboard = () => {
  const { 
    activeButtonIndex, 
    setActiveButton, 
    isRecordingMode, 
    setRecordingMode 
  } = useGameStore();

  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState(false);
  const [recordingId, setRecordingId] = useState<number | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // Initialize and load sounds from DB
  useEffect(() => {
    const loadSounds = async () => {
      const ids = await db.getAllSoundIds();
      for (const key of ids) {
        const id = parseInt(key.replace('sound_', ''));
        const blob = await db.getSound(id);
        if (blob) {
          await audioEngine.loadFromBlob(id, blob);
        }
      }
      setLoading(false);
    };
    loadSounds();
  }, []);

  const handleButtonClick = async (index: number) => {
    if (isRecordingMode) {
      if (recordingId === index) {
        stopRecording();
      } else {
        startRecording(index);
      }
      return;
    }

    if (!audioEngine.isLoaded(index)) return;

    setActiveButton(index);
    const duration = audioEngine.play(index, () => {
      setActiveButton(null);
    });
    
    // Fallback if onended doesn't fire as expected (e.g. very short sounds)
    setTimeout(() => {
      setActiveButton(null);
    }, duration * 1000 + 100);
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
        await audioEngine.loadFromBlob(index, audioBlob);
        setRecordingId(null);
        setRecordingMode(false);
        // Playback recorded sound for confirmation
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

  // Helper to calculate clip-path for 3x5 grid
  const getClipPath = (index: number | null) => {
    if (index === null) return 'inset(0 0 100% 100%)';
    
    const row = Math.floor(index / BUTTON_COLS);
    const col = index % BUTTON_COLS;
    
    // Calculate cell size
    const cellWidth = (100 - INNER_PADDING.left - INNER_PADDING.right) / BUTTON_COLS;
    const cellHeight = (100 - INNER_PADDING.top - INNER_PADDING.bottom) / BUTTON_ROWS;
    
    const top = INNER_PADDING.top + (row * cellHeight);
    const bottom = 100 - (INNER_PADDING.top + (row + 1) * cellHeight);
    const left = INNER_PADDING.left + (col * cellWidth);
    const right = 100 - (INNER_PADDING.left + (col + 1) * cellWidth);
    
    return `inset(${top}% ${right}% ${bottom}% ${left}%)`;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]">
      {/* Board Container with 2532/1170 aspect ratio */}
      <div className="relative w-full max-w-[95vw] shadow-2xl overflow-hidden rounded-xl bg-zinc-900 border-4 border-zinc-800" style={{ aspectRatio: '2532 / 1170' }}>
        
        {/* Layer 1: Base image (board_off) */}
        <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center text-zinc-600 font-bold uppercase tracking-widest text-xl">
           {/* Replace with <Image> once asset exists */}
           <img 
            src="/assets/images/board_off.webp" 
            alt="Board Off" 
            className="w-full h-full object-contain"
            onError={(e) => (e.currentTarget.style.display = 'none')}
           />
           <span>Nippelboard</span>
        </div>

        {/* Layer 2: Glow image (board_on) with clipping */}
        <div 
          className="absolute inset-0 transition-opacity duration-75 z-20 pointer-events-none"
          style={{ 
            opacity: activeButtonIndex !== null ? 1 : 0,
            clipPath: getClipPath(activeButtonIndex)
          }}
        >
          <img 
            src="/assets/images/board_on.webp" 
            alt="Board On" 
            className="w-full h-full object-contain"
            onError={(e) => (e.currentTarget.parentNode as HTMLElement).classList.add('bg-yellow-500/30')}
          />
        </div>

        {/* Interaction Grid (Hotspots) */}
        <div 
          className="absolute z-30 grid grid-cols-5 grid-rows-3"
          style={{ 
            top: `${INNER_PADDING.top}%`,
            bottom: `${INNER_PADDING.bottom}%`,
            left: `${INNER_PADDING.left}%`,
            right: `${INNER_PADDING.right}%`,
            gap: GRID_GAP
          }}
        >
          {Array.from({ length: TOTAL_BUTTONS }).map((_, i) => (
            <button
              key={i}
              onClick={() => handleButtonClick(i)}
              className={cn(
                "relative transition-all active:scale-95 flex items-center justify-center rounded-xl",
                isRecordingMode ? "border-2 border-red-500/30 hover:border-red-500 bg-red-500/5 hover:bg-red-500/10" : "hover:bg-white/5",
                recordingId === i && "animate-pulse border-2 border-red-500 bg-red-500/20",
                activeButtonIndex === i && !isRecordingMode && "bg-white/10",
                debug && "border border-white/40 bg-white/10"
              )}
              aria-label={`Button ${i + 1}`}
            >
              {isRecordingMode && !recordingId && (
                <Mic className="w-5 h-5 text-zinc-500 opacity-40" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Floating UI Controls */}
      <div className="absolute bottom-6 right-6 flex gap-4 z-40">
        <button
          onClick={() => setDebug(!debug)}
          title="Toggle Debug Grid"
          className={cn(
            "p-4 rounded-full shadow-lg transition-all",
            debug ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
          )}
          aria-label="Toggle Debug Grid"
        >
          <Play className="w-6 h-6" />
        </button>
        <button
          onClick={() => setRecordingMode(!isRecordingMode)}
          title="Toggle Recording Mode"
          className={cn(
            "p-4 rounded-full shadow-lg transition-all",
            isRecordingMode ? "bg-red-600 text-white animate-pulse" : "bg-zinc-800 text-zinc-400 hover:text-white"
          )}
          aria-label="Toggle Recording Mode"
        >
          {isRecordingMode ? <X className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <p className="text-white text-lg animate-pulse">Loading Sounds...</p>
        </div>
      )}
    </div>
  );
};
