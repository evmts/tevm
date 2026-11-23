use thiserror::Error;

/// Errors that can occur when using the solc compiler
#[derive(Error, Debug)]
pub enum SolcError {
    /// Error during solc compilation
    #[error("Compilation error: {0}")]
    CompilationError(String),

    /// Error with input/output serialization
    #[error("Serialization error: {0}")]
    SerializationError(String),

    /// Unknown error
    #[error("Unknown error: {0}")]
    Unknown(String),
}
