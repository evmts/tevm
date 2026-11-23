use std::path::PathBuf;
use tokio::fs::read_to_string;

/// Reads a file asynchronously and returns the path and content
///
/// # Arguments
/// * `path` - Path to the file to read
///
/// # Returns
/// * `Ok((String, String))` - The file path and content
/// * `Err(std::io::Error)` - Error if reading fails
pub async fn read_file(path: PathBuf) -> Result<(String, String), std::io::Error> {
    let path_str = path
        .to_str()
        .ok_or_else(|| {
            std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                "source path is not valid UTF-8",
            )
        })?
        .to_owned();
    let content = read_to_string(&path).await?;
    Ok((path_str, content))
}
