'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PhoneLCDProps {
  number: string;
  callStatus: 'idle' | 'dialing' | 'connected';
  debugMode?: boolean;
}

export const PhoneLCD = ({ number, callStatus, debugMode }: PhoneLCDProps) => {
  // Display at most 10 digits, shift left if more are added
  const displayedNumber = number.length > 10 ? number.slice(-10) : number;

  // Determine what to display based on call status
  const getDisplayContent = () => {
    switch (callStatus) {
      case 'dialing':
        return (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            className="text-[#2d3436] text-[min(2.5vw,18px)] tracking-[0.1em] opacity-80 blur-[0.4px] select-none"
            style={{
              fontFamily: "'DotGothic16', monospace",
              textShadow: '1px 1px 0px rgba(255,255,255,0.1)',
              whiteSpace: 'nowrap',
            }}
          >
            VERBINDE...
          </motion.span>
        );
      case 'connected':
        return (
          <span
            className="text-[#2d3436] text-[min(2.5vw,18px)] tracking-[0.1em] opacity-80 blur-[0.4px] select-none"
            style={{
              fontFamily: "'DotGothic16', monospace",
              textShadow: '1px 1px 0px rgba(255,255,255,0.1)',
              whiteSpace: 'nowrap',
            }}
          >
            VERBUNDEN
          </span>
        );
      default:
        return (
          <span
            className="text-[#2d3436] text-[min(3vw,24px)] tracking-[0.1em] opacity-80 blur-[0.4px] select-none"
            style={{
              fontFamily: "'DotGothic16', monospace",
              textShadow: '1px 1px 0px rgba(255,255,255,0.1)',
              whiteSpace: 'nowrap',
            }}
          >
            {displayedNumber}
          </span>
        );
    }
  };

  return (
    <div 
      className="absolute pointer-events-none"
      style={{
        left: 'calc(43.2% + 7.2mm)',
        top: 'calc(32.5% + 1.5mm)',
        width: 'calc(13.5% + 7mm)',
        height: '6.5%',
        perspective: '500px',
      }}
    >
      <div 
        className={cn(
          "relative w-full h-full flex items-center justify-end px-[5%] overflow-hidden",
          "rounded-sm",
          debugMode && "border-2 border-green-500/50"
        )}
        style={{
          transform: 'rotateX(25deg) rotateY(-5deg) rotateZ(2deg) skewX(-7deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* LCD Text */}
        {getDisplayContent()}

        {/* Scanline/Dirt/Glass Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 1px,
                rgba(0,0,0,0.05) 1px,
                rgba(0,0,0,0.05) 2px
              ),
              radial-gradient(
                circle at 50% 50%,
                transparent 0%,
                rgba(0,0,0,0.1) 100%
              )
            `,
            mixBlendMode: 'multiply',
            opacity: 0.6,
          }}
        />

        {/* Debug Grid */}
        {debugMode && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between opacity-50">
            {[...Array(5)].map((_, i) => (
              <div key={`h-${i}`} className="w-full h-[1px] bg-green-400" />
            ))}
            <div className="absolute inset-0 flex justify-between">
              {[...Array(10)].map((_, i) => (
                <div key={`v-${i}`} className="w-[1px] h-full bg-green-400" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
