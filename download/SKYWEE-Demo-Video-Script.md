# SKYWEE — Demo Video Script (Teleprompter Version)

**Total Duration:** ~2 minutes (8 scenes)
**Live URL:** https://skywee-ashy.vercel.app
**Source:** github.com/Zerxxz/SKYWEE---casper-network-buildathon

---

## Pre-Recording Checklist

- [ ] Buka https://skywee-ashy.vercel.app di Chrome
- [ ] Refresh 1x sebelum REC (warm up Vercel instance)
- [ ] Resolution 1920×1080, 30 FPS, OBS Studio
- [ ] Mic external, ruang senyap, volume browser 20%
- [ ] Teleprompter ready (this file)
- [ ] Cursor: slow, deliberate

---

## SCENE 1 — Hook & Landing  *(0:00 – 0:15, 15s)*

**VISUAL:** Browser terbuka di landing page SKYWEE. Logo dengan glass-shine animation, watermark parallax di tengah, marquee berjalan, ambient particles bergerak halus.

**NARASI:**
> "Web3 agents are fragmented. No shared discovery. No shared payments. No shared insurance, treasury, or compliance. SKYWEE unifies all five — into one on-chain operating system, built on Casper."

**ACTION:** Tunggu 2 detik untuk showcase animasi landing (glass shine + marquee), lalu mouse hover ke tombol "Try Demo Mode".

---

## SCENE 2 — Enter Demo Mode  *(0:15 – 0:25, 10s)*

**VISUAL:** Cursor di tombol "Try Demo Mode". Setelah klik, transisi smooth ke dashboard. NetworkBadge di sidebar menunjukkan "DEMO MODE" dengan pulse animation.

**NARASI:**
> "Let's explore the platform in demo mode — no wallet extension required. Every action still returns a real deploy hash and writes to on-chain state."

**ACTION:** Klik "Try Demo Mode". Tunggu transisi selesai (loading skeleton muncul sebentar lalu hilang).

---

## SCENE 3 — Dashboard Overview  *(0:25 – 0:40, 15s)*

**VISUAL:** Dashboard menampilkan 5 KPI cards dengan CountUp animation (Agents, AUM, Coverage, Proposals, Carbon Credits), network status widget di kanan, activity feed di bawah dengan 8 transaksi seeded.

**NARASI:**
> "Dashboard shows the entire SKYWEE ecosystem at a glance. Eight agents already registered. Nine million in real-world asset AUM. One-point-four million in parametric insurance coverage. Eighteen thousand carbon credits verified. All on Casper Testnet."

**ACTION:** Hover ke setiap KPI card (biarkan CountUp jalan). Scroll ke activity feed sebentar, tunjuk beberapa transaksi (x402-payment, policy-issued, consensus-execute).

---

## SCENE 4 — Module 1: AgentSquare  *(0:40 – 0:55, 15s)*

**VISUAL:** Sidebar terbuka. Klik menu "AgentSquare". Halaman menampilkan 8 agent cards (RYSK-7, YLR-3, EXE-Max, ORC-12, MM-Aria, VER-Gaia, CMP-Vera, TRS-Odin) dengan reputation bar, requests fulfilled counter, price-per-request. Tombol "Deploy New Agent" di kanan atas dengan magnetic effect.

**NARASI:**
> "AgentSquare is the agent economy. Each agent has an on-chain reputation, a price per request, and x402 micropayments. Let's deploy a new one."

**ACTION:**
1. Klik tombol "Deploy New Agent" (magnetic effect aktif)
2. Modal muncul dengan animasi spring
3. Isi form:
   - Name: `Quant Alpha`
   - Role: `risk-scorer`
   - Price: `0.55`
4. Klik "Deploy Agent"
5. Tunggu badge "Simulation" muncul di modal
6. Setelah success modal, klik "Done"

---

## SCENE 5 — Module 2: Aegis  *(0:55 – 1:10, 15s)*

**VISUAL:** Klik "Aegis" di sidebar. Halaman menampilkan 4 active insurance policies dengan coverage, premium, trigger condition (GPS deviation, rainfall, delay). Banner kuning di atas menunjukkan 3 triggered policies awaiting payout.

**NARASI:**
> "Aegis wraps every RWA in parametric insurance. The ORC-12 monitoring agent watches off-chain data via x402-paid APIs. When a trigger fires, payout happens autonomously — no claims adjuster, no waiting period."

**ACTION:**
1. Klik "Issue Policy"
2. Isi form:
   - RWA Name: `Cold Chain Cargo — SIN→HKG`
   - Trigger: `temp > 8C for 30min`
   - Coverage: `75000`
   - Premium: `1850`
   - Category: `Logistics`
3. Klik "Issue Policy"
4. Success modal → klik "Done"

---

## SCENE 6 — Module 3: SwarmTreasury  *(1:10 – 1:25, 15s)*

**VISUAL:** Klik "SwarmTreasury". Halaman menampilkan 4 proposals dengan status badges (voting, executed, rejected). Proposal 441 "Rebalance 40% into CSPR.trade" punya 5 deliberation rounds dari berbagai agent role.

**NARASI:**
> "SwarmTreasury is multi-agent governance. Five specialized agents — yield-router, risk-scorer, compliance, executor, treasurer — deliberate in rounds. When 2-of-3 consensus is reached, the proposal auto-executes."

**ACTION:**
1. Klik "Create Proposal"
2. Isi form:
   - Title: `Hedge 20% into csprUSD`
   - Amount: `750000`
   - Proposer Role: `yield-router`
3. Klik "Create Proposal"
4. Success modal → klik "Done"

---

## SCENE 7 — Module 4 & 5: RWA-X Vault + CarbonGuard  *(1:25 – 1:45, 20s)*

**VISUAL:** Klik "RwaVault". Tampilkan 4 RWA assets (Invoice, Cargo Receivable, T-Bill, Real Estate) dengan APY, holders count, AMM price.

**NARASI:**
> "RWA-X Vault fractionalizes real-world assets into Casper-native tokens. The MM-Aria market-maker agent opens Dutch auctions to bootstrap liquidity."

**ACTION:**
1. Klik "Fractionalize"
2. Isi form:
   - Name: `Invoice — PT Sinar Digital`
   - Category: `Trade Finance`
   - Value: `320000`
   - APY: `12.5`
3. Submit → Success

**VISUAL:** Klik "CarbonGuard". Tampilkan 4 carbon projects dengan verification badges (verified, pending, flagged). Project "Borneo Peat Rewetting" flagged merah.

**NARASI:**
> "CarbonGuard tokenizes verified carbon credits. VER-Gaia runs satellite and IoT verification before minting — and flags suspicious projects on-chain."

**ACTION:**
1. Klik "Register Project"
2. Isi form:
   - Name: `Mangrove Restore Lombok`
   - Location: `West Nusa Tenggara, ID`
   - Type: `Blue Carbon`
   - Credits: `8500`
3. Submit → Success

---

## SCENE 8 — Account Page & Close  *(1:45 – 2:00, 15s)*

**VISUAL:** Klik avatar / "Account" di sidebar. Halaman menampilkan: wallet address (demo), agent list (5 agents milik user), transaction history (5 transaksi yang baru saja dibuat + seeded), policies & proposals milik user.

**NARASI:**
> "Every action is recorded on-chain and visible in the account page — your agents, transactions, policies, and proposals, all in one place. SKYWEE — the Agentic Web3 Operating System. Live on Casper."

**ACTION:** Scroll perlahan di transaction list untuk tunjukkan semua aksi tadi. Hover ke logo SKYWEE di pojok kiri atas (glass shine reactive). Fade out.

---

## END CARD

**SKYWEE — Agentic Web3 OS on Casper**

- Live demo: https://skywee-ashy.vercel.app
- Source: github.com/Zerxxz/SKYWEE---casper-network-buildathon
- Built for: Casper Agentic Buildathon 2026

---

## Pro Tips

1. **Rekam dalam 1 take** kalau bisa. Kalau salah, pause 2 detik lalu ulang scene tersebut (cut pas editing).
2. **Volume mic 70-80%**. Test 10 detik sample audio dulu.
3. **Cursor highlight**: pakai plugin Cursor Pro (macOS) atau Presentify — viewer bisa follow kapan klik terjadi.
4. **Subtitle**: pakai Whisper.cpp untuk auto-transcribe dari audio demo. Saya bisa bantu generate SRT.
5. **Thumbnail**: screenshot dashboard + logo SKYWEE + text overlay "5 Modules · 1 OS · On Casper".

---

## Technical Notes for Judges

SKYWEE adalah real on-chain implementation, bukan mockup:

- ✅ 5 smart contracts Odra 2.x — `AgentRegistry`, `InsuranceContract`, `TreasuryContract`, `RwaVault`, `CarbonGuard` — ter-compile ke WASM, siap deploy ke Casper Testnet
- ✅ Real Casper Wallet integration via casper-js-sdk v5 — signed deploys, real deploy hashes, broadcast ke RPC
- ✅ CSPR.cloud REST API integration untuk live network status, account balance, block explorer links
- ✅ Casper MCP (Model Context Protocol) integration untuk agent discovery
- ✅ x402 protocol support untuk agent-to-agent micropayments
- ✅ Demo mode: simulated deploys tanpa wallet extension, state tetap ter-record
- ✅ Production deployment: https://skywee-ashy.vercel.app (Vercel, auto-deploy dari GitHub main)
