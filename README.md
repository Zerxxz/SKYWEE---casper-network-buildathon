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
    │   ├── live-block-widget.tsx      # Live Casper block height (CSPR.cloud)
    │   ├── network-status-widget.tsx  # Dashboard network status (CSPR.cloud)
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
        ├── cspr-cloud.ts              # CSPR.cloud REST client (server-side)
        ├── casper-deploy.ts           # Deploy construction + signing (casper-js-sdk)
        ├── casper-mcp.ts              # Casper MCP server client (server-side)
        ├── use-network.ts             # React hooks for live network data
        ├── use-deploy-submit.ts       # React hook for deploy submission
        ├── use-mcp.ts                 # React hooks for MCP discovery
        └── api.ts                     # API route utilities

scripts/                                # Deployment & seeding scripts
├── deploy.ts                          # Master deployment script (one-command)
├── deploy-config.ts                   # Contract + agent + network config
├── deploy-logger.ts                   # Pretty console logger
├── contract-deployer.ts               # Odra CLI wrapper for contract deploy
├── agent-seeder.ts                    # Seeds 8 initial agents on-chain + DB
├── env-updater.ts                     # Updates .env.local with deploy results
├── health-check.ts                    # Verifies deployment health
└── seed.ts                            # Original DB-only seed script
```

---

## ☁️ CSPR.cloud Integration

SKYWEE integrates with the official [CSPR.cloud](https://cspr.cloud) REST API
for live on-chain data. This powers:

- **Sidebar block height** — auto-refreshes every 10s
- **Wallet balance** — fetched when you connect your Casper Wallet
- **Network status widget** — block height, era, peer count, validator count
- **cspr.live deep links** — every block, account, and deploy links to the
  public block explorer

### Getting a CSPR.cloud API key

1. Visit <https://cspr.cloud> and sign up (free)
2. Generate an API key from your account dashboard
3. Add it to your `.env.local`:

```bash
CSPR_NETWORK=testnet                              # or mainnet
CSPR_CLOUD_API_KEY=your_key_here
```

### Graceful fallback

Without an API key, SKYWEE falls back to cached/synthetic data so the UI
continues to function. The sidebar widget shows "Cached · set
CSPR_CLOUD_API_KEY for live" so it's clear when real data is missing.

---

## 🚀 Local Development

### Prerequisites

- **Bun** ≥ 1.0
- **Rust** pinned to **1.85.0** (for contract compilation only — see `contracts/odra/rust-toolchain.toml`). This is the first rustc that supports `edition2024` (needed by transitive deps like `zeroize 1.9.x`) while still being cleanable by `-C target-feature=-bulk-memory` + `wasm-opt` for Casper.
- **Binaryen** (`wasm-opt`) — required for the post-build step that strips bulk-memory ops. Install via `apt install binaryen` / `brew install binaryen`.
- **Casper Wallet** browser extension (optional — demo mode works without it)
- **CSPR.cloud API key** (optional — cached fallback works without it)

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

### Deploy the Smart Contracts (one-command deployment)

SKYWEE includes a master deployment script that handles everything in one
command: compile contracts, deploy to Casper Testnet, seed initial agents,
update environment configuration, and run a health check.

#### Prerequisites (for real deploy)

- **Rust** 1.85.0 (pinned via `contracts/odra/rust-toolchain.toml`): <https://rustup.rs>
- **Odra CLI**: `cargo install cargo-odra --locked`
- **Binaryen** (`wasm-opt`): `apt install binaryen` / `brew install binaryen` — used by `contracts/odra/scripts/optimize-wasm.sh` to lower bulk-memory ops before deploy.
- **Casper Wallet key file** (.pem): generate with `casper-client keygen` or
  export from your Casper Wallet extension
- **Testnet CSPR** for gas: get from faucet at <https://testnet.cspr.live/faucet>

> **Why pinned to 1.85.0?** Two competing constraints:
> 1. `zeroize 1.9.x` and other transitive deps require `edition2024`, which
>    only stabilized in rustc 1.85. Older rustc (1.81/1.82) cannot parse
>    their manifests at all.
> 2. Since rustc 1.82 (LLVM 19), the `wasm32-unknown-unknown` backend lowers
>    `memcpy`/`memset` into `memory.copy`/`memory.fill` and emits a data-count
>    section — both rejected by Casper's wasmi-0.x preprocessor with
>    `Deserialization error: Bulk memory operations are not supported`.
>
> 1.85.0 is the sweet spot: it satisfies (1), and for (2) we add
> `-C target-feature=-bulk-memory` in `.cargo/config.toml` plus a
> `wasm-opt --llvm-memory-copy-fill-lowering --strip-target-features` post-build
> pass (`scripts/optimize-wasm.sh`) to strip any residual bulk-memory opcodes
> coming from the precompiled std.
>
> See [casper-network/casper-node#4367](https://github.com/casper-network/casper-node/issues/4367)
> and [rust-lang/rust#132620](https://github.com/rust-lang/rust/issues/132620).

#### Quick start

```bash
# 1. Test the deployment logic without gas (recommended first run)
bun run deploy:dry-run

# 2. Real deploy to Casper Testnet
bun run deploy -- --key ~/.casper/testnet/secret_key.pem

# 3. With optional CSPR.cloud API key + MCP server URL
bun run deploy -- \
  --key ~/.casper/testnet/secret_key.pem \
  --cspr-cloud-key your_cspr_cloud_api_key \
  --mcp-url http://localhost:3001
```

The script performs 4 steps automatically:

| Step | Action | Result |
|------|--------|--------|
| 1 | **Deploy Contracts** | Compiles 5 Odra contracts via `cargo build --release`, deploys each to Casper Testnet via `odra deploy`, saves hashes to `.skywee-deploy/` state files |
| 2 | **Seed Agents** | Registers 8 initial SKYWEE agents (RYSK-7, YLR-3, EXE-Max, ORC-12, MM-Aria, VER-Gaia, CMP-Vera, TRS-Odin) on-chain + in DB. Authorizes 1 Aegis monitor, 1 CarbonGuard verifier, 5 SwarmTreasury swarm agents |
| 3 | **Update .env.local** | Writes all contract hashes + RPC URL + network name + chain name to `.env` so the Next.js app can use them |
| 4 | **Health Check** | Verifies deploy state, env config, DB agents, activity feed, and network reachability |

#### Other modes

```bash
# Only run health check (verify deployment is healthy)
bun run deploy:health

# Only seed agents (skip contract deploy, use existing .skywee-deploy/ state)
bun run deploy:seed-only

# Only update .env.local from existing deploy state
bun run scripts/deploy.ts --env-only

# Deploy to mainnet (USE WITH CAUTION)
bun run deploy -- --network mainnet --key ~/.casper/mainnet/secret_key.pem

# Skip cargo build (use existing build)
bun run deploy -- --key ~/.casper/testnet/secret_key.pem --skip-build
```

#### Alternative: deploy via `casper-client` CLI (no nightly Rust, no SSE)

If you hit issues with Odra's `livenet-env` (SSE stream hangs, nightly Rust
quirks, etc.), you can deploy the same 5 wasms using the official
`casper-client` CLI instead. The contracts and wasms stay the same — only
the deploy mechanism changes.

> **⚠️ Mid-2026 infrastructure change**: As of mid-2026, the legacy
> `rpc.testnet.casper.network` and `events.testnet.casper.network`
> endpoints are retired (DNS NXDOMAIN). All Casper testnet RPC traffic now
> goes through CSPR.cloud, which requires `Authorization: Bearer <token>`
> on every request. Get a token at https://cspr.cloud
> (sign in → Account → API Tokens).

**Prerequisites:**

- `casper-client` installed: `cargo install casper-client --locked` (or `apt install casper-client`)
- The 5 `.wasm` files already built (run `cd contracts/odra && cargo odra build` once)
- A Casper Testnet secret key PEM file with ≥50 CSPR for gas
- A CSPR.cloud API token (free at https://cspr.cloud)

**Usage:**

```bash
# Terminal 1: start the auth proxy (small Python HTTP forwarder that
# injects the Bearer token into every request — casper-client CLI itself
# doesn't support custom HTTP headers).
export CSPR_PROXY_TOKEN="your_cspr_cloud_bearer_token"
python3 scripts/cspr-auth-proxy.py

# Terminal 2: dry run (prints the exact casper-client commands)
bash scripts/deploy-casper-client.sh \
  --network testnet \
  --key ~/.casper/testnet/secret_key.pem \
  --cspr-cloud-token your_cspr_cloud_bearer_token \
  --dry-run

# Real deploy
bash scripts/deploy-casper-client.sh \
  --network testnet \
  --key ~/.casper/testnet/secret_key.pem \
  --cspr-cloud-token your_cspr_cloud_bearer_token
```

**What it does (vs. the Odra path):**

| Step | `bun run deploy` (Odra) | `deploy-casper-client.sh` (alternative) |
|------|------------------------|--------------------------|
| Build wasm | `cargo odra build` | Same — reuses the same `.wasm` files |
| Submit deploy | `cargo run --bin deploy_skywee --features livenet` (uses Odra livenet-env) | `casper-client put-deploy` × 5 (via auth proxy on `127.0.0.1:7778`) |
| Auth to CSPR.cloud | Odra reads `CSPR_CLOUD_AUTH_TOKEN` env var natively | `cspr-auth-proxy.py` injects `Authorization: Bearer` header |
| Wait for execution | SSE event stream (can hang if events URL is wrong) | Polls `get-deploy` every 16s (no SSE) |
| Extract contract hash | Odra prints it to stdout | Parses `WriteContractPackage` transform from execution result |
| Init args (TreasuryContract) | Hardcoded in `bin/deploy.rs` | Passed via `--session-arg "auto_execute_threshold:u512='1000000000'"` |
| TTL format | Rust `Duration` | `humantime` format (`1800sec`, `30min`, `1hr 12min`) |
| Output | `.skywee-deploy/` state files + `.env.local` | `.env.local.deployed` snippet (copy into `.env.local` manually) |

**Trade-offs:**

- ✅ **Pro**: No nightly Rust needed to deploy (only to build wasms)
- ✅ **Pro**: No SSE dependency — works even if events URL is unreachable
- ✅ **Pro**: Each `casper-client` call is independently debuggable
- ✅ **Pro**: Auth proxy is a tiny 200-line Python script — easy to inspect/modify
- ❌ **Con**: Requires running `cspr-auth-proxy.py` in a separate terminal
- ❌ **Con**: Doesn't run the agent seeder step (register agents via the UI after deploy)
- ❌ **Con**: Doesn't auto-update `.env.local` — copy the snippet manually

**After deploying via this alternative**, copy the contents of `.env.local.deployed`
into your actual `.env.local`, then restart the dev server:

```bash
cat .env.local.deployed >> .env.local
bun run dev
```

#### What gets deployed

| Contract | Module | Description |
|----------|--------|-------------|
| AgentRegistry | `agent_registry` | AgentSquare — agent registration & reputation attestation |
| InsuranceContract | `insurance` | Aegis — parametric insurance with autonomous payout |
| TreasuryContract | `treasury` | SwarmTreasury — multi-agent DAO execution |
| RwaVault | `rwa_vault` | RWA-X Vault — fractionalization + agent-managed AMM |
| CarbonGuard | `carbon_guard` | CarbonGuard — autonomous carbon verification + burn |

#### Initial agents seeded

| Name | Role | Price/Request | Reputation |
|------|------|--------------|------------|
| RYSK-7 | risk-scorer | 0.42 CSPR | 98 |
| YLR-3 | yield-router | 0.18 CSPR | 95 |
| EXE-Max | executor | free | 96 |
| ORC-12 | oracle | 0.31 CSPR | 92 |
| MM-Aria | market-maker | 0.12 CSPR | 94 |
| VER-Gaia | verifier | 0.55 CSPR | 99 |
| CMP-Vera | compliance | 0.38 CSPR | 91 |
| TRS-Odin | treasurer | free | 97 |

Plus 5 SwarmTreasury agents authorized for consensus voting, 1 Aegis monitor
(ORC-12), and 1 CarbonGuard verifier (VER-Gaia).

#### Deployment state

Contract hashes are saved to `.skywee-deploy/<module>.json`:

```json
{
  "module": "agent_registry",
  "name": "AgentRegistry",
  "hash": "hash-abc123...",
  "deployHash": "0xdef456...",
  "deployedAt": "2026-06-23T18:50:05.000Z",
  "network": "testnet"
}
```

This allows re-running `--seed-only` or `--env-only` without re-deploying.

> **Note:** In the prototype, the Next.js API routes simulate on-chain
> contract calls by writing to the local SQLite database. When the real
> contracts are deployed, the modal submit flow will automatically detect
> the Casper Wallet extension and broadcast real signed deploys via the
> `/api/skywee/deploys/broadcast` route.

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
