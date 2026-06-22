//! RWA-X Vault — Agent-Managed RWA AMM Contract
//!
//! Fractionalizes real-world assets (invoices, cargo, bonds, real-estate)
//! into Casper-native tokens. The market-maker agent runs Dutch auctions
//! for new issuances and rebalances the AMM curve based on demand.

use odra::prelude::*;
use crate::shared::ModuleId;

#[odra::module_state]
pub struct RwaVaultState {
    pub owner: Variable<Address>,
    /// Asset counter — next asset ID.
    pub asset_count: u32,
    /// Asset ID → Asset.
    pub assets: Mapping<u32, RwaAsset>,
    /// Asset ID → AMM curve params (a simple constant-product variant).
    pub curves: Mapping<u32, AmmCurve>,
    /// Authorized market-maker agent.
    pub market_maker: Variable<Address>,
    /// Vault balance (CSPR).
    pub vault_balance: Variable<U512>,
}

#[derive(OdraType, Clone)]
pub struct RwaAsset {
    pub id: u32,
    pub name: String,
    pub category: String,
    pub total_value: U512,
    pub tokenized: U512,
    pub holders: u32,
    pub apy_bps: u32, // APY in basis points (114 = 1.14%)
    pub amm_price: U512, // current price in CSPR-micro
    pub status: AssetStatus,
    pub created_block: u64,
}

#[derive(OdraType, PartialEq, Eq, Clone, Copy)]
pub enum AssetStatus {
    Active,
    Frozen,
    Matured,
}

#[derive(OdraType, Clone)]
pub struct AmmCurve {
    pub asset_id: u32,
    pub reserve_token: U512,
    pub reserve_cspr: U512,
    pub fee_bps: u32,
}

#[derive(OdraEvent)]
pub enum RwaVaultEvent {
    AssetFractionalized { id: u32, name: String, total_value: U512 },
    MarketMakerSet { addr: Address },
    DutchAuctionOpened { asset_id: u32, start_price: U512 },
    DutchAuctionFilled { asset_id: u32, fill_price: U512, buyer: Address },
    AmmRebalanced { asset_id: u32, new_reserve_token: U512, new_reserve_cspr: U512 },
    SwapExecuted { asset_id: u32, amount_in: U512, amount_out: U512, buyer: Address },
}

#[odra::module]
impl RwaVault {
    pub fn init(&mut self) {
        let caller = env().caller();
        self.owner.set(caller);
        self.asset_count.set(0);
        self.vault_balance.set(U512::zero());
    }

    /// Set the authorized market-maker agent. Only owner.
    pub fn set_market_maker(&mut self, addr: Address) {
        self.assert_owner();
        self.market_maker.set(addr);
        env().emit_event(RwaVaultEvent::MarketMakerSet { addr });
    }

    /// Fractionalize a new RWA into tokens. Caller becomes the issuer.
    /// In production this would mint an NFT/ERC20-equivalent on Casper.
    pub fn fractionalize(
        &mut self,
        name: String,
        category: String,
        total_value: U512,
        apy_bps: u32,
    ) -> u32 {
        let caller = env().caller();
        let id = self.asset_count.get();
        let asset = RwaAsset {
            id,
            name: name.clone(),
            category,
            total_value,
            tokenized: total_value,
            holders: 1,
            apy_bps,
            amm_price: U512::from(1_000_000_000), // 1.0 in micro
            status: AssetStatus::Active,
            created_block: env().block_height(),
        };
        self.assets.set(&id, asset);

        // Initialize AMM curve
        self.curves.set(
            &id,
            AmmCurve {
                asset_id: id,
                reserve_token: total_value,
                reserve_cspr: total_value, // 1:1 initial
                fee_bps: 30, // 0.3%
            },
        );
        self.asset_count.set(id + 1);

        env().emit_event(RwaVaultEvent::AssetFractionalized {
            id,
            name,
            total_value,
        });
        id
    }

    /// Market-maker: open a Dutch auction for new issuance.
    pub fn open_dutch_auction(&mut self, asset_id: u32, start_price: U512) {
        self.assert_market_maker();
        let _asset = self.assets.get(&asset_id).expect("Asset does not exist");
        env().emit_event(RwaVaultEvent::DutchAuctionOpened {
            asset_id,
            start_price,
        });
    }

    /// Fill a Dutch auction at current price. Caller pays CSPR.
    #[payable]
    pub fn fill_dutch_auction(&mut self, asset_id: u32, max_price: U512) {
        let caller = env().caller();
        let payment = env().attached_value();
        assert!(payment <= max_price, "Price exceeds maximum");

        let mut asset = self.assets.get(&asset_id).expect("Asset does not exist");
        asset.amm_price = payment;
        asset.holders += 1;
        self.assets.set(&asset_id, asset);

        let vault = self.vault_balance.get();
        self.vault_balance.set(vault + payment);

        env().emit_event(RwaVaultEvent::DutchAuctionFilled {
            asset_id,
            fill_price: payment,
            buyer: caller,
        });
    }

    /// Market-maker: rebalance the AMM curve for an asset.
    pub fn rebalance_amm(
        &mut self,
        asset_id: u32,
        new_reserve_token: U512,
        new_reserve_cspr: U512,
    ) {
        self.assert_market_maker();
        let mut curve = self.curves.get(&asset_id).expect("Curve does not exist");
        curve.reserve_token = new_reserve_token;
        curve.reserve_cspr = new_reserve_cspr;
        self.curves.set(&asset_id, curve.clone());

        env().emit_event(RwaVaultEvent::AmmRebalanced {
            asset_id,
            new_reserve_token,
            new_reserve_cspr,
        });
    }

    /// Constant-product swap: token in → CSPR out (or vice versa).
    #[payable]
    pub fn swap(&mut self, asset_id: u32, token_in: bool, amount_in: U512) {
        let caller = env().caller();
        let mut curve = self.curves.get(&asset_id).expect("Curve does not exist");

        let amount_out = if token_in {
            // x * y = k
            let k = curve.reserve_token * curve.reserve_cspr;
            let new_token = curve.reserve_token + amount_in;
            let new_cspr = k / new_token;
            let out = curve.reserve_cspr - new_cspr;
            curve.reserve_token = new_token;
            curve.reserve_cspr = new_cspr;
            out
        } else {
            let k = curve.reserve_token * curve.reserve_cspr;
            let new_cspr = curve.reserve_cspr + amount_in;
            let new_token = k / new_cspr;
            let out = curve.reserve_token - new_token;
            curve.reserve_cspr = new_cspr;
            curve.reserve_token = new_token;
            out
        };

        self.curves.set(&asset_id, curve);
        env().emit_event(RwaVaultEvent::SwapExecuted {
            asset_id,
            amount_in,
            amount_out,
            buyer: caller,
        });
    }

    /// Read-only
    pub fn asset_count(&self) -> u32 {
        self.asset_count.get()
    }

    pub fn vault_balance(&self) -> U512 {
        self.vault_balance.get()
    }

    pub fn get_asset(&self, id: u32) -> RwaAsset {
        self.assets.get(&id).expect("Asset does not exist")
    }

    pub fn get_curve(&self, id: u32) -> AmmCurve {
        self.curves.get(&id).expect("Curve does not exist")
    }

    fn assert_owner(&self) {
        let caller = env().caller();
        let owner = self.owner.get();
        assert_eq!(caller, owner, "Only owner");
    }

    fn assert_market_maker(&self) {
        let caller = env().caller();
        let mm = self.market_maker.get();
        assert_eq!(caller, mm, "Only market-maker");
    }
}

pub fn module_id() -> ModuleId {
    ModuleId::RwaVault
}
