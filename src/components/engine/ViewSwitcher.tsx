'use client';

import { useGameStore } from '@/store/game-store';
import { Hotspot, HotspotLayer } from './HotspotLayer';

export const ViewSwitcher = () => {
  const { currentView, setView } = useGameStore();

  if (currentView === 'start') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white">
        <h2 className="text-4xl font-bold mb-8">Start Scene</h2>
        <p className="mb-4">Klicke auf den roten Bereich, um zur Test-Szene zu wechseln.</p>
        <HotspotLayer>
          <Hotspot 
            x={40} y={40} width={20} height={20} 
            onClick={() => setView('test-scene')} 
            label="Gehe zu Test-Szene"
          />
        </HotspotLayer>
        {/* Debug visual for the hotspot */}
        <div className="absolute left-[40%] top-[40%] w-[20%] h-[20%] border-2 border-dashed border-red-500 pointer-events-none flex items-center justify-center">
          <span className="text-red-500 text-sm">Hotspot</span>
        </div>
      </div>
    );
  }

  if (currentView === 'test-scene') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white">
        <h2 className="text-4xl font-bold mb-8">Test Scene</h2>
        <p className="mb-4">Klicke auf den blauen Bereich, um zurückzukehren.</p>
        <HotspotLayer>
          <Hotspot 
            x={10} y={10} width={20} height={20} 
            onClick={() => setView('start')} 
            label="Zurück zum Start"
          />
        </HotspotLayer>
        {/* Debug visual for the hotspot */}
        <div className="absolute left-[10%] top-[10%] w-[20%] h-[20%] border-2 border-dashed border-blue-500 pointer-events-none flex items-center justify-center">
          <span className="text-blue-500 text-sm">Zurück</span>
        </div>
      </div>
    );
  }

  return null;
};
