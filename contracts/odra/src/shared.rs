//! Shared types & modules used across SKYWEE contracts.

use odra::prelude::*;

/// Module identifier — matches the 5 SKYWEE modules.
#[derive(OdraType, PartialEq, Eq, Clone, Copy)]
pub enum ModuleId {
    AgentSquare,
    Aegis,
    SwarmTreasury,
    RwaVault,
    CarbonGuard,
}

/// Transaction type emitted as an event in every contract call.
#[derive(OdraType, PartialEq, Eq, Clone)]
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

/// Helper: formatted short address string (first 6 + last 4 chars).
pub fn short_addr(addr: &Address) -> String {
    let s = format!("{:?}", addr);
    if s.len() <= 12 {
        s
    } else {
        format!("{}…{}", &s[..6], &s[s.len() - 4..])
    }
}
