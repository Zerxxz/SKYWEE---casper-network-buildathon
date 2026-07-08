#!/usr/bin/env bun
// Patches every src/app/api/skywee/**/route.ts file to:
//   1. Import ensureSchema from @/lib/db
//   2. Await ensureSchema(db) at the top of each POST/GET handler
//      (before any DB query runs)
//
// Idempotent — if a file is already patched, it's skipped.
import { readFileSync, writeFileSync } from "fs"
import { execSync } from "child_process"

// Find all route.ts files that import db
const files = execSync(
  `find src/app/api/skywee -name "route.ts" -exec grep -l 'import { db } from "@/lib/db"' {} \\;`,
  { encoding: "utf-8" },
).trim().split("\n").filter(Boolean)

let patched = 0
let skipped = 0

for (const file of files) {
  const src = readFileSync(file, "utf-8")
  if (src.includes("ensureSchema")) {
    skipped++
    continue
  }

  // 1. Add ensureSchema to the import
  let updated = src.replace(
    'import { db } from "@/lib/db"',
    'import { db, ensureSchema } from "@/lib/db"',
  )

  // 2. Inside each export async function POST/GET handler, insert await ensureSchema(db) at the start of the try block.
  //    Pattern: `try {\n` at the start of the handler body.
  //    We do this by replacing the first occurrence of `try {` after each handler signature.
  //    Simpler: just insert at every `try {` that's at the top level of a handler.
  //    We use a regex that matches `export async function POST(req: Request) {` ... `try {` and inserts before the first statement.

  // Approach: insert `await ensureSchema(db)` right after every `try {` that appears inside an exported handler.
  // To be safe, we only insert once per handler, at the first `try {` occurrence.
  // The pattern `try {\n` followed by typical code:
  const tryPattern = /export async function (POST|GET)\([^)]*\)[^{]*\{[\s\S]*?try \{/
  let match
  const matches = [...updated.matchAll(new RegExp(tryPattern.source, "g"))]
  // We need to do this carefully — replace from the end to preserve indices.
  // Simpler approach: just insert `await ensureSchema(db)` after every `try {\n`
  // that comes after a handler signature.
  // Even simpler: just replace `try {` with `try {\n    await ensureSchema(db)`
  // globally, but only inside handlers — not inside helper functions.
  // Since all our routes have the pattern `try {` right after the handler signature,
  // a simple replace_all of `try {` → `try {\n    await ensureSchema(db)` works,
  // but we need to ensure we only do this once per file (to avoid double-patching
  // files with multiple handlers).

  // Count handlers
  const handlerCount = (updated.match(/export async function (POST|GET)\(/g) || []).length
  // Count try blocks
  const tryCount = (updated.match(/\btry \{/g) || []).length

  if (handlerCount === 0) {
    // No handlers — skip
    skipped++
    continue
  }

  // We want to insert `await ensureSchema(db)` at the START of each handler body,
  // right after the opening `{` of the handler, before any `try {`.
  // Pattern: `export async function POST(...)\n...\n{\n` then insert on next line.
  // But the handler signature can span multiple lines.
  // Better: insert right before the first `try {` in each handler.

  // Use a stateful regex replace
  let insertCount = 0
  updated = updated.replace(
    /export async function (POST|GET)\([^)]*\)\s*\{([\s\S]*?)try \{/g,
    (match, method, between) => {
      insertCount++
      return `export async function ${method}(req: Request) ${between}{\n  await ensureSchema(db)\ntry {`
    },
  )

  if (insertCount === 0) {
    console.warn(`⚠️  No handlers patched in ${file}`)
    continue
  }

  writeFileSync(file, updated, "utf-8")
  patched++
  console.log(`✓ Patched ${file} (${insertCount} handler${insertCount > 1 ? "s" : ""})`)
}

console.log(`\nDone. Patched ${patched}, skipped ${skipped}.`)
