"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Settings, Sparkles, X } from "lucide-react"
import { useSkyweeSettings } from "@/lib/skywee/settings-store"

/**
 * SettingsButton — gear icon that opens a settings panel for toggling
 * cursor trail + ambient particles.
 *
 * Positioned in the header next to theme toggle.
 */
export function SettingsButton() {
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const { cursorTrailEnabled, particlesEnabled, toggleCursorTrail, toggleParticles } =
    useSkyweeSettings()

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 rounded-md skywee-hairline bg-foreground/[0.03] hover:bg-foreground/[0.08] transition-colors grid place-items-center"
        aria-label="Settings"
        title="Settings"
      >
        <Settings size={14} className={open ? "rotate-90 transition-transform" : "transition-transform"} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 rounded-lg skywee-glass-strong p-2 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-muted-foreground" />
                <span className="text-xs font-semibold">Visual Effects</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-foreground/5"
                aria-label="Close settings"
              >
                <X size={12} />
              </button>
            </div>

            {/* Toggles */}
            <div className="p-2">
              <ToggleRow
                label="Cursor Trail"
                description="Comet trail behind cursor"
                enabled={cursorTrailEnabled}
                onToggle={toggleCursorTrail}
              />
              <ToggleRow
                label="Ambient Particles"
                description="Floating dots in background"
                enabled={particlesEnabled}
                onToggle={toggleParticles}
              />
            </div>

            {/* Footer hint */}
            <div className="px-3 py-2 border-t border-border">
              <div className="text-[10px] font-mono text-muted-foreground/60">
                Settings saved automatically
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-foreground/5 transition-colors text-left"
    >
      <div className="min-w-0">
        <div className="text-xs font-medium">{label}</div>
        <div className="text-[10px] text-muted-foreground">{description}</div>
      </div>
      {/* Toggle switch */}
      <div
        className={[
          "relative h-5 w-9 rounded-full transition-colors flex-shrink-0 ml-3",
          enabled ? "bg-primary" : "bg-foreground/15",
        ].join(" ")}
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 h-4 w-4 rounded-full bg-background shadow-sm"
          style={{ left: enabled ? "calc(100% - 18px)" : "2px" }}
        />
      </div>
    </button>
  )
}
