use std::{fmt::Write, ops::Range, path::PathBuf};

use crate::resolve_imports::ResolveImportsError;
use crate::state::State;
use crate::{resolve_imports::resolve_imports_spanned, Config, ModuleInfo, ResolvedImport};
use tokio::fs;
use tokio::sync::OwnedSemaphorePermit;

fn rewrite_imports(code: &str, imports: &[(Range<usize>, ResolvedImport)]) -> String {
    let mut rewritten = String::with_capacity(code.len());
    let mut cursor = 0;
    for (literal, import) in imports {
        let quote = code.as_bytes()[literal.start];
        rewritten.push_str(&code[cursor..literal.start + 1]);
        // Keep the original quote and encode the resolved path as a Solidity string.
        for &byte in import.updated.as_bytes() {
            match byte {
                b'\\' => rewritten.push_str("\\\\"),
                b if b == quote => {
                    rewritten.push('\\');
                    rewritten.push(b as char);
                }
                0x20..=0x7e => rewritten.push(byte as char),
                _ => write!(rewritten, "\\x{byte:02x}").unwrap(),
            }
        }
        cursor = literal.end - 1;
    }
    rewritten.push_str(&code[cursor..]);
    rewritten
}

/// Read a module (or use provided code), resolve its imports, insert into `ctx.graph`,
/// and return the list of child imports.
pub async fn process_module(
    path: &PathBuf,
    code_opt: Option<String>,
    cfg: &Config,
    state: State,
    _permit: OwnedSemaphorePermit,
) -> Result<String, Vec<ResolveImportsError>> {
    let id = path.to_string_lossy().to_string();
    let mut seen = state.seen.lock().await;
    if !seen.insert(id.clone()) {
        return Ok(id);
    };
    drop(seen);
    let code = if let Some(c) = code_opt {
        c
    } else {
        fs::read_to_string(&path)
            .await
            .map_err(|err| vec![ResolveImportsError::ReadError {
                context_path: path.clone(),
                message: err.to_string(),
            }])?
    };

    let resolved_imports = resolve_imports_spanned(path, &code, cfg)?;
    let imported_ids = resolved_imports
        .iter()
        .map(|(_, import)| PathBuf::from(&import.absolute))
        .collect();
    let rewritten_code = rewrite_imports(&code, &resolved_imports);

    state.graph.lock().await.insert(
        path.to_string_lossy().into_owned(),
        ModuleInfo {
            code: rewritten_code,
            raw_code: code,
            imported_ids,
        },
    );
    Ok(id)
}
