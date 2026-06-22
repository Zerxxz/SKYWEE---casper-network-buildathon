//! CarbonGuard — Autonomous Carbon Verification Contract
//!
//! Tokenizes voluntary carbon credits as RWA. A verification agent
//! (VER-Gaia) pulls satellite + IoT data via x402-paid APIs, validates
//! project claims, and autonomously burns credits when deforestation
//! or non-performance is detected.

use odra::prelude::*;
use crate::shared::ModuleId;

#[odra::module_state]
pub struct CarbonGuardState {
    pub owner: Variable<Address>,
    /// Project counter — next project ID.
    pub project_count: u32,
    /// Project ID → Project.
    pub projects: Mapping<u32, CarbonProject>,
    /// Authorized verifier agent.
    pub verifier: Variable<Address>,
    /// Total credits issued across all projects.
    pub total_issued: Variable<U512>,
    /// Total credits retired across all projects.
    pub total_retired: Variable<U512>,
    /// Per-credit balance: (project_id, holder) → balance.
    pub balances: Mapping<(u32, Address), U512>,
}

#[derive(OdraType, Clone)]
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

#[derive(OdraType, PartialEq, Eq, Clone, Copy)]
pub enum VerificationStatus {
    Verified,
    Pending,
    Flagged,
}

#[derive(OdraEvent)]
pub enum CarbonGuardEvent {
    ProjectRegistered { id: u32, name: String, location: String, credits: U512 },
    VerifierSet { addr: Address },
    VerificationPassed { project_id: u32, block: u64 },
    VerificationFailed { project_id: u32, reason: String },
    CreditsBurned { project_id: u32, amount: U512, total_burned: U512 },
    CreditsTransferred { project_id: u32, from: Address, to: Address, amount: U512 },
    CreditsRetired { project_id: u32, holder: Address, amount: U512 },
}

#[odra::module]
impl CarbonGuard {
    pub fn init(&mut self) {
        let caller = env().caller();
        self.owner.set(caller);
        self.project_count.set(0);
        self.total_issued.set(U512::zero());
        self.total_retired.set(U512::zero());
    }

    /// Set the authorized verifier agent. Only owner.
    pub fn set_verifier(&mut self, addr: Address) {
        self.assert_owner();
        self.verifier.set(addr);
        env().emit_event(CarbonGuardEvent::VerifierSet { addr });
    }

    /// Register a new carbon project. Caller receives the initial credits.
    pub fn register_project(
        &mut self,
        name: String,
        location: String,
        project_type: String,
        credits: U512,
    ) -> u32 {
        let caller = env().caller();
        let id = self.project_count.get();
        let project = CarbonProject {
            id,
            name: name.clone(),
            location: location.clone(),
            project_type,
            credits_issued: credits,
            credits_retired: U512::zero(),
            verification: VerificationStatus::Pending,
            last_check_block: env().block_height(),
            registered_block: env().block_height(),
        };
        self.projects.set(&id, project);

        // Issue credits to caller
        self.balances.set(&(id, caller), credits);
        let total = self.total_issued.get();
        self.total_issued.set(total + credits);

        self.project_count.set(id + 1);
        env().emit_event(CarbonGuardEvent::ProjectRegistered {
            id,
            name,
            location,
            credits,
        });
        id
    }

    /// Verifier: pass verification for a project.
    pub fn verify_project(&mut self, project_id: u32) {
        self.assert_verifier();
        let mut project = self.projects.get(&project_id).expect("Project does not exist");
        project.verification = VerificationStatus::Verified;
        project.last_check_block = env().block_height();
        self.projects.set(&project_id, project);

        env().emit_event(CarbonGuardEvent::VerificationPassed {
            project_id,
            block: env().block_height(),
        });
    }

    /// Verifier: flag a project — automatically burns all unretired credits.
    pub fn flag_project(&mut self, project_id: u32, reason: String) {
        self.assert_verifier();
        let mut project = self.projects.get(&project_id).expect("Project does not exist");

        // Burn all unretired credits
        let to_burn = project.credits_issued - project.credits_retired;
        if to_burn > U512::zero() {
            // Iterate holders and zero balances — in production would use a holder list
            // For demo, we just update project-level totals
            project.credits_retired = project.credits_issued;
            let total_retired = self.total_retired.get();
            self.total_retired.set(total_retired + to_burn);
            env().emit_event(CarbonGuardEvent::CreditsBurned {
                project_id,
                amount: to_burn,
                total_burned: project.credits_retired,
            });
        }

        project.verification = VerificationStatus::Flagged;
        project.last_check_block = env().block_height();
        self.projects.set(&project_id, project);

        env().emit_event(CarbonGuardEvent::VerificationFailed { project_id, reason });
    }

    /// Transfer credits between holders.
    pub fn transfer(&mut self, project_id: u32, to: Address, amount: U512) {
        let caller = env().caller();
        let key = (project_id, caller);
        let from_balance = self.balances.get(&key).unwrap_or(U512::zero());
        assert!(from_balance >= amount, "Insufficient balance");

        self.balances.set(&key, from_balance - amount);
        let to_key = (project_id, to);
        let to_balance = self.balances.get(&to_key).unwrap_or(U512::zero());
        self.balances.set(&to_key, to_balance + amount);

        env().emit_event(CarbonGuardEvent::CreditsTransferred {
            project_id,
            from: caller,
            to,
            amount,
        });
    }

    /// Retire (permanently burn) credits — called by holder.
    pub fn retire(&mut self, project_id: u32, amount: U512) {
        let caller = env().caller();
        let key = (project_id, caller);
        let balance = self.balances.get(&key).unwrap_or(U512::zero());
        assert!(balance >= amount, "Insufficient balance");

        self.balances.set(&key, balance - amount);

        let mut project = self.projects.get(&project_id).expect("Project does not exist");
        project.credits_retired += amount;
        self.projects.set(&project_id, project);

        let total = self.total_retired.get();
        self.total_retired.set(total + amount);

        env().emit_event(CarbonGuardEvent::CreditsRetired {
            project_id,
            holder: caller,
            amount,
        });
    }

    /// Read-only
    pub fn project_count(&self) -> u32 {
        self.project_count.get()
    }

    pub fn total_issued(&self) -> U512 {
        self.total_issued.get()
    }

    pub fn total_retired(&self) -> U512 {
        self.total_retired.get()
    }

    pub fn get_project(&self, id: u32) -> CarbonProject {
        self.projects.get(&id).expect("Project does not exist")
    }

    pub fn balance_of(&self, project_id: u32, holder: Address) -> U512 {
        self.balances.get(&(project_id, holder)).unwrap_or(U512::zero())
    }

    fn assert_owner(&self) {
        let caller = env().caller();
        let owner = self.owner.get();
        assert_eq!(caller, owner, "Only owner");
    }

    fn assert_verifier(&self) {
        let caller = env().caller();
        let v = self.verifier.get();
        assert_eq!(caller, v, "Only verifier");
    }
}

pub fn module_id() -> ModuleId {
    ModuleId::CarbonGuard
}
