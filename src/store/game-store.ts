import { create } from 'zustand';

interface GameState {
  currentView: string;
  inventory: string[];
  activeButtonIndex: number | null;
  debugMode: boolean;
  isAssetsLoaded: boolean;
  showPhone: boolean;
  dialedNumber: string;
  callStatus: 'idle' | 'dialing' | 'connected';
  setView: (view: string) => void;
  setAssetsLoaded: (loaded: boolean) => void;
  toggleDebug: () => void;
  addToInventory: (item: string) => void;
  removeFromInventory: (item: string) => void;
  setActiveButton: (index: number | null) => void;
  togglePhone: (show: boolean) => void;
  dialKey: (key: string) => void;
  resetDialedNumber: () => void;
  deleteLastDigit: () => void;
  setCallStatus: (status: 'idle' | 'dialing' | 'connected') => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentView: 'desk',
  inventory: [],
  activeButtonIndex: null,
  debugMode: false,
  isAssetsLoaded: false,
  showPhone: false,
  dialedNumber: '',
  callStatus: 'idle',
  setView: (view) => set({ currentView: view }),
  setAssetsLoaded: (loaded) => set({ isAssetsLoaded: loaded }),
  toggleDebug: () => set((state) => ({ debugMode: !state.debugMode })),
  addToInventory: (item) => set((state) => ({ 
    inventory: [...state.inventory, item] 
  })),
  removeFromInventory: (item) => set((state) => ({ 
    inventory: state.inventory.filter((i) => i !== item) 
  })),
  setActiveButton: (index) => set({ activeButtonIndex: index }),
  togglePhone: (show) => set({ showPhone: show, dialedNumber: '' }),
  dialKey: (key) => set((state) => ({ 
    dialedNumber: (state.dialedNumber + key).slice(-20) // Limit length
  })),
  resetDialedNumber: () => set({ dialedNumber: '' }),
  deleteLastDigit: () => set((state) => ({
    dialedNumber: state.dialedNumber.slice(0, -1)
  })),
  setCallStatus: (status) => set({ callStatus: status }),
}));
