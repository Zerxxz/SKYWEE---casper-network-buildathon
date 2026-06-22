//! SKYWEE — Agentic Web3 OS smart contracts for Casper Network
//!
//! This crate contains the 5 core Odra smart contracts that power SKYWEE:
//!
//! 1. `agent_registry` — AgentSquare: agent registration, reputation attestation
//! 2. `insurance`      — Aegis: parametric insurance policies + autonomous payout
//! 3. `treasury`       — SwarmTreasury: multi-agent governance + execution
//! 4. `rwa_vault`      — RWA-X Vault: fractionalization + agent-managed AMM
//! 5. `carbon_guard`   — CarbonGuard: carbon credit verification + burn
//!
//! All contracts are written in the Odra framework and deploy to Casper Testnet.
//! See README.md for deployment instructions.

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
