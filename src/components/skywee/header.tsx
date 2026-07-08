"use client"

import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"

const NAV_ITEMS = [
  { label: "Overview", href: "#overview" },
  { label: "Modules", href: "#modules" },
  { label: "Live Activity", href: "#activity" },
  { label: "Casper Stack", href: "#stack" },
  { label: "Buildathon", href: "#buildathon" },
]

export function SkyweeHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        "border-b",
        scrolled
          ? "border-white/10 bg-black/60 backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent bg-black/20 backdrop-blur-md backdrop-saturate-120",
      ].join(" ")}
      style={{
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(150%)" : "blur(10px) saturate(120%)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="#top" className="flex items-center gap-2.5 group" aria-label="SKYWEE home">
            <div
              aria-hidden
              className="relative h-8 w-8 rounded-md bg-white text-black grid place-items-center font-black text-sm tracking-tighter"
            >
              S
              <span className="absolute inset-0 rounded-md ring-1 ring-white/20" />
            </div>
            <span className="font-mono text-sm font-bold tracking-[0.18em] text-white">
              SKYWEE
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors rounded-md hover:bg-white/5"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right side: network badge + connect */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
              <span className="relative flex h-1.5 w-1.5">
                <span className="skywee-pulse-dot absolute inline-flex h-full w-full rounded-full bg-white/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/70">
                Casper Testnet
              </span>
            </div>
            <button
              type="button"
              className="px-3.5 py-1.5 text-xs font-semibold bg-white text-black rounded-md hover:bg-white/90 transition-colors"
            >
              Connect Wallet
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="md:hidden p-2 text-white/70 hover:text-white"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-black/80 backdrop-blur-xl">
          <nav className="px-4 py-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-md"
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              className="w-full mt-2 px-3 py-2 text-sm font-semibold bg-white text-black rounded-md"
            >
              Connect Wallet
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
