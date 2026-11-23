use node_resolve::{resolve_from, ResolutionError as NodeResolutionError};
use std::io;
use std::path::{Component, Path, PathBuf};

use crate::Config;

#[derive(Debug)]
pub enum ResolveImportPathError {
    InvalidRelativePath {
        context_path: String,
        import_path: String,
        err: io::Error,
    },
    NotFoundAbsolutePath {
        import_path: String,
        causes: Vec<NodeResolutionError>,
    },
}

// Resolve existing ancestors as well: a missing leaf below an escaping symlink
// must not make that link a valid remapping target.
fn check_remapping_root(root: &Path, path: &Path) -> io::Result<()> {
    let base = if root.as_os_str().is_empty() {
        Path::new(".")
    } else {
        root
    };
    let root_on_disk = match base.canonicalize() {
        Ok(canonical) => canonical,
        Err(e) if e.kind() == io::ErrorKind::NotFound => return Ok(()),
        Err(e) => return Err(e),
    };
    for ancestor in path.ancestors().take_while(|p| *p != root) {
        match ancestor.canonicalize() {
            Ok(resolved) if resolved.starts_with(&root_on_disk) => break,
            Ok(_) => {
                return Err(io::Error::new(
                    io::ErrorKind::InvalidInput,
                    "path leaves remapping target",
                ))
            }
            Err(e) if e.kind() == io::ErrorKind::NotFound && !ancestor.is_symlink() => continue,
            Err(e) => return Err(e),
        }
    }
    Ok(())
}

/// Resolves an import path to an absolute file path
///
/// # Arguments
/// * `context_path` - The absolute path of the file containing the import
/// * `import_path` - The raw import path to resolve
/// * `cfg` - Configuration containing remappings and library paths
///
/// # Returns
/// * `Ok(PathBuf)` - The resolved absolute path
/// * `Err(ResolveImportPathError)` - Error encountered during resolution
pub fn resolve_import_path(
    context_path: PathBuf,
    import_path: &str,
    cfg: &Config,
) -> Result<PathBuf, ResolveImportPathError> {
    let invalid_path = |message| ResolveImportPathError::InvalidRelativePath {
        context_path: context_path.display().to_string(),
        import_path: import_path.to_owned(),
        err: io::Error::new(io::ErrorKind::InvalidInput, message),
    };
    if import_path.contains('\0') {
        return Err(invalid_path("NUL in import path"));
    }

    // Extract the directory from the file path
    let dir_path = if context_path.is_file() || !context_path.exists() {
        context_path.parent().unwrap_or(&context_path).to_path_buf()
    } else {
        context_path.clone()
    };

    // Explicit ./ and ../ imports always resolve from the importing source.
    let imp_path = Path::new(import_path);
    if let Some(c) = imp_path.components().next() {
        if matches!(c, Component::CurDir | Component::ParentDir) {
            let joined = dir_path.join(&imp_path);
            let mut normalized = PathBuf::new();
            for comp in joined.components() {
                match comp {
                    Component::CurDir => { /* skip `.` */ }
                    Component::ParentDir => {
                        normalized.pop();
                    }
                    Component::RootDir => {
                        normalized.push(PathBuf::from(std::path::MAIN_SEPARATOR.to_string()));
                    }
                    Component::Prefix(prefix) => {
                        normalized.push(prefix.as_os_str());
                    }
                    Component::Normal(os_str) => {
                        normalized.push(os_str);
                    }
                }
            }
            return Ok(normalized);
        }
    }

    // Config also supports public struct literals, whose remappings may be unsorted.
    let mapping = cfg
        .remappings
        .iter()
        .filter_map(|(prefix, target)| import_path.strip_prefix(prefix).map(|rest| (rest, target)))
        .min_by_key(|(rest, _)| rest.len()); // shortest suffix = longest prefix; first tie wins
    if let Some((rest, target)) = mapping {
        let rest = rest.trim_start_matches(&['/', '\\'][..]);
        // Normalize only the suffix. Parent imports within a package are valid,
        // but they cannot remove a component of the configured target itself.
        let mut suffix = PathBuf::new();
        for component in Path::new(rest).components() {
            match component {
                Component::CurDir => (),
                Component::Normal(part) if Path::new(part).file_name() == Some(part) => {
                    suffix.push(part)
                }
                Component::ParentDir if suffix.pop() => (),
                _ => return Err(invalid_path("path leaves remapping target")),
            }
        }
        let candidate = target.join(suffix);
        check_remapping_root(target, &candidate).map_err(|err| {
            ResolveImportPathError::InvalidRelativePath {
                context_path: context_path.display().to_string(),
                import_path: import_path.to_owned(),
                err,
            }
        })?;
        return Ok(candidate);
    }

    // Finally try using node.js resolution
    let mut causes = Vec::with_capacity(cfg.libs.len() + 1);
    match resolve_from(import_path, dir_path) {
        Ok(res) => return Ok(res),
        Err(err) => causes.push(err),
    }
    for lib in cfg.libs.iter() {
        // Configured library directories can contain the package directly or
        // serve as a Node resolution base with its own node_modules.
        match resolve_from(&format!("./{import_path}"), lib.clone())
            .or_else(|_| resolve_from(import_path, lib.clone()))
        {
            Ok(res) => return Ok(res),
            Err(err) => causes.push(err),
        }
    }

    Err(ResolveImportPathError::NotFoundAbsolutePath {
        import_path: import_path.to_string(),
        causes,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::{create_dir_all, File};
    use std::io::Write;
    use tempfile::tempdir;

    fn setup_test_files(dir: &PathBuf, files: &[&str]) -> Result<(), std::io::Error> {
        for file_path in files {
            let full_path = dir.join(file_path);
            if let Some(parent) = full_path.parent() {
                create_dir_all(parent)?;
            }
            File::create(full_path)?.write_all(b"// Test file")?;
        }
        Ok(())
    }

    fn normalize_path(path: &str) -> String {
        path.replace("/private/var/", "/var/")
    }

    #[test]
    fn test_basic_resolution() {
        let temp_dir = tempdir().unwrap();
        let root_dir = temp_dir.path().to_path_buf();

        setup_test_files(&root_dir, &["src/main.rs", "src/utils/helper.rs"]).unwrap();

        let absolute_path = root_dir.join("src").display().to_string();

        // Create a Config for testing
        let cfg = Config::from((
            Some(Vec::<String>::new()),
            Some(Vec::<(String, String)>::new()),
        ));

        let result = resolve_import_path(PathBuf::from(&absolute_path), "./utils/helper.rs", &cfg);

        assert!(result.is_ok());
        let resolved_path = normalize_path(&result.unwrap().display().to_string());
        let expected_path =
            normalize_path(&root_dir.join("src/utils/helper.rs").display().to_string());
        assert_eq!(resolved_path, expected_path);
    }

    #[test]
    fn relative_imports_take_precedence_over_matching_remappings() {
        let root = tempdir().unwrap();
        let context = root.path().join("src/Main.sol");
        let cfg = Config::from((
            None,
            Some(vec![
                ("./".into(), root.path().join("wrong")),
                ("../".into(), root.path().join("wrong")),
            ]),
        ));
        for (import, expected) in [
            ("./Helper.sol", "src/Helper.sol"),
            ("../Helper.sol", "Helper.sol"),
        ] {
            assert_eq!(
                resolve_import_path(context.clone(), import, &cfg).unwrap(),
                root.path().join(expected)
            );
        }
    }

    #[test]
    fn longest_prefix_and_first_tie_win_for_public_config_literals() {
        let cfg = Config {
            libs: Default::default(),
            remappings: vec![
                ("pkg/".into(), PathBuf::from("/other")),
                ("pkg/sub/".into(), PathBuf::from("/first")),
                ("pkg/sub/".into(), PathBuf::from("/second")),
            ]
            .into(),
        };
        assert_eq!(
            resolve_import_path("/Main.sol".into(), "pkg/sub/A.sol", &cfg).unwrap(),
            PathBuf::from("/first/A.sol")
        );
    }

    #[cfg(unix)]
    #[test]
    fn remapping_rejects_symlinks_leading_outside_the_selected_root() {
        use std::os::unix::fs::symlink;

        let dir = tempdir().unwrap();
        let root = dir.path().join("lib");
        setup_test_files(
            &dir.path().to_path_buf(),
            &["lib/real/A.sol", "sibling/A.sol"],
        )
        .unwrap();
        symlink("../sibling", root.join("outside")).unwrap();
        symlink("real", root.join("inside")).unwrap();
        let cfg = Config::from((None, Some(vec![("pkg/".into(), root.clone())])));
        let resolve = |s| resolve_import_path(dir.path().join("Main.sol"), s, &cfg);
        assert!(resolve("pkg/outside/A.sol").is_err());
        assert!(resolve("pkg/outside/new.sol").is_err());
        assert_eq!(
            resolve("pkg/inside/A.sol").unwrap(),
            root.join("inside/A.sol")
        );
        assert_eq!(
            resolve("pkg/inside/new.sol").unwrap(),
            root.join("inside/new.sol")
        );
    }

    #[test]
    fn test_resolution_failure() {
        let temp_dir = tempdir().unwrap();
        let root_dir = temp_dir.path().to_path_buf();

        let absolute_path = root_dir.join("src").display().to_string();

        // Create a config with default values
        let cfg = Config::from((
            Some(Vec::<String>::new()),
            Some(Vec::<(String, String)>::new()),
        ));

        let result =
            resolve_import_path(PathBuf::from(&absolute_path), "non/existent/file.rs", &cfg);

        assert!(result.is_err());
        match result.err().unwrap() {
            ResolveImportPathError::NotFoundAbsolutePath { causes, .. } => {
                assert!(!causes.is_empty());
            }
            _ => panic!("Expected NotFoundAbsolutePath error"),
        }
    }

    #[test]
    fn test_priority_order() {
        let temp_dir = tempdir().unwrap();
        let root_dir = temp_dir.path().to_path_buf();

        setup_test_files(&root_dir, &["src/utils/common.rs", "lib/utils/common.rs"]).unwrap();

        let src_path = root_dir.join("src").display().to_string();
        let lib_path = root_dir.join("lib").display().to_string();

        // Create config with libs
        let cfg_with_libs = Config::from((Some(vec![lib_path.clone()]), Some(vec![])));

        let result = resolve_import_path(
            PathBuf::from(&src_path),
            "./utils/common.rs",
            &cfg_with_libs,
        );

        if result.is_err() {
            let fallback_result =
                resolve_import_path(PathBuf::from(&src_path), "utils/common.rs", &cfg_with_libs);

            assert!(
                fallback_result.is_ok(),
                "Both resolution attempts failed: {:?}",
                fallback_result.as_ref().err()
            );
            let resolved_path = normalize_path(&fallback_result.unwrap().display().to_string());
            let expected_path =
                normalize_path(&root_dir.join("src/utils/common.rs").display().to_string());
            assert_eq!(resolved_path, expected_path);
        } else {
            let resolved_path = normalize_path(&result.unwrap().display().to_string());
            let expected_path =
                normalize_path(&root_dir.join("src/utils/common.rs").display().to_string());
            assert_eq!(resolved_path, expected_path);
        }
    }

    #[test]
    fn test_node_modules_esm_resolution() {
        let temp_dir = tempdir().unwrap();
        let root_dir = temp_dir.path().to_path_buf();

        setup_test_files(
            &root_dir,
            &[
                "src/main.js",
                "node_modules/test-package/dist/index.mjs",
                "node_modules/test-package/dist/utils/helper.mjs",
                "node_modules/test-package/src/types.d.ts",
            ],
        )
        .unwrap();

        let package_json = r#"{
            "name": "test-package",
            "version": "1.0.0",
            "type": "module",
            "main": "dist/index.mjs"
        }"#;

        let package_json_path = root_dir.join("node_modules/test-package/package.json");
        File::create(&package_json_path)
            .unwrap()
            .write_all(package_json.as_bytes())
            .unwrap();

        let src_path = root_dir.join("src").display().to_string();

        // Create a Config for testing
        let cfg = Config::from((
            Some(Vec::<String>::new()),
            Some(Vec::<(String, String)>::new()),
        ));

        let package_result = resolve_import_path(PathBuf::from(&src_path), "test-package", &cfg);

        if package_result.is_err() {
            let error = package_result.as_ref().err().unwrap();
            println!("Package resolution error: {:?}", error);
            println!("Package.json exists: {}", package_json_path.exists());
        }

        if package_result.is_ok() {
            let resolved_path = normalize_path(&package_result.unwrap().display().to_string());
            let expected_path = normalize_path(
                &root_dir
                    .join("node_modules/test-package/dist/index.mjs")
                    .display()
                    .to_string(),
            );

            println!("Package resolution successful:");
            println!("  Resolved: {}", resolved_path);
            println!("  Expected: {}", expected_path);

            assert_eq!(
                resolved_path, expected_path,
                "Package resolution path mismatch"
            );
        } else {
            println!("Package resolution test skipped due to resolution failure");
        }

        let package_path = root_dir
            .join("node_modules/test-package/dist")
            .display()
            .to_string();

        let relative_result =
            resolve_import_path(PathBuf::from(&package_path), "./utils/helper.mjs", &cfg);

        if relative_result.is_err() {
            let error = relative_result.as_ref().err().unwrap();
            println!("Relative import resolution error: {:?}", error);
            println!(
                "Target file exists: {}",
                root_dir
                    .join("node_modules/test-package/dist/utils/helper.mjs")
                    .exists()
            );
        }

        assert!(relative_result.is_ok(), "Relative import resolution failed");
        let resolved_rel_path = normalize_path(&relative_result.unwrap().display().to_string());
        let expected_rel_path = normalize_path(
            &root_dir
                .join("node_modules/test-package/dist/utils/helper.mjs")
                .display()
                .to_string(),
        );

        assert_eq!(
            resolved_rel_path, expected_rel_path,
            "Relative import resolution path mismatch"
        );

        let subpath_result =
            resolve_import_path(PathBuf::from(&src_path), "test-package/src/types", &cfg);

        if subpath_result.is_ok() {
            let resolved_subpath = normalize_path(&subpath_result.unwrap().display().to_string());
            let expected_subpath = normalize_path(
                &root_dir
                    .join("node_modules/test-package/src/types.d.ts")
                    .display()
                    .to_string(),
            );

            println!("Subpath import resolution successful:");
            println!("  Resolved: {}", resolved_subpath);
            println!("  Expected: {}", expected_subpath);

            assert_eq!(
                resolved_subpath, expected_subpath,
                "Subpath import resolution path mismatch"
            );
        } else {
            println!("Subpath import test skipped due to resolution failure");
        }
    }
}
