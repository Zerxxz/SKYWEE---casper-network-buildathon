"use client"

import * as React from "react"
import {
  motion,
  useMotionValue,
  useSpring,
  type MotionStyle,
} from "framer-motion"

/**
 * useMagnetic — magnetic hover effect hook.
 *
 * The element follows the cursor slightly when hovered, creating a premium
 * tactile feel. Uses spring physics for smooth, natural movement.
 *
 * Returns motion values + handlers. Attach the ref yourself to the element.
 *
 * Usage:
 *   const ref = useRef<HTMLButtonElement>(null)
 *   const magnetic = useMagnetic(ref, { strength: 0.3 })
 *   <motion.button ref={ref} style={magnetic.style} {...magnetic.handlers}>
 *     Click me
 *   </motion.button>
 *
 * Options:
 *   - strength: how much the element follows cursor (0-1). Default: 0.25
 *   - radius: max distance in px the element will travel. Default: 8
 *
 * The effect is automatically disabled:
 *   - When prefers-reduced-motion is set
 *   - On touch devices (pointer: coarse)
 */

interface MagneticOptions {
  strength?: number
  radius?: number
}

interface MagneticReturn {
  style: MotionStyle
  handlers: {
    onMouseMove: (e: React.MouseEvent<HTMLElement>) => void
    onMouseLeave: () => void
  }
}

export function useMagnetic(
  ref: React.RefObject<HTMLElement | null>,
  { strength = 0.25, radius = 8 }: MagneticOptions = {},
): MagneticReturn {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Spring physics — stiff but with slight overshoot for natural feel
  const springConfig = { stiffness: 350, damping: 25, mass: 0.5 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  // Check if effect should be enabled
  const [enabled, setEnabled] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === "undefined") return
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches
    setEnabled(!reducedMotion && !coarsePointer)
  }, [])

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!enabled) return
      const el = ref.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Distance from cursor to center
      const deltaX = e.clientX - centerX
      const deltaY = e.clientY - centerY

      // Apply strength factor + clamp to radius
      const moveX = Math.max(-radius, Math.min(radius, deltaX * strength))
      const moveY = Math.max(-radius, Math.min(radius, deltaY * strength))

      x.set(moveX)
      y.set(moveY)
    },
    [enabled, ref, strength, radius, x, y],
  )

  const handleMouseLeave = React.useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])

  return {
    style: enabled ? { x: springX, y: springY } : {},
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
  }
}
