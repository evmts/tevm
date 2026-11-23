pub mod models;
pub mod solc;
pub mod error;
pub mod napi;
// The basic usage example is also compiled as a standalone Cargo example.
#[cfg(feature = "examples")]
extern crate self as tevm_solc_rs;
#[cfg(feature = "examples")]
pub mod examples;
#[cfg(test)]
mod fuzz_proptest;

// Re-export the main functions and types for easier access
pub use models::{
    SolcInputDescription, SolcOutput, SolcLanguage, SolcInputSource, SolcInputSources,
    SolcSettings, SolcOptimizer, SolcOutputSelection, SolcErrorEntry, SolcContractOutput,
};
pub use solc::{Solc, solc_compile};
pub use error::SolcError;
