//! CarbonGuard — Autonomous Carbon Verification Contract (Odra 2.x)

use odra::prelude::*;
use odra::casper_types::U512;
use crate::shared::ModuleId;

#[odra::odra_type]
pub struct CarbonProject {
    pub id: u32,
    pub name: String,
    pub location: String,
    pub project_type: String,
    pub credits_issued: U512,
    pub credits_retired: U512,
    pub verification: VerificationStatus,
    pub last_check_block: u64,
    pub registered_block: u64,
}

#[odra::odra_type]
pub enum VerificationStatus {
    Verified,
    Pending,
    Flagged,
}

// Events as individual structs (Odra 2.x pattern)
#[derive(odra::casper_event_standard::Event)]
pub struct ProjectRegistered { pub id: u32, pub name: String, pub location: String, pub credits: U512 }

#[derive(odra::casper_event_standard::Event)]
pub struct VerifierSet { pub addr: Address }

#[derive(odra::casper_event_standard::Event)]
pub struct VerificationPassed { pub project_id: u32, pub block: u64 }

#[derive(odra::casper_event_standard::Event)]
pub struct VerificationFailed { pub project_id: u32, pub reason: String }

#[derive(odra::casper_event_standard::Event)]
pub struct CreditsBurned { pub project_id: u32, pub amount: U512, pub total_burned: U512 }

#[derive(odra::casper_event_standard::Event)]
pub struct CreditsTransferred { pub project_id: u32, pub from: Address, pub to: Address, pub amount: U512 }

#[derive(odra::casper_event_standard::Event)]
pub struct CreditsRetired { pub project_id: u32, pub holder: Address, pub amount: U512 }

#[odra::module]
pub struct CarbonGuard {
    pub owner: Var<Address>,
    pub project_count: Var<u32>,
    pub projects: Mapping<u32, CarbonProject>,
    pub verifier: Var<Address>,
    pub total_issued: Var<U512>,
    pub total_retired: Var<U512>,
    pub balances: Mapping<(u32, Address), U512>,
}

#[odra::module]
impl CarbonGuard {
    pub fn init(&mut self) {
        let caller = self.env().caller();
        self.owner.set(caller);
        self.project_count.set(0);
        self.total_issued.set(U512::zero());
        self.total_retired.set(U512::zero());
    }

    pub fn set_verifier(&mut self, addr: Address) {
        self.assert_owner();
        self.verifier.set(addr);
        self.env().emit_event(VerifierSet { addr });
    }

    pub fn register_project(
        &mut self,
        name: String,
        location: String,
        project_type: String,
        credits: U512,
    ) -> u32 {
        let caller = self.env().caller();
        let id = self.project_count.get_or_default();
        let project = CarbonProject {
            id,
            name: name.clone(),
            location: location.clone(),
            project_type,
            credits_issued: credits,
            credits_retired: U512::zero(),
            verification: VerificationStatus::Pending,
            last_check_block: self.env().get_block_time(),
            registered_block: self.env().get_block_time(),
        };
        self.projects.set(&id, project);

        self.balances.set(&(id, caller), credits);
        let total = self.total_issued.get_or_default();
        self.total_issued.set(total + credits);

        self.project_count.set(id + 1);
        self.env().emit_event(ProjectRegistered { id, name, location, credits });
        id
    }

    pub fn verify_project(&mut self, project_id: u32) {
        self.assert_verifier();
        let mut project = self.projects.get(&project_id).unwrap_or_revert(self);
        project.verification = VerificationStatus::Verified;
        project.last_check_block = self.env().get_block_time();
        self.projects.set(&project_id, project);

        self.env().emit_event(VerificationPassed { project_id, block: self.env().get_block_time() });
    }

    pub fn flag_project(&mut self, project_id: u32, reason: String) {
        self.assert_verifier();
        let mut project = self.projects.get(&project_id).unwrap_or_revert(self);

        let to_burn = project.credits_issued - project.credits_retired;
        if to_burn > U512::zero() {
            project.credits_retired = project.credits_issued;
            let total_retired = self.total_retired.get_or_default();
            self.total_retired.set(total_retired + to_burn);
            self.env().emit_event(CreditsBurned {
                project_id,
                amount: to_burn,
                total_burned: project.credits_retired,
            });
        }

        project.verification = VerificationStatus::Flagged;
        project.last_check_block = self.env().get_block_time();
        self.projects.set(&project_id, project);

        self.env().emit_event(VerificationFailed { project_id, reason });
    }

    pub fn transfer(&mut self, project_id: u32, to: Address, amount: U512) {
        let caller = self.env().caller();
        let key = (project_id, caller);
        let from_balance = self.balances.get(&key).unwrap_or(U512::zero());
        assert!(from_balance >= amount, "Insufficient balance");

        self.balances.set(&key, from_balance - amount);
        let to_key = (project_id, to);
        let to_balance = self.balances.get(&to_key).unwrap_or(U512::zero());
        self.balances.set(&to_key, to_balance + amount);

        self.env().emit_event(CreditsTransferred { project_id, from: caller, to, amount });
    }

    pub fn retire(&mut self, project_id: u32, amount: U512) {
        let caller = self.env().caller();
        let key = (project_id, caller);
        let balance = self.balances.get(&key).unwrap_or(U512::zero());
        assert!(balance >= amount, "Insufficient balance");

        self.balances.set(&key, balance - amount);

        let mut project = self.projects.get(&project_id).unwrap_or_revert(self);
        project.credits_retired += amount;
        self.projects.set(&project_id, project);

        let total = self.total_retired.get_or_default();
        self.total_retired.set(total + amount);

        self.env().emit_event(CreditsRetired { project_id, holder: caller, amount });
    }

    pub fn project_count(&self) -> u32 {
        self.project_count.get_or_default()
    }

    pub fn total_issued(&self) -> U512 {
        self.total_issued.get_or_default()
    }

    pub fn total_retired(&self) -> U512 {
        self.total_retired.get_or_default()
    }

    pub fn get_project(&self, id: u32) -> CarbonProject {
        self.projects.get(&id).unwrap_or_revert(self)
    }

    pub fn balance_of(&self, project_id: u32, holder: Address) -> U512 {
        self.balances.get(&(project_id, holder)).unwrap_or(U512::zero())
    }

    fn assert_owner(&self) {
        let caller = self.env().caller();
        let owner = self.owner.get().unwrap_or_revert(self);
        assert_eq!(caller, owner, "Only owner");
    }

    fn assert_verifier(&self) {
        let caller = self.env().caller();
        let v = self.verifier.get().unwrap_or_revert(self);
        assert_eq!(caller, v, "Only verifier");
    }
}

pub fn module_id() -> ModuleId {
    ModuleId::CarbonGuard
}
