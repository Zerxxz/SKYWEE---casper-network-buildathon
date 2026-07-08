"use client"

import * as React from "react"
import { useSkyweeSettings } from "@/lib/skywee/settings-store"

/**
 * AmbientParticles — subtle floating dots in the background.
 *
 * Creates a calm, atmospheric feel with slowly drifting particles.
 * Particles are purely CSS-animated (no JS runtime cost).
 *
 * Features:
 *   - 15 particles with random positions, sizes, durations
 *   - Slow vertical drift + slight horizontal sway
 *   - Very low opacity (subtle, not distracting)
 *   - Disabled on reduced motion
 *   - Configurable via settings store
 */

const PARTICLE_COUNT = 15

interface Particle {
  id: number
  left: number
  top: number
  size: number
  duration: number
  delay: number
  swayDuration: number
  opacity: number
}

// Generate stable random particles (memoized)
const PARTICLES: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: 1 + Math.random() * 2.5, // 1px - 3.5px
  duration: 15 + Math.random() * 20, // 15s - 35s
  delay: Math.random() * 10, // 0s - 10s
  swayDuration: 8 + Math.random() * 6, // 8s - 14s
  opacity: 0.1 + Math.random() * 0.2, // 0.1 - 0.3
}))

export function AmbientParticles() {
  const [enabled, setEnabled] = React.useState(false)
  const particlesEnabled = useSkyweeSettings((s) => s.particlesEnabled)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setEnabled(!reducedMotion && particlesEnabled)
  }, [particlesEnabled])

  if (!enabled) return null

  return (
    <div className="skywee-particles-container" aria-hidden>
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          className="skywee-particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            // Vertical drift animation
            animation: `skywee-particle-drift ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
            // Horizontal sway (separate animation on inner element via ::before)
            ["--sway-duration" as string]: `${p.swayDuration}s`,
            ["--sway-delay" as string]: `${p.delay * 0.5}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
