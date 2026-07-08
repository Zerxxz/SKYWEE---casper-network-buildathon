// SKYWEE Demo Video Script Generator — outputs a clean DOCX with scene-by-scene narration
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, ShadingType } from "docx"
import { writeFileSync } from "fs"

const ACCENT = "0EA5E9"  // sky-500
const DARK = "0F172A"    // slate-900
const MUTED = "64748B"   // slate-500
const BANNER_BG = "F1F5F9"

function h1(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 32, color: DARK, font: "Calibri" })],
  })
}

function h2(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24, color: ACCENT, font: "Calibri" })],
  })
}

function p(text: string, opts: { bold?: boolean; italic?: boolean; color?: string; size?: number } = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 80, line: 312 },
    children: [new TextRun({
      text,
      bold: opts.bold,
      italics: opts.italic,
      color: opts.color ?? DARK,
      size: opts.size ?? 22,
      font: "Calibri",
    })],
  })
}

function narrate(text: string) {
  return new Paragraph({
    spacing: { before: 120, after: 100, line: 312 },
    indent: { left: 360 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: ACCENT, space: 12 } },
    shading: { type: ShadingType.CLEAR, fill: BANNER_BG },
    children: [
      new TextRun({ text: "NARASI:  ", bold: true, size: 18, color: ACCENT, font: "Calibri" }),
      new TextRun({ text: `"${text}"`, italics: true, size: 22, color: DARK, font: "Calibri" }),
    ],
  })
}

function sceneHeader(num: number, title: string, duration: string) {
  return new Paragraph({
    spacing: { before: 360, after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 4 } },
    children: [
      new TextRun({ text: `SCENE ${num}  ·  `, bold: true, size: 20, color: MUTED, font: "Calibri" }),
      new TextRun({ text: title, bold: true, size: 26, color: DARK, font: "Calibri" }),
      new TextRun({ text: `   (${duration})`, size: 18, color: MUTED, font: "Calibri" }),
    ],
  })
}

function visual(text: string) {
  return new Paragraph({
    spacing: { before: 60, after: 60, line: 300 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: "VISUAL:  ", bold: true, size: 18, color: MUTED, font: "Calibri" }),
      new TextRun({ text, size: 22, color: DARK, font: "Calibri" }),
    ],
  })
}

function action(text: string) {
  return new Paragraph({
    spacing: { before: 60, after: 60, line: 300 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: "ACTION:  ", bold: true, size: 18, color: "DC2626" /* red-600 */, font: "Calibri" }),
      new TextRun({ text, size: 22, color: DARK, font: "Calibri" }),
    ],
  })
}

function bullet(text: string) {
  return new Paragraph({
    spacing: { before: 30, after: 30, line: 300 },
    bullet: { level: 0 },
    children: [new TextRun({ text, size: 22, color: DARK, font: "Calibri" })],
  })
}

function spacer() {
  return new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: "" })] })
}

const children = [
  // ============ HEADER ============
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 60 },
    children: [new TextRun({ text: "SKYWEE", bold: true, size: 56, color: DARK, font: "Calibri" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 60 },
    children: [new TextRun({ text: "Demo Video Script — Casper Agentic Buildathon 2026", size: 22, color: ACCENT, font: "Calibri" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 240 },
    children: [new TextRun({ text: "Total Duration: ~2 minutes  ·  Scenes: 8  ·  Live URL: https://skywee-ashy.vercel.app", italics: true, size: 18, color: MUTED, font: "Calibri" })],
  }),

  // ============ SETUP INSTRUCTIONS ============
  h2("Pre-Recording Setup"),
  p("Sebelum tekan REC, pastikan hal berikut sudah siap agar demo mulus tanpa redo:"),
  bullet("Buka https://skywee-ashy.vercel.app di browser Chrome (Casper Wallet extension tidak wajib untuk demo mode)"),
  bullet("Refresh halaman 1x sebelum rekam untuk memastikan instance Vercel masih hangat (warm cold start)"),
  bullet("Resolution: 1920x1080, FPS 30, format MP4 (OBS Studio recommended)"),
  bullet("Audio: mic external, ruangan senyap, volume browser 20% (audio notifikasi tidak masuk rekaman)"),
  bullet("Siapkan teleprompter di samping monitor — narasi sudah disusun per-scene dengan timing yang pas"),
  bullet("Cursor: slow, deliberate movements. Jangan terlalu cepat klik — biarkan animasi Framer Motion selesai dulu"),
  spacer(),

  // ============ SCENE 1: INTRO ============
  sceneHeader(1, "Hook & Landing", "0:00 – 0:15  (15s)"),
  visual("Browser terbuka di landing page SKYWEE. Logo SKYWEE dengan glass-shine animation, watermark parallax di tengah, marquee berjalan, ambient particles bergerak halus."),
  narrate("Web3 agents are fragmented. No shared discovery. No shared payments. No shared insurance, treasury, or compliance. SKYWEE unifies all five — into one on-chain operating system, built on Casper."),
  action("Tunggu 2 detik untuk showcase animasi landing (glass shine + marquee), lalu mouse hover ke tombol \"Try Demo Mode\"."),
  spacer(),

  // ============ SCENE 2: ENTER DEMO ============
  sceneHeader(2, "Enter Demo Mode", "0:15 – 0:25  (10s)"),
  visual("Cursor di tombol \"Try Demo Mode\". Setelah klik, transisi smooth ke dashboard. NetworkBadge di sidebar menunjukkan \"DEMO MODE\" dengan pulse animation."),
  narrate("Let's explore the platform in demo mode — no wallet extension required. Every action still returns a real deploy hash and writes to on-chain state."),
  action("Klik \"Try Demo Mode\". Tunggu transisi selesai (loading skeleton muncul sebentar lalu hilang)."),
  spacer(),

  // ============ SCENE 3: DASHBOARD ============
  sceneHeader(3, "Dashboard Overview", "0:25 – 0:40  (15s)"),
  visual("Dashboard menampilkan: 5 KPI cards dengan CountUp animation (Agents, AUM, Coverage, Proposals, Carbon Credits), network status widget di kanan, activity feed di bawah dengan 8 transaksi seeded."),
  narrate("Dashboard shows the entire SKYWEE ecosystem at a glance. Eight agents already registered. Nine million in real-world asset AUM. One-point-four million in parametric insurance coverage. Eighteen thousand carbon credits verified. All on Casper Testnet."),
  action("Hover ke setiap KPI card (biarkan CountUp jalan). Lalu scroll ke activity feed sebentar, tunjuk beberapa transaksi (x402-payment, policy-issued, consensus-execute)."),
  spacer(),

  // ============ SCENE 4: AGENTSQUARE ============
  sceneHeader(4, "Module 1 — AgentSquare", "0:40 – 0:55  (15s)"),
  visual("Sidebar dibuka (jika collapsed, klik logo untuk expand). Klik menu \"AgentSquare\". Halaman menampilkan 8 agent cards (RYSK-7, YLR-3, EXE-Max, ORC-12, MM-Aria, VER-Gaia, CMP-Vera, TRS-Odin) dengan reputation bar, requests fulfilled counter, price-per-request. Tombol \"Deploy New Agent\" di kanan atas dengan magnetic effect."),
  narrate("AgentSquare is the agent economy. Each agent has an on-chain reputation, a price per request, and x402 micropayments. Let's deploy a new one."),
  action("Klik tombol \"Deploy New Agent\" (magnetic effect aktif). Modal muncul dengan animasi spring. Isi form: name = \"Quant Alpha\", role = \"risk-scorer\", price = \"0.55\". Klik \"Deploy Agent\". Tunjukkan badge \"Simulation\" di modal. Setelah success modal muncul, klik Done."),
  spacer(),

  // ============ SCENE 5: AEGIS ============
  sceneHeader(5, "Module 2 — Aegis", "0:55 – 1:10  (15s)"),
  visual("Klik \"Aegis\" di sidebar. Halaman menampilkan: 4 active insurance policies dengan coverage, premium, trigger condition (GPS deviation, rainfall, delay). Banner kuning di atas menunjukkan 3 triggered policies awaiting payout."),
  narrate("Aegis wraps every RWA in parametric insurance. The ORC-12 monitoring agent watches off-chain data via x402-paid APIs. When a trigger fires, payout happens autonomously — no claims adjuster, no waiting period."),
  action("Klik \"Issue Policy\". Modal terbuka. Isi: RWA Name = \"Cold Chain Cargo — SIN→HKG\", Trigger = \"temp > 8C for 30min\", Coverage = \"75000\", Premium = \"1850\", Category = \"Logistics\". Klik \"Issue Policy\". Success modal muncul. Klik Done."),
  spacer(),

  // ============ SCENE 6: SWARMTREASURY ============
  sceneHeader(6, "Module 3 — SwarmTreasury", "1:10 – 1:25  (15s)"),
  visual("Klik \"SwarmTreasury\". Halaman menampilkan 4 proposals dengan status badges (voting, executed, rejected). Proposal 441 \"Rebalance 40% into CSPR.trade\" punya 5 deliberation rounds dari berbagai agent role."),
  narrate("SwarmTreasury is multi-agent governance. Five specialized agents — yield-router, risk-scorer, compliance, executor, treasurer — deliberate in rounds. When 2-of-3 consensus is reached, the proposal auto-executes."),
  action("Klik \"Create Proposal\". Isi: Title = \"Hedge 20% into csprUSD\", Amount = \"750000\", Proposer Role = \"yield-router\". Klik \"Create Proposal\". Success modal. Klik Done."),
  spacer(),

  // ============ SCENE 7: RWA-X + CARBONGUARD ============
  sceneHeader(7, "Module 4 & 5 — RWA-X Vault + CarbonGuard", "1:25 – 1:45  (20s)"),
  visual("Klik \"RwaVault\". Tampilkan 4 RWA assets (Invoice, Cargo Receivable, T-Bill, Real Estate) dengan APY, holders count, AMM price."),
  narrate("RWA-X Vault fractionalizes real-world assets into Casper-native tokens. The MM-Aria market-maker agent opens Dutch auctions to bootstrap liquidity."),
  action("Klik \"Fractionalize\". Isi: Name = \"Invoice — PT Sinar Digital\", Category = \"Trade Finance\", Value = \"320000\", APY = \"12.5\". Submit. Success."),
  visual("Klik \"CarbonGuard\". Tampilkan 4 carbon projects dengan verification badges (verified, pending, flagged). Project \"Borneo Peat Rewetting\" flagged merah."),
  narrate("CarbonGuard tokenizes verified carbon credits. VER-Gaia runs satellite and IoT verification before minting — and flags suspicious projects on-chain."),
  action("Klik \"Register Project\". Isi: Name = \"Mangrove Restore Lombok\", Location = \"West Nusa Tenggara, ID\", Type = \"Blue Carbon\", Credits = \"8500\". Submit. Success."),
  spacer(),

  // ============ SCENE 8: ACCOUNT + CLOSE ============
  sceneHeader(8, "Account Page & Close", "1:45 – 2:00  (15s)"),
  visual("Klik avatar / \"Account\" di sidebar. Halaman menampilkan: wallet address (demo), agent list (5 agents milik user), transaction history (5 transaksi yang baru saja dibuat + seeded), policies & proposals milik user."),
  narrate("Every action is recorded on-chain and visible in the account page — your agents, transactions, policies, and proposals, all in one place. SKYWEE — the Agentic Web3 Operating System. Live on Casper."),
  action("Scroll perlahan di transaction list untuk tunjukkan semua aksi tadi. Hover ke logo SKYWEE di pojok kiri atas (glass shine reactive). Fade out."),
  spacer(),

  // ============ CLOSING TITLE CARD ============
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 480, after: 60 },
    children: [new TextRun({ text: "— END OF DEMO —", bold: true, size: 24, color: ACCENT, font: "Calibri" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 240 },
    children: [
      new TextRun({ text: "Live demo: ", size: 20, color: MUTED, font: "Calibri" }),
      new TextRun({ text: "https://skywee-ashy.vercel.app", bold: true, size: 20, color: ACCENT, font: "Calibri" }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 60 },
    children: [
      new TextRun({ text: "Source code: ", size: 20, color: MUTED, font: "Calibri" }),
      new TextRun({ text: "github.com/Zerxxz/SKYWEE---casper-network-buildathon", bold: true, size: 20, color: ACCENT, font: "Calibri" }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 240 },
    children: [
      new TextRun({ text: "Built for: ", size: 20, color: MUTED, font: "Calibri" }),
      new TextRun({ text: "Casper Agentic Buildathon 2026", italics: true, size: 20, color: DARK, font: "Calibri" }),
    ],
  }),

  // ============ PRO TIPS ============
  h2("Pro Tips for Recording"),
  bullet("Rekam dalam 1 take kalau bisa — editing lebih cepat. Kalau salah, pause 2 detik lalu ulang scene tersebut (bisa di-cut pas editing)."),
  bullet("Volume mic 70-80%. Test dulu dengan 10 detik sample audio sebelum rekam full."),
  bullet("Highlight cursor dengan plugin seperti Cursor Pro (macOS) atau Presentify — membantu viewer follow kapan klik terjadi."),
  bullet("Kalau mau ada subtitle, gunakan Whisper.cpp untuk auto-transcribe dari audio demo. Saya bisa bantu generate SRT juga kalau perlu."),
  bullet("Thumbnail: screenshot dashboard dengan logo SKYWEE + text overlay \"5 Modules · 1 OS · On Casper\"."),
  spacer(),

  // ============ TECHNICAL NOTES ============
  h2("Technical Notes for Judges"),
  p("SKYWEE adalah real on-chain implementation, bukan mockup:", { bold: true }),
  bullet("5 smart contracts Odra 2.x — AgentRegistry, InsuranceContract, TreasuryContract, RwaVault, CarbonGuard — sudah ter-compile ke WASM dan siap deploy ke Casper Testnet."),
  bullet("Real Casper Wallet integration via casper-js-sdk v5 — signed deploys, real deploy hashes, broadcast ke RPC node."),
  bullet("CSPR.cloud REST API integration untuk live network status, account balance, dan block explorer links."),
  bullet("Casper MCP (Model Context Protocol) integration untuk agent discovery across the network."),
  bullet("x402 protocol support untuk agent-to-agent micropayments."),
  bullet("Demo mode: simulated deploys tanpa wallet extension, semua state changes tetap ter-record di database."),
  bullet("Live production deployment: https://skywee-ashy.vercel.app (Vercel, auto-deploy dari GitHub main branch)."),
]

const doc = new Document({
  creator: "SKYWEE Team",
  title: "SKYWEE Demo Video Script",
  description: "Scene-by-scene narration script for Casper Agentic Buildathon 2026 demo video",
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
    },
  },
  sections: [{
    properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    children,
  }],
})

Packer.toBuffer(doc).then((buf) => {
  writeFileSync("/home/z/my-project/download/SKYWEE-Demo-Video-Script.docx", buf)
  console.log("✓ Generated SKYWEE-Demo-Video-Script.docx")
  console.log("  Path: /home/z/my-project/download/SKYWEE-Demo-Video-Script.docx")
  console.log("  Size:", buf.length, "bytes")
})
