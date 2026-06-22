//! Deployment entrypoint — deploys all 5 SKYWEE contracts to Casper Testnet.
//!
//! Run with: `cargo run --bin deploy_skywee -- --network testnet`

use clap::Parser;
use skywee_contracts::{
    AgentRegistry, AgentRegistryDeployer,
    InsuranceContract, InsuranceContractDeployer,
    TreasuryContract, TreasuryContractDeployer,
    RwaVault, RwaVaultDeployer,
    CarbonGuard, CarbonGuardDeployer,
};

#[derive(Parser, Debug)]
struct Args {
    /// Network: testnet | mainnet
    #[arg(long, default_value = "testnet")]
    network: String,

    /// Node URL (overrides network default)
    #[arg(long)]
    node: Option<String>,

    /// Path to secret key file
    #[arg(long)]
    key: String,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();

    println!("🚀 Deploying SKYWEE contracts to Casper {}…", args.network);

    // 1. AgentSquare — Agent Registry
    let agent_registry = AgentRegistry::deploy(&AgentRegistryDeployer, &args.key)?;
    println!("✓ AgentRegistry:        {}", agent_registry.address());

    // 2. Aegis — Insurance
    let insurance = InsuranceContract::deploy(&InsuranceContractDeployer, &args.key)?;
    println!("✓ InsuranceContract:    {}", insurance.address());

    // 3. SwarmTreasury — Treasury
    let treasury = TreasuryContract::deploy(
        &TreasuryContractDeployer,
        &args.key,
        odra::U512::from(1_000_000_000_000), // auto-execute threshold: 1000 CSPR
    )?;
    println!("✓ TreasuryContract:     {}", treasury.address());

    // 4. RWA-X Vault
    let rwa_vault = RwaVault::deploy(&RwaVaultDeployer, &args.key)?;
    println!("✓ RwaVault:             {}", rwa_vault.address());

    // 5. CarbonGuard
    let carbon_guard = CarbonGuard::deploy(&CarbonGuardDeployer, &args.key)?;
    println!("✓ CarbonGuard:          {}", carbon_guard.address());

    println!("\n✅ All SKYWEE contracts deployed successfully.");
    println!("\nContract addresses (save these for SKYWEE frontend .env):");
    println!("  NEXT_PUBLIC_AGENT_REGISTRY_ADDR={}", agent_registry.address());
    println!("  NEXT_PUBLIC_INSURANCE_ADDR={}", insurance.address());
    println!("  NEXT_PUBLIC_TREASURY_ADDR={}", treasury.address());
    println!("  NEXT_PUBLIC_RWA_VAULT_ADDR={}", rwa_vault.address());
    println!("  NEXT_PUBLIC_CARBON_GUARD_ADDR={}", carbon_guard.address());

    Ok(())
}
