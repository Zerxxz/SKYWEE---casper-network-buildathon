"use client"

import { motion } from "framer-motion"
import { Github, ArrowUpRight, Calendar, Trophy } from "lucide-react"

export function SkyweeBuildathon() {
  return (
    <section id="buildathon" className="relative py-24 px-4 sm:px-6 lg:px-8 scroll-mt-20">
      {/* SKYWEE bg watermark */}
      <div
        aria-hidden
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-black tracking-[-0.08em] leading-none whitespace-nowrap select-none"
          style={{
            fontSize: "clamp(8rem, 24vw, 18rem)",
            color: "oklch(1 0 0 / 0.02)",
          }}
        >
          SUBMIT
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl skywee-glass-strong p-8 sm:p-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full skywee-hairline bg-white/5">
            <Trophy size={11} className="text-white/70" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/70">
              Casper Agentic Buildathon 2026
            </span>
          </div>

          <h2 className="mt-6 text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-white">
            One submission.{" "}
            <span className="text-white/40">Five products.</span>
          </h2>
          <p className="mt-5 max-w-2xl mx-auto text-sm sm:text-base text-white/60 leading-relaxed">
            SKYWEE is submitted to the Casper Innovation Track as a single
            unified prototype deployed on Casper Testnet. Every module
            produces transactions on-chain, every agent is registered in the
            Odra contract, every payment flows through x402. The repo is fully
            open-source with a documented README and demo video walkthrough.
          </p>

          {/* Meta info */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            <div className="rounded-lg skywee-hairline bg-white/[0.03] p-3.5">
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-white/40">
                <Calendar size={10} /> Deadline
              </div>
              <div className="mt-1.5 text-sm font-semibold text-white">June 30, 2026</div>
            </div>
            <div className="rounded-lg skywee-hairline bg-white/[0.03] p-3.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                Prize Pool
              </div>
              <div className="mt-1.5 text-sm font-semibold text-white">$150,000 USD</div>
            </div>
            <div className="rounded-lg skywee-hairline bg-white/[0.03] p-3.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                Network
              </div>
              <div className="mt-1.5 text-sm font-semibold text-white">Casper Testnet</div>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-black rounded-md text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              <Github size={14} />
              View on GitHub
              <ArrowUpRight size={12} />
            </a>
            <a
              href="#modules"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 skywee-hairline bg-white/5 text-white rounded-md text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              Watch Demo Video
              <ArrowUpRight size={12} />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
