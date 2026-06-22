"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useMagnetic } from "@/lib/skywee/use-magnetic"

/**
 * MagneticWrapper — wraps any element with magnetic hover effect.
 * The wrapped element follows the cursor slightly when hovered.
 *
 * Usage:
 *   <MagneticWrapper strength={0.2} radius={6}>
 *     <button>Click me</button>
 *   </MagneticWrapper>
 *
 * Options:
 *   - strength: how much it follows cursor (0-1). Default: 0.2
 *   - radius: max px travel. Default: 6
 *   - className: optional wrapper class
 */

interface MagneticWrapperProps {
  children: React.ReactNode
  strength?: number
  radius?: number
  className?: string
}

export function MagneticWrapper({
  children,
  strength = 0.2,
  radius = 6,
  className,
}: MagneticWrapperProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const magnetic = useMagnetic(ref, { strength, radius })

  return (
    <motion.div
      ref={ref}
      className={["inline-block", className].filter(Boolean).join(" ")}
      style={magnetic.style}
      onMouseMove={magnetic.handlers.onMouseMove}
      onMouseLeave={magnetic.handlers.onMouseLeave}
    >
      {children}
    </motion.div>
  )
}
