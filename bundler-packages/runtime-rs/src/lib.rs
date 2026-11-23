use alloy_primitives::Bytes;
use foundry_compilers::artifacts::Contract;
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashSet};
use strum::EnumString;
use strum_macros::Display;
#[cfg(test)]
mod fuzz_proptest;

#[napi]
#[derive(Debug, Clone, Copy, EnumString, Display)]
#[strum(serialize_all = "lowercase")]
pub enum ModuleType {
    Ts,
    Cjs,
    Dts,
    Mjs,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ContractPackage {
    TevmContract,
    TevmContractScoped,
}

impl ContractPackage {
    fn to_string(&self) -> String {
        match self {
            ContractPackage::TevmContract => "tevm/contract".to_string(),
            ContractPackage::TevmContractScoped => "@tevm/contract".to_string(),
        }
    }

    #[allow(dead_code)]
    fn from_str(s: &str) -> Option<Self> {
        match s {
            "tevm/contract" => Some(ContractPackage::TevmContract),
            "@tevm/contract" => Some(ContractPackage::TevmContractScoped),
            _ => None,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TevmContract {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bytecode: Option<Bytes>,
    #[serde(rename = "deployedBytecode", skip_serializing_if = "Option::is_none")]
    pub deployed_bytecode: Option<Bytes>,
    pub name: String,
    #[serde(rename = "humanReadableAbi")]
    pub human_readable_abi: Vec<String>,
    /// Original JSON when human-readable signatures cannot encode anonymous events.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub abi: Option<serde_json::Value>,
}

fn format_abi_type(param: &serde_json::Value) -> String {
    let ty = param
        .get("type")
        .and_then(serde_json::Value::as_str)
        .unwrap_or_default();
    if let Some(suffix) = ty.strip_prefix("tuple") {
        let components = format_abi_params(
            param.get("components")
                .and_then(serde_json::Value::as_array),
        );
        format!("({}){}", components, suffix)
    } else {
        ty.to_string()
    }
}

fn format_abi_param(param: &serde_json::Value) -> String {
    let ty = format_abi_type(param);
    let indexed = if param
        .get("indexed")
        .and_then(serde_json::Value::as_bool)
        .unwrap_or(false)
    {
        " indexed"
    } else {
        ""
    };
    let name = param
        .get("name")
        .and_then(serde_json::Value::as_str)
        .unwrap_or_default();

    if name.is_empty() {
        format!("{}{}", ty, indexed)
    } else {
        format!("{}{} {}", ty, indexed, name)
    }
}

fn format_abi_params(params: Option<&Vec<serde_json::Value>>) -> String {
    params
        .map(|params| {
            params
                .iter()
                .map(format_abi_param)
                .collect::<Vec<_>>()
                .join(", ")
        })
        .unwrap_or_default()
}

fn format_abi_item(item: &serde_json::Value) -> Option<String> {
    let item_type = item.get("type").and_then(serde_json::Value::as_str)?;
    let inputs = format_abi_params(item.get("inputs").and_then(serde_json::Value::as_array));
    let state_mutability = item
        .get("stateMutability")
        .and_then(serde_json::Value::as_str)
        .unwrap_or_default();

    match item_type {
        "function" => {
            let name = item.get("name").and_then(serde_json::Value::as_str)?;
            let outputs = format_abi_params(item.get("outputs").and_then(serde_json::Value::as_array));
            let mut signature = format!("function {}({})", name, inputs);
            if matches!(state_mutability, "view" | "pure" | "payable") {
                signature.push_str(&format!(" {}", state_mutability));
            }
            if !outputs.is_empty() {
                signature.push_str(&format!(" returns ({})", outputs));
            }
            Some(signature)
        }
        "event" => {
            let name = item.get("name").and_then(serde_json::Value::as_str)?;
            Some(format!("event {}({})", name, inputs))
        }
        "error" => {
            let name = item.get("name").and_then(serde_json::Value::as_str)?;
            Some(format!("error {}({})", name, inputs))
        }
        "constructor" => {
            let mut signature = format!("constructor({})", inputs);
            if state_mutability == "payable" {
                signature.push_str(" payable");
            }
            Some(signature)
        }
        "fallback" => {
            let mut signature = "fallback() external".to_string();
            if state_mutability == "payable" {
                signature.push_str(" payable");
            }
            Some(signature)
        }
        "receive" => Some("receive() external payable".to_string()),
        _ => None,
    }
}

/// Formats a contract ABI into a human-readable form
fn format_abi(abi: &serde_json::Value) -> Vec<String> {
    match abi.as_array() {
        Some(items) => items.iter().filter_map(format_abi_item).collect(),
        None => vec![],
    }
}

fn contract_bytecode(contract: &Contract) -> Option<Bytes> {
    contract
        .evm
        .as_ref()
        .and_then(|evm| evm.bytecode.as_ref())
        .and_then(|bytecode| bytecode.object.as_bytes())
        .cloned()
}

fn contract_deployed_bytecode(contract: &Contract) -> Option<Bytes> {
    contract
        .evm
        .as_ref()
        .and_then(|evm| evm.deployed_bytecode.as_ref())
        .and_then(|bytecode| bytecode.bytes())
        .cloned()
}

// Preserve usable export names. Encode other names reversibly and leave their
// original spelling in the artifact and declaration data.
fn export_name(name: &str, contracts: &BTreeMap<String, TevmContract>) -> String {
    static IDENTIFIER: once_cell::sync::Lazy<regex::Regex> = once_cell::sync::Lazy::new(|| {
        regex::Regex::new(r"^[\p{ID_Start}$_][\p{ID_Continue}$\u{200C}\u{200D}]*$").unwrap()
    });
    // Strict-mode BindingIdentifier exclusions, followed by generator-reserved names.
    const RESERVED: &[&str] = &[
        "arguments", "eval", "await", "break", "case", "catch", "class", "const", "continue",
        "debugger", "default", "delete", "do", "else", "enum", "export", "extends", "false",
        "finally", "for", "function", "if", "implements", "import", "in", "instanceof",
        "interface", "let", "new", "null", "package", "private", "protected", "public",
        "return", "static", "super", "switch", "this", "throw", "true", "try", "typeof",
        "var", "void", "while", "with", "yield",
        "artifacts", "createContract", "__proto__",
    ];
    if IDENTIFIER.is_match(name) && !RESERVED.contains(&name) {
        return name.to_owned();
    }
    let mut alias = format!("Tevm${}", hex::encode(name));
    while contracts.contains_key(&alias) {
        alias.push('$');
    }
    alias
}

fn private_name(prefix: &str, name: &str, used: &mut HashSet<String>) -> String {
    let mut local = format!("{prefix}{name}");
    while !used.insert(local.clone()) {
        local.push('$');
    }
    local
}

/// Generates CJS, MJS, TypeScript or declarations in contract-name order.
/// Original names remain keys of the artifacts export. Names that cannot serve
/// as export bindings are encoded as described in the crate README. Declarations
/// retain ABI signatures and included bytecode as literals. Contracts with
/// anonymous events also retain their JSON ABI for lossless event metadata.
pub fn generate_runtime(
    contracts: Vec<(String, Contract)>,
    module_type: ModuleType,
    contract_package: ContractPackage,
    include_bytecode: bool,
) -> String {
    let package = contract_package.to_string();
    
    let mut tevm_contracts = BTreeMap::new();
    
    for (name, contract) in contracts {
        let bytecode = if include_bytecode {
            contract_bytecode(&contract)
        } else {
            None
        };
        let deployed_bytecode = if include_bytecode {
            contract_deployed_bytecode(&contract)
        } else {
            None
        };
        
        // Create tevm contract - convert foundry JsonAbi to serde_json::Value for format_abi
        let abi_value = contract.abi.as_ref()
            .map(|abi| serde_json::to_value(abi).unwrap_or(serde_json::Value::Array(vec![])))
            .unwrap_or(serde_json::Value::Array(vec![]));

        let has_anonymous_event = contract
            .abi
            .as_ref()
            .is_some_and(|abi| abi.events().any(|event| event.anonymous));
        let tevm_contract = TevmContract {
            bytecode,
            deployed_bytecode,
            name: name.clone(),
            human_readable_abi: format_abi(&abi_value),
            abi: has_anonymous_event.then_some(abi_value),
        };
        tevm_contracts.insert(name, tevm_contract);
    }

    if tevm_contracts.is_empty() {
        return "// No contracts found in the solc output".to_string();
    }

    let bindings: Vec<_> = tevm_contracts
        .values()
        .map(|contract| (export_name(&contract.name, &tevm_contracts), contract))
        .collect();
    let mut used: HashSet<_> = bindings.iter().map(|(name, _)| name.clone()).collect();
    let contract_type = if matches!(module_type, ModuleType::Dts) && used.contains("Contract") {
        private_name("_", "ContractType", &mut used)
    } else {
        "Contract".to_owned()
    };
    let mut output = match module_type {
        ModuleType::Cjs => format!("const {{ createContract }} = require('{package}');\n\n"),
        ModuleType::Dts if contract_type != "Contract" => {
            format!("import type {{ Contract as {contract_type} }} from '{package}';\n\n")
        }
        ModuleType::Dts => format!("import type {{ Contract }} from '{package}';\n\n"),
        _ => format!("import {{ createContract }} from '{package}';\n\n"),
    };

    let export = if matches!(module_type, ModuleType::Cjs) {
        "module.exports."
    } else {
        "export const "
    };
    let assertion = if matches!(module_type, ModuleType::Ts) { " as const" } else { "" };
    let mut entries = Vec::new();
    for (name, contract) in bindings {
        let key = serde_json::to_string(&contract.name).expect("serializable contract name");
        let local = private_name("_", &name, &mut used);
        if matches!(module_type, ModuleType::Dts) {
            let signatures =
                serde_json::to_string(&contract.human_readable_abi).expect("ABI strings");
            output.push_str(&format!(
                "declare const {local}: {{\n  readonly name: {key};\n  readonly humanReadableAbi: readonly {signatures};\n"
            ));
            let mut bytecode_type = |field: &str, bytes: &Option<Bytes>| {
                if let Some(bytes) = bytes {
                    output.push_str(&format!("  readonly {field}: \"{bytes}\";\n"));
                    format!("typeof {local}.{field}")
                } else {
                    "undefined".to_owned()
                }
            };
            let init = bytecode_type("bytecode", &contract.bytecode);
            let deployed = bytecode_type("deployedBytecode", &contract.deployed_bytecode);
            if let Some(abi) = &contract.abi {
                output.push_str(&format!("  readonly abi: readonly {abi};\n"));
            }
            output.push_str("};\n");
            let contract_decl = format!(
                "{contract_type}<\n  typeof {local}.name,\n  typeof {local}.humanReadableAbi,\n  undefined,\n  {init},\n  {deployed},\n  undefined\n>"
            );
            if contract.abi.is_some() {
                output.push_str(&format!("export const {name}: Omit<{contract_decl}, \"abi\"> & {{ abi: typeof {local}.abi }};\n\n"));
            } else {
                output.push_str(&format!("export const {name}: {contract_decl};\n\n"));
            }
            entries.push(format!("  {key}: typeof {local};"));
            continue;
        }

        let json = serde_json::to_string_pretty(contract).expect("serializable TevmContract");
        // createContract accepts exactly one ABI representation. Its string parser
        // cannot round-trip the anonymous flag, so pass JSON for those contracts.
        let args = if contract.abi.is_some() {
            let mut value = serde_json::to_value(contract).expect("serializable TevmContract");
            value
                .as_object_mut()
                .expect("contract object")
                .remove("humanReadableAbi");
            serde_json::to_string_pretty(&value).expect("serializable arguments")
        } else {
            json.clone()
        };
        output.push_str(&format!("const {local} = {args}{assertion};\n\n"));
        output.push_str(&format!("/**\n * Contract implementation for {name}\n * @see [contract docs](https://tevm.sh/learn/contracts/) for more documentation\n */\n"));
        if contract.abi.is_some() && matches!(module_type, ModuleType::Ts) {
            output.push_str(&format!(
                "{export}{name} = {{ ...createContract({local}), abi: {local}.abi }};\n\n"
            ));
        } else {
            output.push_str(&format!("{export}{name} = createContract({local});\n\n"));
        }
        // A computed key keeps __proto__ an ordinary own property in JS object literals.
        let property = if contract.name == "__proto__" {
            format!("[{key}]")
        } else {
            key
        };
        entries.push(format!("  {property}: {json}"));
    }

    if matches!(module_type, ModuleType::Dts) {
        output.push_str(&format!(
            "export const artifacts: {{\n{}\n}};\n",
            entries.join("\n")
        ));
    } else {
        output.push_str(&format!(
            "{export}artifacts = {{\n{}\n}}{assertion};\n",
            entries.join(",\n")
        ));
    }
    output
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    /// Helper function to create a vector of foundry-style Contract objects for testing
    fn create_test_contracts(
        contracts_data: Vec<(String, serde_json::Value, String, String)>,
    ) -> Vec<(String, Contract)> {
        contracts_data
            .into_iter()
            .map(|(name, abi, bytecode, deployed_bytecode)| {
                let contract = serde_json::from_value(json!({
                    "abi": abi, "evm": {
                        "bytecode": {"object": bytecode},
                        "deployedBytecode": {"object": deployed_bytecode},
                    }
                }))
                .expect("valid Foundry fixture");
                (name, contract)
            })
            .collect()
    }

    #[test]
    fn test_bytecode_formatting() {
        let wire = json!({"C": {"evm": {
            "bytecode":{"object":"0060FF"}, "deployedBytecode":{"object":"0x00aB"}
        }}});
        for include in [false, true] {
            let source = generate_runtime_js(
                wire.to_string(),
                "mjs".into(),
                include,
                "tevm/contract".into(),
            )
            .unwrap();
            let (_, literal) = source.split_once("export const artifacts = ").unwrap();
            let artifacts: serde_json::Value =
                serde_json::from_str(literal.trim_end_matches(";\n")).unwrap();
            let artifact = &artifacts["C"];
            if include {
                assert_eq!(artifact["bytecode"], "0x0060ff");
                assert_eq!(artifact["deployedBytecode"], "0x00ab");
            } else {
                assert!(artifact.get("bytecode").is_none());
                assert!(artifact.get("deployedBytecode").is_none());
            }
        }
    }

    #[test]
    fn test_generate_runtime_minimal() {
        // Create minimal test data based on JavaScript tests
        let abi = json!([
            { "type": "function", "name": "test", "inputs": [], "outputs": [], "stateMutability": "nonpayable" }
        ]);

        let contracts_data = vec![(
            "TestContract".to_string(),
            abi,
            "1234".to_string(),
            "5678".to_string(),
        )];

        let contracts = create_test_contracts(contracts_data);

        // Test each module type
        let module_types = [
            ModuleType::Cjs,
            ModuleType::Dts,
            ModuleType::Ts,
            ModuleType::Mjs,
        ];

        for module_type in module_types {
            let result = generate_runtime(
                contracts.clone(),
                module_type.clone(),
                ContractPackage::TevmContractScoped,
                false,
            );

            // Basic assertions for all module types
            assert!(result.contains("TestContract"));

            // Module-specific assertions
            match module_type {
                ModuleType::Cjs => {
                    assert!(result.contains("module.exports"));
                }
                ModuleType::Ts | ModuleType::Mjs => {
                    assert!(result.contains("export const"));
                }
                ModuleType::Dts => {
                    assert!(result.contains("export const TestContract: Contract<"));
                }
            }
        }
    }

    #[test]
    fn test_generate_runtime_no_contracts() {
        // Create empty contracts vector
        let contracts: Vec<(String, Contract)> = Vec::new();

        let result = generate_runtime(
            contracts,
            ModuleType::Cjs,
            ContractPackage::TevmContractScoped,
            false,
        );

        // No contracts should result in a comment
        assert_eq!(result, "// No contracts found in the solc output");
    }

    #[test]
    fn test_generate_runtime_package_names() {
        // Create simple test contract
        let abi = json!([
            { "type": "constructor", "inputs": [], "stateMutability": "payable" }
        ]);

        let contracts_data = vec![(
            "MyContract".to_string(),
            abi,
            "0420".to_string(),
            "420420".to_string(),
        )];

        let contracts = create_test_contracts(contracts_data);

        // Test with TevmContract package
        let result_tevm =
            generate_runtime(contracts.clone(), ModuleType::Ts, ContractPackage::TevmContract, false);
        assert!(result_tevm.contains("import { createContract } from 'tevm/contract'"));
        assert!(!result_tevm.contains("import { createContract } from '@tevm/contract'"));

        // Test with TevmContractScoped package
        let result_scoped = generate_runtime(
            contracts,
            ModuleType::Ts,
            ContractPackage::TevmContractScoped,
            false,
        );
        assert!(result_scoped.contains("import { createContract } from '@tevm/contract'"));
        assert!(!result_scoped.contains("import { createContract } from 'tevm/contract'"));
    }

    #[test]
    fn test_generate_runtime_cjs() {
        // Create test contract for CommonJS output
        let abi = json!([
            { "type": "constructor", "inputs": [], "stateMutability": "payable" }
        ]);

        let contracts_data = vec![(
            "MyContract".to_string(),
            abi,
            "0420".to_string(),
            "420420".to_string(),
        )];

        let contracts = create_test_contracts(contracts_data);

        let result = generate_runtime(
            contracts,
            ModuleType::Cjs,
            ContractPackage::TevmContractScoped,
            false,
        );

        // Assert expected CommonJS format
        assert!(result.contains("const { createContract } = require('@tevm/contract');"));
        assert!(result.contains("const _MyContract ="));
        assert!(result.contains("module.exports.MyContract = createContract(_MyContract);"));
        assert!(result.contains("module.exports.artifacts ="));
    }

    #[test]
    fn test_generate_runtime_ts() {
        // Create test contract for TypeScript output
        let abi = json!([
            { "type": "constructor", "inputs": [], "stateMutability": "payable" }
        ]);

        let contracts_data = vec![(
            "MyContract".to_string(),
            abi,
            "0420".to_string(),
            "420420".to_string(),
        )];

        let contracts = create_test_contracts(contracts_data);

        let result = generate_runtime(
            contracts,
            ModuleType::Ts,
            ContractPackage::TevmContractScoped,
            false,
        );

        // Assert expected TypeScript format
        assert!(result.contains("import { createContract } from '@tevm/contract';"));
        assert!(result.contains("const _MyContract = "));
        assert!(result.contains(" as const;"));
        assert!(result.contains("export const MyContract = createContract(_MyContract);"));
        assert!(result.contains("export const artifacts = "));
    }

    #[test]
    fn test_generate_runtime_mjs() {
        // Create test contract for ES Module output
        let abi = json!([
            { "type": "constructor", "inputs": [], "stateMutability": "payable" }
        ]);

        let contracts_data = vec![(
            "MyContract".to_string(),
            abi,
            "0420".to_string(),
            "420420".to_string(),
        )];

        let contracts = create_test_contracts(contracts_data);

        let result = generate_runtime(
            contracts,
            ModuleType::Mjs,
            ContractPackage::TevmContractScoped,
            false,
        );

        // Assert expected MJS format
        assert!(result.contains("import { createContract } from '@tevm/contract';"));
        assert!(result.contains("const _MyContract = "));
        assert!(!result.contains(" as const;")); // MJS doesn't use 'as const'
        assert!(result.contains("export const MyContract = createContract(_MyContract);"));
        assert!(result.contains("export const artifacts = "));
    }

    #[test]
    fn test_generate_runtime_dts() {
        // Create test contract for TypeScript declaration file output
        let abi = json!([
            { "type": "constructor", "inputs": [], "stateMutability": "payable" }
        ]);

        let contracts_data = vec![(
            "MyContract".to_string(),
            abi,
            "0420".to_string(),
            "420420".to_string(),
        )];

        let contracts = create_test_contracts(contracts_data);

        let result = generate_runtime(
            contracts,
            ModuleType::Dts,
            ContractPackage::TevmContractScoped,
            false,
        );

        assert!(result.contains("import type { Contract } from '@tevm/contract';"));
        assert!(result.contains("readonly [\"constructor() payable\"]"));
        assert!(result.contains("export const MyContract: Contract<"));
        assert!(result.contains("  undefined,\n  undefined,\n  undefined,\n  undefined"));
        assert!(result.contains("\"MyContract\": typeof "));
        assert!(!result.contains("any"));
    }

    #[test]
    fn test_generate_runtime_multiple_contracts() {
        // Create multiple contracts
        let abi1 = json!([
            {
                "type": "function",
                "name": "getValue",
                "inputs": [],
                "outputs": [{ "type": "uint256" }],
                "stateMutability": "view"
            }
        ]);

        let abi2 = json!([
            {
                "type": "function",
                "name": "help",
                "inputs": [{ "name": "x", "type": "uint256" }],
                "outputs": [{ "type": "uint256" }],
                "stateMutability": "pure"
            }
        ]);

        let contracts_data = vec![
            (
                "MainContract".to_string(),
                abi1,
                "01".to_string(),
                "02".to_string(),
            ),
            (
                "HelperContract".to_string(),
                abi2,
                "03".to_string(),
                "04".to_string(),
            ),
        ];

        let contracts = create_test_contracts(contracts_data);

        let result = generate_runtime(
            contracts,
            ModuleType::Ts,
            ContractPackage::TevmContractScoped,
            false,
        );

        // Assert both contracts are included
        assert!(result.contains("\"name\": \"MainContract\""));
        assert!(result.contains("\"name\": \"HelperContract\""));

        // Assert both contracts are exported
        assert!(result.contains("export const MainContract = createContract(_MainContract);"));
        assert!(result.contains("export const HelperContract = createContract(_HelperContract);"));
    }

    #[test]
    fn test_generate_runtime_complex_abi() {
        // Create contracts with complex ABI
        let complex_abi = json!([
            {
                "type": "function",
                "name": "complexFunction",
                "inputs": [
                    {
                        "name": "inputStruct",
                        "type": "tuple",
                        "components": [
                            { "name": "a", "type": "uint256" },
                            { "name": "b", "type": "string" }
                        ]
                    },
                    { "name": "arrayInput", "type": "uint256[]" }
                ],
                "outputs": [{ "name": "output", "type": "bytes32" }],
                "stateMutability": "view"
            },
            {
                "type": "event",
                "name": "ComplexEvent",
                "inputs": [
                    { "indexed": true, "name": "sender", "type": "address" },
                    { "indexed": false, "name": "value", "type": "uint256" }
                ],
                "anonymous": false
            }
        ]);

        let contracts_data = vec![(
            "ComplexABI".to_string(),
            complex_abi,
            "05".to_string(),
            "06".to_string(),
        )];

        let contracts = create_test_contracts(contracts_data);

        let result = generate_runtime(
            contracts,
            ModuleType::Ts,
            ContractPackage::TevmContractScoped,
            false,
        );

        // The complex ABI should be in the output
        assert!(result.contains("ComplexABI"));
        assert!(result.contains("export const ComplexABI = createContract(_ComplexABI);"));
    }

    #[test]
    fn test_generate_runtime_empty_bytecode() {
        // Test with empty bytecode
        let abi = json!([
            { "type": "function", "name": "test", "inputs": [], "outputs": [], "stateMutability": "nonpayable" }
        ]);

        let contracts_data = vec![(
            "EmptyBytecodeContract".to_string(),
            abi,
            "".to_string(),
            "".to_string(),
        )];

        let contracts = create_test_contracts(contracts_data);

        let result = generate_runtime(
            contracts,
            ModuleType::Ts,
            ContractPackage::TevmContractScoped,
            false,
        );

        // The contract should be included without bytecode
        assert!(result.contains("EmptyBytecodeContract"));
        assert!(!result.contains("\"bytecode\""));
        assert!(!result.contains("\"deployedBytecode\""));
    }

    #[test]
    fn test_contract_package_conversion() {
        // Test ContractPackage conversion methods
        let tevm_contract = ContractPackage::TevmContract;
        let tevm_contract_scoped = ContractPackage::TevmContractScoped;

        assert_eq!(tevm_contract.to_string(), "tevm/contract");
        assert_eq!(tevm_contract_scoped.to_string(), "@tevm/contract");

        assert_eq!(
            ContractPackage::from_str("tevm/contract"),
            Some(ContractPackage::TevmContract)
        );
        assert_eq!(
            ContractPackage::from_str("@tevm/contract"),
            Some(ContractPackage::TevmContractScoped)
        );
        assert_eq!(ContractPackage::from_str("invalid"), None);
    }
}

// NAPI bindings for JS/TS interop

/// Generate the JavaScript runtime code for a Solidity contract
/// Now using Foundry Contract type
#[napi(catch_unwind)]
pub fn generate_runtime_js(
    contracts_json: String,
    module_type: String,
    include_bytecode: bool,
    contract_package: String,
) -> napi::Result<String> {
    let contracts = match serde_json::from_str::<BTreeMap<String, Contract>>(&contracts_json) {
        Ok(contracts) => contracts.into_iter().collect(),
        Err(_) => serde_json::from_str::<Vec<(String, Contract)>>(&contracts_json)?,
    };

    // Parse module type
    let module_type = match module_type.to_lowercase().as_str() {
        "ts" => ModuleType::Ts,
        "cjs" => ModuleType::Cjs,
        "mjs" => ModuleType::Mjs,
        "dts" => ModuleType::Dts,
        _ => {
            return Err(napi::Error::new(
                napi::Status::InvalidArg,
                format!("Invalid module type: {}", module_type),
            ))
        }
    };

    let contract_package = ContractPackage::from_str(&contract_package).ok_or_else(|| {
        napi::Error::new(
            napi::Status::InvalidArg,
            format!("Invalid contract package: {}", contract_package),
        )
    })?;

    // Generate the runtime code with the new type
    let result = generate_runtime(contracts, module_type, contract_package, include_bytecode);

    Ok(result)
}
