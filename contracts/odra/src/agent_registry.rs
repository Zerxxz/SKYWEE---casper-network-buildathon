//! AgentSquare — Agent-to-Agent Economy Contract
//!
//! A permissionless registry where AI agents publish capabilities, set a
//! price per request in CSPR, and earn on-chain reputation. Consumers pay
//! per request through the x402 protocol; this contract records the
//! attestation and updates reputation based on fulfillment.

use odra::prelude::*;
use crate::shared::{ModuleId, Reputation, MAX_REPUTATION};

/// An agent registered in the SKYWEE economy.
#[odra::module_state]
pub struct AgentRegistryState {
    /// Total agent count — also serves as the next agent ID.
    pub agent_count: u32,
    /// Mapping from agent ID to Agent struct.
    pub agents: Mapping<u32, Agent>,
    /// Mapping from owner address → list of agent IDs they own.
    pub agents_by_owner: Mapping<Address, Vec<u32>>,
    /// Mapping from (agent_id, requester) → request count, for reputation math.
    pub request_counts: Mapping<(u32, Address), u32>,
}

/// Agent record stored on-chain.
#[derive(OdraType, Clone)]
pub struct Agent {
    pub id: u32,
    pub name: String,
    pub role: String,
    pub owner: Address,
    pub price_per_request: U512,
    pub reputation: Reputation,
    pub requests_fulfilled: u32,
    pub active: bool,
    pub registered_block: u64,
}

/// Events emitted by the contract.
#[derive(OdraEvent)]
pub enum AgentRegistryEvent {
    AgentRegistered { id: u32, name: String, owner: Address, price: U512 },
    AgentDeactivated { id: u32 },
    RequestFulfilled { agent_id: u32, requester: Address, payment: U512, new_reputation: Reputation },
    ReputationUpdated { id: u32, old: Reputation, new: Reputation },
}

#[odra::module]
impl AgentRegistry {
    /// Initializes the contract.
    pub fn init(&mut self) {
        self.agent_count.set(0);
    }

    /// Register a new agent. Caller becomes the owner.
    /// Emits `AgentRegistered`.
    pub fn register_agent(
        &mut self,
        name: String,
        role: String,
        price_per_request: U512,
    ) -> u32 {
        let caller = env().caller();
        let id = self.agent_count.get();
        let agent = Agent {
            id,
            name: name.clone(),
            role,
            owner: caller,
            price_per_request,
            reputation: 50, // start at neutral reputation
            requests_fulfilled: 0,
            active: true,
            registered_block: env().block_height(),
        };
        self.agents.set(&id, agent);
        self.agents_by_owner.set(&caller, {
            let mut v = self.agents_by_owner.get(&caller).unwrap_or_default();
            v.push(id);
            v
        });
        self.agent_count.set(id + 1);
        env().emit_event(AgentRegistryEvent::AgentRegistered {
            id,
            name,
            owner: caller,
            price: price_per_request,
        });
        id
    }

    /// Record a fulfilled request — called by the x402 payment attestation
    /// flow after the provider agent has returned a response.
    ///
    /// Reputation update rules:
    ///   - +1 per successful fulfillment, capped at MAX_REPUTATION.
    ///   - On a failure (reputation > 0), -5 reputation.
    pub fn record_fulfillment(
        &mut self,
        agent_id: u32,
        requester: Address,
        payment: U512,
        success: bool,
    ) {
        let mut agent = self.agents.get(&agent_id).expect("Agent does not exist");
        let old_rep = agent.reputation;
        let new_rep = if success {
            (old_rep as u16 + 1).min(MAX_REPUTATION as u16) as Reputation
        } else {
            old_rep.saturating_sub(5)
        };
        agent.reputation = new_rep;
        agent.requests_fulfilled += 1;
        self.agents.set(&agent_id, agent.clone());

        // Update request count
        let key = (agent_id, requester);
        let count = self.request_counts.get(&key).unwrap_or(0);
        self.request_counts.set(&key, count + 1);

        env().emit_event(AgentRegistryEvent::RequestFulfilled {
            agent_id,
            requester,
            payment,
            new_reputation: new_rep,
        });
        if old_rep != new_rep {
            env().emit_event(AgentRegistryEvent::ReputationUpdated {
                id: agent_id,
                old: old_rep,
                new: new_rep,
            });
        }
    }

    /// Deactivate an agent — only callable by owner.
    pub fn deactivate(&mut self, agent_id: u32) {
        let caller = env().caller();
        let mut agent = self.agents.get(&agent_id).expect("Agent does not exist");
        assert_eq!(agent.owner, caller, "Only the owner can deactivate");
        agent.active = false;
        self.agents.set(&agent_id, agent);
        env().emit_event(AgentRegistryEvent::AgentDeactivated { id: agent_id });
    }

    /// Read-only: get agent by ID.
    pub fn get_agent(&self, agent_id: u32) -> Agent {
        self.agents.get(&agent_id).expect("Agent does not exist")
    }

    /// Read-only: list all agents owned by an address.
    pub fn get_agents_by_owner(&self, owner: Address) -> Vec<u32> {
        self.agents_by_owner.get(&owner).unwrap_or_default()
    }

    /// Read-only: total registered agent count.
    pub fn agent_count(&self) -> u32 {
        self.agent_count.get()
    }
}

/// Helper: module id for this contract — used by the indexers.
pub fn module_id() -> ModuleId {
    ModuleId::AgentSquare
}
