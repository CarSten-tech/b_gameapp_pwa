'use client';

import { useGameStore } from '@/store/game-store';
import { cn } from '@/lib/utils';

interface HotspotProps {
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  onClick: () => void;
  label?: string;
}

export const Hotspot = ({ x, y, width, height, onClick, label }: HotspotProps) => {
  const debugMode = useGameStore((state) => state.debugMode);

  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute cursor-pointer transition-colors group",
        debugMode ? "border-2 border-dashed border-red-500 bg-red-500/10" : "border-2 border-transparent hover:border-yellow-400/50"
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
      }}
      aria-label={label || 'Hotspot'}
    >
      {/* Visual aid for debugging, can be removed later */}
      <div className={cn(
        "absolute inset-0 bg-yellow-400/10",
        debugMode ? "flex items-center justify-center" : "hidden group-hover:block"
      )}>
        {debugMode && (
          <span className="text-red-500 text-[10px] font-bold truncate px-1">
            {label || 'Hotspot'}
          </span>
        )}
      </div>
    </button>
  );
};

export const HotspotLayer = ({ children }: { children: React.ReactNode }) => {
  return <div className="absolute inset-0 z-10">{children}</div>;
};
