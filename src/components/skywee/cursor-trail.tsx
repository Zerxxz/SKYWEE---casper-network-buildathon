"use client"

import * as React from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

/**
 * CursorTrail — multiple dots that follow the cursor with staggered delay.
 *
 * Creates a comet-like trailing effect behind the custom cursor.
 * Each dot has progressively more spring lag, creating a smooth trail.
 *
 * Features:
 *   - Configurable number of trail dots (default: 6)
 *   - Each dot has progressively softer spring (more lag)
 *   - Dots decrease in size and opacity toward the tail
 *   - Mix-blend-mode: difference for adaptive contrast
 *   - Disabled on touch devices & reduced motion
 *
 * Note: Hooks are called at top level for each dot (up to `count`).
 * This is why count is fixed at render time, not dynamic.
 */

interface CursorTrailProps {
  /** Number of trail dots. Default: 6 (max 12) */
  count?: number
}

const MAX_TRAIL = 12

export function CursorTrail({ count = 6 }: CursorTrailProps) {
  const safeCount = Math.min(MAX_TRAIL, Math.max(1, count))
  const [enabled, setEnabled] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches
    const desktop = window.matchMedia("(min-width: 768px)").matches
    setEnabled(!reducedMotion && !coarsePointer && desktop)
  }, [])

  // Create all motion values at top level — must be called unconditionally
  // We create MAX_TRAIL dots but only render `safeCount` of them
  const trailConfigs = React.useMemo(
    () =>
      Array.from({ length: MAX_TRAIL }, (_, i) => ({
        stiffness: Math.max(40, 380 - i * 35),
        damping: Math.max(12, 28 - i * 1.5),
        mass: 0.4 + i * 0.08,
        size: Math.max(2, 5 - i * 0.4),
        opacity: Math.max(0.05, 0.5 - i * 0.07),
      })),
    [],
  )

  // Create motion values for each potential dot
  const motions = trailConfigs.map((cfg) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const x = useMotionValue(-100)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const y = useMotionValue(-100)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const springX = useSpring(x, { stiffness: cfg.stiffness, damping: cfg.damping, mass: cfg.mass })
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const springY = useSpring(y, { stiffness: cfg.stiffness, damping: cfg.damping, mass: cfg.mass })
    return { x: springX, y: springY, setX: x, setY: y, size: cfg.size, opacity: cfg.opacity }
  })

  // Track mouse
  React.useEffect(() => {
    if (!enabled) return

    const handleMouseMove = (e: MouseEvent) => {
      motions.forEach((m) => {
        m.setX.set(e.clientX)
        m.setY.set(e.clientY)
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [enabled, motions])

  if (!enabled) return null

  return (
    <>
      {motions.slice(0, safeCount).map((m, i) => (
        <motion.div
          key={i}
          className="skywee-cursor-trail-dot"
          style={{
            x: m.x,
            y: m.y,
            width: m.size,
            height: m.size,
            opacity: m.opacity,
          }}
        />
      ))}
    </>
  )
}
