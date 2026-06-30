//! RWA-X Vault — Agent-Managed RWA AMM Contract (Odra 2.x)

use odra::prelude::*;
use odra::casper_types::U512;
use crate::shared::ModuleId;

#[odra::odra_type]
pub struct RwaAsset {
    pub id: u32,
    pub name: String,
    pub category: String,
    pub total_value: U512,
    pub tokenized: U512,
    pub holders: u32,
    pub apy_bps: u32,
    pub amm_price: U512,
    pub status: AssetStatus,
    pub created_block: u64,
}

#[odra::odra_type]
pub enum AssetStatus {
    Active,
    Frozen,
    Matured,
}

#[odra::odra_type]
pub struct AmmCurve {
    pub asset_id: u32,
    pub reserve_token: U512,
    pub reserve_cspr: U512,
    pub fee_bps: u32,
}

// Events as individual structs (Odra 2.x pattern)
#[derive(odra::casper_event_standard::Event)]
pub struct AssetFractionalized { pub id: u32, pub name: String, pub total_value: U512 }

#[derive(odra::casper_event_standard::Event)]
pub struct MarketMakerSet { pub addr: Address }

#[derive(odra::casper_event_standard::Event)]
pub struct DutchAuctionOpened { pub asset_id: u32, pub start_price: U512 }

#[derive(odra::casper_event_standard::Event)]
pub struct DutchAuctionFilled { pub asset_id: u32, pub fill_price: U512, pub buyer: Address }

#[derive(odra::casper_event_standard::Event)]
pub struct AmmRebalanced { pub asset_id: u32, pub new_reserve_token: U512, pub new_reserve_cspr: U512 }

#[derive(odra::casper_event_standard::Event)]
pub struct SwapExecuted { pub asset_id: u32, pub amount_in: U512, pub amount_out: U512, pub buyer: Address }

#[odra::module]
pub struct RwaVault {
    pub owner: Var<Address>,
    pub asset_count: Var<u32>,
    pub assets: Mapping<u32, RwaAsset>,
    pub curves: Mapping<u32, AmmCurve>,
    pub market_maker: Var<Address>,
    pub vault_balance: Var<U512>,
}

#[odra::module]
impl RwaVault {
    pub fn init(&mut self) {
        let caller = self.env().caller();
        self.owner.set(caller);
        self.asset_count.set(0);
        self.vault_balance.set(U512::zero());
    }

    pub fn set_market_maker(&mut self, addr: Address) {
        self.assert_owner();
        self.market_maker.set(addr);
        self.env().emit_event(MarketMakerSet { addr });
    }

    pub fn fractionalize(
        &mut self,
        name: String,
        category: String,
        total_value: U512,
        apy_bps: u32,
    ) -> u32 {
        let id = self.asset_count.get_or_default();
        let asset = RwaAsset {
            id,
            name: name.clone(),
            category,
            total_value,
            tokenized: total_value,
            holders: 1,
            apy_bps,
            amm_price: U512::from(1_000_000_000),
            status: AssetStatus::Active,
            created_block: self.env().get_block_time(),
        };
        self.assets.set(&id, asset);

        self.curves.set(
            &id,
            AmmCurve {
                asset_id: id,
                reserve_token: total_value,
                reserve_cspr: total_value,
                fee_bps: 30,
            },
        );
        self.asset_count.set(id + 1);

        self.env().emit_event(AssetFractionalized { id, name, total_value });
        id
    }

    pub fn open_dutch_auction(&mut self, asset_id: u32, start_price: U512) {
        self.assert_market_maker();
        let _asset = self.assets.get(&asset_id).unwrap_or_revert(self);
        self.env().emit_event(DutchAuctionOpened { asset_id, start_price });
    }

    #[odra(payable)]
    pub fn fill_dutch_auction(&mut self, asset_id: u32, max_price: U512) {
        let caller = self.env().caller();
        let payment = self.env().attached_value();
        assert!(payment <= max_price, "Price exceeds maximum");

        let mut asset = self.assets.get(&asset_id).unwrap_or_revert(self);
        asset.amm_price = payment;
        asset.holders += 1;
        self.assets.set(&asset_id, asset);

        let vault = self.vault_balance.get_or_default();
        self.vault_balance.set(vault + payment);

        self.env().emit_event(DutchAuctionFilled { asset_id, fill_price: payment, buyer: caller });
    }

    pub fn rebalance_amm(
        &mut self,
        asset_id: u32,
        new_reserve_token: U512,
        new_reserve_cspr: U512,
    ) {
        self.assert_market_maker();
        let mut curve = self.curves.get(&asset_id).unwrap_or_revert(self);
        curve.reserve_token = new_reserve_token;
        curve.reserve_cspr = new_reserve_cspr;
        self.curves.set(&asset_id, curve);

        self.env().emit_event(AmmRebalanced { asset_id, new_reserve_token, new_reserve_cspr });
    }

    #[odra(payable)]
    pub fn swap(&mut self, asset_id: u32, token_in: bool, amount_in: U512) {
        let caller = self.env().caller();
        let mut curve = self.curves.get(&asset_id).unwrap_or_revert(self);

        let amount_out = if token_in {
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
        self.env().emit_event(SwapExecuted { asset_id, amount_in, amount_out, buyer: caller });
    }

    pub fn asset_count(&self) -> u32 {
        self.asset_count.get_or_default()
    }

    pub fn vault_balance(&self) -> U512 {
        self.vault_balance.get_or_default()
    }

    pub fn get_asset(&self, id: u32) -> RwaAsset {
        self.assets.get(&id).unwrap_or_revert(self)
    }

    pub fn get_curve(&self, id: u32) -> AmmCurve {
        self.curves.get(&id).unwrap_or_revert(self)
    }

    fn assert_owner(&self) {
        let caller = self.env().caller();
        let owner = self.owner.get().unwrap_or_revert(self);
        assert_eq!(caller, owner, "Only owner");
    }

    fn assert_market_maker(&self) {
        let caller = self.env().caller();
        let mm = self.market_maker.get().unwrap_or_revert(self);
        assert_eq!(caller, mm, "Only market-maker");
    }
}

pub fn module_id() -> ModuleId {
    ModuleId::RwaVault
}
