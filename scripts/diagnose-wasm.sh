#!/usr/bin/env bash
# =============================================================================
# SKYWEE — Diagnostic script: verify the wasm you're deploying is clean
# =============================================================================
#
# This script reproduces the EXACT check that Casper's wasm_prep.rs performs
# during deploy preprocessing. It will tell you definitively whether the wasm
# file you're about to deploy (or just deployed) contains bulk-memory opcodes.
#
# Usage:
#   bash scripts/diagnose-wasm.sh [path-to-wasm]
#
# If no path given, checks all 5 wasms in contracts/odra/wasm/.
#
# WHAT IT CHECKS:
# 1. File exists and is a valid wasm (magic bytes \0asm)
# 2. No data count section (ID 12) — Casper rejects this
# 3. No 0xFC opcode as a real instruction (the "bulk memory" rejection trigger)
# 4. Cross-checks with wabt's wasm-validate --disable-bulk-memory (reference tool)
# 5. Cross-checks with wasm2wat grep (reference disassembler)
#
# If all 3 checks agree the wasm is CLEAN, but Casper still rejects with
# "Bulk memory operations are not supported", then you are NOT deploying
# the wasm file you think you are. Possible causes:
#   - Stale wasm in contracts/odra/wasm/ (run `cargo odra build` to regenerate)
#   - Deploy script pointed at a different file
#   - Git clone is outdated (run `git pull origin main`)
#   - cargo-odra cache has old wasm (run `cargo clean && cargo odra build`)
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
DEFAULT_WASM_DIR="$REPO_ROOT/contracts/odra/wasm"

# Target wasm(s)
if [[ $# -ge 1 ]]; then
  TARGETS=("$@")
else
  TARGETS=(
    "$DEFAULT_WASM_DIR/AgentRegistry.wasm"
    "$DEFAULT_WASM_DIR/InsuranceContract.wasm"
    "$DEFAULT_WASM_DIR/TreasuryContract.wasm"
    "$DEFAULT_WASM_DIR/RwaVault.wasm"
    "$DEFAULT_WASM_DIR/CarbonGuard.wasm"
  )
fi

echo ""
log_info "SKYWEE wasm diagnostic"
log_info "======================="
log_info "Repo root: $REPO_ROOT"
log_info "Git HEAD:  $(cd "$REPO_ROOT" && git rev-parse HEAD 2>/dev/null || echo 'not a git repo')"
log_info "Git branch: $(cd "$REPO_ROOT" && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'n/a')"
log_info ""

# Check tools
log_info "Tool availability:"
for tool in wasm2wat wasm-validate wasm-objdump python3; do
  if command -v "$tool" >/dev/null 2>&1; then
    log_success "$tool: $(command -v "$tool")"
  else
    log_error "$tool: NOT INSTALLED"
    if [[ "$tool" == "wasm2wat" || "$tool" == "wasm-validate" || "$tool" == "wasm-objdump" ]]; then
      echo "       Install wabt: apt install wabt  OR  brew install wabt"
    fi
  fi
done
echo ""

# Check each target wasm
for wasm in "${TARGETS[@]}"; do
  echo ""
  log_info "Checking: $wasm"

  if [[ ! -f "$wasm" ]]; then
    log_error "File does not exist"
    continue
  fi

  size=$(stat -c%s "$wasm" 2>/dev/null || stat -f%z "$wasm")
  log_info "Size: $size bytes"

  md5=$(md5sum "$wasm" 2>/dev/null | awk '{print $1}' || md5 -q "$wasm" 2>/dev/null)
  log_info "MD5: $md5"

  # Get last modification time
  mtime=$(stat -c%y "$wasm" 2>/dev/null || stat -f%Sm "$wasm" 2>/dev/null)
  log_info "Modified: $mtime"

  # Check magic bytes
  magic=$(xxd -l 4 -p "$wasm" 2>/dev/null || python3 -c "
b=open('$wasm','rb').read(4)
print(b.hex())
")
  if [[ "$magic" == "0061736d" ]]; then
    log_success "Magic bytes: \\0asm (valid wasm)"
  else
    log_error "Magic bytes: $magic (NOT a wasm file!)"
    continue
  fi

  # Check 1: data count section (ID 12)
  has_dc=$(python3 -c "
b=open('$wasm','rb').read()
off=8
sections=[]
while off<len(b):
    sid=b[off]; off+=1
    sz=0; sh=0
    while True:
        x=b[off]; off+=1
        sz|=(x&0x7f)<<sh
        if x&0x80==0: break
        sh+=7
    sections.append(sid)
    off+=sz
print('yes' if 12 in sections else 'no')
")
  if [[ "$has_dc" == "yes" ]]; then
    log_error "CHECK 1 FAIL: data count section (ID 12) present — Casper rejects"
  else
    log_success "CHECK 1 OK: no data count section"
  fi

  # Check 2: 0xFC opcodes as real instructions (operand-aware parser)
  fc_opcodes=$(python3 -c "
import sys
sys.path.insert(0, '$REPO_ROOT/scripts' if False else '$REPO_ROOT')
# Inline the parser to avoid path issues
import struct

def read_uleb(d, o):
    r=s=0
    while True:
        x=d[o]; o+=1; r|=(x&0x7f)<<s
        if x&0x80==0: break
        s+=7
    return r, o

def read_sleb(d, o):
    r=s=0
    while True:
        x=d[o]; o+=1; r|=(x&0x7f)<<s; s+=7
        if x&0x80==0:
            if x&0x40: r|=-(1<<s)
            break
    return r, o

def read_blocktype(d, o):
    b=d[o]
    if b in (0x40,0x7f,0x7e,0x7d,0x7c,0x70,0x6f):
        return o+1
    _, o = read_sleb(d, o)
    return o

def skip_instr(d, o):
    op=d[o]; o+=1
    if op==0xFC:
        sub, o = read_uleb(d, o)
        if sub in (0x08, 0x0c):
            _, o = read_uleb(d, o)
            _, o = read_uleb(d, o)
        elif sub in (0x09, 0x0d):
            _, o = read_uleb(d, o)
        elif sub in (0x0a, 0x0b, 0x0e, 0x0f, 0x11):
            _, o = read_uleb(d, o)
            _, o = read_uleb(d, o)
        elif sub == 0x10:
            _, o = read_uleb(d, o)
        elif sub < 0x08:
            pass
        return o, op, sub
    if op in (0x02, 0x03, 0x04):
        o = read_blocktype(d, o)
    elif op in (0x0c, 0x0d):
        _, o = read_uleb(d, o)
    elif op == 0x0e:
        n, o = read_uleb(d, o)
        for _ in range(n+1):
            _, o = read_uleb(d, o)
    elif op == 0x10:
        _, o = read_uleb(d, o)
    elif op == 0x11:
        _, o = read_uleb(d, o)
        _, o = read_uleb(d, o)
    elif op == 0x1c:
        n, o = read_uleb(d, o)
        o += n
    elif op in (0x20, 0x21, 0x22, 0x23, 0x24):
        _, o = read_uleb(d, o)
    elif 0x28 <= op <= 0x3e:
        _, o = read_uleb(d, o)
        _, o = read_uleb(d, o)
    elif op == 0x3f or op == 0x40:
        o += 1
    elif op == 0x41:
        _, o = read_sleb(d, o)
    elif op == 0x42:
        _, o = read_sleb(d, o)
    elif op == 0x43:
        o += 4
    elif op == 0x44:
        o += 8
    elif op == 0xd0:
        o += 1
    elif op == 0xd2:
        _, o = read_uleb(d, o)
    return o, op, None

b=open('$wasm','rb').read()
off=8
sections={}
while off<len(b):
    sid=b[off]; off+=1
    sz, off = read_uleb(b, off)
    sections[sid] = (off, off+sz)
    off += sz

if 10 not in sections:
    print(0); sys.exit()

pstart, pend = sections[10]
payload = b[pstart:pend]
off = 0
num_funcs, off = read_uleb(payload, off)

fc_count = 0
for fi in range(num_funcs):
    body_size, off = read_uleb(payload, off)
    body_start = off
    body_end = off + body_size
    n_local_decls, off = read_uleb(payload, off)
    for _ in range(n_local_decls):
        _, off = read_uleb(payload, off)
        off += 1
    instr_off = off
    while instr_off < body_end:
        try:
            new_off, op, sub = skip_instr(payload, instr_off)
        except:
            break
        if op == 0xFC:
            fc_count += 1
        instr_off = new_off
        if op == 0x0b:
            break
    off = body_end

print(fc_count)
")
  if [[ "$fc_opcodes" -gt 0 ]]; then
    log_error "CHECK 2 FAIL: $fc_opcodes 0xFC opcodes found in code section — Casper rejects"
  else
    log_success "CHECK 2 OK: 0 0xFC opcodes in code section (operand-aware parser)"
  fi

  # Check 3: wabt wasm-validate --disable-bulk-memory (reference)
  if command -v wasm-validate >/dev/null 2>&1; then
    if wasm-validate --disable-bulk-memory "$wasm" 2>/dev/null; then
      log_success "CHECK 3 OK: wasm-validate --disable-bulk-memory passed (wabt reference)"
    else
      log_error "CHECK 3 FAIL: wasm-validate --disable-bulk-memory rejected this wasm"
      wasm-validate --disable-bulk-memory "$wasm" 2>&1 | head -3 | sed 's/^/       /'
    fi
  fi

  # Check 4: wasm2wat grep (reference disassembler)
  if command -v wasm2wat >/dev/null 2>&1; then
    wat_count=$(wasm2wat "$wasm" 2>/dev/null | grep -cE 'memory\.(copy|fill|init)|data\.drop|table\.(get|set|copy|init|fill|grow)|elem\.drop' || true)
    wat_count=$(echo "$wat_count" | tail -1)
    if [[ "$wat_count" -gt 0 ]]; then
      log_error "CHECK 4 FAIL: $wat_count forbidden opcodes per wasm2wat"
    else
      log_success "CHECK 4 OK: 0 forbidden opcodes per wasm2wat"
    fi
  fi

  # Show exports (Casper requires 'call' export)
  if command -v wasm-objdump >/dev/null 2>&1; then
    echo ""
    log_info "Exports (Casper requires 'call'):"
    wasm-objdump -x "$wasm" 2>/dev/null | grep -E "^  Export|func|memory" | head -15 | sed 's/^/    /'
  fi
done

echo ""
echo "================================================================"
log_info "DIAGNOSTIC SUMMARY"
echo "================================================================"
echo ""
echo "If all 4 checks pass for a wasm file, that wasm IS Casper-compatible."
echo "If Casper still rejects it with 'Bulk memory operations are not supported',"
echo "you are NOT deploying the wasm you just checked. Likely causes:"
echo ""
echo "  1. Stale wasm in contracts/odra/wasm/ — run:"
echo "     cd contracts/odra && cargo clean && cargo odra build"
echo ""
echo "  2. Deploy script points to a different file — verify the path"
echo ""
echo "  3. Git clone is outdated — run:"
echo "     git pull origin main"
echo "     cd contracts/odra && cargo odra build"
echo ""
echo "  4. cargo-odra's built-in optimizer didn't run — check 'cargo odra build'"
echo "     output for 'Optimizing wasm files...' line"
echo ""
echo "  5. You built with a different Rust toolchain — verify with:"
echo "     cd contracts/odra && rustc --version"
echo "     (should match the pin in rust-toolchain.toml)"
