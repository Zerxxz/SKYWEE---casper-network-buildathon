"use client"

import { SkyweeHeader } from "@/components/skywee/header"
import { SkyweeHero } from "@/components/skywee/hero"
import { SkyweeTicker } from "@/components/skywee/ticker"
import { SkyweeArchitecture } from "@/components/skywee/architecture"
import { SkyweeModules } from "@/components/skywee/modules-section"
import { SkyweeActivityFeed } from "@/components/skywee/activity-feed"
import { SkyweeStack } from "@/components/skywee/casper-stack"
import { SkyweeBuildathon } from "@/components/skywee/buildathon"
import { SkyweeFooter } from "@/components/skywee/footer"

export default function Home() {
  return (
    <div id="top" className="relative min-h-screen flex flex-col bg-background">
      {/* Subtle grain texture overlay */}
      <div className="skywee-grain" aria-hidden />

      {/* Header */}
      <SkyweeHeader />

      {/* Main */}
      <main className="flex-1">
        <SkyweeHero />
        <SkyweeTicker />
        <SkyweeArchitecture />
        <SkyweeModules />
        <SkyweeActivityFeed />
        <SkyweeStack />
        <SkyweeBuildathon />
      </main>

      {/* Footer */}
      <SkyweeFooter />
    </div>
  )
}
