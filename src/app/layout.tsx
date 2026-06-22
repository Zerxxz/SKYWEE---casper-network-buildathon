import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/skywee/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SKYWEE — Agentic Web3 OS on Casper Network",
  description:
    "SKYWEE unifies five agentic AI primitives — AgentSquare, Aegis, SwarmTreasury, RWA-X Vault, and CarbonGuard — into one platform on Casper Testnet. Built for the Casper Agentic Buildathon 2026.",
  keywords: [
    "SKYWEE",
    "Casper Network",
    "Agentic AI",
    "DeFi",
    "RWA",
    "x402",
    "Odra",
    "Web3",
    "Casper Buildathon",
  ],
  authors: [{ name: "SKYWEE Team" }],
  openGraph: {
    title: "SKYWEE — Agentic Web3 OS on Casper Network",
    description:
      "Five modules. One trust layer. Fully on-chain on Casper Testnet.",
    siteName: "SKYWEE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SKYWEE — Agentic Web3 OS on Casper Network",
    description:
      "Five modules. One trust layer. Fully on-chain on Casper Testnet.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
