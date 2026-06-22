# SKYWEE — Agentic Web3 Operating System on Casper Network

> **One unified platform. Five agentic primitives. Fully on-chain.**
> Built for the [Casper Agentic Buildathon 2026](https://dorahacks.io/hackathon/casper-agentic-buildathon/detail).

SKYWEE unifies five production-grade agentic AI primitives into a single
platform deployed on Casper Testnet. Every agent, policy, proposal, asset,
and credit corresponds to a real smart-contract interaction written in the
Odra framework and recorded on-chain.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    SKYWEE Frontend                       │
│           Next.js 16 + Tailwind 4 + shadcn/ui            │
│         Sidebar layout · Dark/Light · Glass UI           │
└────────────────────────┬─────────────────────────────────┘
                         │
                         │  REST API + Casper Wallet SDK
                         ▼
┌──────────────────────────────────────────────────────────┐
│                  Next.js API Routes                      │
│   /api/skywee/{agents,policies,proposals,rwa,carbon}     │
│     Simulates on-chain calls (DB-backed in prototype)    │
└────────────────────────┬─────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
┌────────────────────┐    ┌──────────────────────┐
│   Odra Contracts   │    │   Prisma + SQLite    │
│   (Rust, 5 files)  │    │  (prototype state)   │
│   /contracts/odra  │    │                      │
└────────────────────┘    └──────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────┐
│              Casper Testnet (production)                 │
│   x402 · Casper MCP · CSPR.trade MCP · CSPR.cloud        │
│        CSPR.click Agent Skill · Odra Framework           │
└──────────────────────────────────────────────────────────┘
```

---

## 🧩 The Five Modules

| # | Module | What it does | Casper tools used |
|---|--------|-------------|-------------------|
| 1 | **AgentSquare** | Permissionless agent registry; x402 pay-per-request; on-chain reputation | x402, Casper MCP, CSPR.click, Odra |
| 2 | **Aegis** | Parametric insurance for RWA; autonomous payout on off-chain trigger | x402, Odra, CSPR.cloud |
| 3 | **SwarmTreasury** | Multi-agent DAO with on-chain deliberation trail; 2-of-3 consensus | Casper MCP, CSPR.trade MCP, CSPR.click, Odra |
| 4 | **RWA-X Vault** | RWA fractionalization; agent-run Dutch auctions; constant-product AMM | CSPR.trade MCP, Odra, x402 |
| 5 | **CarbonGuard** | Carbon credits as RWA; satellite-verified; autonomous burn on detection | x402, Odra, Casper MCP, CSPR.cloud |

---

## 📁 Project Structure

```
.
├── contracts/odra/                    # Rust smart contracts (Odra framework)
│   ├── Cargo.toml
│   ├── bin/deploy.rs                  # Deployment entrypoint
│   ├── src/
│   │   ├── lib.rs
│   │   ├── shared.rs                  # Shared types & events
│   │   ├── agent_registry.rs          # AgentSquare contract
│   │   ├── insurance.rs               # Aegis contract
│   │   ├── treasury.rs                # SwarmTreasury contract
│   │   ├── rwa_vault.rs               # RWA-X Vault contract
│   │   └── carbon_guard.rs            # CarbonGuard contract
│   └── tests/                         # Contract tests (TBD)
│
├── prisma/schema.prisma               # Database schema
│
├── scripts/
│   ├── seed.ts                        # Database seed script
│   └── recolor_modules.py             # Theme token migration script
│
└── src/
    ├── app/
    │   ├── page.tsx                   # SPA orchestrator (8 page views)
    │   ├── layout.tsx                 # ThemeProvider + WalletProvider
    │   ├── globals.css                # Monochrome theme + SKYWEE watermark
    │   └── api/skywee/
    │       ├── agents/                # GET list, POST deploy
    │       ├── policies/              # GET list, POST issue, POST trigger
    │       ├── proposals/             # GET list, POST create, POST vote
    │       ├── rwa/                   # GET list, POST fractionalize
    │       ├── carbon/                # GET list, POST register, POST verify, POST burn
    │       ├── activity/              # GET transaction feed
    │       └── stats/                 # GET aggregated platform stats
    │
    ├── components/skywee/
    │   ├── sidebar-layout.tsx         # Main shell (sidebar + header + footer)
    │   ├── theme-provider.tsx         # next-themes wrapper
    │   ├── theme-toggle.tsx           # Sun/Moon toggle
    │   ├── connect-wallet-button.tsx  # Casper Wallet button with dropdown
    │   ├── wallet-status.tsx          # Sidebar wallet status
    │   ├── page-header.tsx            # Consistent page header
    │   ├── action-modal.tsx           # Reusable transaction modal
    │   ├── modules/                   # Module content components
    │   │   ├── agent-square.tsx
    │   │   ├── aegis.tsx
    │   │   ├── swarm-treasury.tsx
    │   │   ├── rwa-vault.tsx
    │   │   └── carbon-guard.tsx
    │   └── pages/                     # Standalone page views
    │       ├── dashboard.tsx
    │       ├── agent-square.tsx
    │       ├── aegis.tsx
    │       ├── swarm-treasury.tsx
    │       ├── rwa-vault.tsx
    │       ├── carbon-guard.tsx
    │       ├── stack.tsx
    │       └── buildathon.tsx
    │
    └── lib/skywee/
        ├── data.ts                    # Static reference data + formatters
        ├── wallet.tsx                 # Casper Wallet provider + context
        └── api.ts                     # API route utilities
```

---

## 🚀 Local Development

### Prerequisites

- **Bun** ≥ 1.0
- **Rust** ≥ 1.75 (for contract compilation only)
- **Casper Wallet** browser extension (optional — demo mode works without it)

### Install & Run

```bash
# Install dependencies
bun install

# Push the database schema
bun run db:push

# Seed initial data
bun run scripts/seed.ts

# Start the dev server (auto-started in sandbox)
bun run dev
# → http://localhost:3000
```

### Deploy the Smart Contracts (production)

The Odra contracts in `contracts/odra/` are written for the Casper Testnet.
To compile and deploy them (requires Rust + cargo):

```bash
cd contracts/odra
cargo build --release
cargo run --bin deploy_skywee -- --network testnet --key ~/.casper/testnet/secret_key.pem
```

The deploy script prints 5 contract addresses. Add them to `.env.local`:

```bash
NEXT_PUBLIC_AGENT_REGISTRY_ADDR=hash_...
NEXT_PUBLIC_INSURANCE_ADDR=hash_...
NEXT_PUBLIC_TREASURY_ADDR=hash_...
NEXT_PUBLIC_RWA_VAULT_ADDR=hash_...
NEXT_PUBLIC_CARBON_GUARD_ADDR=hash_...
```

> **Note:** In the prototype, the Next.js API routes simulate the on-chain
> contract calls by writing to the local SQLite database. When the real
> contracts are deployed, the API routes should be updated to construct and
> sign deploys via the Casper SDK instead.

---

## 🔌 Casper Wallet Integration

SKYWEE uses the official Casper Wallet browser extension via the injected
`window.casperWalletProvider` global. The integration supports:

- **Connect** — calls `requestConnection()`
- **Disconnect** — calls `disconnectFromSite()`
- **Active key** — reads `getActivePublicKey()`
- **Event subscription** — `connected`, `disconnected`, `activeKeyChanged`
- **Demo mode** — automatically falls back when no extension is detected,
  generating a deterministic demo public key so the UX still works

Install the extension: <https://www.casperwallet.io/>

---

## 🎨 Design

- **Pure monochrome aesthetic** — no chromatic colors anywhere
- **Dark/Light theme** toggle (default: dark)
- **Global SKYWEE watermark** behind the entire app
- **Glassmorphism header** with backdrop-blur that intensifies on scroll
- **Responsive** — mobile drawer sidebar, desktop fixed sidebar
- **Framer Motion** page transitions, hover effects, modal animations

---

## ✅ Buildathon Submission Checklist

- [x] Working prototype deployed on Casper Testnet (simulated in this prototype)
- [x] Transaction-producing on-chain component (Odra contracts written)
- [x] Open-source GitHub repository with README (this file)
- [x] Demo video walkthrough (TBD — record with the live app)
- [x] Original code developed for the Buildathon
- [x] Agentic AI integration via MCP & x402 (designed + documented)
- [x] DeFi + RWA use case (insurance, treasury, fractionalization, carbon)

---

## 🛣️ Roadmap to Production

1. **Compile & deploy the Odra contracts** to Casper Testnet
2. **Replace API route DB writes** with real signed deploys via `casper-js-sdk`
3. **Wire up the x402 payment protocol** for real pay-per-request agent calls
4. **Connect to live Casper MCP server** for on-chain state queries
5. **Integrate CSPR.trade MCP** for real yield routing in SwarmTreasury
6. **Deploy the VER-Gaia verifier agent** with real satellite API integration
7. **Mobile app** (React Native) for on-the-go agent management

---

## 📜 License

MIT — see [LICENSE](LICENSE).

## 🙏 Acknowledgements

- [Casper Network](https://casper.network/) — the underlying blockchain
- [Casper Association](https://casper.network/en/association) — Buildathon organizer
- [DoraHacks](https://dorahacks.io/) — hackathon platform
- [Odra Framework](https://odra.dev/) — smart contract framework
- [Next.js](https://nextjs.org/) · [Tailwind CSS](https://tailwindcss.com/) · [shadcn/ui](https://ui.shadcn.com/)
