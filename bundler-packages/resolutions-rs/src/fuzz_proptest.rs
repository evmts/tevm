use crate::resolve_imports::{resolve_imports_detailed, ResolveImportsError};
use crate::{resolve_import_path, resolve_imports, Config};
use proptest::prelude::*;
use proptest::test_runner::RngSeed;
use std::collections::HashSet;
use std::path::{Component, Path, PathBuf};

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
    #![proptest_config(ProptestConfig { cases: 1024, rng_seed: RngSeed::Fixed(0x501a03), ..ProptestConfig::default() })]

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
        prop_assert!(
            resolved.is_ok(),
            "relative path should always normalize: {}",
            import_path
        );
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
        let resolved =
            resolve_import_path(PathBuf::from("/workspace/src/Main.sol"), &import_path, &cfg);
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
            (d, u) => prop_assert!(
                false,
                "detailed/deduped disagreed: {:?} vs {:?}",
                d.is_ok(),
                u.is_ok()
            ),
        }
    }
}

fn mapped_config(base: &Path) -> Config {
    Config::from((None, Some(vec![("@pkg/".to_owned(), base.to_owned())])))
}

fn directives() -> impl Strategy<Value = Vec<(String, String)>> {
    prop::collection::vec(
        (
            prop_oneof![Just("./"), Just("../"), Just("@pkg/")],
            "[a-d]{1,3}",
            0..4u8,
            prop_oneof![
                Just(" "),
                Just("\n"),
                Just(" /* gap */ "),
                Just(" // gap\n")
            ],
            prop_oneof![Just("'"), Just("\"")],
        )
            .prop_map(|(prefix, stem, form, gap, quote)| {
                let path = format!("{prefix}{stem}.sol");
                let lit = format!("{quote}{path}{quote}");
                let clause = match form {
                    0 => lit,
                    1 => format!("{lit}{gap}as{gap}Alias"),
                    2 => format!("*{gap}as{gap}Alias{gap}from{gap}{lit}"),
                    _ => format!("{{A{gap}as{gap}B,{gap}C}}{gap}from{gap}{lit}"),
                };
                (
                    format!("// import './decoy.sol';\nimport{gap}{clause};\n"),
                    path,
                )
            }),
        1..7,
    )
}

proptest! {
    #![proptest_config(ProptestConfig { cases: 1024, rng_seed: RngSeed::Fixed(0x501a04), ..ProptestConfig::default() })]

    #[test]
    fn solar_resolves_real_directives_in_source_order(items in directives()) {
        let root = Path::new("/project");
        let context = root.join("src/Main.sol");
        let cfg = mapped_config(&root.join("lib"));
        let mut code = String::from("/* import '@pkg/unused.sol'; */\n");
        let mut originals = Vec::new();
        let mut paths = Vec::new();
        for (statement, path) in items.iter().chain(items.first()) {
            code.push_str(statement);
            let (base, file) = path.rsplit_once('/').unwrap();
            let dir = match base {
                "." => root.join("src"),
                ".." => root.to_owned(),
                _ => root.join("lib"),
            };
            paths.push(dir.join(file));
            originals.push(path.as_str());
        }
        let detailed = resolve_imports_detailed(&context, &code, &cfg).unwrap();
        prop_assert_eq!(
            detailed
                .iter()
                .map(|i| i.original.as_str())
                .collect::<Vec<_>>(),
            originals
        );
        prop_assert_eq!(
            detailed
                .iter()
                .map(|i| PathBuf::from(&i.absolute))
                .collect::<Vec<_>>(),
            &paths[..]
        );
        prop_assert!(detailed.iter().all(|i| i.updated == i.absolute));
        let mut seen = HashSet::new();
        paths.retain(|p| seen.insert(p.clone()));
        prop_assert_eq!(resolve_imports(&context, &code, &cfg).unwrap(), paths);
    }

    #[test]
    fn remapped_suffix_stays_within_its_target(
        parts in prop::collection::vec(prop_oneof![Just("."), Just(".."), Just("a"), Just("b")], 0..12)
    ) {
        let base = Path::new("/project/lib/pkg");
        let import = format!("@pkg/{}", parts.join("/"));
        let mut stack = Vec::new();
        let mut escapes = false;
        for part in parts {
            match part {
                "." => (),
                ".." if stack.pop().is_none() => {
                    escapes = true;
                    break;
                }
                ".." => (),
                other => stack.push(other),
            }
        }
        let resolve = || {
            resolve_import_path(
                "/project/src/Main.sol".into(),
                &import,
                &mapped_config(base),
            )
        };
        if escapes {
            prop_assert!(resolve().is_err());
        } else {
            let expected = base.join(stack.iter().collect::<PathBuf>());
            prop_assert_eq!(&resolve().unwrap(), &expected);
            prop_assert_eq!(resolve().unwrap(), expected);
        }
    }

    #[test]
    fn source_bytes_follow_utf8_file_boundary(
        bytes in prop_oneof![
            prop::collection::vec(any::<u8>(), 0..100),
            (directives(), 0..128usize).prop_map(|(items, cut)| {
                let mut bytes = items[0].0.as_bytes().to_vec();
                bytes.truncate(cut);
                bytes
            }),
            prop::sample::select(vec![b"import \"./A".to_vec(), b"\0".to_vec(), vec![0xf0, 0x9f, 0xa6],
                b"import '\0';".to_vec(), "/* λ */ import './A.sol';".as_bytes().to_vec()])
        ]
    ) {
        let dir = tempfile::tempdir().unwrap();
        let file = dir.path().join("Main.sol");
        std::fs::write(&file, &bytes).unwrap();
        let read = crate::TOKIO.block_on(crate::read_file(file.clone()));
        match std::str::from_utf8(&bytes) {
            Err(_) => prop_assert_eq!(read.unwrap_err().kind(), std::io::ErrorKind::InvalidData),
            Ok(source) => {
                let (_, text) = read.unwrap();
                prop_assert_eq!(&text, source);
                let parse = || {
                    resolve_imports(&file, &text, &empty_config())
                        .map_err(|errs| errs.iter().map(std::mem::discriminant).collect::<Vec<_>>())
                };
                prop_assert_eq!(parse(), parse());
            }
        }
    }

    #[test]
    fn escaped_import_bytes_resolve_as_utf8(bytes in prop::collection::vec(any::<u8>(), 1..16)) {
        let escaped: String = bytes.iter().map(|b| format!("\\x{b:02x}")).collect();
        let source = format!("import './{escaped}.sol';");
        let ctx = Path::new("/project/Main.sol");
        let parsed = resolve_imports(ctx, &source, &empty_config());
        match std::str::from_utf8(&bytes) {
            Ok(name) if !name.contains('\0') => {
                let expected =
                    resolve_import_path(ctx.to_owned(), &format!("./{name}.sol"), &empty_config())
                        .unwrap();
                prop_assert_eq!(parsed.unwrap(), vec![expected]);
            }
            _ => prop_assert!(parsed.is_err()),
        }
    }

    #[test]
    fn module_rewrites_only_the_import_literals(items in directives()) {
        let ctx = Path::new("/project/src/Main.sol");
        let cfg = mapped_config(Path::new("/project/lib"));
        let mut input = String::from("// λ\r\n");
        let mut expected = input.clone();
        for (statement, original) in items {
            let comment = format!("/* import '{original}'; */\r\n");
            let absolute = resolve_import_path(ctx.to_owned(), &original, &cfg).unwrap();
            let updated = absolute.to_str().unwrap().replace('\\', "\\\\");
            input.push_str(&comment);
            input.push_str(&statement);
            expected.push_str(&comment);
            expected.push_str(&statement.replace(&original, &updated));
        }
        let module = process_source(ctx, &input, &cfg);
        prop_assert_eq!(module.code, expected);
        prop_assert_eq!(module.raw_code, input);
    }

    #[test]
    fn nul_in_import_paths_is_an_error(stem in "[a-z]{0,12}", mapped in any::<bool>()) {
        let prefix = if mapped { "@pkg/" } else { "./" };
        let path = format!("{prefix}{stem}\0.sol");
        let ctx = Path::new("/project/Main.sol");
        let cfg = mapped_config(Path::new("/project/lib"));
        prop_assert!(resolve_import_path(ctx.to_owned(), &path, &cfg).is_err());
        let source = format!("import '{path}';");
        prop_assert!(resolve_imports(ctx, &source, &cfg).is_err());
    }

    #[test]
    fn unterminated_import_is_a_parse_error(stem in ident_strategy(), quote in prop_oneof![Just("'"), Just("\"")]) {
        let ctx = Path::new("/project/Broken.sol");
        let code = format!("import {quote}./{stem}");
        let errors = resolve_imports(ctx, &code, &empty_config()).unwrap_err();
        prop_assert!(
            matches!(errors.as_slice(), [ResolveImportsError::ParseError { context_path, .. }] if context_path == ctx),
            "expected a parse error for the input file"
        );
    }
}

fn process_source(path: &Path, source: &str, cfg: &Config) -> crate::ModuleInfo {
    crate::TOKIO.block_on(async {
        let state = crate::state::State::new(1);
        let permit = state.sem.clone().acquire_owned().await.unwrap();
        let id = crate::process_module::process_module(
            &path.to_owned(),
            Some(source.to_owned()),
            cfg,
            state.clone(),
            permit,
        )
        .await
        .unwrap();
        let info = state.graph.lock().await[&id].clone();
        info
    })
}

#[test]
fn comment_with_the_same_import_is_preserved() {
    let module = process_source(
        Path::new("/project/Main.sol"),
        "// import './A';\nimport/**/'./A';",
        &empty_config(),
    );
    let path = Path::new("/project").join("A");
    let escaped = path.to_string_lossy().replace('\\', "\\\\");
    assert_eq!(
        module.code,
        format!("// import './A';\nimport/**/'{escaped}';")
    );
}

#[test]
fn escaped_import_matches_solc_source_unit_name() {
    let resolved = resolve_imports(
        Path::new("/project/Main.sol"),
        r"import './\x41.sol';",
        &empty_config(),
    )
    .unwrap();
    assert_eq!(resolved, [PathBuf::from("/project/A.sol")]);
}

#[test]
fn reparse_same_filename_uses_current_source() {
    let ctx = Path::new("/project/Edit.sol");
    let cfg = empty_config();
    assert!(resolve_imports(ctx, "", &cfg).unwrap().is_empty());
    assert_eq!(
        resolve_imports(ctx, "import './B.sol';", &cfg).unwrap(),
        [PathBuf::from("/project/B.sol")]
    );
}

#[test]
fn remapping_rejects_parent_at_target_root() {
    let cfg = mapped_config(Path::new("/project/lib"));
    assert!(resolve_import_path("/project/Main.sol".into(), "@pkg/..", &cfg).is_err());
}

fn check_graph(edges: &[Vec<usize>]) -> Result<(), TestCaseError> {
    let dir = tempfile::tempdir().unwrap();
    let path = |i| dir.path().join(format!("M{i}.sol"));
    let source = |i: usize| {
        edges[i]
            .iter()
            .map(|j| format!("import './M{j}.sol';\n"))
            .collect::<String>()
    };
    for i in 0..edges.len() {
        std::fs::write(path(i), source(i)).unwrap();
    }
    let mut reachable = HashSet::new();
    let mut pending = vec![0];
    while let Some(i) = pending.pop() {
        if reachable.insert(i) {
            pending.extend(&edges[i]);
        }
    }

    let graph = crate::TOKIO
        .block_on(async {
            tokio::time::timeout(
                std::time::Duration::from_secs(3),
                crate::module_factory(path(0), &source(0), empty_config()),
            )
            .await
        })
        .map_err(|_| TestCaseError::fail("module graph traversal timed out"))?
        .unwrap();
    prop_assert_eq!(graph.len(), reachable.len());
    for i in reachable {
        let module = &graph[path(i).to_str().unwrap()];
        let expected: Vec<_> = edges[i].iter().map(|j| path(*j)).collect();
        prop_assert_eq!(&module.imported_ids, &expected);
    }
    Ok(())
}

proptest! {
    #![proptest_config(ProptestConfig { cases: 256, rng_seed: RngSeed::Fixed(0x501a05), ..ProptestConfig::default() })]
    #[test]
    fn node_package_import_resolves_to_the_fixture(
        scope in prop::option::of("[a-z]{1,6}"), stem in "[a-z]{1,8}",
        from_library in any::<bool>(), by_main in any::<bool>()
    ) {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path();
        let context = root.join("src/Main.sol");
        std::fs::create_dir(root.join("src")).unwrap();
        let package = format!(
            "{}test-{stem}",
            scope.map(|s| format!("@{s}/")).unwrap_or_default()
        );
        let search = if from_library {
            root.join("library")
        } else {
            root.to_owned()
        };
        let package_dir = search.join("node_modules").join(&package);
        std::fs::create_dir_all(&package_dir).unwrap();
        let target = package_dir.join("Token.sol");
        std::fs::write(&target, "contract Token {}").unwrap();
        std::fs::write(package_dir.join("package.json"), r#"{"main":"Token.sol"}"#).unwrap();
        let path = if by_main {
            package
        } else {
            format!("{package}/Token.sol")
        };
        let source = format!("import {{Token as T}} from '{path}';");
        let cfg = Config::from((Some(vec![search]), None));
        let expected = target.canonicalize().unwrap();
        prop_assert_eq!(
            resolve_imports(&context, &source, &cfg).unwrap(),
            vec![expected]
        );
    }

    #[test]
    fn cyclic_graph_terminates_with_exact_reachable_edges(
        edges in (1..5usize).prop_flat_map(|n|
            prop::collection::vec(prop::collection::vec(0..n, 0..4), n))
    ) {
        check_graph(&edges)?;
    }
}

#[test]
fn self_import_terminates() {
    check_graph(&[vec![0]]).unwrap();
}

#[cfg(unix)]
#[test]
fn non_utf8_source_filename_returns_io_error() {
    use std::os::unix::ffi::OsStringExt;
    let path = PathBuf::from(std::ffi::OsString::from_vec(vec![0xff]));
    assert_eq!(
        crate::TOKIO
            .block_on(crate::read_file(path))
            .unwrap_err()
            .kind(),
        std::io::ErrorKind::InvalidData
    );
}

#[test]
fn relative_import_rejects_nul() {
    assert!(resolve_imports(
        Path::new("/project/Main.sol"),
        r"import './\x00';",
        &empty_config()
    )
    .is_err());
    assert!(resolve_import_path("/project/Main.sol".into(), "./\0", &empty_config()).is_err());
}
