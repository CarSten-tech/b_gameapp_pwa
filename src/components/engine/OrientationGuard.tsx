'use client';

import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';

export const OrientationGuard = ({ children }: { children: React.ReactNode }) => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check window dimensions or screen orientation
      const isP = window.innerHeight > window.innerWidth;
      setIsPortrait(isP);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (isPortrait) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <Smartphone className="w-16 h-16 mb-4 animate-bounce rotate-90" />
        <h1 className="text-2xl font-bold mb-2">Bitte Handy drehen</h1>
        <p className="text-gray-400">
          Dieses Spiel ist für den Querformat-Modus optimiert. Bitte drehe dein Gerät, um fortzufahren.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
