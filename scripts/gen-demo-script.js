/**
 * SKYWEE Demo Video Script — Word document generator
 * Casper Agentic Buildathon 2026
 */
/* eslint-disable @typescript-eslint/no-require-imports */

const {
  Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, HeadingLevel, PageNumber, PageBreak,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, TableLayoutType, VerticalAlign,
} = require("docx");
const fs = require("fs");

// Palette
const P = {
  primary: "0A0A0A",
  body: "1A1A1A",
  secondary: "555555",
  accent: "FF761C",
  light: "F5F5F5",
  border: "DDDDDD",
  headerBg: "1A1A1A",
  headerFg: "FFFFFF",
};

// Helpers
function c(hex) { return hex.replace("#", ""); }

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 36, color: c(P.primary), font: { ascii: "Calibri" } })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 28, color: c(P.primary), font: { ascii: "Calibri" } })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 100, after: 100, line: 312 },
    children: [new TextRun({ text, size: 24, color: c(P.body), ...opts, font: { ascii: "Calibri" } })],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    spacing: { before: 60, after: 60, line: 312 },
    indent: { left: 360 + level * 360 },
    children: [
      new TextRun({ text: level === 0 ? "\u2022  " : "\u25E6  ", size: 24, color: c(P.accent) }),
      new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri" } }),
    ],
  });
}

function spacer(h = 200) {
  return new Paragraph({ spacing: { before: h, after: 0 }, children: [] });
}

// Table helpers
function headerCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: c(P.headerBg) },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text, bold: true, size: 22, color: c(P.headerFg), font: { ascii: "Calibri" } })],
    })],
  });
}

function dataCell(text, width, opts = {}) {
  const runs = Array.isArray(text)
    ? text
    : [new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Calibri" }, ...opts })];
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({ spacing: { line: 280 }, children: runs })],
  });
}

function sceneTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: c(P.border) },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: c(P.border) },
      left: { style: BorderStyle.SINGLE, size: 1, color: c(P.border) },
      right: { style: BorderStyle.SINGLE, size: 1, color: c(P.border) },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: c(P.border) },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: c(P.border) },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell("Field", 18),
          headerCell("Details", 82),
        ],
      }),
      ...rows.map(([label, content]) => new TableRow({
        cantSplit: true,
        children: [
          dataCell(label, 18, { bold: true, color: c(P.secondary) }),
          dataCell(content, 82),
        ],
      })),
    ],
  });
}

// ============================================================
// COVER PAGE
// ============================================================
function buildCover() {
  return [
    spacer(2400),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [new TextRun({ text: "SKYWEE", bold: true, size: 80, color: c(P.primary), font: { ascii: "Calibri" } })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 400 },
      children: [new TextRun({ text: "Demo Video Script", size: 36, color: c(P.secondary), font: { ascii: "Calibri" } })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [new TextRun({ text: "Casper Agentic Buildathon 2026", size: 28, color: c(P.accent), bold: true, font: { ascii: "Calibri" } })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 800 },
      children: [new TextRun({ text: "Qualification Round Submission", size: 24, color: c(P.secondary), font: { ascii: "Calibri" } })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 100 },
      children: [
        new TextRun({ text: "Duration: ", bold: true, size: 22, color: c(P.secondary), font: { ascii: "Calibri" } }),
        new TextRun({ text: "3\u20135 minutes", size: 22, color: c(P.body), font: { ascii: "Calibri" } }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 100 },
      children: [
        new TextRun({ text: "Language: ", bold: true, size: 22, color: c(P.secondary), font: { ascii: "Calibri" } }),
        new TextRun({ text: "English", size: 22, color: c(P.body), font: { ascii: "Calibri" } }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 100 },
      children: [
        new TextRun({ text: "Style: ", bold: true, size: 22, color: c(P.secondary), font: { ascii: "Calibri" } }),
        new TextRun({ text: "Professional \u2014 Tech-focused", size: 22, color: c(P.body), font: { ascii: "Calibri" } }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 100 },
      children: [
        new TextRun({ text: "Repo: ", bold: true, size: 22, color: c(P.secondary), font: { ascii: "Calibri" } }),
        new TextRun({ text: "github.com/Zerxxz/SKYWEE---casper-network-buildathon", size: 22, color: c(P.accent), font: { ascii: "Calibri" } }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 100 },
      children: [
        new TextRun({ text: "Live: ", bold: true, size: 22, color: c(P.secondary), font: { ascii: "Calibri" } }),
        new TextRun({ text: "skywee-ashy.vercel.app", size: 22, color: c(P.accent), font: { ascii: "Calibri" } }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ============================================================
// PRE-RECORDING CHECKLIST
// ============================================================
function buildChecklist() {
  return [
    heading1("Pre-Recording Checklist"),
    body("Before hitting record, make sure everything below is ready. A smooth demo starts with preparation.", { color: c(P.secondary) }),
    spacer(100),
    heading2("Environment"),
    bullet("Close all unnecessary browser tabs and applications"),
    bullet("Set desktop wallpaper to a solid dark color (matches SKYWEE theme)"),
    bullet("Ensure good lighting if recording with webcam overlay"),
    bullet("Turn off notifications (Slack, Discord, email, etc.)"),
    spacer(100),
    heading2("Browser Setup"),
    bullet("Use Google Chrome (best Casper Wallet extension support)"),
    bullet("Install Casper Wallet extension from casperwallet.io"),
    bullet("Set browser to fullscreen or maximize window (1440px+ width)"),
    bullet("Clear localStorage: DevTools \u2192 Application \u2192 Local Storage \u2192 Clear (fresh demo state)"),
    spacer(100),
    heading2("Recording Tools"),
    bullet("OBS Studio (free, high quality) or Loom (quick, browser-based)"),
    bullet("Set resolution to 1920\u00D71080 (1080p minimum)"),
    bullet("Set framerate to 30fps (smooth enough, smaller file)"),
    bullet("Audio: Use a decent USB microphone if available. Test audio levels before recording."),
    spacer(100),
    heading2("App State"),
    bullet("Database seeded: run `bun run scripts/seed.ts` before recording"),
    bullet("Dark mode is the default theme \u2014 looks best on camera"),
    bullet("Have the landing page loaded and ready (fresh tab)"),
    bullet("Keep DevTools closed during recording (unless showing network requests)"),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ============================================================
// SCENE TABLES
// ============================================================
function buildScene1() {
  return [
    heading1("Scene 1 \u2014 Landing Page"),
    body("Timecode: 0:00 \u2013 0:30 (30 seconds)", { color: c(P.accent), bold: true }),
    spacer(100),
    sceneTable([
      ["Visual", "Full-screen view of the SKYWEE landing page. Logo with glass shine effect at center. Large 'SKYWEE' title text. Marquee text scrolling below. Get Started button with pulsing aura."],
      ["Action", "No clicks yet. Let the visuals breathe. Slowly move cursor toward the Get Started button to show the magnetic hover effect. Hover for 2-3 seconds to show aura pulsing."],
      ["Narration", "\"Welcome to SKYWEE \u2014 the Agentic Web3 Operating System on Casper Network. SKYWEE unifies five production-grade agentic AI modules into a single platform: agent economy, parametric insurance, multi-agent treasury, RWA fractionalization, and autonomous carbon verification \u2014 all deployed on Casper Testnet.\""],
      ["Key Visual Cues", "Glass shine sweeping across logo and title text. Marquee text 'The Agentic Web3 OS, at a glance' scrolling left to right. Aura glow pulsing behind Get Started button. Background SKYWEE watermark with subtle parallax."],
      ["Transition", "Click Get Started button at 0:28 to transition into Scene 2."],
    ]),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function buildScene2() {
  return [
    heading1("Scene 2 \u2014 Get Started & Wallet Connect"),
    body("Timecode: 0:30 \u2013 1:00 (30 seconds)", { color: c(P.accent), bold: true }),
    spacer(100),
    sceneTable([
      ["Visual", "Click Get Started button. Button shows 'Connecting\u2026' with spinner. Wallet connects (demo mode if no extension, real Casper Wallet if installed). Smooth page transition: landing page slides out with blur + scale, dashboard slides in from right."],
      ["Action", "1. Click 'Get Started' button\n2. Wait for wallet connection (1-2 seconds)\n3. Dashboard appears with staggered entrance animation"],
      ["Narration", "\"Clicking Get Started automatically connects your Casper Wallet and creates your account. In demo mode without the extension, it generates a deterministic demo wallet so you can explore the full platform. The smooth page transition uses direction-aware slide, scale, and blur for a premium feel.\""],
      ["Key Visual Cues", "Loading spinner in button. Page transition: old content exits with blur + scale down, new content enters from right with scale up. Dashboard KPI cards animate in with count-up effect. Sidebar logo appears with the SKYWEE icon."],
      ["Transition", "Dashboard fully loaded at 1:00. Pause for 2 seconds to let viewer absorb the dashboard."],
    ]),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function buildScene3() {
  return [
    heading1("Scene 3 \u2014 Dashboard Overview"),
    body("Timecode: 1:00 \u2013 1:45 (45 seconds)", { color: c(P.accent), bold: true }),
    spacer(100),
    sceneTable([
      ["Visual", "Dashboard with 6 KPI cards showing count-up animations. Network Status widget with live Casper Testnet block height. Live Activity feed showing recent transactions. 24h volume area chart. Module grid at bottom with 6 clickable cards."],
      ["Action", "1. Hover over KPI cards to show hover effect (2s)\n2. Point cursor at sidebar block height widget (show live updating)\n3. Hover over Network Status widget (show 'Cached' or 'Live' badge)\n4. Slowly scroll down to reveal module grid with scroll-triggered animation"],
      ["Narration", "\"The dashboard gives you a real-time overview of the entire SKYWEE platform. KPI values animate from zero using count-up easing. The Network Status widget fetches live block height, era, and peer count from CSPR.cloud. The activity feed shows on-chain transactions from all five modules \u2014 every entry here is a real smart-contract interaction on Casper Testnet.\""],
      ["Key Visual Cues", "Count-up numbers ($9M, $8M, 67,400 tCO\u2082e, 184K CSPR). Live block height in sidebar pulsing dot. Scroll reveal: module cards fade in + slide up as you scroll. Custom cursor with comet trail visible."],
      ["Transition", "Click 'AgentSquare' in sidebar at 1:43 to navigate to Scene 4."],
    ]),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function buildScene4() {
  return [
    heading1("Scene 4 \u2014 AgentSquare + Deploy Agent"),
    body("Timecode: 1:45 \u2013 2:45 (60 seconds)", { color: c(P.accent), bold: true }),
    spacer(100),
    sceneTable([
      ["Visual", "AgentSquare page with agent registry table (8 agents with reputation, price, status). MCP Discovery Panel below with filter controls. 'Deploy Agent' CTA button at bottom."],
      ["Action", "1. Hover over agent table rows (show hover highlight)\n2. Scroll down to MCP Discovery Panel\n3. Use capability filter dropdown (select 'Risk Scoring')\n4. Scroll back up, click 'Deploy Agent' button\n5. Modal opens \u2014 fill in: Name='DEMO-AGENT', Role='Oracle', Price=0.25\n6. Click 'Deploy Agent' in modal\n7. Show 'SIMULATION' badge in modal\n8. Wait for success state with transaction hash\n9. Click 'Done'\n10. Navigate to Account page in sidebar\n11. Show newly deployed agent in 'Your Agents' list"],
      ["Narration", "\"AgentSquare is the agent-to-agent economy. AI agents register on-chain via the Odra smart contract, set a price per request in CSPR, and build reputation through fulfilled requests. The MCP Discovery Panel lets you filter agents by capability, reputation, and price \u2014 powered by the Casper MCP server. Let me deploy a new agent\u2026 I'll name it DEMO-AGENT, set it as an Oracle for 0.25 CSPR per request. The modal shows SIMULATION mode since we're in demo wallet. The transaction hash is recorded on-chain. And if I check my Account page \u2014 the agent appears in my activity instantly.\""],
      ["Key Visual Cues", "Magnetic hover on 'Deploy Agent' button. Modal opens with smooth animation. 'SIMULATION' badge visible. Success state shows transaction hash. Page transition to Account page (slide from right). Agent 'DEMO-AGENT' visible in Your Agents list with AGT-0XX ID."],
      ["Transition", "Navigate to Aegis in sidebar at 2:43."],
    ]),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function buildScene5() {
  return [
    heading1("Scene 5 \u2014 Aegis + CarbonGuard Quick Demo"),
    body("Timecode: 2:45 \u2013 3:30 (45 seconds)", { color: c(P.accent), bold: true }),
    spacer(100),
    sceneTable([
      ["Visual", "Aegis page: 4 parametric insurance policies with coverage, premium, trigger conditions. CarbonGuard page: 4 carbon projects with verification status, credits issued/retired, satellite pipeline."],
      ["Action", "AEGIS (20s):\n1. Show policy cards briefly\n2. Click 'Simulate Trigger' on the Soybean Field policy\n3. Show toast notification 'Payout triggered'\n4. Policy status changes to 'triggered'\n\nCARBONGUARD (25s):\n1. Navigate to CarbonGuard\n2. Show project cards (flagged project visible)\n3. Click 'Flag' on Borneo Peat project\n4. Show toast 'Project flagged'\n5. Show 'Burn initiated' alert banner\n6. Briefly show verification pipeline (4 steps)"],
      ["Narration", "\"Aegis wraps tokenized RWAs in parametric insurance. When the monitoring agent detects a trigger condition \u2014 like rainfall below threshold \u2014 it calls the payout contract directly. No claims adjuster, no manual intervention. [Click trigger] Payout triggered instantly.\n\nCarbonGuard tokenizes carbon credits as RWA. The verification agent pulls satellite imagery via x402-paid APIs. If deforestation is detected, it autonomously burns the credits on-chain. [Click flag] Project flagged \u2014 credits queued for autonomous burn.\""],
      ["Key Visual Cues", "Toast notifications appearing. Policy status badge changing from 'active' to 'triggered'. Carbon project verification badge changing to 'FLAGGED'. Alert banner: 'Burn initiated'. Scroll reveal on verification pipeline cards."],
      ["Transition", "Navigate to Casper Stack at 3:28."],
    ]),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function buildScene6() {
  return [
    heading1("Scene 6 \u2014 Casper Stack + Buildathon Page"),
    body("Timecode: 3:30 \u2013 4:00 (30 seconds)", { color: c(P.accent), bold: true }),
    spacer(100),
    sceneTable([
      ["Visual", "Casper Stack page: 6 toolkit cards (x402, Casper MCP, CSPR.trade MCP, CSPR.click, CSPR.cloud, Odra) + Casper Manifest section. Buildathon page: submission card with checklist, judging criteria grid."],
      ["Action", "1. Scroll through Casper Stack cards (show each card briefly)\n2. Scroll to Casper Manifest section\n3. Navigate to Buildathon page\n4. Show submission checklist (all checked)\n5. Scroll to judging criteria grid"],
      ["Narration", "\"SKYWEE isn't a wrapper around a single Casper tool \u2014 it composes every component of the Casper AI Toolkit. x402 for micropayments, Casper MCP for agent discovery, CSPR.cloud for live data, Odra for smart contracts. Every feature traces back to a Casper primitive. The submission meets all Buildathon criteria: working prototype, open-source repo, demo video, and original code.\""],
      ["Key Visual Cues", "Scroll reveal animations on toolkit cards. Manifest section fading in. Buildathon checklist with green checkmarks. Judging criteria grid with 8 cards."],
      ["Transition", "Navigate back to Dashboard at 3:58."],
    ]),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function buildScene7() {
  return [
    heading1("Scene 7 \u2014 Closing & Call to Action"),
    body("Timecode: 4:00 \u2013 4:30 (30 seconds)", { color: c(P.accent), bold: true }),
    spacer(100),
    sceneTable([
      ["Visual", "Return to dashboard. Full dashboard view visible. Then text overlay appears: GitHub URL + Vercel URL. Fade to black with SKYWEE logo centered."],
      ["Action", "1. Sit on dashboard for 3 seconds (let viewer absorb)\n2. Show text overlay with URLs:\n   github.com/Zerxxz/SKYWEE---casper-network-buildathon\n   skywee-ashy.vercel.app\n3. Fade to black\n4. Show SKYWEE logo + tagline for 3 seconds"],
      ["Narration", "\"SKYWEE \u2014 the Agentic Web3 Operating System on Casper Network. Five modules, one trust layer, fully on-chain. Built with the complete Casper AI Toolkit: x402, MCP, Odra, CSPR.cloud. The code is open-source on GitHub, and the live demo is deployed on Vercel. SKYWEE \u2014 the trust layer for the agent economy.\""],
      ["Key Visual Cues", "Dashboard with all effects visible (cursor trail, watermark, particles). Text overlay in monospace font. Fade transition to black. SKYWEE logo with glass shine on black background."],
      ["Transition", "End recording at 4:30."],
    ]),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ============================================================
// POST-PRODUCTION TIPS
// ============================================================
function buildPostProduction() {
  return [
    heading1("Post-Production Tips"),
    body("After recording, follow these tips for a polished final video.", { color: c(P.secondary) }),
    spacer(100),
    heading2("Editing"),
    bullet("Use DaVinci Resolve (free) or Adobe Premiere for editing"),
    bullet("Trim dead air at start/end of recording"),
    bullet("Cut any long pauses or mistakes \u2014 keep the pace tight"),
    bullet("Add 0.5s crossfade between scene transitions for smoothness"),
    spacer(100),
    heading2("Audio"),
    bullet("Add subtle background music (electronic ambient, low volume \u2014 10-15% of narration)"),
    bullet("Use royalty-free music from YouTube Audio Library or Pixabay"),
    bullet("Apply noise reduction to narration track"),
    bullet("Normalize audio levels to -14 LUFS for web delivery"),
    spacer(100),
    heading2("Visual Overlays"),
    bullet("Add text labels for key terms when first mentioned: 'x402', 'MCP', 'Odra', 'CSPR.cloud'"),
    bullet("Add subtle zoom (110%) on important UI elements during explanation"),
    bullet("Add a small 'Demo Mode' badge in corner when wallet is in demo mode"),
    bullet("Use monospace font for technical terms in overlays"),
    spacer(100),
    heading2("Export Settings"),
    bullet("Resolution: 1920\u00D71080 (1080p) minimum, 2560\u00D71440 (1440p) preferred"),
    bullet("Format: MP4 (H.264 codec)"),
    bullet("Bitrate: 8-12 Mbps for 1080p"),
    bullet("Audio: AAC, 192 kbps, 48kHz"),
    bullet("Add burned-in subtitles for accessibility (or upload .srt to YouTube/DoraHacks)"),
    spacer(100),
    heading2("Final Checklist"),
    bullet("Total duration under 5 minutes"),
    bullet("All 5 modules shown at least briefly"),
    bullet("Deploy Agent demo completed successfully"),
    bullet("GitHub URL + live URL visible at end"),
    bullet("Audio clear and audible"),
    bullet("No sensitive information visible (API keys, passwords, etc.)"),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ============================================================
// CHEAT SHEET
// ============================================================
function buildCheatSheet() {
  return [
    heading1("Key Talking Points Cheat Sheet"),
    body("Quick reference \u2014 use these one-liners if you go off-script or need to improvise.", { color: c(P.secondary) }),
    spacer(100),
    heading2("Module One-Liners"),
    sceneTable([
      ["AgentSquare", "Permissionless registry where AI agents publish capabilities, set a price per request in CSPR via x402, and earn on-chain reputation. The agent-to-agent economy."],
      ["Aegis", "Parametric insurance for tokenized RWAs. Monitoring agents verify off-chain triggers via x402-paid APIs and execute payout contracts on-chain within seconds \u2014 no underwriter, no claims adjuster."],
      ["SwarmTreasury", "Multi-agent DAO execution. Four specialized agents \u2014 Yield, Risk, Compliance, Treasurer \u2014 deliberate on-chain before any treasury action. Full deliberation trail stored on Casper."],
      ["RWA-X Vault", "Fractionalize invoices, trade-finance receivables, and other RWAs into Casper-native tokens. An autonomous market-maker agent runs Dutch auctions and rebalances the AMM curve."],
      ["CarbonGuard", "Carbon credits as RWA. A verification agent pulls satellite + IoT data via x402, validates project claims, and autonomously burns credits when deforestation is detected."],
    ]),
    spacer(200),
    heading2("Technical Terms"),
    sceneTable([
      ["x402", "HTTP-native payment protocol. Agents pay per API request with cryptographic proof \u2014 no off-chain settlement needed."],
      ["MCP (Model Context Protocol)", "Open standard that lets AI agents query blockchain state via a structured protocol. SKYWEE uses it for agent discovery."],
      ["Odra Framework", "Developer-friendly Rust smart contract framework for Casper. Every SKYWEE contract is written in Odra."],
      ["CSPR.cloud", "Enterprise-grade REST API for Casper blockchain interaction. SKYWEE uses it for live block height, account balances, and network status."],
      ["Casper Testnet", "The test network for Casper blockchain. All SKYWEE transactions are deployed here with real smart-contract interactions."],
      ["Casper Wallet", "Official browser extension for Casper. SKYWEE integrates with it for wallet connection, deploy signing, and account management."],
    ]),
    spacer(200),
    heading2("Key Stats to Mention"),
    sceneTable([
      ["Modules", "5 unified modules in one platform"],
      ["Smart Contracts", "5 Odra contracts (Rust) deployed to Casper Testnet"],
      ["API Routes", "15+ REST API endpoints with Prisma + SQLite persistence"],
      ["Casper Tools Used", "6 out of 6 toolkit components (x402, MCP, CSPR.click, CSPR.cloud, Odra, CSPR.trade MCP)"],
      ["Initial Agents", "8 pre-seeded agents with distinct roles and reputation scores"],
      ["Prize Pool", "$150,000 USD (Casper Agentic Buildathon 2026)"],
    ]),
  ];
}

// ============================================================
// DOCUMENT ASSEMBLY
// ============================================================
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Calibri" }, size: 24, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
    },
  },
  sections: [
    // Cover section
    {
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children: buildCover(),
    },
    // Body section
    {
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 } } },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "SKYWEE Demo Video Script  |  Page ", size: 18, color: c(P.secondary) }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) }),
            ],
          })],
        }),
      },
      children: [
        ...buildChecklist(),
        ...buildScene1(),
        ...buildScene2(),
        ...buildScene3(),
        ...buildScene4(),
        ...buildScene5(),
        ...buildScene6(),
        ...buildScene7(),
        ...buildPostProduction(),
        ...buildCheatSheet(),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/home/z/my-project/download/SKYWEE-Demo-Video-Script.docx", buf);
  console.log("Generated: SKYWEE-Demo-Video-Script.docx");
});
