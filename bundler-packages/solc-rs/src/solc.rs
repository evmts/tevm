use crate::error::SolcError;
use crate::models::{SolcInputDescription, SolcOutput};
use std::io::{self, Write};
use std::path::PathBuf;
use std::process::{Child, Command, Output, Stdio};
use std::sync::Arc;

/// The Solc compiler interface
#[derive(Debug, Clone)]
pub struct Solc {
    /// The path to the solc binary
    pub path: Arc<PathBuf>,
    /// The version of the solc compiler
    pub version: String,
}

impl Solc {
    /// Create a new Solc instance
    pub fn new(path: PathBuf, version: String) -> Self {
        Solc {
            path: Arc::new(path),
            version,
        }
    }

    /// Compile Solidity code
    pub fn compile(&self, input: &SolcInputDescription) -> Result<SolcOutput, SolcError> {
        solc_compile(self, input)
    }
}

/// Compile Solidity code using the provided solc compiler
pub fn solc_compile(solc: &Solc, input: &SolcInputDescription) -> Result<SolcOutput, SolcError> {
    // Serialize the input to JSON
    let input_json =
        serde_json::to_string(input).map_err(|e| SolcError::SerializationError(e.to_string()))?;

    let child = Command::new(&*solc.path)
        .arg("--standard-json")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| SolcError::CompilationError(format!("Failed to execute solc: {}", e)))?;

    let output = exchange_standard_json(child, input_json.as_bytes())?;

    // Check if the command executed successfully
    if !output.status.success() {
        return Err(SolcError::CompilationError(
            String::from_utf8_lossy(&output.stderr).to_string(),
        ));
    }

    parse_output(&output.stdout)
}

// solc may fill either output pipe before it has finished reading its input.
fn exchange_standard_json(mut child: Child, input: &[u8]) -> Result<Output, SolcError> {
    let stdin = child.stdin.take();
    std::thread::scope(|scope| {
        let writer = std::thread::Builder::new().spawn_scoped(scope, move || {
            let mut stdin = stdin.ok_or_else(|| io::Error::other("solc stdin is not piped"))?;
            stdin.write_all(input)
        });
        // Wait before propagating a broken pipe so the child is always reaped.
        let output = child
            .wait_with_output()
            .map_err(|e| SolcError::CompilationError(format!("Failed to read solc output: {e}")))?;
        let written = writer.and_then(|handle| {
            handle
                .join()
                .map_err(|_| io::Error::other("solc stdin writer panicked"))?
        });
        // A child that exits early may have already explained its failure on stderr.
        if output.status.success() || output.stderr.is_empty() {
            written.map_err(|e| {
                SolcError::CompilationError(format!(
                    "Failed to write solc standard JSON input: {e}"
                ))
            })?;
        }
        Ok(output)
    })
}

pub(crate) fn parse_output(stdout: &[u8]) -> Result<SolcOutput, SolcError> {
    // Serde skips unknown fields without checking the encoding of their strings.
    let text = std::str::from_utf8(stdout)
        .map_err(|e| SolcError::SerializationError(format!("Invalid UTF-8 in solc output: {e}")))?;
    let solc_output: SolcOutput = serde_json::from_str(text).map_err(|e| {
        SolcError::SerializationError(format!("Failed to parse solc output: {}", e))
    })?;

    let messages: Vec<_> = solc_output
        .errors
        .iter()
        .flatten()
        .filter(|error| error.severity == "error")
        .map(|error| error.formatted_message.as_deref().unwrap_or(&error.message))
        .collect();
    if !messages.is_empty() {
        return Err(SolcError::CompilationError(messages.join("\n")));
    }

    Ok(solc_output)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{
        SolcInputSource, SolcLanguage, SolcOptimizer, SolcOptimizerDetails, SolcSettings,
    };
    use std::collections::HashMap;
    use std::env;

    #[cfg(unix)]
    fn shell_child(script: &str) -> Child {
        Command::new("sh")
            .args(["-c", script])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .unwrap()
    }

    #[cfg(unix)]
    #[test]
    fn drains_large_outputs_while_writing_input() {
        let child = shell_child("dd if=/dev/zero bs=65536 count=16 2>/dev/null; dd if=/dev/zero bs=65536 count=16 >&2 2>/dev/null; wc -c");
        let size = 1024 * 1024;
        let (tx, rx) = std::sync::mpsc::channel();
        std::thread::spawn(move || {
            tx.send(exchange_standard_json(child, &vec![b'a'; size]))
                .unwrap();
        });
        let output = rx
            .recv_timeout(std::time::Duration::from_secs(10))
            .expect("solc pipes deadlocked")
            .unwrap();
        assert!(output.status.success());
        assert_eq!(output.stderr.len(), size);
        assert_eq!(output.stdout.get(..size).unwrap(), vec![0; size]);
        assert_eq!(
            std::str::from_utf8(&output.stdout[size..]).unwrap().trim(),
            size.to_string()
        );
    }

    #[cfg(unix)]
    #[test]
    fn reaps_child_when_stdin_closes_early() {
        let child = shell_child("exec 0<&-; exit 0");
        let pid = child.id();
        let err = exchange_standard_json(child, &vec![0; 1024 * 1024]).unwrap_err();
        assert!(err
            .to_string()
            .contains("Failed to write solc standard JSON input"));
        let ps = Command::new("ps")
            .args(["-p", &pid.to_string(), "-o", "stat="])
            .output()
            .unwrap();
        assert!(ps.stdout.is_empty(), "child {pid} still exists");
    }

    fn get_solc_path() -> Option<PathBuf> {
        // Try to get solc path from environment variable
        if let Ok(path) = env::var("SOLC_PATH") {
            let path = PathBuf::from(path);
            if path.exists() {
                return Some(path);
            }
        }

        // Try to find solc in PATH
        if let Ok(output) = Command::new("which").arg("solc").output() {
            if output.status.success() {
                let path_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
                let path = PathBuf::from(path_str);
                if path.exists() {
                    return Some(path);
                }
            }
        }

        None
    }

    #[test]
    fn test_solc_compile_if_available() {
        // Skip test if solc is not available
        let solc_path = match get_solc_path() {
            Some(path) => path,
            None => {
                println!("Skipping test: solc not found. Set SOLC_PATH environment variable.");
                return;
            }
        };

        // Get solc version
        let output = Command::new(&solc_path)
            .arg("--version")
            .output()
            .expect("Failed to execute solc command");

        let version_output = String::from_utf8_lossy(&output.stdout);
        let version = version_output
            .lines()
            .find_map(|line| line.strip_prefix("Version: "))
            .expect("version field in solc --version");

        // Create solc instance
        let solc = Solc::new(solc_path, version.to_string());

        // Create a simple contract
        let contract = r#"
            pragma solidity >=0.4.16;
            
            contract Empty {}

            contract SimpleStorage {
                uint256 private storedData;
                
                function set(uint256 x) public {
                    storedData = x;
                }
                
                function get() public view returns (uint256) {
                    return storedData;
                }
            }
        "#;

        // Prepare the input
        let mut sources = HashMap::new();
        sources.insert(
            "SimpleStorage.sol".to_string(),
            SolcInputSource {
                keccak256: None,
                urls: None,
                content: Some(contract.to_string()),
            },
        );

        let input = SolcInputDescription {
            language: SolcLanguage::Solidity,
            sources,
            settings: Some(SolcSettings {
                optimizer: Some(SolcOptimizer {
                    enabled: Some(true),
                    details: Some(SolcOptimizerDetails {
                        peephole: Some(true),
                        ..Default::default()
                    }),
                    ..Default::default()
                }),
                output_selection: Some(HashMap::from([(
                    "*".into(),
                    HashMap::from([("*".into(), vec!["abi".into(), "storageLayout".into()])]),
                )])),
                ..Default::default()
            }),
        };

        let output = solc.compile(&input).expect("compile SimpleStorage");
        let contracts = output.contracts.expect("requested contract output");
        let file = &contracts["SimpleStorage.sol"];
        let empty = file["Empty"].storage_layout.as_ref().unwrap();
        assert!(empty.storage.is_empty());
        assert!(empty.types.as_ref().is_none_or(HashMap::is_empty));
        let stateful = file["SimpleStorage"].storage_layout.as_ref().unwrap();
        assert!(stateful
            .types
            .as_ref()
            .unwrap()
            .contains_key(&stateful.storage[0].type_name));
        let abi = file["SimpleStorage"].abi.as_ref().unwrap();
        assert!(abi
            .as_array()
            .unwrap()
            .iter()
            .any(|item| item["name"] == "get"));
    }
}
