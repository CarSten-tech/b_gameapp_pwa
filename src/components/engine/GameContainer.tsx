'use client';

import { useGameStore } from '@/store/game-store';
import { motion, AnimatePresence } from 'framer-motion';
import { OrientationGuard } from './OrientationGuard';

export const GameContainer = ({ children }: { children: React.ReactNode }) => {
  const currentView = useGameStore((state) => state.currentView);

  return (
    <OrientationGuard>
      <main className="fixed inset-0 overflow-hidden bg-black select-none touch-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative w-full h-full bg-center bg-cover bg-no-repeat"
            style={{
              // Placeholder backgrounds until real images are added
              backgroundColor: currentView === 'start' ? '#1a1a1a' : '#2a2a2a',
            }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </OrientationGuard>
  );
};
