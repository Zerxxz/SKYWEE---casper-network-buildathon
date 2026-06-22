"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch — render a stable placeholder until mounted
  React.useEffect(() => setMounted(true), [])

  const isDark = theme === "dark"

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative h-9 w-9 rounded-md skywee-hairline bg-foreground/[0.03] hover:bg-foreground/[0.08] transition-colors grid place-items-center"
    >
      {/* Render both icons but hide via opacity to avoid hydration mismatch */}
      <Sun
        size={14}
        className={[
          "absolute transition-all duration-300",
          mounted && isDark ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100",
        ].join(" ")}
      />
      <Moon
        size={14}
        className={[
          "absolute transition-all duration-300",
          mounted && isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0",
        ].join(" ")}
      />
    </button>
  )
}
