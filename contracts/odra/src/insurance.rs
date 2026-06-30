//! Aegis — Parametric Insurance Contract (Odra 2.x)

use odra::prelude::*;
use odra::casper_types::U512;
use crate::shared::ModuleId;

#[odra::odra_type]
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

#[odra::odra_type]
pub enum PolicyStatus {
    Active,
    Triggered,
    Expired,
    Cancelled,
}

// Events as individual structs (Odra 2.x pattern)
#[derive(odra::casper_event_standard::Event)]
pub struct PolicyIssued { pub id: u32, pub rwa_id: String, pub coverage: U512, pub premium: U512 }

#[derive(odra::casper_event_standard::Event)]
pub struct PolicyTriggered { pub id: u32, pub payout: U512, pub monitor: Address }

#[derive(odra::casper_event_standard::Event)]
pub struct PolicyExpired { pub id: u32 }

#[derive(odra::casper_event_standard::Event)]
pub struct MonitorAuthorized { pub addr: Address }

#[derive(odra::casper_event_standard::Event)]
pub struct MonitorRevoked { pub addr: Address }

#[derive(odra::casper_event_standard::Event)]
pub struct PremiumDeposited { pub addr: Address, pub amount: U512 }

#[odra::module]
pub struct InsuranceContract {
    pub policy_count: Var<u32>,
    pub policies: Mapping<u32, Policy>,
    pub monitors: Mapping<Address, bool>,
    pub owner: Var<Address>,
    pub pool_balance: Var<U512>,
}

#[odra::module]
impl InsuranceContract {
    pub fn init(&mut self) {
        let caller = self.env().caller();
        self.owner.set(caller);
        self.policy_count.set(0);
        self.pool_balance.set(U512::zero());
    }

    pub fn authorize_monitor(&mut self, monitor: Address) {
        self.assert_owner();
        self.monitors.set(&monitor, true);
        self.env().emit_event(MonitorAuthorized { addr: monitor });
    }

    pub fn revoke_monitor(&mut self, monitor: Address) {
        self.assert_owner();
        self.monitors.set(&monitor, false);
        self.env().emit_event(MonitorRevoked { addr: monitor });
    }

    #[odra(payable)]
    pub fn issue_policy(
        &mut self,
        rwa_id: String,
        trigger: String,
        coverage: U512,
        monitor: Address,
    ) -> u32 {
        let caller = self.env().caller();
        let premium = self.env().attached_value();
        assert!(
            self.monitors.get(&monitor).unwrap_or(false),
            "Monitor is not authorized"
        );

        let pool = self.pool_balance.get_or_default();
        self.pool_balance.set(pool + premium);

        let id = self.policy_count.get_or_default();
        let policy = Policy {
            id,
            rwa_id: rwa_id.clone(),
            trigger,
            coverage,
            premium,
            policyholder: caller,
            monitor,
            status: PolicyStatus::Active,
            issued_block: self.env().get_block_time(),
            payout_block: None,
        };
        self.policies.set(&id, policy);
        self.policy_count.set(id + 1);

        self.env().emit_event(PolicyIssued { id, rwa_id, coverage, premium });
        self.env().emit_event(PremiumDeposited { addr: caller, amount: premium });
        id
    }

    pub fn trigger_payout(&mut self, policy_id: u32) {
        let caller = self.env().caller();
        let mut policy = self.policies.get(&policy_id).unwrap_or_revert(self);
        assert_eq!(policy.status, PolicyStatus::Active, "Policy not active");
        assert_eq!(policy.monitor, caller, "Only the assigned monitor can trigger");

        let pool = self.pool_balance.get_or_default();
        assert!(pool >= policy.coverage, "Insufficient pool balance");

        self.env().transfer_tokens(&policy.policyholder, &policy.coverage);
        self.pool_balance.set(pool - policy.coverage);

        policy.status = PolicyStatus::Triggered;
        policy.payout_block = Some(self.env().get_block_time());
        let payout = policy.coverage;
        self.policies.set(&policy_id, policy);

        self.env().emit_event(PolicyTriggered { id: policy_id, payout, monitor: caller });
    }

    pub fn expire_policy(&mut self, policy_id: u32) {
        let mut policy = self.policies.get(&policy_id).unwrap_or_revert(self);
        assert_eq!(policy.status, PolicyStatus::Active, "Policy not active");
        policy.status = PolicyStatus::Expired;
        self.policies.set(&policy_id, policy);
        self.env().emit_event(PolicyExpired { id: policy_id });
    }

    #[odra(payable)]
    pub fn deposit_premium(&mut self) {
        let caller = self.env().caller();
        let amount = self.env().attached_value();
        let pool = self.pool_balance.get_or_default();
        self.pool_balance.set(pool + amount);
        self.env().emit_event(PremiumDeposited { addr: caller, amount });
    }

    pub fn get_policy(&self, id: u32) -> Policy {
        self.policies.get(&id).unwrap_or_revert(self)
    }

    pub fn pool_balance(&self) -> U512 {
        self.pool_balance.get_or_default()
    }

    pub fn policy_count(&self) -> u32 {
        self.policy_count.get_or_default()
    }

    fn assert_owner(&self) {
        let caller = self.env().caller();
        let owner = self.owner.get().unwrap_or_revert(self);
        assert_eq!(caller, owner, "Only owner");
    }
}

pub fn module_id() -> ModuleId {
    ModuleId::Aegis
}
