// Client-side user preferences, persisted via AsyncStorage.
//  - reducedMotion: skip non-essential animations (Reanimated, Framer-style).
//  - dataSaver: components that can pick a lower-bitrate variant should
//    consult this; we expose it so future video / playable bundles can
//    opt into lighter content.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const KEY = "loopit-prefs";

type State = {
  reducedMotion: boolean;
  dataSaver: boolean;
  hydrated: boolean;
  setReducedMotion: (v: boolean) => void;
  setDataSaver: (v: boolean) => void;
  hydrate: () => Promise<void>;
};

export const usePrefs = create<State>((set, get) => ({
  reducedMotion: false,
  dataSaver: false,
  hydrated: false,

  setReducedMotion: (v) => {
    set({ reducedMotion: v });
    persist();
  },

  setDataSaver: (v) => {
    set({ dataSaver: v });
    persist();
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const o = JSON.parse(raw) as {
          reducedMotion?: boolean;
          dataSaver?: boolean;
        };
        set({
          reducedMotion: !!o.reducedMotion,
          dataSaver: !!o.dataSaver,
        });
      }
    } catch {}
    set({ hydrated: true });
  },
}));

function persist() {
  const { reducedMotion, dataSaver } = usePrefs.getState();
  AsyncStorage.setItem(
    KEY,
    JSON.stringify({ reducedMotion, dataSaver }),
  ).catch(() => {});
}
