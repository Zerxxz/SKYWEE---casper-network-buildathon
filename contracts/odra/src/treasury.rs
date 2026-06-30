//! SwarmTreasury — Multi-Agent DAO Execution Contract (Odra 2.x)

use odra::prelude::*;
use odra::casper_types::U512;
use crate::shared::{ModuleId, MIN_CONSENSUS_REPUTATION};

#[odra::odra_type]
pub enum ProposalStatus {
    Voting,
    Executed,
    Rejected,
}

#[odra::odra_type]
pub enum SwarmRole {
    YieldRouter,
    RiskScorer,
    Compliance,
    Treasurer,
    Executor,
}

#[odra::odra_type]
pub struct Proposal {
    pub id: u32,
    pub title: String,
    pub proposed_by: Address,
    pub proposer_role: SwarmRole,
    pub amount: U512,
    pub status: ProposalStatus,
    pub votes_for: U512,
    pub votes_against: U512,
    pub deliberation_rounds: u32,
    pub created_block: u64,
    pub executed_block: Option<u64>,
}

#[odra::odra_type]
pub struct SwarmAgent {
    pub addr: Address,
    pub role: SwarmRole,
    pub reputation: u8,
    pub active: bool,
}

#[odra::odra_type]
pub struct DeliberationEntry {
    pub id: u32,
    pub proposal_id: u32,
    pub agent_addr: Address,
    pub agent_role: SwarmRole,
    pub message: String,
    pub round: u32,
    pub block: u64,
}

// Events as individual structs (Odra 2.x pattern)
#[derive(odra::casper_event_standard::Event)]
pub struct SwarmAgentAdded { pub addr: Address, pub role: SwarmRole }

#[derive(odra::casper_event_standard::Event)]
pub struct ProposalCreated { pub id: u32, pub title: String, pub amount: U512, pub proposer: Address }

#[derive(odra::casper_event_standard::Event)]
pub struct DeliberationLogged { pub proposal_id: u32, pub agent: Address, pub round: u32 }

#[derive(odra::casper_event_standard::Event)]
pub struct VoteCast { pub proposal_id: u32, pub voter: Address, pub support: bool, pub weight: U512 }

#[derive(odra::casper_event_standard::Event)]
pub struct ProposalExecuted { pub id: u32, pub amount: U512 }

#[derive(odra::casper_event_standard::Event)]
pub struct ProposalRejected { pub id: u32 }

#[odra::module]
pub struct TreasuryContract {
    pub owner: Var<Address>,
    pub balance: Var<U512>,
    pub proposal_count: Var<u32>,
    pub proposals: Mapping<u32, Proposal>,
    pub log_count: Var<u32>,
    pub deliberation_log: Mapping<u32, DeliberationEntry>,
    pub swarm_agents: Mapping<Address, SwarmAgent>,
    pub auto_execute_threshold: Var<U512>,
    /// (proposal_id, voter_addr) → voted (true/false)
    pub voters: Mapping<(u32, Address), bool>,
}

#[odra::module]
impl TreasuryContract {
    pub fn init(&mut self, auto_execute_threshold: U512) {
        let caller = self.env().caller();
        self.owner.set(caller);
        self.balance.set(U512::zero());
        self.proposal_count.set(0);
        self.log_count.set(0);
        self.auto_execute_threshold.set(auto_execute_threshold);
    }

    pub fn add_swarm_agent(&mut self, addr: Address, role: SwarmRole, reputation: u8) {
        self.assert_owner();
        assert!(
            reputation >= MIN_CONSENSUS_REPUTATION,
            "Reputation below consensus minimum"
        );
        let agent = SwarmAgent { addr, role, reputation, active: true };
        self.swarm_agents.set(&addr, agent.clone());
        self.env().emit_event(SwarmAgentAdded { addr, role: agent.role });
    }

    pub fn create_proposal(&mut self, title: String, amount: U512) -> u32 {
        let caller = self.env().caller();
        let agent = self.swarm_agents.get(&caller).unwrap_or_revert(self);
        assert!(agent.active, "Agent not active");

        let id = self.proposal_count.get_or_default();
        let proposal = Proposal {
            id,
            title: title.clone(),
            proposed_by: caller,
            proposer_role: agent.role,
            amount,
            status: ProposalStatus::Voting,
            votes_for: U512::zero(),
            votes_against: U512::zero(),
            deliberation_rounds: 0,
            created_block: self.env().get_block_time(),
            executed_block: None,
        };
        self.proposals.set(&id, proposal);
        self.proposal_count.set(id + 1);

        self.env().emit_event(ProposalCreated { id, title, amount, proposer: caller });
        id
    }

    pub fn log_deliberation(&mut self, proposal_id: u32, message: String) {
        let caller = self.env().caller();
        let agent = self.swarm_agents.get(&caller).unwrap_or_revert(self);

        let entry_id = self.log_count.get_or_default();
        let entry = DeliberationEntry {
            id: entry_id,
            proposal_id,
            agent_addr: caller,
            agent_role: agent.role,
            message,
            round: 1,
            block: self.env().get_block_time(),
        };
        self.deliberation_log.set(&entry_id, entry);
        self.log_count.set(entry_id + 1);

        self.env().emit_event(DeliberationLogged { proposal_id, agent: caller, round: 1 });
    }

    pub fn vote(&mut self, proposal_id: u32, support: bool) {
        let caller = self.env().caller();
        let agent = self.swarm_agents.get(&caller).unwrap_or_revert(self);
        assert!(agent.active, "Agent not active");

        let mut proposal = self.proposals.get(&proposal_id).unwrap_or_revert(self);
        assert_eq!(proposal.status, ProposalStatus::Voting, "Proposal not in voting phase");

        let voter_key = (proposal_id, caller);
        assert!(
            !self.voters.get(&voter_key).unwrap_or(false),
            "Already voted"
        );

        let weight = U512::from(agent.reputation as u64) * U512::from(1000);
        if support {
            proposal.votes_for += weight;
        } else {
            proposal.votes_against += weight;
        }
        self.proposals.set(&proposal_id, proposal.clone());
        self.voters.set(&voter_key, true);

        self.env().emit_event(VoteCast { proposal_id, voter: caller, support, weight });

        // Auto-execute if amount <= threshold AND 2-of-3 consensus reached
        let threshold = self.auto_execute_threshold.get_or_default();
        if proposal.amount <= threshold {
            let for_count = (proposal.votes_for / U512::from(1000)).as_u32();
            let total = for_count + (proposal.votes_against / U512::from(1000)).as_u32();
            if for_count >= 2 && total >= 3 {
                self.execute_proposal_internal(proposal_id);
            }
        }
    }

    pub fn execute_proposal(&mut self, proposal_id: u32) {
        let proposal = self.proposals.get(&proposal_id).unwrap_or_revert(self);
        assert_eq!(proposal.status, ProposalStatus::Voting, "Proposal not in voting phase");

        let for_count = (proposal.votes_for / U512::from(1000)).as_u32();
        let against_count = (proposal.votes_against / U512::from(1000)).as_u32();
        let total = for_count + against_count;
        assert!(total >= 3, "Quorum not reached");
        assert!(for_count > against_count, "Not enough FOR votes");

        self.execute_proposal_internal(proposal_id);
    }

    fn execute_proposal_internal(&mut self, proposal_id: u32) {
        let mut proposal = self.proposals.get(&proposal_id).unwrap_or_revert(self);
        assert_eq!(proposal.status, ProposalStatus::Voting, "Proposal not in voting phase");

        let balance = self.balance.get_or_default();
        assert!(balance >= proposal.amount, "Insufficient treasury balance");

        self.env().transfer_tokens(&proposal.proposed_by, &proposal.amount);
        self.balance.set(balance - proposal.amount);

        proposal.status = ProposalStatus::Executed;
        proposal.executed_block = Some(self.env().get_block_time());
        let amount = proposal.amount;
        self.proposals.set(&proposal_id, proposal);

        self.env().emit_event(ProposalExecuted { id: proposal_id, amount });
    }

    #[odra(payable)]
    pub fn deposit(&mut self) {
        let amount = self.env().attached_value();
        let balance = self.balance.get_or_default();
        self.balance.set(balance + amount);
    }

    pub fn balance(&self) -> U512 {
        self.balance.get_or_default()
    }

    pub fn proposal_count(&self) -> u32 {
        self.proposal_count.get_or_default()
    }

    pub fn get_proposal(&self, id: u32) -> Proposal {
        self.proposals.get(&id).unwrap_or_revert(self)
    }

    pub fn get_deliberation(&self, id: u32) -> DeliberationEntry {
        self.deliberation_log.get(&id).unwrap_or_revert(self)
    }

    fn assert_owner(&self) {
        let caller = self.env().caller();
        let owner = self.owner.get().unwrap_or_revert(self);
        assert_eq!(caller, owner, "Only owner");
    }
}

pub fn module_id() -> ModuleId {
    ModuleId::SwarmTreasury
}
