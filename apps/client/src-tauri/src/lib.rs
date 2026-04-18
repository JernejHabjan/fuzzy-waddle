use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, Runtime,
};

/// Locks or unlocks the cursor to the application window.
///
/// Called from Angular via `invoke('set_cursor_grab', { grab: true | false })`.
///
/// Used for RTS edge-scroll panning — locking the cursor prevents accidental
/// clicks outside the window during intense gameplay.
///
/// NOTE: On macOS, `set_cursor_grab` may fall back to cursor hiding only due
/// to OS-level restrictions. This is a known Tauri / WKWebView limitation.
#[tauri::command]
fn set_cursor_grab<R: Runtime>(app: AppHandle<R>, grab: bool) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Could not find main window".to_string())?;

    window
        .set_cursor_grab(grab)
        .map_err(|e| format!("set_cursor_grab failed: {e}"))
}

/// Exits the application cleanly.
///
/// Called from Angular via `invoke('quit')` — shown as a Quit button on the
/// home screen when running as a desktop app.
#[tauri::command]
fn quit<R: Runtime>(app: AppHandle<R>) {
    app.exit(0);
}

/// Returns the application version string from Cargo.toml.
///
/// Called from Angular via `invoke('get_app_version')` to display the version
/// in the main menu and splash screen.
#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Toggles fullscreen on the main window.
/// Called from Angular's Settings page via `invoke('toggle_fullscreen')`.
#[tauri::command]
fn toggle_fullscreen<R: Runtime>(app: AppHandle<R>) -> Result<bool, String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Could not find main window".to_string())?;
    let is_fullscreen = window
        .is_fullscreen()
        .map_err(|e| format!("is_fullscreen failed: {e}"))?;
    window
        .set_fullscreen(!is_fullscreen)
        .map_err(|e| format!("set_fullscreen failed: {e}"))?;
    Ok(!is_fullscreen)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        // Prevent multiple instances — focuses the existing window instead of opening another.
        // When Windows fires a protocol URL (e.g. OAuth callback), it spawns a new process with
        // the URL in argv. Single-instance kills that process, so we must forward the URL to the
        // running instance as a Tauri event so deep-link listeners can complete the OAuth flow.
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            for arg in &argv {
                if arg.contains("://") && !arg.starts_with('-') {
                    let _ = app.emit("deep-link-received", arg.as_str());
                }
            }
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        // Automatically saves and restores window position, size, maximized, and fullscreen state
        .plugin(tauri_plugin_window_state::Builder::default().build())
        // Native desktop notifications (game saved, match ready, etc.)
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            // ── Deep-link scheme registration (dev mode only) ─────────────────────
            // In production the NSIS installer writes the registry entry.
            // In dev mode (`tauri dev`) no installer runs, so register manually.
            #[cfg(debug_assertions)]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                if let Err(e) = app.deep_link().register_all() {
                    eprintln!("[deep-link] dev-mode registration failed: {e}");
                }
            }

            // ── DevTools (debug builds only) ─────────────────────────────────────
            // Auto-open the WebView inspector on startup so console logs are
            // visible immediately. Remove or gate behind a flag for release.
            #[cfg(debug_assertions)]
            if let Some(window) = app.get_webview_window("main") {
                window.open_devtools();
            }

            // ── System tray ──────────────────────────────────────────────────────────
            let show_hide_item =
                MenuItemBuilder::with_id("show_hide", "Show / Hide Window").build(app)?;
            let quit_item =
                MenuItemBuilder::with_id("quit", "Quit Ashes of the Ancients").build(app)?;

            let tray_menu = MenuBuilder::new(app)
                .item(&show_hide_item)
                .separator()
                .item(&quit_item)
                .build()?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .tooltip("Ashes of the Ancients")
                // Left-click toggles window visibility; right-click opens the menu
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().0.as_str() {
                    "show_hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    // Left-click toggles show/hide; double-click always shows
                    match event {
                        TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } => {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                if window.is_visible().unwrap_or(false) {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                        TrayIconEvent::DoubleClick {
                            button: MouseButton::Left,
                            ..
                        } => {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_cursor_grab, quit, get_app_version, toggle_fullscreen])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
