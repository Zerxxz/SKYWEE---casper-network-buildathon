#!/usr/bin/env bash
# Post-build optimizer for Casper-deployable wasm.
#
# Even with `-C target-feature=-bulk-memory` in .cargo/config.toml, the
# precompiled rust-std component linked into the final module can still
# contain memory.copy / memory.fill opcodes (because std itself was built
# by rustup with default features). wasm-opt's --llvm-memory-copy-fill-lowering
# pass rewrites any remaining bulk-memory opcodes into MVP loops, and
# --strip-target-features removes the `target_features` custom section so
# Casper's validator doesn't trip over declared-but-unknown features.
#
# Usage:  bash scripts/optimize-wasm.sh   (run from contracts/odra/)
# Requires: binaryen (wasm-opt) on PATH.
set -euo pipefail

WASM_DIR="$(cd "$(dirname "$0")/../wasm" && pwd)"

if ! command -v wasm-opt >/dev/null 2>&1; then
  echo "ERROR: wasm-opt (Binaryen) is not installed." >&2
  echo "  Debian/Ubuntu: sudo apt install binaryen" >&2
  echo "  macOS:         brew install binaryen" >&2
  echo "  Or grab a prebuilt release: https://github.com/WebAssembly/binaryen/releases" >&2
  exit 1
fi

if [ ! -d "$WASM_DIR" ]; then
  echo "ERROR: wasm directory not found at $WASM_DIR" >&2
  echo "  Run 'cargo odra build' first." >&2
  exit 1
fi

shopt -s nullglob
WASM_FILES=( "$WASM_DIR"/*.wasm )

if [ "${#WASM_FILES[@]}" -eq 0 ]; then
  echo "ERROR: no .wasm files found in $WASM_DIR" >&2
  echo "  Run 'cargo odra build' first." >&2
  exit 1
fi

echo "Optimizing ${#WASM_FILES[@]} wasm module(s) for Casper:"
for w in "${WASM_FILES[@]}"; do
  name="$(basename "$w")"
  tmp="$w.raw"
  cp "$w" "$tmp"
  size_before=$(stat -c%s "$tmp" 2>/dev/null || stat -f%z "$tmp" 2>/dev/null || echo "?")
  # --llvm-memory-copy-fill-lowering : rewrite memory.copy/fill -> MVP loops
  # --strip-target-features          : drop target_features custom section
  # -Oz                              : size-optimized
  wasm-opt "$tmp" \
    --llvm-memory-copy-fill-lowering \
    --strip-target-features \
    -Oz \
    -o "$w"
  rm -f "$tmp"
  size_after=$(stat -c%s "$w")
  echo "  $name  ->  ${size_after} bytes (was ${size_before})"
done

echo ""
echo "Done. Verifying no bulk-memory opcodes remain..."
MISSING=0
for w in "${WASM_FILES[@]}"; do
  name="$(basename "$w")"
  if command -v wasm2wat >/dev/null 2>&1; then
    bad="$(wasm2wat "$w" 2>/dev/null | grep -E 'memory\.(init|copy|fill)|data\.drop|table\.(init|copy)|elem\.drop' || true)"
    if [ -n "$bad" ]; then
      echo "  $name : FAIL - still contains bulk-memory ops:"
      echo "$bad" | head -5 | sed 's/^/      /'
      MISSING=1
    else
      echo "  $name : OK"
    fi
  else
    echo "  $name : (wasm2wat not available, skipping verification)"
  fi
done

if [ "$MISSING" -ne 0 ]; then
  echo "" >&2
  echo "ERROR: some wasm modules still contain bulk-memory operations." >&2
  exit 1
fi

echo ""
echo "All modules clean. Ready for Casper deployment."
