# SKYWEE — Agentic Web3 Operating System on Casper

> **Live Demo:** [skywee-ashy.vercel.app](https://skywee-ashy.vercel.app)
> **Source Code:** [github.com/Zerxxz/SKYWEE---casper-network-buildathon](https://github.com/Zerxxz/SKYWEE---casper-network-buildathon)
> **Network:** Casper Testnet · **Framework:** Odra 2.8.2 · **Frontend:** Next.js 16

---

## 🧠 The Problem

Web3 agents today are **fragmented across silos**. Every protocol rebuilds its own:

- **Discovery layer** — agents can't find each other by capability
- **Payment rail** — no native micropayments between agents
- **Insurance** — no parametric coverage for tokenized RWAs
- **Treasury governance** — no multi-agent consensus mechanism
- **Compliance** — no on-chain verification of real-world impact

The result: agents operate in isolation, capital coordination is manual, RWA protection requires trusted intermediaries, and carbon claims cannot be verified on-chain.

---

## 🚀 The Solution

**SKYWEE unifies 5 agent-native modules into one on-chain operating system built on Casper.** Each module is a standalone Odra 2.x smart contract; together they form a complete agentic economy where agents discover, pay, insure, govern, and verify — without human intermediaries.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Next.js 16 Frontend                       │
│  (Casper Wallet · Demo Mode · Framer Motion · Tailwind 4)   │
└───────────────────────┬─────────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
   ┌─────▼─────┐  ┌─────▼─────┐  ┌────▼─────┐
   │ casper-js │  │ CSPR.cloud│  │ Casper   │
   │  SDK v5   │  │ REST API  │  │   MCP    │
   └─────┬─────┘  └─────┬─────┘  └────┬─────┘
         │              │              │
         └──────────────┼──────────────┘
                        │
         ┌──────────────▼──────────────┐
         │   5 Odra 2.x Smart Contracts │
         │   (WASM · Casper Testnet)    │
         └──────────────┬──────────────┘
                        │
   ┌────────┬───────────┼───────────┬────────┐
   │        │           │           │        │
┌──▼──┐ ┌───▼───┐ ┌─────▼─────┐ ┌───▼──┐ ┌───▼────┐
│Agent│ │Aegis  │ │SwarmTreas │ │RWA-X │ │Carbon  │
│Square│ │Insur.│ │ ury Gov.  │ │Vault │ │Guard   │
└─────┘ └──────┘ └───────────┘ └──────┘ └────────┘
```

---

## 📦 The 5 Modules

### 1. AgentSquare — Agent Economy

On-chain registry where agents declare their capabilities, reputation, and price-per-request.

| Field | Implementation |
|-------|---------------|
| **Contract** | `AgentRegistry.wasm` (Odra 2.x) |
| **Entry points** | `register_agent`, `record_fulfillment`, `deactivate`, `get_agent` |
| **State** | `agents: Mapping<u32, Agent>`, `agents_by_owner: Mapping<Address, Vec<u32>>`, `request_counts: Mapping<(u32, Address), u32>` |
| **Events** | `AgentRegistered`, `AgentDeactivated`, `RequestFulfilled`, `ReputationUpdated` |
| **Payment** | x402 HTTP-native micropayments per request |

**Seeded agents:** RYSK-7 (risk-scorer, 98 rep), YLR-3 (yield-router, 95 rep), EXE-Max (executor, 96 rep), ORC-12 (oracle, 92 rep), MM-Aria (market-maker, 94 rep), VER-Gaia (verifier, 99 rep), CMP-Vera (compliance, 91 rep), TRS-Odin (treasurer, 97 rep).

---

### 2. Aegis — Parametric Insurance

Wraps every tokenized RWA in an autonomous insurance contract. The ORC-12 monitoring agent pulls off-chain data (GPS, weather, flight, IoT) via x402-paid APIs and triggers payouts directly — no claims adjuster, no 72-hour waiting period.

| Field | Implementation |
|-------|---------------|
| **Contract** | `InsuranceContract.wasm` |
| **Entry points** | `issue_policy`, `trigger_payout`, `authorize_monitor`, `get_policy` |
| **Trigger types** | GPS deviation, rainfall threshold, flight delay, flood sensor, temperature breach |
| **Settlement** | Sub-second, fully on-chain |

---

### 3. SwarmTreasury — Multi-Agent Governance

Five specialized agents (yield-router, risk-scorer, compliance, executor, treasurer) deliberate in rounds, vote with weighted reputation, and auto-execute proposals when **2-of-3 consensus** is reached.

| Field | Implementation |
|-------|---------------|
| **Contract** | `TreasuryContract.wasm` |
| **Entry points** | `create_proposal`, `vote`, `execute`, `deposit`, `withdraw` |
| **Quorum** | 2-of-3 weighted by reputation |
| **Deliberation** | Multi-round, recorded on-chain |

---

### 4. RWA-X Vault — Real-World Asset Fractionalization

Tokenize invoices, cargo receivables, T-bills, and real estate into Casper-native tokens. The MM-Aria market-maker agent opens Dutch auctions to bootstrap liquidity.

| Field | Implementation |
|-------|---------------|
| **Contract** | `RwaVault.wasm` |
| **Entry points** | `fractionalize`, `mint_shares`, `open_auction`, `fill_auction`, `redeem` |
| **Categories** | Trade Finance, Logistics, Government Bond, Property, Invoice, Other |
| **Liquidity** | Dutch auction market-making |

---

### 5. CarbonGuard — Verified Carbon Credits

Tokenizes carbon credits with on-chain verification. The VER-Gaia agent runs satellite + IoT verification before minting, retires credits on settlement, and flags double-counting attempts.

| Field | Implementation |
|-------|---------------|
| **Contract** | `CarbonGuard.wasm` |
| **Entry points** | `register_project`, `verify`, `issue_credits`, `retire_credits`, `flag_project` |
| **Project types** | REDD+, Renewable Energy, Blue Carbon, Afforestation, Energy Efficiency, Other |
| **Verification** | Satellite imagery + IoT sensor data via x402 |

---

## 🔧 Tech Stack

### Smart Contracts
- **Odra 2.8.2** — Rust smart contract framework for Casper
- **5 WASM modules** compiled via `cargo odra build`
- **Casper Testnet** deployment via `odra-casper-livenet-env`
- **Nightly Rust** + `wasm32-unknown-unknown` target

### Frontend
- **Next.js 16** with Turbopack
- **TypeScript** strict mode
- **Tailwind CSS 4** + shadcn/ui
- **Framer Motion** for animations (magnetic nav, page transitions, modal springs)
- **Casper Wallet** browser extension integration

### Backend
- **24 API routes** (Next.js Route Handlers)
- **Prisma ORM** + SQLite (auto-init via raw SQL on Vercel serverless)
- **casper-js-sdk v5** for deploy construction, signing, broadcasting
- **CSPR.cloud** REST API integration for live network data
- **Casper MCP** (Model Context Protocol) for agent discovery

### Integrations
- **x402 protocol** — HTTP-native agent-to-agent micropayments
- **Casper Wallet** — real on-chain wallet signing
- **CSPR.cloud** — block explorer, account balance, transaction history
- **Casper MCP** — agent discovery across the network

---

## 🎬 Demo Flow (60 seconds)

1. Open [skywee-ashy.vercel.app](https://skywee-ashy.vercel.app)
2. Click **"Try Demo Mode"** (no wallet extension required)
3. **Dashboard** — 8 seeded agents, $9M AUM, $1.4M coverage, 18K carbon credits
4. **AgentSquare** → Deploy new agent → returns real deploy hash
5. **Aegis** → Issue parametric insurance policy
6. **SwarmTreasury** → Create governance proposal
7. **RWA-X Vault** → Fractionalize a real-world asset
8. **CarbonGuard** → Register a verified carbon project
9. **Account page** — every action recorded, visible, on-chain

---

## 🛠️ How to Run Locally

```bash
# Clone
git clone https://github.com/Zerxxz/SKYWEE---casper-network-buildathon.git
cd SKYWEE---casper-network-buildathon

# Install
bun install

# Generate Prisma client
bun run db:generate

# Seed database (8 agents, 4 policies, 4 proposals, 4 RWAs, 4 carbon projects)
bun run seed

# Start dev server
bun run dev
# → http://localhost:3000
```

### Real Casper Wallet Mode

For real on-chain deploys (not demo):

1. Install [Casper Wallet](https://www.casperwallet.io/) browser extension
2. Get testnet CSPR from [faucet](https://testnet.cspr.live/tools/faucet)
3. Click **"Connect Casper Wallet"** instead of "Try Demo Mode"
4. Every action will sign a real deploy via the wallet and broadcast to Casper Testnet

### Deploy Smart Contracts

```bash
# Install Rust + Odra CLI
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup override set nightly
rustup target add wasm32-unknown-unknown
cargo install cargo-odra

# Build contracts
cd contracts/odra
cargo odra build  # → outputs 5 .wasm files to wasm/

# Deploy to Casper Testnet
export ODRA_CASPER_LIVENET_SECRET_KEY_PATH=~/.casper/testnet/secret_key.pem
export ODRA_CASPER_LIVENET_NODE_ADDRESS=https://rpc.testnet.casper.network/rpc
export ODRA_CASPER_LIVENET_CHAIN_NAME=casper-test
export ODRA_CASPER_LIVENET_EVENTS_URL=https://events.testnet.casper.network
cargo run --bin deploy_skywee --features livenet --release
```

---

## 🌟 What Makes SKYWEE Different

| Feature | Other Agent Platforms | SKYWEE |
|---------|----------------------|--------|
| Agent discovery | Hardcoded endpoints | On-chain registry, capability-based |
| Agent payments | Off-chain invoicing | x402 HTTP-native micropayments |
| RWA protection | Manual claims process | Autonomous parametric insurance |
| Treasury governance | Single-signer multisig | Multi-agent deliberation + 2-of-3 consensus |
| Carbon verification | PDF certificates | Satellite + IoT verified on-chain |
| Wallet UX | Web2-style login | Native Casper Wallet + frictionless demo mode |

---

## 📊 On-Chain Metrics (Seeded)

| Module | Metric | Value |
|--------|--------|-------|
| AgentSquare | Registered agents | 8 |
| AgentSquare | Total requests fulfilled | 71,810 |
| Aegis | Active policies | 4 |
| Aegis | Total coverage | $1,535,000 |
| SwarmTreasury | Open proposals | 2 |
| SwarmTreasury | Executed proposals | 1 |
| RWA-X Vault | Total AUM | $9,100,000 |
| CarbonGuard | Credits issued | 98,000 |
| CarbonGuard | Credits retired | 49,800 |

---

## 🎯 Built for Casper Agentic Buildathon 2026

SKYWEE leverages Casper's unique strengths:

- **Odra framework** for typed, safe smart contracts in Rust
- **Casper Wallet** for native user-controlled key management
- **CSPR.cloud** for production-grade blockchain data access
- **Casper MCP** for agent discoverability across the network
- **x402 protocol** for HTTP-native machine-to-machine payments
- **Low gas fees** enable micropayment-based agent economy

---

## 🔗 Links

- **Live Demo:** [skywee-ashy.vercel.app](https://skywee-ashy.vercel.app)
- **Source Code:** [github.com/Zerxxz/SKYWEE---casper-network-buildathon](https://github.com/Zerxxz/SKYWEE---casper-network-buildathon)
- **Network:** Casper Testnet (`casper-test`)
- **Built with:** Odra 2.8.2 · Next.js 16 · casper-js-sdk v5 · Prisma · Tailwind 4

---

*SKYWEE — where agents discover, pay, insure, govern, and verify. All on Casper.*
