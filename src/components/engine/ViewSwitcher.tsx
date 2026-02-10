'use client';

import { useGameStore } from '@/store/game-store';
import { SchreibtischSzene } from './SchreibtischSzene';
import { Nippelboard } from '@/components/nippelboard/Nippelboard';
import { TelefonSzene } from './TelefonSzene';
import { motion } from 'framer-motion';

export const ViewSwitcher = () => {
  const { currentView, setView } = useGameStore();

  const isNippelboard = currentView === 'nippelboard';

  return (
    <div className="relative w-full h-full">
      {/* 1. Schreibtisch Layer */}
      <motion.div
        className="absolute inset-0 z-10"
        initial={false}
        animate={{ 
          opacity: isNippelboard ? 0 : 1,
          scale: isNippelboard ? 1.5 : 1,
          pointerEvents: isNippelboard ? 'none' : 'auto'
        }}
        transition={{ 
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        <SchreibtischSzene />
      </motion.div>

      {/* 2. Nippelboard Layer */}
      <motion.div
        className="absolute inset-0 z-20"
        initial={false}
        animate={{ 
          opacity: isNippelboard ? 1 : 0,
          scale: isNippelboard ? 1 : 0.8,
          pointerEvents: isNippelboard ? 'auto' : 'none'
        }}
        transition={{ 
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        <Nippelboard onBack={() => setView('desk')} />
      </motion.div>

      {/* 3. Global Overlays (Telephone etc) */}
      <TelefonSzene />
    </div>
  );
};
