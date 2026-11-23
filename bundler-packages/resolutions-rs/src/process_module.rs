use std::{fmt::Write, ops::Range, path::PathBuf};

use crate::resolve_imports::ResolveImportsError;
use crate::state::State;
use crate::{resolve_imports::resolve_imports_spanned, Config, ModuleInfo, ResolvedImport};
use tokio::fs;
use tokio::sync::OwnedSemaphorePermit;

fn rewrite_imports(
    code: &str,
    imports: &[(Range<usize>, ResolvedImport)],
) -> Result<String, Range<usize>> {
    let mut rewritten = String::with_capacity(code.len());
    let mut cursor = 0;
    for (literal, import) in imports {
        let prefix = code
            .get(cursor..literal.start)
            .ok_or_else(|| literal.clone())?;
        let text = code.get(literal.clone()).ok_or_else(|| literal.clone())?;
        let quote = match text.as_bytes() {
            [start @ (b'\'' | b'"'), .., end] if start == end => *start,
            _ => return Err(literal.clone()),
        };
        rewritten.push_str(prefix);
        rewritten.push(quote as char);
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
        rewritten.push(quote as char);
        cursor = literal.end;
    }
    rewritten.push_str(code.get(cursor..).ok_or(cursor..code.len())?);
    Ok(rewritten)
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
        fs::read_to_string(&path).await.map_err(|err| {
            vec![ResolveImportsError::ReadError {
                context_path: path.clone(),
                message: err.to_string(),
            }]
        })?
    };

    let resolved_imports = resolve_imports_spanned(path, &code, cfg)?;
    let imported_ids = resolved_imports
        .iter()
        .map(|(_, import)| PathBuf::from(&import.absolute))
        .collect();
    let rewritten_code = rewrite_imports(&code, &resolved_imports).map_err(|span| {
        vec![ResolveImportsError::InvalidImportSpan {
            context_path: path.clone(),
            span,
        }]
    })?;

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn invalid_literal_spans_return_the_offending_range() {
        let code = "'é' \"b\"";
        let import = ResolvedImport {
            original: "b".into(),
            absolute: "/b".into(),
            updated: "/b".into(),
        };
        for (start, end) in [
            (0, usize::MAX),
            (usize::MAX, usize::MAX),
            (3, 2),
            (1, 2),
            (0, 0),
            (0, 1),
            (0, 7),
        ] {
            let range = start..end;
            assert_eq!(
                rewrite_imports(code, &[(range.clone(), import.clone())]),
                Err(range)
            );
        }
        let repeated = [(5..8, import.clone()), (0..4, import)];
        assert_eq!(rewrite_imports(code, &repeated), Err(0..4));
    }
}
