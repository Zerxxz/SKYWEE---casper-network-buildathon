"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Bot,
  ShieldCheck,
  Users,
  Layers,
  Leaf,
  Boxes,
  Trophy,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { ConnectWalletButton } from "./connect-wallet-button"
import { WalletStatus } from "./wallet-status"
import { LiveBlockWidget } from "./live-block-widget"
import { CustomCursor } from "./custom-cursor"
import { CursorTrail } from "./cursor-trail"
import { useMagnetic } from "@/lib/skywee/use-magnetic"
import { MODULES } from "@/lib/skywee/data"

export type PageId =
  | "dashboard"
  | "agent-square"
  | "aegis"
  | "swarm-treasury"
  | "rwa-vault"
  | "carbon-guard"
  | "stack"
  | "buildathon"

interface NavItem {
  id: PageId
  label: string
  icon: LucideIcon
  group: "main" | "modules" | "meta"
  description?: string
}

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { id: "agent-square", label: "AgentSquare", icon: Bot, group: "modules", description: "Agent economy" },
  { id: "aegis", label: "Aegis", icon: ShieldCheck, group: "modules", description: "RWA insurance" },
  { id: "swarm-treasury", label: "SwarmTreasury", icon: Users, group: "modules", description: "DAO execution" },
  { id: "rwa-vault", label: "RWA-X Vault", icon: Layers, group: "modules", description: "RWA AMM" },
  { id: "carbon-guard", label: "CarbonGuard", icon: Leaf, group: "modules", description: "Carbon verify" },
  { id: "stack", label: "Casper Stack", icon: Boxes, group: "meta" },
  { id: "buildathon", label: "Buildathon", icon: Trophy, group: "meta" },
]

const GROUP_LABEL: Record<NavItem["group"], string> = {
  main: "Overview",
  modules: "Modules",
  meta: "Resources",
}

// Sidebar width constants
const SIDEBAR_EXPANDED = 260
const SIDEBAR_COLLAPSED = 68
// Breakpoint at which sidebar auto-collapses (tablet). Below this, mobile drawer is used.
// We use 1024px (lg) as the desktop threshold — tablet range is 768-1023px where sidebar
// shows but auto-collapses to icon-only by default.
const TABLET_BREAKPOINT = 1024

interface SidebarLayoutProps {
  active: PageId
  onNavigate: (id: PageId) => void
  children: React.ReactNode
}

export function SidebarLayout({ active, onNavigate, children }: SidebarLayoutProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(false)
  const [isTablet, setIsTablet] = React.useState(false)
  const activeItem = NAV.find((n) => n.id === active) ?? NAV[0]

  // Persist collapsed state to localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("skywee-sidebar-collapsed")
      if (stored !== null) {
        setCollapsed(stored === "true")
      }
    } catch {
      // ignore
    }
  }, [])

  // Auto-collapse on tablet breakpoint (768px - 1023px)
  React.useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth
      const tablet = width >= 768 && width < TABLET_BREAKPOINT
      setIsTablet(tablet)
      // Auto-collapse when entering tablet range (only if user hasn't manually set a preference)
      if (tablet) {
        try {
          const userPref = localStorage.getItem("skywee-sidebar-user-pref")
          if (userPref === null) {
            setCollapsed(true)
          }
        } catch {
          setCollapsed(true)
        }
      }
    }
    checkTablet()
    window.addEventListener("resize", checkTablet)
    return () => window.removeEventListener("resize", checkTablet)
  }, [])

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem("skywee-sidebar-collapsed", String(next))
        // Mark that user has explicitly toggled — prevents auto-collapse from overriding
        localStorage.setItem("skywee-sidebar-user-pref", String(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  // Keyboard shortcut: Cmd/Ctrl+B to toggle sidebar
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+B (Mac) or Ctrl+B (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "b" && !e.shiftKey && !e.altKey) {
        // Only on desktop/tablet where sidebar is visible (not mobile drawer)
        if (window.innerWidth >= 768) {
          e.preventDefault()
          toggleCollapsed()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleCollapsed])

  const handleNavigate = (id: PageId) => {
    onNavigate(id)
    setMobileOpen(false)
  }

  // Group nav items
  const groups = ["main", "modules", "meta"] as const
  const groupedNav = groups.map((g) => ({
    group: g,
    items: NAV.filter((n) => n.group === g),
  }))

  // Dynamic padding for main content based on sidebar state
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  return (
    <div className="relative min-h-screen flex bg-background">
      {/* ====== CUSTOM CURSOR (desktop only) ====== */}
      <CustomCursor />
      <CursorTrail count={6} />

      {/* ====== GLOBAL SKYWEE WATERMARK (parallax on mouse move) ====== */}
      <ParallaxWatermark />
      <div className="skywee-grain" aria-hidden />

      {/* ====== SIDEBAR (desktop + tablet) — collapsible ====== */}
      <aside
        className="hidden md:flex fixed inset-y-0 left-0 z-40 flex-col border-r border-sidebar-border bg-sidebar overflow-hidden skywee-sidebar-aside"
        style={{
          width: sidebarWidth,
        }}
      >
        <SidebarContent
          groupedNav={groupedNav}
          active={active}
          onNavigate={handleNavigate}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
      </aside>

      {/* ====== SIDEBAR (mobile drawer) ====== */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col border-r border-sidebar-border bg-sidebar"
            >
              <SidebarContent
                groupedNav={groupedNav}
                active={active}
                onNavigate={handleNavigate}
                onClose={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ====== MAIN CONTENT ====== */}
      <div
        className="flex-1 relative z-10 flex flex-col min-w-0 skywee-main-shift"
        style={{
          "--skywee-sidebar-width": `${sidebarWidth}px`,
        } as React.CSSProperties}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/60 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            {/* Left: mobile menu + desktop collapse toggle + breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile: open drawer */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 -ml-2 rounded-md hover:bg-foreground/5"
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>

              {/* Desktop/tablet: collapse toggle */}
              <button
                type="button"
                onClick={toggleCollapsed}
                className="hidden md:flex p-2 -ml-2 rounded-md hover:bg-foreground/5 transition-colors"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={collapsed ? "Expand sidebar (⌘B)" : "Collapse sidebar (⌘B)"}
              >
                {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>

              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hidden sm:inline">
                  SKYWEE
                </span>
                <span className="text-muted-foreground/40 hidden sm:inline">/</span>
                <span className="text-sm font-semibold truncate">
                  {activeItem.label}
                </span>
              </div>
            </div>

            {/* Right: network badge + theme toggle + connect wallet */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md skywee-hairline bg-foreground/[0.03]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="skywee-pulse-dot absolute inline-flex h-full w-full rounded-full bg-foreground/70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-foreground" />
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Casper Testnet
                </span>
              </div>

              <ThemeToggle />

              {/* Real Casper Wallet button */}
              <ConnectWalletButton />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 relative overflow-hidden">
          <PageTransition pageId={active}>
            {children}
          </PageTransition>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-background/40 backdrop-blur-sm">
          <div className="px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                aria-hidden
                className="h-6 w-6 rounded bg-primary text-primary-foreground grid place-items-center font-black text-[10px] tracking-tighter"
              >
                S
              </div>
              <span className="font-mono text-xs font-bold tracking-[0.18em]">
                SKYWEE
              </span>
              <span className="text-[10px] font-mono text-muted-foreground ml-2">
                © 2026 · Casper Buildathon
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
              <span>Agentic AI</span>
              <span>·</span>
              <span>DeFi</span>
              <span>·</span>
              <span>RWA</span>
              <span>·</span>
              <span>Casper Network</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

/* =================== Sidebar Content =================== */

interface SidebarContentProps {
  groupedNav: Array<{ group: string; items: NavItem[] }>
  active: PageId
  onNavigate: (id: PageId) => void
  onClose?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

function SidebarContent({
  groupedNav,
  active,
  onNavigate,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={["h-16 flex items-center border-b border-sidebar-border", collapsed ? "justify-center px-2" : "justify-between px-5"].join(" ")}>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            onNavigate("dashboard")
          }}
          className="flex items-center gap-2.5 group flex-shrink-0"
          title={collapsed ? "SKYWEE" : undefined}
        >
          <div
            aria-hidden
            className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-black text-sm tracking-tighter group-hover:scale-105 transition-transform"
          >
            S
          </div>
          <span
            className={[
              "font-mono text-sm font-bold tracking-[0.18em] whitespace-nowrap skywee-sidebar-text",
              collapsed ? "is-hidden w-0 overflow-hidden" : "",
            ].join(" ")}
          >
            SKYWEE
          </span>
        </a>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-md hover:bg-foreground/5"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={["flex-1 overflow-y-auto skywee-sidebar-scroll py-4", collapsed ? "px-2" : "px-3"].join(" ")}>
        {groupedNav.map(({ group, items }) => (
          <div key={group} className={collapsed ? "mb-4" : "mb-6"}>
            {/* Group label — fades out when collapsed */}
            <div
              className={[
                "px-3 mb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/60 skywee-sidebar-text",
                collapsed ? "is-hidden h-0 overflow-hidden mb-0" : "",
              ].join(" ")}
            >
              {GROUP_LABEL[group as NavItem["group"]]}
            </div>
            {/* Separator dot — fades in when collapsed */}
            <div
              className={[
                "flex justify-center mb-2 skywee-sidebar-text",
                collapsed ? "" : "is-hidden h-0 overflow-hidden mb-0",
              ].join(" ")}
            >
              <div className="h-1 w-1 rounded-full bg-foreground/20" />
            </div>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const isActive = active === item.id
                return (
                  <li key={item.id}>
                    <MagneticNavItem
                      item={item}
                      isActive={isActive}
                      collapsed={collapsed}
                      onNavigate={onNavigate}
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom: wallet + live status + shortcut hint */}
      {!collapsed ? (
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <WalletStatus />
          <LiveBlockWidget />
          {/* Keyboard shortcut hint */}
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">
              Toggle
            </span>
            <span className="skywee-kbd">⌘B</span>
          </div>
        </div>
      ) : (
        <div className="border-t border-sidebar-border p-2 flex flex-col items-center gap-2">
          <WalletStatus compact />
          <LiveBlockWidget compact />
        </div>
      )}
    </div>
  )
}

/* =================== Parallax Watermark =================== */

/**
 * SKYWEE watermark with subtle parallax on mouse move.
 * The watermark drifts slightly opposite to cursor movement, creating depth.
 * Disabled on touch devices & reduced motion.
 */
function ParallaxWatermark() {
  const [offset, setOffset] = React.useState({ x: 0, y: 0 })
  const [enabled, setEnabled] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches
    setEnabled(!reducedMotion && !coarsePointer)
  }, [])

  React.useEffect(() => {
    if (!enabled) return

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      // Subtle parallax — max 15px movement
      const x = ((e.clientX - centerX) / centerX) * -15
      const y = ((e.clientY - centerY) / centerY) * -15
      setOffset({ x, y })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [enabled])

  return (
    <div className="skywee-global-watermark" aria-hidden>
      {/* Center watermark — large, subtle, centered in background */}
      <div
        className="skywee-watermark-parallax"
        style={{
          transform: enabled ? `translate(${offset.x * 0.5}px, ${offset.y * 0.5}px)` : undefined,
        }}
      >
        <span className="skywee-global-watermark-center">SKYWEE</span>
      </div>
      {/* Corner watermark — small, elegant, bottom-right */}
      <div
        className="skywee-watermark-parallax"
        style={{
          transform: enabled ? `translate(${offset.x}px, ${offset.y}px)` : undefined,
        }}
      >
        <span className="skywee-global-watermark-text">SKYWEE</span>
        <span className="skywee-global-watermark-tagline">Agentic Web3 OS</span>
      </div>
    </div>
  )
}

/* =================== Magnetic Nav Item =================== */

interface MagneticNavItemProps {
  item: NavItem
  isActive: boolean
  collapsed: boolean
  onNavigate: (id: PageId) => void
}

/**
 * Sidebar nav button with magnetic hover effect.
 * The button follows the cursor slightly when hovered, using spring physics.
 * Disabled on touch devices, reduced motion, and when collapsed (icon-only mode
 * doesn't benefit from magnetic since the target is too small).
 */
function MagneticNavItem({ item, isActive, collapsed, onNavigate }: MagneticNavItemProps) {
  const Icon = item.icon
  const ref = React.useRef<HTMLButtonElement>(null)
  // Smaller radius when collapsed (icon-only) for subtler effect
  const magnetic = useMagnetic(ref, { strength: 0.2, radius: collapsed ? 4 : 6 })

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={() => onNavigate(item.id)}
      title={collapsed ? item.label : undefined}
      style={magnetic.style}
      onMouseMove={magnetic.handlers.onMouseMove}
      onMouseLeave={magnetic.handlers.onMouseLeave}
      className={[
        "w-full flex items-center rounded-md text-sm transition-colors relative group overflow-hidden",
        collapsed
          ? "justify-center px-0 py-2.5"
          : "gap-3 px-3 py-2",
        isActive
          ? "bg-primary text-primary-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
      ].join(" ")}
    >
      <Icon size={15} className="flex-shrink-0" />
      {/* Label + description — fades out when collapsed */}
      <span
        className={[
          "flex-1 text-left truncate skywee-sidebar-text",
          collapsed ? "is-hidden w-0 overflow-hidden" : "",
        ].join(" ")}
      >
        {item.label}
      </span>
      {item.description && !isActive && (
        <span
          className={[
            "text-[10px] font-mono text-muted-foreground/50 hidden xl:inline skywee-sidebar-text",
            collapsed ? "is-hidden w-0 overflow-hidden" : "",
          ].join(" ")}
        >
          {item.description}
        </span>
      )}
      {isActive && !collapsed && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-primary-foreground rounded-full"
        />
      )}
      {/* Active indicator dot when collapsed */}
      {isActive && collapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 bg-primary-foreground rounded-r-full" />
      )}
    </motion.button>
  )
}

/* =================== Page Transition (direction-aware) =================== */

// Page order for direction calculation
const PAGE_ORDER: PageId[] = [
  "dashboard",
  "agent-square",
  "aegis",
  "swarm-treasury",
  "rwa-vault",
  "carbon-guard",
  "stack",
  "buildathon",
]

interface PageTransitionProps {
  pageId: PageId
  children: React.ReactNode
}

/**
 * Direction-aware page transition:
 * - Navigating forward (higher index): slide in from right + scale up
 * - Navigating backward (lower index): slide in from left + scale up
 * - Includes blur + opacity for depth
 * - Staggered children via motion variants
 */
function PageTransition({ pageId, children }: PageTransitionProps) {
  const currentIndex = PAGE_ORDER.indexOf(pageId)
  const [prevIndex, setPrevIndex] = React.useState(currentIndex)
  const direction = currentIndex >= prevIndex ? 1 : -1

  // Update prevIndex after render so direction is correct on next navigation
  React.useEffect(() => {
    setPrevIndex(currentIndex)
  }, [currentIndex])

  const xOffset = 40 * direction

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={pageId}
        custom={direction}
        initial={{
          opacity: 0,
          x: xOffset,
          scale: 0.98,
          filter: "blur(8px)",
        }}
        animate={{
          opacity: 1,
          x: 0,
          scale: 1,
          filter: "blur(0px)",
          transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1],
            opacity: { duration: 0.3, ease: "easeOut" },
            filter: { duration: 0.35, ease: "easeOut" },
            scale: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
            x: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
          },
        }}
        exit={{
          opacity: 0,
          x: -xOffset,
          scale: 0.98,
          filter: "blur(8px)",
          transition: {
            duration: 0.25,
            ease: [0.4, 0, 1, 1],
            opacity: { duration: 0.2, ease: "easeIn" },
            filter: { duration: 0.2, ease: "easeIn" },
          },
        }}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
            visible: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Stagger item — wrap any element inside a page to get staggered entrance.
 */
export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 12 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
      },
    }}
  >
    {children}
  </motion.div>
)
