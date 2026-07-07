#!/usr/bin/env bash
# =============================================================================
# SKYWEE — Init diagnostic: find which contract's init() is failing
# =============================================================================
#
# Error "User error: 64658" = Odra ExecutionError::MissingArg
# (formula: 64536 UserErrorTooHigh + 122 MissingArg = 64658)
#
# This means: contract install succeeded (wasm passed preprocessing),
# but init() entry point was called and one of its expected runtime
# args was missing.
#
# This script:
#   1. Verifies wasms are clean (no bulk-memory — already fixed)
#   2. Lists every entry point + arg name expected by each wasm
#   3. Cross-checks against deploy.rs to find any mismatch
#
# Usage:
#   bash scripts/diagnose-init.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}ℹ${NC}  $*"; }
log_success() { echo -e "${GREEN}✓${NC} $*"; }
log_warn()    { echo -e "${YELLOW}⚠${NC} $*"; }
log_error()   { echo -e "${RED}✗${NC} $*" >&2; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WASM_DIR="$REPO_ROOT/contracts/odra/wasm"

echo ""
log_info "SKYWEE init() diagnostic"
log_info "========================"
log_info "Repo: $REPO_ROOT"
log_info ""

# Verify wasms are clean first
log_info "Step 1: Verify wasms are Casper-compatible (no bulk-memory)"
echo ""
bash "$SCRIPT_DIR/diagnose-wasm.sh" 2>&1 | grep -E "CHECK|MD5|Size" | head -25
echo ""

# Extract entry points + arg names from each wasm
log_info "Step 2: Extract entry points + arg names from each wasm"
echo ""

python3 << 'PYEOF'
import re
import os

WASM_DIR = "$WASM_DIR"

CONTRACTS = [
    ("AgentRegistry", "AgentRegistry.wasm", "init() — NO args"),
    ("InsuranceContract", "InsuranceContract.wasm", "init() — NO args"),
    ("TreasuryContract", "TreasuryContract.wasm", "init(auto_execute_threshold: U512) — 1 arg"),
    ("RwaVault", "RwaVault.wasm", "init() — NO args"),
    ("CarbonGuard", "CarbonGuard.wasm", "init() — NO args"),
]

# Init arg names per contract (extracted from Rust source)
EXPECTED_INIT_ARGS = {
    "AgentRegistry": [],
    "InsuranceContract": [],
    "TreasuryContract": ["auto_execute_threshold"],
    "RwaVault": [],
    "CarbonGuard": [],
}

print(f"{'Contract':<22} {'init expects':<35} {'Status':<10}")
print(f"{'-'*22} {'-'*35} {'-'*10}")

for name, filename, desc in CONTRACTS:
    wasm_path = os.path.join(WASM_DIR, filename)
    if not os.path.exists(wasm_path):
        print(f"{name:<22} FILE NOT FOUND: {filename}")
        continue

    data = open(wasm_path, 'rb').read()

    # Find all readable strings in data section
    strings = re.findall(rb'[\x20-\x7e]{4,}', data)
    string_set = set()
    for s in strings:
        s_str = s.decode('ascii', errors='replace')
        string_set.add(s_str)

    # Init export must exist
    has_init_export = b'init' in data  # rough check

    # Check if expected init args appear as strings in wasm
    expected_args = EXPECTED_INIT_ARGS[name]
    found_args = []
    missing_args = []
    for arg in expected_args:
        if arg in string_set:
            found_args.append(arg)
        else:
            missing_args.append(arg)

    if missing_args:
        status = f"❌ missing: {','.join(missing_args)}"
    elif expected_args:
        status = f"✓ found: {','.join(found_args)}"
    else:
        status = "✓ no args expected"

    print(f"{name:<22} {desc:<35} {status:<10}")

print()
print("=" * 80)
print("Entry points exported by each wasm (from wasm-objdump):")
print("=" * 80)
PYEOF

# Use wasm-objdump to list exports per wasm
if command -v wasm-objdump >/dev/null 2>&1; then
  for w in "$WASM_DIR"/*.wasm; do
    name=$(basename "$w" .wasm)
    echo ""
    echo "--- $name ---"
    wasm-objdump -x "$w" 2>/dev/null | grep -E "Export\[" | head -1
    wasm-objdump -x "$w" 2>/dev/null | grep -E "^\s+-\s+func.*->" | head -20
  done
else
  log_warn "wasm-objdump not installed — skipping export dump"
  log_warn "Install wabt: apt install wabt OR brew install wabt"
fi

echo ""
echo "================================================================"
log_info "Step 3: deploy.rs init calls"
echo "================================================================"
echo ""
grep -nB1 -A3 "::deploy\|InitArgs" "$REPO_ROOT/contracts/odra/bin/deploy.rs" | head -40

echo ""
echo "================================================================"
log_info "Step 4: How to identify which contract's init() is failing"
echo "================================================================"
echo ""
echo "When you run 'cargo run --bin deploy_skywee --features livenet --release',"
echo "the output should show progress per contract. The contract that fails"
echo "will be the LAST one printed before the panic."
echo ""
echo "Expected output sequence:"
echo "  🚀 Deploying SKYWEE contracts to Casper livenet..."
echo "  AgentRegistry  : hash-..."
echo "  Insurance      : hash-..."
echo "  Treasury       : hash-...    <- if init fails here, panic happens"
echo "  RwaVault       : hash-..."
echo "  CarbonGuard    : hash-..."
echo ""
echo "If the panic message says 'Invalid init args for contract TreasuryContract',"
echo "then the issue is TreasuryContract init args not being passed correctly."
echo ""
echo "If it says the same for AgentRegistry (which has init() with NO args),"
echo "then Odra is passing unexpected args — possible Odra livenet-env bug."
echo ""
echo "Run the deploy with verbose logging:"
echo "  RUST_LOG=odra_casper_livenet_env=debug,odra_casper_rpc_client=debug \\"
echo "    cargo run --bin deploy_skywee --features livenet --release 2>&1 | tee deploy.log"
echo ""
echo "Then send me the deploy.log file — I can pinpoint exactly which arg is missing."
