//! SKYWEE — Odra build script.
//!
//! Reads the `ODRA_MODULE` environment variable (set by `cargo odra build`
//! once per contract listed in Odra.toml) and turns it into a
//! `cargo::rustc-cfg=odra_module="..."` directive. The `#[odra::module]`
//! macro on each contract struct uses this cfg to conditionally compile
//! only ONE contract into each emitted wasm — so the five wasm files
//! (AgentRegistry, InsuranceContract, TreasuryContract, RwaVault, CarbonGuard)
//! are five distinct small modules, not five identical copies of the whole
//! library.
fn main() {
    odra_build::build();
}
