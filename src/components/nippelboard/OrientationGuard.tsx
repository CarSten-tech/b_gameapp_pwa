'use client';

import React, { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';

export const OrientationGuard = ({ children }: { children: React.ReactNode }) => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  if (isPortrait) {
    return (
      <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="animate-bounce mb-6">
          <RotateCw className="w-16 h-16 text-white opacity-20" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Bitte drehe dein Gerät</h1>
        <p className="text-zinc-500 max-w-xs">
          Das Nippelboard ist für das Querformat optimiert.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
