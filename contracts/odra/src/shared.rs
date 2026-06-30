//! Shared types & modules used across SKYWEE contracts (Odra 2.x)

use odra::prelude::*;
use odra::casper_types::U512;

/// Module identifier — matches the 5 SKYWEE modules.
#[odra::odra_type]
pub enum ModuleId {
    AgentSquare,
    Aegis,
    SwarmTreasury,
    RwaVault,
    CarbonGuard,
}

/// Transaction type emitted as an event in every contract call.
#[odra::odra_type]
pub struct TxEvent {
    pub module: ModuleId,
    pub tx_type: String,
    pub agent: String,
    pub amount_cspr: U512,
    pub block_height: u64,
    pub caller: Address,
}

/// Reputation score (0-100) — used by AgentSquare and other modules.
pub type Reputation = u8;

/// Maximum reputation.
pub const MAX_REPUTATION: Reputation = 100;

/// Minimum reputation for an agent to participate in consensus.
pub const MIN_CONSENSUS_REPUTATION: Reputation = 70;
