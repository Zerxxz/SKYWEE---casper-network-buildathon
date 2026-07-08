"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

/**
 * SKYWEE UI settings store.
 * Persists to localStorage so user preferences survive page reloads.
 */

interface SkyweeSettings {
  /** Enable/disable cursor trail effect */
  cursorTrailEnabled: boolean
  /** Enable/disable ambient floating particles */
  particlesEnabled: boolean
  /** Toggle cursor trail */
  toggleCursorTrail: () => void
  /** Toggle particles */
  toggleParticles: () => void
  /** Set cursor trail enabled */
  setCursorTrailEnabled: (enabled: boolean) => void
  /** Set particles enabled */
  setParticlesEnabled: (enabled: boolean) => void
}

export const useSkyweeSettings = create<SkyweeSettings>()(
  persist(
    (set) => ({
      cursorTrailEnabled: true,
      particlesEnabled: true,
      toggleCursorTrail: () =>
        set((state) => ({ cursorTrailEnabled: !state.cursorTrailEnabled })),
      toggleParticles: () =>
        set((state) => ({ particlesEnabled: !state.particlesEnabled })),
      setCursorTrailEnabled: (enabled) => set({ cursorTrailEnabled: enabled }),
      setParticlesEnabled: (enabled) => set({ particlesEnabled: enabled }),
    }),
    {
      name: "skywee-settings",
    },
  ),
)
