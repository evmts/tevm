use std::{path::PathBuf, sync::Arc};

#[derive(Clone)]
pub struct Config {
    pub libs: Arc<Vec<PathBuf>>,
    /// Non-relative imports use the longest matching prefix. The first identical prefix wins.
    pub remappings: Arc<Vec<(String, PathBuf)>>,
}

impl From<(Option<Vec<PathBuf>>, Option<Vec<(String, PathBuf)>>)> for Config {
    fn from(data: (Option<Vec<PathBuf>>, Option<Vec<(String, PathBuf)>>)) -> Self {
        let (libs, remappings) = data;
        let mut remappings = remappings.unwrap_or_default();
        // Stable sorting preserves the first configured target for duplicate prefixes.
        remappings.sort_by_key(|(prefix, _)| std::cmp::Reverse(prefix.len()));
        Config {
            libs: Arc::new(libs.unwrap_or_default()),
            remappings: Arc::new(remappings),
        }
    }
}

impl From<(Option<Vec<String>>, Option<Vec<(String, String)>>)> for Config {
    fn from(data: (Option<Vec<String>>, Option<Vec<(String, String)>>)) -> Self {
        let (libs, remappings) = data;
        Config::from((
            libs.map(|paths| paths.into_iter().map(PathBuf::from).collect::<Vec<_>>()),
            remappings.map(|pairs| {
                pairs
                    .into_iter()
                    .map(|(k, v)| (k, PathBuf::from(v)))
                    .collect()
            }),
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn both_constructors_sort_prefixes_stably() {
        let strings = vec![
            ("pkg/".to_owned(), "base".to_owned()),
            ("pkg/sub/".to_owned(), "first".to_owned()),
            ("pkg/sub/".to_owned(), "second".to_owned()),
        ];
        let paths: Vec<_> = strings
            .iter()
            .map(|(k, v)| (k.clone(), PathBuf::from(v)))
            .collect();
        let expected = [&paths[1], &paths[2], &paths[0]];
        for cfg in [
            Config::from((None, Some(strings))),
            Config::from((None, Some(paths.clone()))),
        ] {
            assert_eq!(cfg.remappings.iter().collect::<Vec<_>>(), expected);
        }
    }
}
