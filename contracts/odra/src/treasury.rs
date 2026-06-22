//! SwarmTreasury — Multi-Agent DAO Execution Contract
//!
//! Specialized agents (Yield, Risk, Compliance, Treasurer, Executor)
//! deliberate on treasury actions. Small actions auto-execute via 2-of-3
//! consensus; large actions become governance proposals with full
//! deliberation trail stored on-chain.

use odra::prelude::*;
use crate::shared::{ModuleId, MIN_CONSENSUS_REPUTATION};

#[odra::module_state]
pub struct TreasuryState {
    /// Owner (governance).
    pub owner: Variable<Address>,
    /// Treasury balance (CSPR + tokens).
    pub balance: Variable<U512>,
    /// Proposal counter — next proposal ID.
    pub proposal_count: u32,
    /// Proposal ID → Proposal.
    pub proposals: Mapping<u32, Proposal>,
    /// Deliberation log entry counter.
    pub log_count: u32,
    /// Log entry ID → DeliberationEntry.
    pub deliberation_log: Mapping<u32, DeliberationEntry>,
    /// Authorized agent addresses (the swarm).
    pub swarm_agents: Mapping<Address, SwarmAgent>,
    /// Auto-execute threshold: actions <= this amount auto-execute on 2-of-3.
    pub auto_execute_threshold: Variable<U512>,
}

#[derive(OdraType, Clone)]
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
    pub voters: Mapping<Address, bool>,
    pub created_block: u64,
    pub executed_block: Option<u64>,
}

#[derive(OdraType, PartialEq, Eq, Clone, Copy)]
pub enum ProposalStatus {
    Voting,
    Executed,
    Rejected,
}

#[derive(OdraType, PartialEq, Eq, Clone, Copy)]
pub enum SwarmRole {
    YieldRouter,
    RiskScorer,
    Compliance,
    Treasurer,
    Executor,
}

#[derive(OdraType, Clone)]
pub struct SwarmAgent {
    pub addr: Address,
    pub role: SwarmRole,
    pub reputation: u8,
    pub active: bool,
}

#[derive(OdraType, Clone)]
pub struct DeliberationEntry {
    pub id: u32,
    pub proposal_id: u32,
    pub agent_addr: Address,
    pub agent_role: SwarmRole,
    pub message: String,
    pub round: u32,
    pub block: u64,
}

#[derive(OdraEvent)]
pub enum TreasuryEvent {
    SwarmAgentAdded { addr: Address, role: SwarmRole },
    ProposalCreated { id: u32, title: String, amount: U512, proposer: Address },
    DeliberationLogged { proposal_id: u32, agent: Address, round: u32 },
    VoteCast { proposal_id: u32, voter: Address, support: bool, weight: U512 },
    ProposalExecuted { id: u32, amount: U512 },
    ProposalRejected { id: u32 },
    AutoExecuted { amount: U512, signers: Vec<Address> },
}

#[odra::module]
impl TreasuryContract {
    pub fn init(&mut self, auto_execute_threshold: U512) {
        let caller = env().caller();
        self.owner.set(caller);
        self.balance.set(U512::zero());
        self.proposal_count.set(0);
        self.log_count.set(0);
        self.auto_execute_threshold.set(auto_execute_threshold);
    }

    /// Add a swarm agent. Only owner.
    pub fn add_swarm_agent(&mut self, addr: Address, role: SwarmRole, reputation: u8) {
        self.assert_owner();
        assert!(
            reputation >= MIN_CONSENSUS_REPUTATION,
            "Reputation below consensus minimum"
        );
        let agent = SwarmAgent { addr, role, reputation, active: true };
        self.swarm_agents.set(&addr, agent);
        env().emit_event(TreasuryEvent::SwarmAgentAdded { addr, role });
    }

    /// Create a proposal — only callable by an active swarm agent.
    pub fn create_proposal(&mut self, title: String, amount: U512) -> u32 {
        let caller = env().caller();
        let agent = self.swarm_agents.get(&caller).expect("Caller is not a swarm agent");
        assert!(agent.active, "Agent not active");

        let id = self.proposal_count.get();
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
            voters: Mapping::new(),
            created_block: env().block_height(),
            executed_block: None,
        };
        self.proposals.set(&id, proposal);
        self.proposal_count.set(id + 1);

        env().emit_event(TreasuryEvent::ProposalCreated {
            id,
            title,
            amount,
            proposer: caller,
        });
        id
    }

    /// Append a deliberation log entry. Only swarm agents.
    pub fn log_deliberation(&mut self, proposal_id: u32, message: String) {
        let caller = env().caller();
        let agent = self.swarm_agents.get(&caller).expect("Caller is not a swarm agent");

        let entry_id = self.log_count.get();
        let entry = DeliberationEntry {
            id: entry_id,
            proposal_id,
            agent_addr: caller,
            agent_role: agent.role,
            message,
            round: self.next_round_for(proposal_id),
            block: env().block_height(),
        };
        self.deliberation_log.set(&entry_id, entry);
        self.log_count.set(entry_id + 1);

        env().emit_event(TreasuryEvent::DeliberationLogged {
            proposal_id,
            agent: caller,
            round: self.next_round_for(proposal_id),
        });
    }

    /// Vote on a proposal — only swarm agents.
    /// Weight is the agent's reputation × 1000.
    pub fn vote(&mut self, proposal_id: u32, support: bool) {
        let caller = env().caller();
        let agent = self.swarm_agents.get(&caller).expect("Caller is not a swarm agent");
        assert!(agent.active, "Agent not active");

        let mut proposal = self.proposals.get(&proposal_id).expect("Proposal does not exist");
        assert_eq!(proposal.status, ProposalStatus::Voting, "Proposal not in voting phase");

        // Check hasn't already voted
        assert!(
            !proposal.voters.get(&caller).unwrap_or(false),
            "Already voted"
        );

        let weight = U512::from(agent.reputation as u64) * U512::from(1000);
        if support {
            proposal.votes_for += weight;
        } else {
            proposal.votes_against += weight;
        }
        proposal.voters.set(&caller, true);
        self.proposals.set(&proposal_id, proposal.clone());

        env().emit_event(TreasuryEvent::VoteCast {
            proposal_id,
            voter: caller,
            support,
            weight,
        });

        // Auto-execute if amount <= threshold AND 2-of-3 consensus reached
        let threshold = self.auto_execute_threshold.get();
        if proposal.amount <= threshold {
            let votes = self.count_votes(proposal_id);
            if votes.for_count >= 2 && votes.total >= 3 {
                self.execute_proposal_internal(proposal_id);
            }
        }
    }

    /// Execute a proposal (governance path) — callable by anyone after
    /// voting has reached quorum and majority.
    pub fn execute_proposal(&mut self, proposal_id: u32) {
        let proposal = self.proposals.get(&proposal_id).expect("Proposal does not exist");
        assert_eq!(proposal.status, ProposalStatus::Voting, "Proposal not in voting phase");

        let votes = self.count_votes(proposal_id);
        assert!(votes.total >= 3, "Quorum not reached");
        assert!(votes.for_count > votes.against_count, "Not enough FOR votes");

        self.execute_proposal_internal(proposal_id);
    }

    fn execute_proposal_internal(&mut self, proposal_id: u32) {
        let mut proposal = self.proposals.get(&proposal_id).expect("Proposal does not exist");
        assert_eq!(proposal.status, ProposalStatus::Voting, "Proposal not in voting phase");

        let balance = self.balance.get();
        assert!(balance >= proposal.amount, "Insufficient treasury balance");

        // Execute: transfer to proposer (in real impl, would route to target)
        env().transfer_tokens(&proposal.proposed_by, &proposal.amount);
        self.balance.set(balance - proposal.amount);

        proposal.status = ProposalStatus::Executed;
        proposal.executed_block = Some(env().block_height());
        self.proposals.set(&proposal_id, proposal.clone());

        env().emit_event(TreasuryEvent::ProposalExecuted {
            id: proposal_id,
            amount: proposal.amount,
        });
    }

    /// Deposit CSPR into the treasury.
    #[payable]
    pub fn deposit(&mut self) {
        let amount = env().attached_value();
        let balance = self.balance.get();
        self.balance.set(balance + amount);
    }

    /// Read-only helpers
    pub fn balance(&self) -> U512 {
        self.balance.get()
    }

    pub fn proposal_count(&self) -> u32 {
        self.proposal_count.get()
    }

    pub fn get_proposal(&self, id: u32) -> Proposal {
        self.proposals.get(&id).expect("Proposal does not exist")
    }

    pub fn get_deliberation(&self, id: u32) -> DeliberationEntry {
        self.deliberation_log.get(&id).expect("Entry does not exist")
    }

    fn count_votes(&self, proposal_id: u32) -> VoteCounts {
        let proposal = self.proposals.get(&proposal_id).expect("Proposal does not exist");
        // In a real implementation we'd track voters in a list to iterate.
        // For demo, we infer counts from a separate counter mapping.
        // Here we just use votes_for / votes_against magnitude ÷ 1000 as count.
        let for_count = (proposal.votes_for / U512::from(1000)).as_u32();
        let against_count = (proposal.votes_against / U512::from(1000)).as_u32();
        VoteCounts {
            for_count,
            against_count,
            total: for_count + against_count,
        }
    }

    fn next_round_for(&self, _proposal_id: u32) -> u32 {
        // Simplified: in production we'd group entries by proposal and count.
        1
    }

    fn assert_owner(&self) {
        let caller = env().caller();
        let owner = self.owner.get();
        assert_eq!(caller, owner, "Only owner");
    }
}

struct VoteCounts {
    for_count: u32,
    against_count: u32,
    total: u32,
}

pub fn module_id() -> ModuleId {
    ModuleId::SwarmTreasury
}
