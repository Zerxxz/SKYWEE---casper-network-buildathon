export function SkyweeFooter() {
  return (
    <footer className="relative mt-auto border-t border-white/10 bg-black/60 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Brand */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5">
              <div
                aria-hidden
                className="h-8 w-8 rounded-md bg-white text-black grid place-items-center font-black text-sm tracking-tighter"
              >
                S
              </div>
              <span className="font-mono text-sm font-bold tracking-[0.18em] text-white">
                SKYWEE
              </span>
            </div>
            <p className="mt-4 max-w-sm text-xs text-white/50 leading-relaxed">
              The Agentic Web3 Operating System on Casper Network. Five
              modules, one trust layer, fully on-chain. Built for the Casper
              Agentic Buildathon 2026.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
              <span className="relative flex h-1.5 w-1.5">
                <span className="skywee-pulse-dot absolute inline-flex h-full w-full rounded-full bg-white/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/70">
                Casper Testnet · Block 2,847,195
              </span>
            </div>
          </div>

          {/* Columns */}
          <div className="md:col-span-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-3">
              Modules
            </div>
            <ul className="space-y-2 text-xs">
              <li><a href="#modules" className="text-white/60 hover:text-white">AgentSquare</a></li>
              <li><a href="#modules" className="text-white/60 hover:text-white">Aegis</a></li>
              <li><a href="#modules" className="text-white/60 hover:text-white">SwarmTreasury</a></li>
              <li><a href="#modules" className="text-white/60 hover:text-white">RWA-X Vault</a></li>
              <li><a href="#modules" className="text-white/60 hover:text-white">CarbonGuard</a></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-3">
              Platform
            </div>
            <ul className="space-y-2 text-xs">
              <li><a href="#overview" className="text-white/60 hover:text-white">Overview</a></li>
              <li><a href="#modules" className="text-white/60 hover:text-white">Modules</a></li>
              <li><a href="#activity" className="text-white/60 hover:text-white">Live Activity</a></li>
              <li><a href="#stack" className="text-white/60 hover:text-white">Casper Stack</a></li>
              <li><a href="#buildathon" className="text-white/60 hover:text-white">Buildathon</a></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-3">
              Resources
            </div>
            <ul className="space-y-2 text-xs">
              <li><a href="https://www.casper.network/ai" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white">Casper AI Toolkit ↗</a></li>
              <li><a href="https://dorahacks.io/hackathon/casper-agentic-buildathon/detail" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white">Buildathon Page ↗</a></li>
              <li><a href="https://casper.network/docs" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white">Casper Docs ↗</a></li>
              <li><a href="#" className="text-white/60 hover:text-white">GitHub Repository ↗</a></li>
              <li><a href="#" className="text-white/60 hover:text-white">Demo Video ↗</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] font-mono text-white/30">
            © 2026 SKYWEE · Casper Agentic Buildathon Submission
          </p>
          <div className="flex items-center gap-4 text-[10px] font-mono text-white/30">
            <span>Agentic AI</span>
            <span>·</span>
            <span>DeFi</span>
            <span>·</span>
            <span>RWA</span>
            <span>·</span>
            <span>Casper Network</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
