"use client"

import * as React from "react"

/**
 * RippleButton — button with ripple effect on click + glow on hover.
 *
 * Usage:
 *   <RippleButton onClick={...}>Click me</RippleButton>
 *   <RippleButton variant="ghost">Ghost variant</RippleButton>
 *
 * Variants:
 *   - "primary": bg-primary text-primary-foreground (default) — has glow
 *   - "ghost": skywee-hairline bg-foreground/[0.02] — no glow, subtle
 *   - "outline": skywee-hairline only — minimal
 *
 * The ripple effect creates a span at the click position that scales out
 * and fades. The glow effect is a blurred ::before pseudo-element that
 * appears on hover.
 */

type Variant = "primary" | "ghost" | "outline"

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: React.ReactNode
}

export function RippleButton({
  variant = "primary",
  className = "",
  children,
  onClick,
  ...props
}: RippleButtonProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  const variantCls: Record<Variant, string> = {
    primary: "bg-primary text-primary-foreground hover:opacity-90 skywee-btn-glow",
    ghost: "skywee-hairline bg-foreground/[0.02] hover:bg-foreground/[0.06] backdrop-blur-md",
    outline: "skywee-hairline hover:bg-foreground/[0.05]",
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current
    if (button) {
      const rect = button.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2

      const ripple = document.createElement("span")
      ripple.className = "skywee-ripple-span"
      ripple.style.width = `${size}px`
      ripple.style.height = `${size}px`
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`

      button.appendChild(ripple)
      // Remove after animation completes
      setTimeout(() => ripple.remove(), 600)
    }
    onClick?.(e)
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      className={[
        "relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all skywee-btn-ripple",
        variantCls[variant],
        className,
      ].join(" ")}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  )
}

/**
 * Hook to add ripple effect to any existing button.
 * Useful for buttons that already have their own styling.
 */
export function useRipple() {
  const ref = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    const button = ref.current
    if (!button) return

    const handleClick = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2

      const ripple = document.createElement("span")
      ripple.className = "skywee-ripple-span"
      ripple.style.width = `${size}px`
      ripple.style.height = `${size}px`
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`

      button.appendChild(ripple)
      setTimeout(() => ripple.remove(), 600)
    }

    button.classList.add("skywee-btn-ripple")
    button.addEventListener("click", handleClick)
    return () => button.removeEventListener("click", handleClick)
  }, [])

  return ref
}
