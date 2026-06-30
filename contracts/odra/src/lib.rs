//! SKYWEE — Agentic Web3 OS smart contracts for Casper Network (Odra 2.x)
#![cfg_attr(target_arch = "wasm32", no_std)]

pub mod agent_registry;
pub mod insurance;
pub mod treasury;
pub mod rwa_vault;
pub mod carbon_guard;
pub mod shared;

pub use agent_registry::AgentRegistry;
pub use insurance::InsuranceContract;
pub use treasury::TreasuryContract;
pub use rwa_vault::RwaVault;
pub use carbon_guard::CarbonGuard;

// TreasuryContractInitArgs is only generated for native targets (used by deploy.rs).
// On wasm32 targets, Odra does not emit the InitArgs struct.
#[cfg(not(target_arch = "wasm32"))]
pub use treasury::TreasuryContractInitArgs;
