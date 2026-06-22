/**
 * Pretty console logger for deployment scripts.
 */

type LogLevel = "info" | "success" | "warn" | "error" | "step" | "detail" | "dim"

const COLORS: Record<LogLevel, string> = {
  info: "\x1b[1m\x1b[37m",      // bold white
  success: "\x1b[1m\x1b[32m",   // bold green
  warn: "\x1b[33m",             // yellow
  error: "\x1b[1m\x1b[31m",     // bold red
  step: "\x1b[1m\x1b[34m",      // bold blue
  detail: "\x1b[2m\x1b[37m",    // dim white
  dim: "\x1b[2m",               // dim
}

const RESET = "\x1b[0m"
const ICONS: Record<LogLevel, string> = {
  info: "ℹ",
  success: "✓",
  warn: "⚠",
  error: "✗",
  step: "▶",
  detail: "·",
  dim: "·",
}

export function log(level: LogLevel, message: string, ...args: unknown[]) {
  const color = COLORS[level]
  const icon = ICONS[level]
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`${color}${icon} ${ts} ${message}${RESET}`, ...args)
}

export const logger = {
  info: (msg: string, ...args: unknown[]) => log("info", msg, ...args),
  success: (msg: string, ...args: unknown[]) => log("success", msg, ...args),
  warn: (msg: string, ...args: unknown[]) => log("warn", msg, ...args),
  error: (msg: string, ...args: unknown[]) => log("error", msg, ...args),
  step: (msg: string, ...args: unknown[]) => log("step", msg, ...args),
  detail: (msg: string, ...args: unknown[]) => log("detail", msg, ...args),
  dim: (msg: string, ...args: unknown[]) => log("dim", msg, ...args),
}

export function banner(text: string) {
  const line = "═".repeat(Math.max(text.length + 4, 60))
  console.log(`\n\x1b[1m\x1b[37m${line}\n  ${text}\n${line}${RESET}\n`)
}

export function divider() {
  console.log(`\x1b[2m${"─".repeat(60)}${RESET}`)
}
