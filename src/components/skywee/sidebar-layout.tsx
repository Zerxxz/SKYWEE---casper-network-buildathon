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
  type LucideIcon,
} from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { ConnectWalletButton } from "./connect-wallet-button"
import { WalletStatus } from "./wallet-status"
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

interface SidebarLayoutProps {
  active: PageId
  onNavigate: (id: PageId) => void
  children: React.ReactNode
}

export function SidebarLayout({ active, onNavigate, children }: SidebarLayoutProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const activeItem = NAV.find((n) => n.id === active) ?? NAV[0]

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

  return (
    <div className="relative min-h-screen flex bg-background">
      {/* ====== GLOBAL SKYWEE WATERMARK ====== */}
      <div className="skywee-global-watermark" aria-hidden>
        <span className="skywee-global-watermark-text">SKYWEE</span>
      </div>
      <div className="skywee-grain" aria-hidden />

      {/* ====== SIDEBAR (desktop) ====== */}
      <aside
        className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[260px] flex-col border-r border-border bg-sidebar/80 backdrop-blur-xl"
      >
        <SidebarContent
          groupedNav={groupedNav}
          active={active}
          onNavigate={handleNavigate}
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
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col border-r border-border bg-sidebar"
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
      <div className="flex-1 lg:pl-[260px] relative z-10 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/60 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            {/* Left: mobile menu + breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-md hover:bg-foreground/5"
                aria-label="Open menu"
              >
                <Menu size={18} />
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
        <main className="flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
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
}

function SidebarContent({ groupedNav, active, onNavigate, onClose }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-border">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            onNavigate("dashboard")
          }}
          className="flex items-center gap-2.5 group"
        >
          <div
            aria-hidden
            className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-black text-sm tracking-tighter group-hover:scale-105 transition-transform"
          >
            S
          </div>
          <span className="font-mono text-sm font-bold tracking-[0.18em]">
            SKYWEE
          </span>
        </a>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md hover:bg-foreground/5"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto skywee-sidebar-scroll px-3 py-4">
        {groupedNav.map(({ group, items }) => (
          <div key={group} className="mb-6">
            <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/60">
              {GROUP_LABEL[group as NavItem["group"]]}
            </div>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon
                const isActive = active === item.id
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      className={[
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all relative group",
                        isActive
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
                      ].join(" ")}
                    >
                      <Icon size={15} className="flex-shrink-0" />
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {item.description && !isActive && (
                        <span className="text-[10px] font-mono text-muted-foreground/50 hidden xl:inline">
                          {item.description}
                        </span>
                      )}
                      {isActive && (
                        <motion.span
                          layoutId="sidebar-active-indicator"
                          className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-primary-foreground rounded-full"
                        />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom: wallet + live status */}
      <div className="border-t border-border p-3 space-y-2">
        <WalletStatus />
        <div className="rounded-lg skywee-hairline bg-foreground/[0.02] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Casper Block
            </span>
            <span className="text-[10px] font-mono skywee-tabular">#2,847,195</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="skywee-pulse-dot h-1.5 w-1.5 rounded-full bg-foreground" />
            <span className="text-[10px] font-mono text-muted-foreground">
              Streaming live
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
