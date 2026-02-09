import { create } from 'zustand';

interface GameState {
  currentView: string;
  inventory: string[];
  isRecordingMode: boolean;
  activeButtonIndex: number | null;
  setView: (view: string) => void;
  addToInventory: (item: string) => void;
  removeFromInventory: (item: string) => void;
  setRecordingMode: (mode: boolean) => void;
  setActiveButton: (index: number | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentView: 'start',
  inventory: [],
  isRecordingMode: false,
  activeButtonIndex: null,
  setView: (view) => set({ currentView: view }),
  addToInventory: (item) => set((state) => ({ 
    inventory: [...state.inventory, item] 
  })),
  removeFromInventory: (item) => set((state) => ({ 
    inventory: state.inventory.filter((i) => i !== item) 
  })),
  setRecordingMode: (mode) => set({ isRecordingMode: mode }),
  setActiveButton: (index) => set({ activeButtonIndex: index }),
}));
