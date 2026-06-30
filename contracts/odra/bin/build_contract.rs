//! SKYWEE — WASM build entry point for cargo-odra
#![no_std]
#![no_main]

extern crate skywee_contracts;
extern crate odra_casper_wasm_env;

#[no_mangle]
pub extern "C" fn main() {
    // Entry point — contracts are linked via extern crate
}
