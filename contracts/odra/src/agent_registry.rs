//! AgentSquare — Agent-to-Agent Economy Contract (Odra 2.x)

use odra::prelude::*;
use odra::casper_types::U512;
use crate::shared::{ModuleId, Reputation, MAX_REPUTATION};

#[odra::odra_type]
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

// Events as individual structs (Odra 2.x pattern)
#[derive(odra::casper_event_standard::Event)]
pub struct AgentRegistered { pub id: u32, pub name: String, pub owner: Address, pub price: U512 }

#[derive(odra::casper_event_standard::Event)]
pub struct AgentDeactivated { pub id: u32 }

#[derive(odra::casper_event_standard::Event)]
pub struct RequestFulfilled { pub agent_id: u32, pub requester: Address, pub payment: U512, pub new_reputation: Reputation }

#[derive(odra::casper_event_standard::Event)]
pub struct ReputationUpdated { pub id: u32, pub old: Reputation, pub new: Reputation }

#[odra::module]
pub struct AgentRegistry {
    pub agent_count: Var<u32>,
    pub agents: Mapping<u32, Agent>,
    pub agents_by_owner: Mapping<Address, Vec<u32>>,
    pub request_counts: Mapping<(u32, Address), u32>,
}

#[odra::module]
impl AgentRegistry {
    pub fn init(&mut self) {
        self.agent_count.set(0);
    }

    pub fn register_agent(
        &mut self,
        name: String,
        role: String,
        price_per_request: U512,
    ) -> u32 {
        let caller = self.env().caller();
        let id = self.agent_count.get_or_default();
        let agent = Agent {
            id,
            name: name.clone(),
            role,
            owner: caller,
            price_per_request,
            reputation: 50,
            requests_fulfilled: 0,
            active: true,
            registered_block: self.env().get_block_time(),
        };
        self.agents.set(&id, agent);
        let mut owned = self.agents_by_owner.get(&caller).unwrap_or_default();
        owned.push(id);
        self.agents_by_owner.set(&caller, owned);
        self.agent_count.set(id + 1);
        self.env().emit_event(AgentRegistered { id, name, owner: caller, price: price_per_request });
        id
    }

    pub fn record_fulfillment(
        &mut self,
        agent_id: u32,
        requester: Address,
        payment: U512,
        success: bool,
    ) {
        let mut agent = self.agents.get(&agent_id).unwrap_or_revert(self);
        let old_rep = agent.reputation;
        let new_rep = if success {
            (old_rep as u16 + 1).min(MAX_REPUTATION as u16) as Reputation
        } else {
            old_rep.saturating_sub(5)
        };
        agent.reputation = new_rep;
        agent.requests_fulfilled += 1;
        self.agents.set(&agent_id, agent);

        let key = (agent_id, requester);
        let count = self.request_counts.get(&key).unwrap_or(0);
        self.request_counts.set(&key, count + 1);

        self.env().emit_event(RequestFulfilled { agent_id, requester, payment, new_reputation: new_rep });
        if old_rep != new_rep {
            self.env().emit_event(ReputationUpdated { id: agent_id, old: old_rep, new: new_rep });
        }
    }

    pub fn deactivate(&mut self, agent_id: u32) {
        let caller = self.env().caller();
        let mut agent = self.agents.get(&agent_id).unwrap_or_revert(self);
        assert_eq!(agent.owner, caller, "Only the owner can deactivate");
        agent.active = false;
        self.agents.set(&agent_id, agent);
        self.env().emit_event(AgentDeactivated { id: agent_id });
    }

    pub fn get_agent(&self, agent_id: u32) -> Agent {
        self.agents.get(&agent_id).unwrap_or_revert(self)
    }

    pub fn get_agents_by_owner(&self, owner: Address) -> Vec<u32> {
        self.agents_by_owner.get(&owner).unwrap_or_default()
    }

    pub fn agent_count(&self) -> u32 {
        self.agent_count.get_or_default()
    }
}

pub fn module_id() -> ModuleId {
    ModuleId::AgentSquare
}
