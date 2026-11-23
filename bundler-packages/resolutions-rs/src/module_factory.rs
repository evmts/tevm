use crate::models::ModuleInfo;
use crate::process_module::process_module;
use crate::resolve_imports::ResolveImportsError;
use crate::state::State;
use crate::Config;
use futures::{stream::FuturesUnordered, StreamExt};
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use tokio::task;

fn get_max_concurrent_reads() -> usize {
    // 1) Base it on CPU count
    let cores = num_cpus::get();

    // 2) On Unix, also factor in the file descriptor limit
    #[cfg(unix)]
    {
        // Safety: calling libc getrlimit is safe if arguments are valid
        unsafe {
            let mut lim = libc::rlimit {
                rlim_cur: 0,
                rlim_max: 0,
            };
            if libc::getrlimit(libc::RLIMIT_NOFILE, &mut lim) == 0 {
                let fd_limit = lim.rlim_cur as usize;
                // compute 2×cores, cap at fd_limit/4, ensure at least 2
                return std::cmp::min(cores * 2, fd_limit / 4).max(2);
            }
        }
    }

    // 3) Fallback for Unix if getrlimit failed, or non-Unix platforms
    (cores * 2).max(2)
}

/// Creates a module map by processing a source file and all its imports recursively with maximum concurrency
///
/// This function processes a source file and all of its imported dependencies concurrently,
/// creating a map of absolute file paths to ModuleInfo objects containing the source code
/// and list of imported dependencies for each module.
///
/// # Arguments
/// * `absolute_path` - The absolute path of the entry file to process
/// * `raw_code` - The source code of the entry file
/// * `remappings` - Map of import path prefixes to replacement values
/// * `libs` - Additional library paths to search for imports
///
/// # Returns
/// * `Ok(HashMap<String, ModuleInfo>)` - Map of absolute file paths to module information
/// * `Err(Vec<ModuleResolutionError>)` - Collection of errors encountered during processing
pub async fn module_factory(
    entrypoint_path: PathBuf,
    raw_code: &str,
    cfg: Config,
) -> Result<HashMap<String, ModuleInfo>, Vec<ResolveImportsError>> {
    let state = State::new(get_max_concurrent_reads());

    let entrypoint_id = process_module(
        &entrypoint_path.to_path_buf(),
        Some(raw_code.to_string()),
        &cfg,
        state.clone(),
        state.sem.clone().acquire_owned().await.unwrap(),
    )
    .await?;

    let mut scheduled = HashSet::from([entrypoint_path.clone()]);
    let mut in_flight = FuturesUnordered::new();
    let mut completed = entrypoint_id;
    loop {
        // Release the graph lock before waiting for any I/O permits.
        let imports = state
            .graph
            .lock()
            .await
            .get(&completed)
            .ok_or_else(|| {
                vec![ResolveImportsError::ReadError {
                    context_path: PathBuf::from(&completed),
                    message: "Completed module is missing from the import graph".into(),
                }]
            })?
            .imported_ids
            .clone();
        for path in imports {
            if scheduled.insert(path.clone()) {
                let permit = state.sem.clone().acquire_owned().await.unwrap();
                let state = state.clone();
                let cfg = cfg.clone();
                in_flight.push(task::spawn(async move {
                    process_module(&path, None, &cfg, state, permit).await
                }));
            }
        }

        let Some(joined) = in_flight.next().await else {
            break;
        };
        completed = joined.map_err(|err| {
            vec![ResolveImportsError::ReadError {
                context_path: entrypoint_path.clone(),
                message: format!("Module task failed: {err}"),
            }]
        })??;
    }

    let out = state.graph.lock().await.clone();
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::Path;
    use tempfile::tempdir;

    fn setup(root: &Path, files: &[(&str, &str)]) {
        for (name, code) in files {
            let path = root.join(name);
            fs::create_dir_all(path.parent().unwrap()).unwrap();
            fs::write(path, code).unwrap();
        }
    }

    fn config() -> Config {
        Config::from((None::<Vec<PathBuf>>, None))
    }

    // Each fixture specifies the exact sources and edges expected in the module graph.
    async fn assert_graph(root: &Path, files: &[(&str, &str, &[&str])], cfg: Config) {
        let paths: Vec<_> = files.iter().map(|(name, code, _)| (*name, *code)).collect();
        setup(root, &paths);
        let (entry, code, _) = files[0];
        let graph = module_factory(root.join(entry), code, cfg).await.unwrap();
        assert_eq!(graph.len(), files.len());
        for (name, code, imports) in files {
            let path = root.join(name);
            let info = &graph[path.to_str().unwrap()];
            assert_eq!(&info.raw_code, code);
            let expected: Vec<_> = imports.iter().map(|name| root.join(name)).collect();
            assert_eq!(info.imported_ids, expected);
            if imports.is_empty() {
                assert_eq!(&info.code, code);
            }
        }
    }

    #[tokio::test]
    async fn test_basic_module_factory() {
        let dir = tempdir().unwrap();
        let root = dir.path().canonicalize().unwrap();
        let entry = root.join("Main.sol");
        let helper = root.join("utils/Helper.sol");
        let code = "import './utils/Helper.sol'; contract Main {}";
        setup(&root, &[("utils/Helper.sol", "contract Helper {}")]);
        let graph = module_factory(entry.clone(), code, config()).await.unwrap();
        assert_eq!(graph.len(), 2);
        let main = &graph[entry.to_str().unwrap()];
        assert_eq!(main.raw_code, code);
        assert_eq!(main.imported_ids, std::slice::from_ref(&helper));
        assert_eq!(
            main.code,
            format!(
                "import '{}'; contract Main {{}}",
                helper.display().to_string().replace('\\', "\\\\")
            )
        );
        assert_eq!(graph[helper.to_str().unwrap()].code, "contract Helper {}");
    }

    #[tokio::test]
    async fn test_multilevel_imports_and_paths_with_spaces() {
        let dir = tempdir().unwrap();
        assert_graph(
            &dir.path().canonicalize().unwrap(),
            &[
                ("Main.sol", "import './lib/A.sol';", &["lib/A.sol"]),
                (
                    "lib/A.sol",
                    "import './nested/B.sol';",
                    &["lib/nested/B.sol"],
                ),
                (
                    "lib/nested/B.sol",
                    "import '../with spaces/C.sol';",
                    &["lib/with spaces/C.sol"],
                ),
                ("lib/with spaces/C.sol", "contract C {}", &[]),
            ],
            config(),
        )
        .await;
    }

    #[tokio::test]
    async fn test_cyclic_imports() {
        let dir = tempdir().unwrap();
        assert_graph(
            &dir.path().canonicalize().unwrap(),
            &[
                ("Main.sol", "import './A.sol';", &["A.sol"]),
                ("A.sol", "import './B.sol';", &["B.sol"]),
                ("B.sol", "import './A.sol';", &["A.sol"]),
            ],
            config(),
        )
        .await;
    }

    #[tokio::test]
    async fn test_with_remappings() {
        let dir = tempdir().unwrap();
        let root = dir.path().canonicalize().unwrap();
        setup(&root, &[("lib/pkg/v2/B.sol", "contract Wrong {}")]);
        let mut mappings = vec![
            ("pkg/".into(), root.join("lib/pkg")),
            ("pkg/v2/".into(), root.join("custom")),
        ];
        for _ in 0..2 {
            let cfg = Config::from((None, Some(mappings.clone())));
            assert_graph(
                &root,
                &[
                    (
                        "Main.sol",
                        "import 'pkg/A.sol'; import 'pkg/v2/B.sol';",
                        &["lib/pkg/A.sol", "custom/B.sol"],
                    ),
                    ("lib/pkg/A.sol", "contract A {}", &[]),
                    ("custom/B.sol", "contract B {}", &[]),
                ],
                cfg,
            )
            .await;
            mappings.reverse();
        }
    }

    #[tokio::test]
    async fn test_with_library_paths() {
        let dir = tempdir().unwrap();
        let root = dir.path().canonicalize().unwrap();
        let cfg = Config::from((Some(vec![root.join("lib")]), None));
        assert_graph(
            &root,
            &[
                (
                    "src/Main.sol",
                    "import 'external/Module.sol'; import 'pkg/C.sol';",
                    &["lib/external/Module.sol", "node_modules/pkg/C.sol"],
                ),
                ("lib/external/Module.sol", "contract M {}", &[]),
                ("node_modules/pkg/C.sol", "contract C {}", &[]),
            ],
            cfg,
        )
        .await;
    }

    #[tokio::test]
    async fn test_nonexistent_imports() {
        let dir = tempdir().unwrap();
        let err = module_factory(
            dir.path().join("Main.sol"),
            "import './missing.sol';",
            config(),
        )
        .await
        .unwrap_err();
        assert!(
            matches!(&err[..], [ResolveImportsError::ReadError { context_path, .. }] if *context_path == dir.path().join("missing.sol"))
        );
    }

    #[tokio::test]
    async fn test_empty_code() {
        let dir = tempdir().unwrap();
        assert_graph(dir.path(), &[("Main.sol", "", &[])], config()).await;
    }
}
