"use client"

import * as React from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

/**
 * CustomCursor — glow dot + ring that follow the cursor.
 *
 * Features:
 *   - Outer ring: follows cursor with spring lag (premium feel)
 *   - Inner dot: follows cursor precisely (1:1)
 *   - Ring scales up on hover over interactive elements (a, button, [data-cursor])
 *   - Ring changes color on hover over [data-cursor="text"] (text cursor)
 *   - Disabled on touch devices & reduced motion
 *   - Mix-blend-mode: difference for adaptive contrast
 *
 * The cursor is rendered as a fixed overlay with pointer-events: none.
 * The native cursor is hidden via CSS on desktop.
 */

export function CustomCursor() {
  const [enabled, setEnabled] = React.useState(false)
  const [variant, setVariant] = React.useState<"default" | "hover" | "text">("default")

  // Inner dot — follows cursor 1:1 (no spring)
  const dotX = useMotionValue(-100)
  const dotY = useMotionValue(-100)

  // Outer ring — follows cursor with spring lag
  const ringX = useMotionValue(-100)
  const ringY = useMotionValue(-100)
  const ringSpringX = useSpring(ringX, { stiffness: 250, damping: 28, mass: 0.6 })
  const ringSpringY = useSpring(ringY, { stiffness: 250, damping: 28, mass: 0.6 })

  // Check if cursor should be enabled
  React.useEffect(() => {
    if (typeof window === "undefined") return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches
    const desktop = window.matchMedia("(min-width: 768px)").matches

    if (!reducedMotion && !coarsePointer && desktop) {
      setEnabled(true)
      // Hide native cursor on desktop — add body class that triggers CSS cursor: none
      document.body.classList.add("skywee-custom-cursor-active")
    }

    return () => {
      document.body.classList.remove("skywee-custom-cursor-active")
    }
  }, [])

  // Track mouse movement
  React.useEffect(() => {
    if (!enabled) return

    const handleMouseMove = (e: MouseEvent) => {
      dotX.set(e.clientX)
      dotY.set(e.clientY)
      ringX.set(e.clientX)
      ringY.set(e.clientY)
    }

    // Detect hover over interactive elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const interactive = target.closest("a, button, input, textarea, select, [role='button'], [data-cursor]")
      const textElement = target.closest("p, h1, h2, h3, h4, h5, h6, span, label, [data-cursor='text']")

      if (interactive) {
        setVariant("hover")
      } else if (textElement && window.getSelection()?.toString()) {
        setVariant("text")
      } else {
        setVariant("default")
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseover", handleMouseOver)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseover", handleMouseOver)
    }
  }, [enabled, dotX, dotY, ringX, ringY])

  if (!enabled) return null

  return (
    <>
      {/* Outer ring — spring lag, scales on hover */}
      <motion.div
        className="skywee-cursor-ring"
        style={{
          x: ringSpringX,
          y: ringSpringY,
        }}
        animate={{
          width: variant === "hover" ? 40 : variant === "text" ? 4 : 28,
          height: variant === "hover" ? 40 : variant === "text" ? 4 : 28,
          opacity: variant === "text" ? 0 : 1,
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />

      {/* Inner dot — 1:1 follow */}
      <motion.div
        className="skywee-cursor-dot"
        style={{
          x: dotX,
          y: dotY,
        }}
        animate={{
          scale: variant === "hover" ? 0 : 1,
          opacity: variant === "hover" ? 0 : 1,
        }}
        transition={{ duration: 0.15 }}
      />
    </>
  )
}
