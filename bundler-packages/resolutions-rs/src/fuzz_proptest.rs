use crate::{resolve_import_path, resolve_imports, Config};
use proptest::prelude::*;
use std::collections::HashSet;
use std::path::{Component, PathBuf};

fn ident_strategy() -> impl Strategy<Value = String> {
    "[a-zA-Z_][a-zA-Z0-9_]{0,12}"
}

fn empty_config() -> Config {
    Config::from((
        Some(Vec::<String>::new()),
        Some(Vec::<(String, String)>::new()),
    ))
}

proptest! {
    #![proptest_config(ProptestConfig::with_cases(256))]

    #[test]
    fn fuzz_relative_import_path_never_panics_and_normalizes_dot_components(
        base_segments in prop::collection::vec(ident_strategy(), 1..5),
        rel_segments in prop::collection::vec(
            prop_oneof![
                Just(".".to_string()),
                Just("..".to_string()),
                ident_strategy(),
            ],
            1..8,
        ),
        use_parent_prefix in any::<bool>(),
    ) {
        let mut context = PathBuf::from("/");
        for seg in &base_segments {
            context.push(seg);
        }
        context.push("Contract.sol");

        let prefix = if use_parent_prefix { "../" } else { "./" };
        let import_path = format!("{}{}.sol", prefix, rel_segments.join("/"));
        let cfg = empty_config();

        let resolved = resolve_import_path(context, &import_path, &cfg);
        prop_assert!(resolved.is_ok(), "relative path should always normalize: {}", import_path);
        let path = resolved.unwrap();
        for comp in path.components() {
            prop_assert!(
                !matches!(comp, Component::CurDir | Component::ParentDir),
                "normalized path must not contain '.' or '..': {:?}",
                path
            );
        }
    }

    #[test]
    fn fuzz_remapping_prefix_always_rewrites_deterministically(
        prefix in "[a-z@][a-z0-9_-]{1,10}/",
        target in "/[a-z]{1,8}/[a-z]{1,8}",
        tail in "[a-zA-Z0-9_/-]{1,20}\\.sol",
    ) {
        let cfg = Config::from((
            Some(Vec::<String>::new()),
            Some(vec![(prefix.clone(), target.clone())]),
        ));
        let import_path = format!("{}{}", prefix, tail);
        let resolved = resolve_import_path(PathBuf::from("/workspace/src/Main.sol"), &import_path, &cfg);
        prop_assert!(resolved.is_ok());
        let path = resolved.unwrap();
        let expected_tail = tail.trim_start_matches(&['/', '\\'][..]);
        prop_assert_eq!(path, PathBuf::from(&target).join(expected_tail));
    }

    #[test]
    fn fuzz_resolve_imports_arbitrary_source_never_panics_and_deduplicates(
        code in prop_oneof![
            ".{0,200}",
            prop::collection::vec(ident_strategy(), 0..6).prop_map(|names| {
                names
                    .into_iter()
                    .map(|n| format!("import \"./{}.sol\";", n))
                    .collect::<Vec<_>>()
                    .join("\n")
            }),
        ]
    ) {
        let cfg = empty_config();
        let ctx = PathBuf::from("/tmp/tevm_fuzz_nonexistent/Main.sol");
        let detailed = crate::resolve_imports::resolve_imports_detailed(&ctx, &code, &cfg);
        let deduped = resolve_imports(&ctx, &code, &cfg);
        match (detailed, deduped) {
            (Ok(all), Ok(unique)) => {
                let unique_set: HashSet<_> = unique.iter().collect();
                prop_assert_eq!(unique_set.len(), unique.len());
                prop_assert!(unique.len() <= all.len());
            }
            (Err(_), Err(_)) => {}
            (d, u) => prop_assert!(false, "detailed/deduped disagreed: {:?} vs {:?}", d.is_ok(), u.is_ok()),
        }
    }
}
