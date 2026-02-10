'use client';

import { useGameStore } from '@/store/game-store';
import { motion } from 'framer-motion';
import { OrientationGuard } from './OrientationGuard';
import { useEffect } from 'react';

export const GameContainer = ({ children }: { children: React.ReactNode }) => {
  const { currentView, isAssetsLoaded, setAssetsLoaded } = useGameStore();

  useEffect(() => {
    // Preload critical images
    const imagesToPreload = [
      '/assets/images/schreibtisch_szene.jpeg',
      '/assets/images/board_off.webp',
      '/assets/images/board_on.webp',
      '/assets/images/telefon_szene.jpeg',
    ];

    let loadedCount = 0;
    const totalImages = imagesToPreload.length;

    if (totalImages === 0) {
      setAssetsLoaded(true);
      return;
    }

    imagesToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          // Add a small artificial delay for a premium feel
          setTimeout(() => setAssetsLoaded(true), 1200);
        }
      };
      img.onerror = () => {
        console.error(`Failed to preload: ${src}`);
        loadedCount++;
        if (loadedCount === totalImages) {
          setAssetsLoaded(true);
        }
      };
    });
  }, [setAssetsLoaded]);

  if (!isAssetsLoaded) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative w-16 h-16">
             <div className="absolute inset-0 border-4 border-zinc-800 rounded-full" />
             <div className="absolute inset-0 border-4 border-t-white rounded-full animate-spin" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-white font-light tracking-[0.3em] uppercase text-sm">Initializing</h1>
            <div className="w-32 h-[1px] bg-zinc-800 relative overflow-hidden">
               <motion.div 
                 className="absolute inset-0 bg-white"
                 animate={{ left: ['-100%', '100%'] }}
                 transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
               />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <OrientationGuard>
      <main className="fixed inset-0 overflow-hidden bg-black select-none touch-none">
        {children}
      </main>
    </OrientationGuard>
  );
};
