import { create } from 'zustand';

interface GameState {
  currentView: string;
  inventory: string[];
  activeButtonIndex: number | null;
  setView: (view: string) => void;
  addToInventory: (item: string) => void;
  removeFromInventory: (item: string) => void;
  setActiveButton: (index: number | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentView: 'start',
  inventory: [],
  activeButtonIndex: null,
  setView: (view) => set({ currentView: view }),
  addToInventory: (item) => set((state) => ({ 
    inventory: [...state.inventory, item] 
  })),
  removeFromInventory: (item) => set((state) => ({ 
    inventory: state.inventory.filter((i) => i !== item) 
  })),
  setActiveButton: (index) => set({ activeButtonIndex: index }),
}));
