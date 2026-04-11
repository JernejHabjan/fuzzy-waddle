use tauri::{command, AppHandle, Manager, Runtime};

/// Locks or unlocks the cursor to the application window.
///
/// Called from Angular via `invoke('set_cursor_grab', { grab: true | false })`.
///
/// This is used by the Probable Waffle RTS game for edge-scroll panning —
/// locking the cursor to the window prevents accidental clicks outside during
/// intense gameplay.
///
/// NOTE: On macOS, `set_cursor_grab` may fall back to cursor hiding only due
/// to OS-level restrictions. This is a known Tauri / WKWebView limitation.
#[command]
pub fn set_cursor_grab<R: Runtime>(app: AppHandle<R>, grab: bool) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Could not find main window".to_string())?;

    window
        .set_cursor_grab(grab)
        .map_err(|e| format!("set_cursor_grab failed: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![set_cursor_grab])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
