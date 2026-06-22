"use client"

import * as React from "react"

/**
 * ScrollReveal — reveals children when they scroll into view.
 * Uses IntersectionObserver for performance (no scroll listeners).
 *
 * Features:
 *   - One-time reveal (once visible, stays visible)
 *   - Configurable delay for staggered reveals
 *   - Direction-aware (up, down, left, right, scale)
 *   - Respects prefers-reduced-motion (shows immediately)
 *   - Works with nested elements
 *
 * Usage:
 *   <ScrollReveal>Reveals from bottom</ScrollReveal>
 *   <ScrollReveal direction="left" delay={0.1}>Reveals from right</ScrollReveal>
 *   <ScrollReveal as="section">Wraps in a section tag</ScrollReveal>
 */

type Direction = "up" | "down" | "left" | "right" | "scale" | "none"

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  /** Direction to reveal from. Default: "up" (slides up) */
  direction?: Direction
  /** Delay in seconds before reveal starts. Default: 0 */
  delay?: number
  /** Threshold (0-1) of element visibility to trigger. Default: 0.15 */
  threshold?: number
  /** Render as different element. Default: "div" */
  as?: "div" | "section" | "article" | "li" | "span"
  /** Distance to travel. Default: 24px */
  distance?: number
}

export function ScrollReveal({
  children,
  className = "",
  direction = "up",
  delay = 0,
  threshold = 0.15,
  as: Tag = "div",
  distance = 24,
}: ScrollRevealProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect reduced motion — show immediately
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold, rootMargin: "0px 0px -50px 0px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  // Calculate initial transform based on direction
  const getInitialTransform = () => {
    switch (direction) {
      case "up": return `translateY(${distance}px)`
      case "down": return `translateY(-${distance}px)`
      case "left": return `translateX(${distance}px)`
      case "right": return `translateX(-${distance}px)`
      case "scale": return `scale(0.95)`
      case "none": return "none"
    }
  }

  const style: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "none" : getInitialTransform(),
    transition: `opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
    willChange: "opacity, transform",
  }

  return (
    // @ts-expect-error — dynamic tag
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  )
}

/**
 * ScrollRevealContainer — for staggered reveals of multiple children.
 * Each direct child gets an incrementing delay.
 */
export function ScrollRevealContainer({
  children,
  className = "",
  stagger = 0.08,
  direction = "up",
  threshold = 0.15,
}: {
  children: React.ReactNode
  className?: string
  stagger?: number
  direction?: Direction
  threshold?: number
}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, i) => {
        if (!React.isValidElement(child)) return child
        return (
          <ScrollReveal
            key={child.key ?? i}
            direction={direction}
            delay={i * stagger}
            threshold={threshold}
          >
            {child}
          </ScrollReveal>
        )
      })}
    </div>
  )
}
