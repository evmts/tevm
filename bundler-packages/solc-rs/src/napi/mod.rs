use napi_derive::napi;

#[napi(catch_unwind)]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
