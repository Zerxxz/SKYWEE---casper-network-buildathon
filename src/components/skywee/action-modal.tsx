"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, CheckCircle2, AlertCircle, ArrowRight, ExternalLink } from "lucide-react"

export interface ActionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  icon?: React.ReactNode
  children: React.ReactNode
  /** Submit handler — should throw on error, return data on success. */
  onSubmit: () => Promise<unknown>
  submitLabel?: string
  successTitle?: string
  successMessage?: string
  successHashLabel?: string
  /** When the modal closes after success, called. */
  onSuccess?: () => void
  /** Deploy mode badge — "live" | "simulation" | null */
  deployMode?: "live" | "simulation" | null
}

type Phase = "form" | "submitting" | "success" | "error"

export function ActionModal({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  onSubmit,
  submitLabel = "Submit",
  successTitle = "Transaction confirmed",
  successMessage,
  successHashLabel = "Transaction Hash",
  onSuccess,
  deployMode,
}: ActionModalProps) {
  const [phase, setPhase] = React.useState<Phase>("form")
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<{ hash?: string; [k: string]: unknown } | null>(null)

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setPhase("form")
      setErrorMsg(null)
      setResult(null)
    }
  }, [open])

  const handleSubmit = async () => {
    setPhase("submitting")
    setErrorMsg(null)
    try {
      const res = (await onSubmit()) as { hash?: string; [k: string]: unknown } | undefined
      setResult(res ?? null)
      setPhase("success")
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e))
      setPhase("error")
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    if (phase === "success") {
      onSuccess?.()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="pointer-events-auto w-full max-w-md rounded-2xl skywee-glass-strong p-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {icon && (
                    <div className="h-9 w-9 rounded-lg skywee-hairline bg-foreground/[0.04] grid place-items-center">
                      {icon}
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold">{title}</h3>
                    {description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 rounded-md hover:bg-foreground/5"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <AnimatePresence mode="wait">
                {phase === "form" && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {children}
                    {deployMode && (
                      <div className="mt-3 mb-1 flex items-center justify-between px-2.5 py-1.5 rounded-md bg-foreground/[0.03] border border-border/60">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          Deploy Mode
                        </span>
                        {deployMode === "live" ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono uppercase rounded bg-foreground text-background">
                            Live · Casper Testnet
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono uppercase rounded bg-foreground/10 text-muted-foreground">
                            Simulation
                          </span>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      {submitLabel}
                      <ArrowRight size={14} />
                    </button>
                  </motion.div>
                )}

                {phase === "submitting" && (
                  <motion.div
                    key="submitting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-10 flex flex-col items-center text-center"
                  >
                    <Loader2 size={28} className="animate-spin text-foreground/70" />
                    <div className="mt-4 text-sm font-semibold">Submitting transaction…</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {deployMode === "live"
                        ? "Signing deploy with Casper Wallet & broadcasting to Testnet."
                        : "Recording transaction in simulation mode."}
                    </div>
                  </motion.div>
                )}

                {phase === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-6 flex flex-col items-center text-center"
                  >
                    <CheckCircle2 size={36} className="text-foreground" />
                    <div className="mt-3 text-sm font-bold">{successTitle}</div>
                    {successMessage && (
                      <div className="mt-1 text-[11px] text-muted-foreground">{successMessage}</div>
                    )}
                    {result?.hash && (
                      <div className="mt-4 w-full rounded-lg skywee-hairline bg-foreground/[0.02] p-3 text-left">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                            {successHashLabel}
                          </div>
                          {result?.broadcast === "live" && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono uppercase rounded bg-foreground text-background">
                              Live
                            </span>
                          )}
                          {result?.broadcast === "simulation" && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono uppercase rounded bg-foreground/10 text-muted-foreground">
                              Simulation
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] break-all">{result.hash}</div>
                        {result?.explorerUrl && typeof result.explorerUrl === "string" && (
                          <a
                            href={result.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                          >
                            View on cspr.live
                            <ExternalLink size={9} />
                          </a>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleClose}
                      className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      Done
                    </button>
                  </motion.div>
                )}

                {phase === "error" && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-6 flex flex-col items-center text-center"
                  >
                    <AlertCircle size={32} className="text-foreground/70" />
                    <div className="mt-3 text-sm font-bold">Transaction failed</div>
                    <div className="mt-1 text-[11px] text-muted-foreground max-w-xs">
                      {errorMsg}
                    </div>
                    <div className="mt-6 flex gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => setPhase("form")}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 skywee-hairline bg-foreground/[0.03] rounded-md text-sm font-semibold hover:bg-foreground/[0.07] transition-colors"
                      >
                        Try Again
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold text-muted-foreground hover:bg-foreground/5 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============== Reusable form fields ==============

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-3.5">
      <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </label>
      {children}
      {hint && <div className="mt-1 text-[10px] text-muted-foreground/70">{hint}</div>}
    </div>
  )
}

export const inputCls =
  "w-full px-3 py-2 text-sm bg-foreground/[0.02] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground/40 focus:border-foreground/40 transition-colors placeholder:text-muted-foreground/40"

export const selectCls = inputCls + " appearance-none cursor-pointer"
