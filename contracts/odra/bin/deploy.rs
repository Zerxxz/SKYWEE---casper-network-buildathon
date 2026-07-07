//! SKYWEE — Real livenet deployment (Odra 2.x)
//!
//! Jalankan dengan:
//!   export ODRA_CASPER_LIVENET_SECRET_KEY_PATH=~/.casper/testnet/secret_key.pem
//!   export ODRA_CASPER_LIVENET_NODE_ADDRESS=https://node.testnet.cspr.cloud/rpc
//!   export ODRA_CASPER_LIVENET_CHAIN_NAME=casper-test
//!   export ODRA_CASPER_LIVENET_EVENTS_URL=https://node-sse.testnet.cspr.cloud/events/main
//!   export CSPR_CLOUD_AUTH_TOKEN=<your_cspr_cloud_bearer_token>
//!   cargo run --bin deploy_skywee --features livenet --release
//!
//! NOTE on endpoints (mid-2026):
//!   The legacy `rpc.testnet.casper.network` and `events.testnet.casper.network`
//!   endpoints are DEPRECATED (DNS NXDOMAIN). CSPR.cloud is now the canonical
//!   RPC proxy for Casper testnet — it requires a Bearer token in the
//!   `Authorization` header. Odra's livenet-env natively reads
//!   `CSPR_CLOUD_AUTH_TOKEN` env var and injects the header on every RPC
//!   and SSE call (see odra-casper/rpc-client/src/casper_client/configuration.rs).
//!   Get a token at https://cspr.cloud (sign in → Account → API Tokens).
//!
//! GAS BUDGET NOTES:
//!   - `env.set_gas(N)` sets the deploy's `payment_amount` to N motes
//!     (with `standard_payment: true`, see odra-casper/rpc-client transactions.rs).
//!   - Casper DEDUCTS THE FULL N UPFRONT at submission; unused is refunded
//!     after execution in the same block.
//!   - Actual gas consumed by a 200 KB Odra contract install on Casper testnet
//!     is ~2.5-4 CSPR. We set 10 CSPR per contract = ~3x headroom.
//!   - Total upfront for 5 contracts: 50 CSPR. The testnet faucet dispenses
//!     ~75 CSPR/day, so a fresh account can deploy in one shot.
//!   - DO NOT bump this back to 300 CSPR (the previous value) — that required
//!     1500 CSPR upfront, which exceeded faucet allocation and caused
//!     `InsufficientFunds` errors at put_deploy time.

use odra::casper_types::U512;
use odra::host::{Deployer, HostEnv, NoArgs};
use odra::prelude::Addressable;
use skywee_contracts::{
    AgentRegistry, CarbonGuard, InsuranceContract, RwaVault, TreasuryContract,
    TreasuryContractInitArgs,
};

fn main() {
    let env: HostEnv = odra_casper_livenet_env::env();

    println!("🚀 Deploying SKYWEE contracts to Casper livenet...\n");

    // Diagnostic: print environment so we can verify RPC URL, events URL, chain name
    // are all correctly propagated. If a deploy hangs or fails, this helps narrow
    // down which env var is missing.
    println!("📋 Livenet environment:");
    println!("   ODRA_CASPER_LIVENET_NODE_ADDRESS  = {}", std::env::var("ODRA_CASPER_LIVENET_NODE_ADDRESS").unwrap_or_else(|_| "<not set>".into()));
    println!("   ODRA_CASPER_LIVENET_CHAIN_NAME    = {}", std::env::var("ODRA_CASPER_LIVENET_CHAIN_NAME").unwrap_or_else(|_| "<not set>".into()));
    println!("   ODRA_CASPER_LIVENET_EVENTS_URL    = {}", std::env::var("ODRA_CASPER_LIVENET_EVENTS_URL").unwrap_or_else(|_| "<not set>".into()));
    println!("   ODRA_CASPER_LIVENET_SECRET_KEY    = {}", std::env::var("ODRA_CASPER_LIVENET_SECRET_KEY_PATH").unwrap_or_else(|_| "<not set>".into()));
    println!("   CSPR_CLOUD_AUTH_TOKEN             = {}",
             if std::env::var("CSPR_CLOUD_AUTH_TOKEN").map(|t| !t.is_empty()).unwrap_or(false) {
                 format!("{} chars (set)", std::env::var("CSPR_CLOUD_AUTH_TOKEN").map(|t| t.len()).unwrap_or(0))
             } else {
                 "<not set>".to_string()
             });
    println!();

    // 1) AgentRegistry — init() tanpa argumen
    println!("▶ Deploying AgentRegistry (init no args)...");
    env.set_gas(200_000_000_000u64); // 200 CSPR upfront — bumped from 10 CSPR
                                    // after "Out of gas error" on 200 KB wasm.
    let agent_registry = AgentRegistry::deploy(&env, NoArgs);
    println!("✓ AgentRegistry  : {:?}", agent_registry.address());

    // 2) InsuranceContract — init() tanpa argumen
    println!("▶ Deploying InsuranceContract (init no args)...");
    env.set_gas(200_000_000_000u64); // 200 CSPR upfront — bumped from 10 CSPR
                                    // after "Out of gas error" on 200 KB wasm.
    let insurance = InsuranceContract::deploy(&env, NoArgs);
    println!("✓ Insurance      : {:?}", insurance.address());

    // 3) TreasuryContract — init(auto_execute_threshold: U512)
    println!("▶ Deploying TreasuryContract (init auto_execute_threshold=1000000000)...");
    env.set_gas(200_000_000_000u64); // 200 CSPR upfront — bumped from 10 CSPR
                                    // after "Out of gas error" on 200 KB wasm.
    let treasury = TreasuryContract::deploy(
        &env,
        TreasuryContractInitArgs {
            auto_execute_threshold: U512::from(1_000_000_000u64),
        },
    );
    println!("✓ Treasury       : {:?}", treasury.address());

    // 4) RwaVault — init() tanpa argumen
    println!("▶ Deploying RwaVault (init no args)...");
    env.set_gas(200_000_000_000u64); // 200 CSPR upfront — bumped from 10 CSPR
                                    // after "Out of gas error" on 200 KB wasm.
    let rwa_vault = RwaVault::deploy(&env, NoArgs);
    println!("✓ RwaVault       : {:?}", rwa_vault.address());

    // 5) CarbonGuard — init() tanpa argumen
    println!("▶ Deploying CarbonGuard (init no args)...");
    env.set_gas(200_000_000_000u64); // 200 CSPR upfront — bumped from 10 CSPR
                                    // after "Out of gas error" on 200 KB wasm.
    let carbon_guard = CarbonGuard::deploy(&env, NoArgs);
    println!("✓ CarbonGuard    : {:?}", carbon_guard.address());

    println!("\n✅ Selesai. Salin address di atas ke .env.local (format hash-...)");
}
