import { create } from 'zustand';

interface SplitViewState {
  isSplitView: boolean;
  toggleSplitView: () => void;
  setSplitView: (val: boolean) => void;
}

export const useSplitViewStore = create<SplitViewState>((set) => ({
  isSplitView: false,
  toggleSplitView: () => set((state) => ({ isSplitView: !state.isSplitView })),
  setSplitView: (val) => set({ isSplitView: val }),
}));
