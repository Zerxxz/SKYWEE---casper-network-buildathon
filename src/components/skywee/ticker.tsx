"use client"

import { TICKER_ITEMS, MODULE_LABEL, type ModuleId } from "@/lib/skywee/data"

export function SkyweeTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS] // duplicate for seamless loop

  return (
    <div
      aria-hidden
      className="relative border-y border-white/10 bg-black/40 overflow-hidden py-3"
    >
      <div className="flex w-max skywee-marquee">
        {items.map((item, i) => (
          <div
            key={`${item.label}-${i}`}
            className="flex items-center gap-2.5 px-6 border-r border-white/5"
          >
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/30">
              {MODULE_LABEL[item.module as ModuleId]}
            </span>
            <span className="text-xs font-medium text-white/60">{item.label}</span>
            <span className="text-xs font-bold text-white skywee-tabular">{item.value}</span>
            <span className="ml-2 text-white/20">·</span>
          </div>
        ))}
      </div>

      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black to-transparent pointer-events-none" />
    </div>
  )
}
