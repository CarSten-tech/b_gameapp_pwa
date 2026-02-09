'use client';

interface HotspotProps {
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  onClick: () => void;
  label?: string;
}

export const Hotspot = ({ x, y, width, height, onClick, label }: HotspotProps) => {
  return (
    <button
      onClick={onClick}
      className="absolute cursor-pointer border-2 border-transparent hover:border-yellow-400/50 transition-colors group"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
      }}
      aria-label={label || 'Hotspot'}
    >
      {/* Visual aid for debugging, can be removed later */}
      <div className="hidden group-hover:block absolute inset-0 bg-yellow-400/10" />
    </button>
  );
};

export const HotspotLayer = ({ children }: { children: React.ReactNode }) => {
  return <div className="absolute inset-0 z-10">{children}</div>;
};
