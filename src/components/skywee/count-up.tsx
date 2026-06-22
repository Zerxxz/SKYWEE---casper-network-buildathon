"use client"

import * as React from "react"
import { useInView, useMotionValue, useSpring, animate } from "framer-motion"

/**
 * CountUp — animated number counter with easing.
 *
 * Animates from 0 (or previous value) to the target value when the element
 * scrolls into view. Uses spring physics for smooth, natural counting.
 *
 * Features:
 *   - Triggers on scroll into view (IntersectionObserver via useInView)
 *   - Spring-based animation (not linear — feels more natural)
 *   - Configurable decimals, separator, prefix, suffix
 *   - Respects prefers-reduced-motion (shows final value immediately)
 *   - Re-animates when value changes
 *
 * Usage:
 *   <CountUp value={24680000} format="usd" />
 *   <CountUp value={142} suffix=" agents" />
 *   <CountUp value={98.7} decimals={1} suffix="%" />
 */

type Format = "number" | "usd" | "cspr" | "compact"

interface CountUpProps {
  value: number
  /** Number format. Default: "number" */
  format?: Format
  /** Decimal places (overrides format default). */
  decimals?: number
  /** Prefix string (e.g. "$"). */
  prefix?: string
  /** Suffix string (e.g. " CSPR"). */
  suffix?: string
  /** Use thousands separator. Default: true */
  separator?: boolean
  /** Duration in seconds. Default: 1.5 */
  duration?: number
  /** className for the span */
  className?: string
}

function formatValue(
  val: number,
  format: Format,
  decimals: number,
  separator: boolean,
  prefix: string,
  suffix: string,
): string {
  let formatted: string

  switch (format) {
    case "usd":
      if (val >= 1_000_000) {
        formatted = `$${(val / 1_000_000).toFixed(decimals)}M`
      } else if (val >= 1_000) {
        formatted = `$${(val / 1_000).toFixed(decimals)}K`
      } else {
        formatted = `$${val.toFixed(0)}`
      }
      break
    case "cspr":
      if (val >= 1_000_000) {
        formatted = `${(val / 1_000_000).toFixed(decimals)}M CSPR`
      } else if (val >= 1_000) {
        formatted = `${(val / 1_000).toFixed(decimals)}K CSPR`
      } else {
        formatted = `${val.toFixed(decimals)} CSPR`
      }
      break
    case "compact":
      if (val >= 1_000_000) {
        formatted = `${(val / 1_000_000).toFixed(decimals)}M`
      } else if (val >= 1_000) {
        formatted = `${(val / 1_000).toFixed(decimals)}K`
      } else {
        formatted = val.toFixed(decimals)
      }
      break
    case "number":
    default:
      formatted = separator
        ? val.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        : val.toFixed(decimals)
      break
  }

  return `${prefix}${formatted}${suffix}`
}

function getDecimalsForFormat(format: Format, value: number): number {
  switch (format) {
    case "usd":
    case "cspr":
    case "compact":
      return value < 100 ? 1 : 0
    case "number":
    default:
      return value < 100 && value % 1 !== 0 ? 1 : 0
  }
}

export function CountUp({
  value,
  format = "number",
  decimals,
  prefix = "",
  suffix = "",
  separator = true,
  duration = 1.5,
  className,
}: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })
  const [displayValue, setDisplayValue] = React.useState(0)
  const [reducedMotion, setReducedMotion] = React.useState(false)

  // Check reduced motion preference
  React.useEffect(() => {
    if (typeof window === "undefined") return
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  }, [])

  // Determine decimals
  const effectiveDecimals = decimals ?? getDecimalsForFormat(format, value)

  // Animate when in view or value changes
  React.useEffect(() => {
    if (!inView) return

    // Reduced motion: show final value immediately
    if (reducedMotion) {
      setDisplayValue(value)
      return
    }

    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1], // easeOutQuint
      onUpdate: (v) => setDisplayValue(v),
    })

    return () => controls.stop()
  }, [inView, value, duration, reducedMotion])

  return (
    <span ref={ref} className={className}>
      {formatValue(displayValue, format, effectiveDecimals, separator, prefix, suffix)}
    </span>
  )
}
