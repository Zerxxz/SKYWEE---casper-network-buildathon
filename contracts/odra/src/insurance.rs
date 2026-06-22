//! Aegis — Parametric Insurance Contract
//!
//! Wraps tokenized RWAs in autonomous parametric insurance. A monitoring
//! agent (e.g. ORC-12) calls `trigger_payout` when the off-chain trigger
//! condition is met — the contract pays out immediately, with no manual
//! claims adjuster.

use odra::prelude::*;
use crate::shared::ModuleId;

#[odra::module_state]
pub struct InsuranceState {
    /// Total policy count — also the next policy ID.
    pub policy_count: u32,
    /// Policy ID → Policy.
    pub policies: Mapping<u32, Policy>,
    /// Authorized monitoring agents (whitelist).
    pub monitors: Mapping<Address, bool>,
    /// Owner of the contract (governance).
    pub owner: Variable<Address>,
    /// Insurance pool balance — used to pay claims.
    pub pool_balance: Variable<U512>,
}

#[derive(OdraType, Clone)]
pub struct Policy {
    pub id: u32,
    pub rwa_id: String,
    pub trigger: String,
    pub coverage: U512,
    pub premium: U512,
    pub policyholder: Address,
    pub monitor: Address,
    pub status: PolicyStatus,
    pub issued_block: u64,
    pub payout_block: Option<u64>,
}

#[derive(OdraType, PartialEq, Eq, Clone, Copy)]
pub enum PolicyStatus {
    Active,
    Triggered,
    Expired,
    Cancelled,
}

#[derive(OdraEvent)]
pub enum InsuranceEvent {
    PolicyIssued {
        id: u32,
        rwa_id: String,
        coverage: U512,
        premium: U512,
    },
    PolicyTriggered {
        id: u32,
        payout: U512,
        monitor: Address,
    },
    PolicyExpired { id: u32 },
    MonitorAuthorized { addr: Address },
    MonitorRevoked { addr: Address },
    PremiumDeposited { addr: Address, amount: U512 },
}

#[odra::module]
impl InsuranceContract {
    pub fn init(&mut self) {
        let caller = env().caller();
        self.owner.set(caller);
        self.policy_count.set(0);
        self.pool_balance.set(U512::zero());
    }

    /// Authorize a monitoring agent address. Only owner.
    pub fn authorize_monitor(&mut self, monitor: Address) {
        self.assert_owner();
        self.monitors.set(&monitor, true);
        env().emit_event(InsuranceEvent::MonitorAuthorized { addr: monitor });
    }

    /// Revoke monitor authorization. Only owner.
    pub fn revoke_monitor(&mut self, monitor: Address) {
        self.assert_owner();
        self.monitors.set(&monitor, false);
        env().emit_event(InsuranceEvent::MonitorRevoked { addr: monitor });
    }

    /// Issue a new parametric policy. Caller is the policyholder.
    /// Premium is transferred from caller to the pool.
    #[payable]
    pub fn issue_policy(
        &mut self,
        rwa_id: String,
        trigger: String,
        coverage: U512,
        monitor: Address,
    ) -> u32 {
        let caller = env().caller();
        let premium = env().attached_value();
        assert!(
            self.monitors.get(&monitor).unwrap_or(false),
            "Monitor is not authorized"
        );

        // Add premium to pool
        let pool = self.pool_balance.get();
        self.pool_balance.set(pool + premium);

        let id = self.policy_count.get();
        let policy = Policy {
            id,
            rwa_id: rwa_id.clone(),
            trigger,
            coverage,
            premium,
            policyholder: caller,
            monitor,
            status: PolicyStatus::Active,
            issued_block: env().block_height(),
            payout_block: None,
        };
        self.policies.set(&id, policy);
        self.policy_count.set(id + 1);

        env().emit_event(InsuranceEvent::PolicyIssued {
            id,
            rwa_id,
            coverage,
            premium,
        });
        env().emit_event(InsuranceEvent::PremiumDeposited {
            addr: caller,
            amount: premium,
        });
        id
    }

    /// Trigger payout — only callable by the assigned monitor agent.
    /// Pays out coverage to the policyholder and marks policy as Triggered.
    pub fn trigger_payout(&mut self, policy_id: u32) {
        let caller = env().caller();
        let mut policy = self.policies.get(&policy_id).expect("Policy does not exist");
        assert_eq!(policy.status, PolicyStatus::Active, "Policy not active");
        assert_eq!(policy.monitor, caller, "Only the assigned monitor can trigger");

        // Check pool balance
        let pool = self.pool_balance.get();
        assert!(pool >= policy.coverage, "Insufficient pool balance");

        // Pay out
        env().transfer_tokens(&policy.policyholder, &policy.coverage);
        self.pool_balance.set(pool - policy.coverage);

        policy.status = PolicyStatus::Triggered;
        policy.payout_block = Some(env().block_height());
        self.policies.set(&policy_id, policy.clone());

        env().emit_event(InsuranceEvent::PolicyTriggered {
            id: policy_id,
            payout: policy.coverage,
            monitor: caller,
        });
    }

    /// Mark an expired policy. Callable by anyone.
    pub fn expire_policy(&mut self, policy_id: u32) {
        let mut policy = self.policies.get(&policy_id).expect("Policy does not exist");
        assert_eq!(policy.status, PolicyStatus::Active, "Policy not active");
        policy.status = PolicyStatus::Expired;
        self.policies.set(&policy_id, policy);
        env().emit_event(InsuranceEvent::PolicyExpired { id: policy_id });
    }

    /// Deposit premium into the pool (top-up).
    #[payable]
    pub fn deposit_premium(&mut self) {
        let caller = env().caller();
        let amount = env().attached_value();
        let pool = self.pool_balance.get();
        self.pool_balance.set(pool + amount);
        env().emit_event(InsuranceEvent::PremiumDeposited { addr: caller, amount });
    }

    /// Read-only: get policy.
    pub fn get_policy(&self, id: u32) -> Policy {
        self.policies.get(&id).expect("Policy does not exist")
    }

    /// Read-only: pool balance.
    pub fn pool_balance(&self) -> U512 {
        self.pool_balance.get()
    }

    /// Read-only: policy count.
    pub fn policy_count(&self) -> u32 {
        self.policy_count.get()
    }

    fn assert_owner(&self) {
        let caller = env().caller();
        let owner = self.owner.get();
        assert_eq!(caller, owner, "Only owner");
    }
}

pub fn module_id() -> ModuleId {
    ModuleId::Aegis
}
