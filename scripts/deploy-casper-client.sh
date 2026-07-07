#!/usr/bin/env bash
# =============================================================================
# SKYWEE — Alternative deploy script using casper-client CLI (no Odra livenet-env)
# =============================================================================
#
# This is an ALTERNATIVE to `cargo run --bin deploy_skywee --features livenet`.
# Use this if:
#   - Odra's livenet-env hangs waiting for SSE events
#   - You don't want to install nightly Rust just to run the deploy binary
#   - You want a simpler, more debuggable deploy flow
#
# WHAT IT DOES:
#   1. Submits 5 wasm deploys in order via `casper-client put-deploy`
#   2. Polls `casper-client get-deploy` for each until executed
#   3. Extracts the contract package hash from execution transforms
#   4. Prints a summary + .env.local snippet at the end
#
# PREREQUISITES:
#   - casper-client installed:
#       cargo install casper-client --locked
#       # OR on Debian/Ubuntu: apt install casper-client
#   - The 5 .wasm files in contracts/odra/wasm/ (built via `cargo odra build`)
#   - A Casper Testnet secret key PEM file with enough CSPR for 5 deploys
#     (faucet at https://testnet.cspr.live/faucet dispenses ~75 CSPR/day)
#
# USAGE:
#   bash scripts/deploy-casper-client.sh \
#     --network testnet \
#     --key ~/.casper/testnet/secret_key.pem
#
#   # Dry run (just print commands, don't submit):
#   bash scripts/deploy-casper-client.sh --network testnet --key ~/.casper/testnet/secret_key.pem --dry-run
#
#   # Override node URL or payment:
#   bash scripts/deploy-casper-client.sh --network testnet --key ~/.k.pem --payment 15000000000
#
#   # Mainnet:
#   bash scripts/deploy-casper-client.sh --network mainnet --key ~/.casper/mainnet/secret_key.pem
#
# =============================================================================

set -euo pipefail

# ----------------------------------------------------------------------------
# Defaults
# ----------------------------------------------------------------------------
NETWORK="testnet"
KEY_PATH=""
NODE_URL=""
CHAIN_NAME=""
PAYMENT_MOTES=200000000000  # 200 CSPR per contract — bumped from 10 CSPR after seeing
                            # "Out of gas error" on 200 KB Odra wasm installs.
                            # Actual cost was 10 CSPR (gas-budget hit), but
                            # contract installs need headroom for ref/unref
                            # and contract-package creation overhead. 20x
                            # safety is overkill but cheap on testnet.
TTL_SECONDS=1800            # 30 minutes (will be passed to casper-client as '30min')
POLL_INTERVAL=16            # Casper testnet block time ~16s
POLL_MAX=60                 # 60 * 16s = 16 min max wait per deploy
DRY_RUN=false
CSPR_CLOUD_TOKEN=""          # Bearer token for cspr.cloud proxy
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONTRACTS_DIR="$REPO_ROOT/contracts/odra"

# Colors for log output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ----------------------------------------------------------------------------
# Help
# ----------------------------------------------------------------------------
print_help() {
  cat <<EOF
SKYWEE — Alternative deploy script using casper-client CLI

USAGE:
  bash scripts/deploy-casper-client.sh --network <testnet|mainnet> --key <PATH> [OPTIONS]

REQUIRED:
  --network <net>      Network: testnet or mainnet
  --key <PATH>         Path to secret_key.pem file

OPTIONS:
  --node-url <URL>     Override RPC node URL (default per network)
  --chain-name <NAME>  Override chain name (default: casper-test / casper)
  --payment <MOTES>    Payment per contract in motes (default: 10000000000 = 10 CSPR)
  --ttl <SECONDS>      Deploy TTL in seconds (default: 1800 = 30min)
  --poll-interval <S>  Poll interval for get-deploy (default: 16s)
  --poll-max <N>       Max poll attempts per deploy (default: 60)
  --cspr-cloud-token <T>  Bearer token for cspr.cloud RPC proxy. Required for
                       testnet/mainnet since mid-2026 (legacy RPC URLs are
                       NXDOMAIN). Get one at https://cspr.cloud (Account → API Tokens).
                       Can also be set via CSPR_CLOUD_AUTH_TOKEN env var.
  --dry-run            Print commands but don't submit
  -h, --help           Show this help

EXAMPLES:
  # Testnet deploy
  bash scripts/deploy-casper-client.sh --network testnet --key ~/.casper/testnet/secret_key.pem

  # Dry run (no submit)
  bash scripts/deploy-casper-client.sh --network testnet --key ~/.k.pem --dry-run
EOF
}

# ----------------------------------------------------------------------------
# Args parsing
# ----------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case $1 in
    --network)          NETWORK="$2"; shift 2 ;;
    --key)              KEY_PATH="$2"; shift 2 ;;
    --node-url)         NODE_URL="$2"; shift 2 ;;
    --chain-name)       CHAIN_NAME="$2"; shift 2 ;;
    --payment)          PAYMENT_MOTES="$2"; shift 2 ;;
    --ttl)              TTL_SECONDS="$2"; shift 2 ;;
    --poll-interval)    POLL_INTERVAL="$2"; shift 2 ;;
    --poll-max)         POLL_MAX="$2"; shift 2 ;;
    --cspr-cloud-token) CSPR_CLOUD_TOKEN="$2"; shift 2 ;;
    --dry-run)          DRY_RUN=true; shift ;;
    -h|--help)          print_help; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; echo "Run with --help for usage." >&2; exit 1 ;;
  esac
done

# Fallback: read token from env var if not passed via flag
if [[ -z "$CSPR_CLOUD_TOKEN" ]]; then
  CSPR_CLOUD_TOKEN="${CSPR_CLOUD_AUTH_TOKEN:-${SKYWEE_CASPER_RPC_TOKEN:-}}"
fi

# ----------------------------------------------------------------------------
# Resolve network defaults
# ----------------------------------------------------------------------------
case "$NETWORK" in
  testnet)
    # As of mid-2026, legacy rpc.testnet.casper.network is NXDOMAIN.
    # CSPR.cloud is the canonical RPC proxy now (requires Bearer auth).
    NODE_URL="${NODE_URL:-https://node.testnet.cspr.cloud/rpc}"
    CHAIN_NAME="${CHAIN_NAME:-casper-test}"
    EXPLORER="https://testnet.cspr.live"
    ;;
  mainnet)
    NODE_URL="${NODE_URL:-https://node.cspr.cloud/rpc}"
    CHAIN_NAME="${CHAIN_NAME:-casper}"
    EXPLORER="https://cspr.live"
    ;;
  *)
    echo -e "${RED}ERROR:${NC} Unknown network: $NETWORK" >&2
    echo "Use --network testnet or --network mainnet" >&2
    exit 1
    ;;
esac

# Convert TTL_SECONDS (integer) to humantime format expected by casper-client.
# casper-client uses humantime::parse_duration, which expects strings like
# '30min' or '1hr 12min' — NOT bare integers like '1800'.
# See casper-client-rs/src/deploy/creation_common.rs:ARG_DEFAULT = "30min".
if [[ "$TTL_SECONDS" =~ ^[0-9]+$ ]]; then
  TTL_HUMAN="${TTL_SECONDS}sec"
else
  # User passed a humantime string directly (--ttl '30min')
  TTL_HUMAN="$TTL_SECONDS"
fi

# ----------------------------------------------------------------------------
# Log helpers
# ----------------------------------------------------------------------------
log_info()    { echo -e "${BLUE}ℹ${NC}  $*"; }
log_step()    { echo -e "${BLUE}▸${NC} $*"; }
log_success() { echo -e "${GREEN}✓${NC} $*"; }
log_warn()    { echo -e "${YELLOW}⚠${NC} $*"; }
log_error()   { echo -e "${RED}✗${NC} $*" >&2; }
log_dim()     { echo -e "   ${YELLOW}$*${NC}"; }

# ----------------------------------------------------------------------------
# Validate environment
# ----------------------------------------------------------------------------
log_info "Validating environment..."

if ! command -v casper-client >/dev/null 2>&1; then
  log_error "casper-client is not installed."
  echo "" >&2
  echo "Install it via one of:" >&2
  echo "  cargo install casper-client --locked   # via cargo (any OS)" >&2
  echo "  apt install casper-client              # Debian/Ubuntu" >&2
  echo "  brew install casper-client             # macOS (community)" >&2
  exit 1
fi
log_success "casper-client found: $(casper-client --version 2>&1 | head -1)"

# Validate CSPR.cloud token (required for testnet/mainnet since mid-2026)
if [[ -z "$CSPR_CLOUD_TOKEN" ]]; then
  log_error "CSPR.cloud auth token is required."
  echo "" >&2
  echo "As of mid-2026, Casper testnet RPC requires Bearer auth." >&2
  echo "Get a token at https://cspr.cloud (sign in → Account → API Tokens)." >&2
  echo "" >&2
  echo "Then either:" >&2
  echo "  export CSPR_CLOUD_AUTH_TOKEN=<your_token>" >&2
  echo "  bash $0 --network testnet --key ~/.casper/testnet/secret_key.pem" >&2
  echo "" >&2
  echo "OR pass via flag:" >&2
  echo "  bash $0 --network testnet --key ~/.k.pem --cspr-cloud-token <your_token>" >&2
  exit 1
fi
log_success "CSPR.cloud auth token set (length: ${#CSPR_CLOUD_TOKEN})"

if [[ -z "$KEY_PATH" ]]; then
  log_error "--key is required (path to secret_key.pem)"
  echo "Run with --help for usage." >&2
  exit 1
fi

if [[ ! -f "$KEY_PATH" ]]; then
  log_error "Secret key file not found: $KEY_PATH"
  echo "Generate one with: casper-client keygen -f <dir>" >&2
  exit 1
fi
log_success "Secret key: $KEY_PATH"

# Verify all 5 wasm files exist before we start (avoid mid-deploy surprises)
declare -a EXPECTED_WASM=(
  "AgentRegistry.wasm"
  "InsuranceContract.wasm"
  "TreasuryContract.wasm"
  "RwaVault.wasm"
  "CarbonGuard.wasm"
)
for w in "${EXPECTED_WASM[@]}"; do
  if [[ ! -f "$CONTRACTS_DIR/wasm/$w" ]]; then
    log_error "Missing wasm: $CONTRACTS_DIR/wasm/$w"
    echo "Run 'cd contracts/odra && cargo odra build' first." >&2
    exit 1
  fi
done
log_success "All 5 wasm files present in $CONTRACTS_DIR/wasm/"

echo ""
log_info "Deploy configuration:"
log_dim "Network:       $NETWORK"
log_dim "Chain name:    $CHAIN_NAME"
log_dim "Node URL:      $NODE_URL"
log_dim "Explorer:      $EXPLORER"
log_dim "Payment:       $PAYMENT_MOTES motes ($((PAYMENT_MOTES / 1000000000)) CSPR) per contract"
log_dim "TTL:           ${TTL_SECONDS}s"
log_dim "Dry run:       $DRY_RUN"
echo ""

# Determine effective node URL (shared by submit_deploy and wait_and_extract_hash).
# If pointing at cspr.cloud (which requires Bearer auth), route through the
# local auth proxy on 127.0.0.1:7778. casper-client CLI v5+ has no --header
# flag, so we need the proxy. See scripts/cspr-auth-proxy.py.
EFFECTIVE_NODE_URL="$NODE_URL"
if [[ "$NODE_URL" == https://node.testnet.cspr.cloud* ]] || \
   [[ "$NODE_URL" == https://node.cspr.cloud* ]]; then
  EFFECTIVE_NODE_URL="http://127.0.0.1:7778/rpc"
  if ! $DRY_RUN; then
    if ! curl -s --max-time 2 http://127.0.0.1:7778/ >/dev/null 2>&1; then
      log_error "cspr-auth-proxy.py is not running on 127.0.0.1:7778."
      echo "" >&2
      echo "CSPR.cloud requires Bearer auth, but casper-client CLI doesn't support" >&2
      echo "custom headers. Start the auth proxy in another terminal first:" >&2
      echo "" >&2
      echo "  CSPR_PROXY_TOKEN=$CSPR_CLOUD_TOKEN python3 scripts/cspr-auth-proxy.py &" >&2
      echo "" >&2
      echo "Then re-run this script." >&2
      exit 1
    fi
  fi
fi

# ============================================================================
# Contract deploy definitions
# ============================================================================
# Format: "DISPLAY_NAME|WASM_FILENAME|SESSION_ARGS"
# SESSION_ARGS is empty for contracts with no init args, or a semicolon-separated
# list of "name:type:value" triples for contracts that need init args.
#
# IMPORTANT — Odra init() requires 4 mandatory "odra_cfg_*" runtime args even
# for contracts whose init() takes no user args. These are injected by Odra's
# host.rs::try_deploy_with_cfg() at deploy time:
#   - odra_cfg_package_hash_key_name : string  (e.g. "agent_registry_package_hash")
#   - odra_cfg_allow_key_override    : bool    (false)
#   - odra_cfg_is_upgradable         : bool    (true)
#   - odra_cfg_is_upgrade            : bool    (false)
#
# Without these, init() reverts with OdraError::MissingArg (code 64658 =
# 64536 UserErrorTooHigh + 122 MissingArg) — even though wasm preprocessing
# succeeded and the contract appears to install.
#
# The submit_deploy() function below auto-prepends these 4 args to every
# contract's user-supplied args. User-supplied args (like
# auto_execute_threshold for TreasuryContract) are appended after.
#
# Order matches contracts/odra/bin/deploy.rs:
#   1. AgentRegistry   — init() no user args
#   2. InsuranceContract — init() no user args
#   3. TreasuryContract — init(auto_execute_threshold: U512)
#   4. RwaVault        — init() no user args
#   5. CarbonGuard     — init() no user args
# ============================================================================

declare -a CONTRACTS=(
  "AgentRegistry|AgentRegistry.wasm|"
  "InsuranceContract|InsuranceContract.wasm|"
  "TreasuryContract|TreasuryContract.wasm|auto_execute_threshold:u512:1000000000"
  "RwaVault|RwaVault.wasm|"
  "CarbonGuard|CarbonGuard.wasm|"
)

# ----------------------------------------------------------------------------
# Helper: submit a deploy and return its hash on stdout
# ----------------------------------------------------------------------------
submit_deploy() {
  local display_name="$1"
  local wasm_filename="$2"
  local session_args_str="$3"
  local wasm_path="$CONTRACTS_DIR/wasm/$wasm_filename"

  # Build the session-arg list. ALWAYS prepend the 4 mandatory odra_cfg_* args.
  # The package_hash_key_name is derived from the contract's display name
  # (snake_case + "_package_hash"), matching what Odra's host.rs does.
  local -a session_args=()

  # Convert display_name (e.g. "AgentRegistry") to snake_case (e.g. "agent_registry")
  local snake_name
  snake_name=$(echo "$display_name" | sed -E 's/([a-z0-9])([A-Z])/\1_\2/g' | tr '[:upper:]' '[:lower:]')

  # 4 mandatory Odra config args (matches odra-core/src/host.rs:254-262)
  # Values need double-single-quote wrap inside the arg value
  session_args+=(--session-arg "odra_cfg_package_hash_key_name:string=''${snake_name}_package_hash''")
  session_args+=(--session-arg "odra_cfg_allow_key_override:bool=''false''")
  session_args+=(--session-arg "odra_cfg_is_upgradable:bool=''true''")
  session_args+=(--session-arg "odra_cfg_is_upgrade:bool=''false''")

  # User-supplied init args (e.g. auto_execute_threshold for TreasuryContract)
  if [[ -n "$session_args_str" ]]; then
    IFS=';' read -ra pairs <<< "$session_args_str"
    for pair in "${pairs[@]}"; do
      IFS=':' read -r arg_name arg_type arg_val <<< "$pair"
      session_args+=(--session-arg "${arg_name}:${arg_type}='${arg_val}'")
    done
  fi

  if $DRY_RUN; then
    echo "[dry-run] casper-client put-deploy \\" >&2
    echo "  --node-address $EFFECTIVE_NODE_URL \\" >&2
    echo "  --chain-name $CHAIN_NAME \\" >&2
    echo "  --secret-key $KEY_PATH \\" >&2
    echo "  --session-path $wasm_path \\" >&2
    echo "  --payment-amount $PAYMENT_MOTES \\" >&2
    echo "  --ttl $TTL_HUMAN ${session_args[*]:-}" >&2
    echo "  (Authorization: Bearer <token> injected by cspr-auth-proxy.py on :7778)" >&2
    echo "dry-run-deploy-hash-$(date +%s%N | tail -c 16)"
    return 0
  fi

  # Submit deploy; capture combined output
  local raw_output
  raw_output=$(casper-client put-deploy \
    --node-address "$EFFECTIVE_NODE_URL" \
    --chain-name "$CHAIN_NAME" \
    --secret-key "$KEY_PATH" \
    --session-path "$wasm_path" \
    --payment-amount "$PAYMENT_MOTES" \
    --ttl "$TTL_HUMAN" \
    "${session_args[@]:-}" 2>&1)

  # casper-client prints JSON like: { "deploy_hash": "abc123...", "hash": "..." }
  # But the deprecated put-deploy wraps it in a json-rpc envelope with a
  # WARNING banner prepended. Grep for a 64-hex deploy_hash anywhere in
  # the output, not just the top-level JSON.
  local deploy_hash
  deploy_hash=$(echo "$raw_output" | python3 -c "
import sys, json, re
text = sys.stdin.read()
# 1) Try JSON parse first
try:
    d = json.loads(text)
    if isinstance(d, dict):
        result = d.get('result', d)
        if isinstance(result, dict):
            h = result.get('deploy_hash') or result.get('hash') or ''
            if h:
                print(h); sys.exit(0)
except Exception:
    pass
# 2) Fallback: regex grep on raw output for a 64-hex string
m = re.search(r'[0-9a-f]{64}', text)
if m:
    print(m.group(0)); sys.exit(0)
" 2>/dev/null || echo "")

  if [[ -z "$deploy_hash" ]]; then
    log_error "Failed to submit deploy for $display_name"
    echo "$raw_output" >&2
    return 1
  fi

  echo "$deploy_hash"
}

# ----------------------------------------------------------------------------
# Helper: poll get-deploy until executed; extract contract package hash
# ----------------------------------------------------------------------------
wait_and_extract_hash() {
  local display_name="$1"
  local deploy_hash="$2"

  if $DRY_RUN; then
    log_dim "[dry-run] would poll get-deploy for $deploy_hash"
    echo "hash-dryrun-${deploy_hash:0:8}"
    return 0
  fi

  local result_json
  for i in $(seq 1 "$POLL_MAX"); do
    sleep "$POLL_INTERVAL"
    result_json=$(casper-client get-deploy \
      --deploy-hash "$deploy_hash" \
      --node-address "$EFFECTIVE_NODE_URL" 2>&1 || echo "")

    # Casper 2.x wraps GET deploy response in an RPC envelope:
    #   {jsonrpc, id, result: {deploy, execution_info.execution_result.Version2}}
    # 2.x execution_result.Version2 has fields: error_message, limit,
    # consumed, cost, refund, effects[], transfers[]. 1.x returns
    # execution_results[] at top level. Handle both shapes.
    has_result=$(echo "$result_json" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    r = d.get('result', d)
    if r.get('execution_results'):
        sys.exit(0)
    ei = r.get('execution_info', {}).get('execution_result', {})
    if ei.get('Version2') or ei.get('Version1'):
        sys.exit(0)
    sys.exit(1)
except Exception:
    sys.exit(1)
" 2>/dev/null && echo yes || echo no)

    if [[ "$has_result" == "yes" ]]; then
      # Empty error_message => success in Casper 2.x. 1.x uses Success/Failure keys.
      is_success=$(echo "$result_json" | python3 -c "
import sys, json
d = json.load(sys.stdin)
r = d.get('result', d)
er = r.get('execution_results', [])
if er:
    print('yes' if 'Success' in er[0].get('result', {}) else 'no')
    sys.exit(0)
ver2 = r.get('execution_info', {}).get('execution_result', {}).get('Version2') or {}
err = ver2.get('error_message')
print('no' if err else 'yes')
" 2>/dev/null || echo no)

      if [[ "$is_success" != "yes" ]]; then
        log_error "Deploy $deploy_hash FAILED execution for $display_name"
        echo "$result_json" | python3 -c "
import sys, json
d = json.load(sys.stdin)
r = d.get('result', d)
er = r.get('execution_results', [])
if er:
    f = er[0].get('result', {}).get('Failure') or {}
    if f:
        print('Failure reason:', f.get('error_message', 'unknown'))
        print('Cost:', f.get('cost', 'unknown'), 'motes')
        print('Effect:', json.dumps(f.get('effect', {}), indent=2)[:500])
else:
    ver2 = r.get('execution_info', {}).get('execution_result', {}).get('Version2') or {}
    print('error_message:', (ver2.get('error_message') or '?')[:500])
    print('cost / limit / consumed (motes):', ver2.get('cost','?'), '/', ver2.get('limit','?'), '/', ver2.get('consumed','?'))
" >&2 || echo "$result_json" >&2
        return 1
      fi

      # Success — extract contract package hash from transforms
      # Success — extract contract package hash from transforms/effects.
      # Casper 2.x: execution_info.execution_result.Version2.effects[]
      #   each element has {key, kind: {Write: CLValue} | {Identity} | {Prune}}
      # Casper 1.x: execution_results[].effect.transforms[] with transform=WriteContractPackage
      local contract_hash
      contract_hash=$(echo "$result_json" | python3 -c "
import sys, json
d = json.load(sys.stdin)
r = d.get('result', d)
# --- Casper 2.x path ---
ver2 = r.get('execution_info', {}).get('execution_result', {}).get('Version2') or {}
effects = ver2.get('effects') or []
for e in effects:
    key = e.get('key', '')
    if key.startswith('hash-'):
        print(key); sys.exit(0)
# --- Casper 1.x path ---
transforms = (r.get('execution_results', []) or [{}])[0].get('effect', {}).get('transforms', [])
for t in transforms:
    transform = t.get('transform', '')
    key = t.get('key', '')
    if 'WriteContractPackage' in transform:
        if key.startswith('hash-'):
            print(key); sys.exit(0)
        elif key.startswith('contract-package-'):
            hex_part = key.replace('contract-package-wasm-', '').replace('contract-package-', '')
            print(f'hash-{hex_part}'); sys.exit(0)
" 2>/dev/null || echo "")

      if [[ -z "$contract_hash" ]]; then
        # Fallback: any effect/transform with 'Contract' in the kind name
        contract_hash=$(echo "$result_json" | python3 -c "
import sys, json
d = json.load(sys.stdin)
r = d.get('result', d)
ver2 = r.get('execution_info', {}).get('execution_result', {}).get('Version2') or {}
for e in ver2.get('effects') or []:
    k = e.get('key', '')
    if 'Contract' in json.dumps(e.get('kind', {})) and k.startswith('hash-'):
        print(k); sys.exit(0)
transforms = (r.get('execution_results', []) or [{}])[0].get('effect', {}).get('transforms', [])
for t in transforms:
    if 'Contract' in t.get('transform','') and t.get('key','').startswith('hash-'):
        print(t['key']); sys.exit(0)
" 2>/dev/null || echo "")
      fi

      if [[ -z "$contract_hash" ]]; then
        log_warn "Deploy succeeded but couldn't auto-extract contract package hash."
        log_dim "Look it up manually at $EXPLORER/deploy/$deploy_hash"
        log_dim "The contract package hash appears in the 'WriteContractPackage' transform."
        echo ""
      fi
      echo "$contract_hash"
      return 0
    fi

    log_dim "  [${i}/${POLL_MAX}] still pending... (${i}x${POLL_INTERVAL}s elapsed)"
  done

  log_error "Deploy $deploy_hash timed out after $((POLL_MAX * POLL_INTERVAL))s for $display_name"
  log_dim "Check status manually: $EXPLORER/deploy/$deploy_hash"
  return 1
}

# ============================================================================
# Main: deploy each contract in order
# ============================================================================
echo ""
log_info "Deploying ${#CONTRACTS[@]} contracts to Casper $NETWORK..."
echo ""

declare -A DEPLOY_HASHES
declare -A CONTRACT_HASHES

for entry in "${CONTRACTS[@]}"; do
  IFS='|' read -r display_name wasm_filename session_args_str <<< "$entry"

  log_step "Deploying $display_name..."

  deploy_hash=$(submit_deploy "$display_name" "$wasm_filename" "$session_args_str") || exit 1
  DEPLOY_HASHES[$display_name]="$deploy_hash"
  log_success "Submitted: $deploy_hash"
  log_dim "Explorer: $EXPLORER/deploy/$deploy_hash"

  log_step "Waiting for execution of $display_name..."
  contract_hash=$(wait_and_extract_hash "$display_name" "$deploy_hash") || exit 1
  CONTRACT_HASHES[$display_name]="$contract_hash"

  if [[ -n "$contract_hash" ]]; then
    log_success "$display_name → $contract_hash"
  fi
  echo ""
done

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "================================================================"
log_info "DEPLOYMENT SUMMARY"
echo "================================================================"
echo "Network:           $NETWORK"
echo "Chain:             $CHAIN_NAME"
echo "Node:              $NODE_URL"
echo "Total contracts:   ${#CONTRACTS[@]}"
echo ""
echo "Contract hashes:"
printf "  %-22s %s\n" "CONTRACT" "PACKAGE HASH"
printf "  %-22s %s\n" "----------------------" "----------------------------------------------------------------"
for entry in "${CONTRACTS[@]}"; do
  IFS='|' read -r display_name _ _ <<< "$entry"
  printf "  %-22s %s\n" "$display_name" "${CONTRACT_HASHES[$display_name]:-N/A}"
done
echo ""
echo "Deploy hashes (for debugging):"
for entry in "${CONTRACTS[@]}"; do
  IFS='|' read -r display_name _ _ <<< "$entry"
  printf "  %-22s %s\n" "$display_name" "${DEPLOY_HASHES[$display_name]}"
done
echo ""
echo "================================================================"

# Generate .env.local snippet
ENV_FILE="$REPO_ROOT/.env.local.deployed"
echo ""
log_info "Generating .env.local snippet at: $ENV_FILE"
cat > "$ENV_FILE" <<EOF
# SKYWEE deployed contract hashes — generated $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Network: $NETWORK ($CHAIN_NAME)
# Node:    $NODE_URL
#
# Append these to your .env.local (or copy this file to .env.local
# if you don't have one yet).

CASPER_NETWORK=$NETWORK
CASPER_RPC_URL=${NODE_URL%:7777}/rpc
CASPER_NETWORK_NAME=$CHAIN_NAME
CASPER_CHAIN_NAME=$CHAIN_NAME

CONTRACT_AGENT_REGISTRY=${CONTRACT_HASHES[AgentRegistry]:-}
CONTRACT_INSURANCE=${CONTRACT_HASHES[InsuranceContract]:-}
CONTRACT_TREASURY=${CONTRACT_HASHES[TreasuryContract]:-}
CONTRACT_RWA_VAULT=${CONTRACT_HASHES[RwaVault]:-}
CONTRACT_CARBON_GUARD=${CONTRACT_HASHES[CarbonGuard]:-}
EOF
log_success "Wrote $ENV_FILE"
echo ""
log_info "Next steps:"
log_dim "1. Copy contents of $ENV_FILE into your actual .env.local"
log_dim "2. Restart your Next.js dev server: bun run dev"
log_dim "3. Verify contracts are queryable:"
log_dim "   casper-client query-state --node-address $NODE_URL \\"
log_dim "     --key '${CONTRACT_HASHES[AgentRegistry]:-}' --state-root-hash ''"
echo ""
log_success "All done."
