# Tauri Desktop App (Probable Waffle)

Probable Waffle can be built as a standalone desktop app using [Tauri v2](https://tauri.app/).
The app is a thin native shell around the same Angular build.

## Prerequisites

| Tool                    | Install                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Rust (stable toolchain) | [rustup.rs](https://rustup.rs/)                                                                                                 |
| Node.js + pnpm          | As for normal web dev (see [Getting Started](getting-started.md))                                                               |
| **Windows**             | [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) + WebView2 (bundled with Windows 10/11) |
| **macOS**               | Xcode Command Line Tools: `xcode-select --install`                                                                              |
| **Linux**               | `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf` (Debian/Ubuntu)                                              |

## Dev

Start the Angular dev server and Tauri window in parallel:

```bash
pnpm tauri:dev
```

## Build

```bash
pnpm tauri:build
```

Output: `apps/client/src-tauri/target/release/bundle/nsis/Ashes of the Ancients_<version>_x64-setup.exe`

## Features

### Splash Screen

A cinematic overlay plays on launch (`TauriSplashComponent`) — dark navy background, gold particle effects, corner frames, sword emblem, and title. It fades out automatically after ~2.4 s and is only rendered when running inside Tauri.

### Custom Title Bar

The window runs frameless (`"decorations": false`). A custom title bar (`TauriTitlebarComponent`) provides:

- Fullscreen toggle
- Minimize / Maximize / Close buttons
- Drag region on the title area

The title bar hides automatically when the window enters fullscreen.

### Fullscreen & Cursor Management

- The window starts fullscreen by default.
- A **Display** card in the in-game Settings screen lets the player toggle fullscreen/windowed at runtime.
- Cursor grab (lock) is engaged only while the window is fullscreen; switching to windowed mode releases the cursor automatically.
- The cursor is also released on `window:blur` (e.g. Alt+Tab) and re-locked on `window:focus` if still fullscreen.

### System Tray

A tray icon appears while the app is running with two actions:

- **Show** — restores and focuses the window
- **Quit** — exits the app

### Single Instance

`tauri-plugin-single-instance` ensures only one instance of the app runs at a time. If a second instance is launched (e.g. by the OS to handle a deep-link URL), it forwards the URL to the running instance and then exits.

### Window State Persistence

`tauri-plugin-window-state` saves and restores window size and position between sessions.

### Notifications

`tauri-plugin-notification` is available for native OS notifications (e.g. game-save confirmation).

## Google Sign-In (OAuth)

Tauri's WebView cannot complete a standard browser OAuth redirect, so sign-in uses a deep-link flow:

1. The app calls `signInWithOAuth` with `skipBrowserRedirect: true` and `redirectTo` pointing to `/assets/auth-callback.html` on the web app.
2. The auth URL is opened in the **system browser** (Chrome / Edge / Safari).
3. After the user authenticates, Google → Supabase → browser lands on `/assets/auth-callback.html` — a plain HTML file (no Angular, no Supabase) that:

- Redirects to `com.fuzzywaddle.probablewaffle://auth/callback?...#...` to hand the full callback payload to the app.
- Tells the user to close the browser tab after the app handoff.

4. OS triggers the registered deep-link → the single-instance plugin forwards it via `"deep-link-received"`.
5. `AuthService` either parses `access_token` + `refresh_token` from the URL hash and calls `supabase.auth.setSession()`, or exchanges a `?code=...` callback for a session.

Using a plain HTML file (not an Angular page) prevents Supabase's `detectSessionInUrl` from accidentally establishing a session in the browser tab instead of the app.

The `/assets/auth-callback.html` redirect URL must also be registered in Supabase — see [supabase.md](supabase.md).

## Notes

- **CSP (`app.security.csp: null`)** — Content Security Policy is disabled in `tauri.conf.json`. Phaser inlines scripts/blobs and loads assets from `tauri://localhost` in ways that conflict with most restrictive CSP rules. Re-enable and tighten once a working policy is established.
- **Service worker** — disabled in Tauri builds (`!isTauri()` guard in `main.ts`) because there is no web server to serve `ngsw-worker.js` from.

## CORS

The Tauri app contacts the production API (`https://fuzzy-waddle-api.onrender.com`) from two different origins depending on how it runs:

| Mode                             | Origin                   |
| -------------------------------- | ------------------------ |
| `pnpm tauri:dev` (all platforms) | `http://localhost:4200`  |
| Production — Windows (WebView2)  | `http://tauri.localhost` |
| Production — macOS / Linux       | `tauri://localhost`      |

In dev mode Tauri's WebView loads the Angular dev server directly, so the origin is the dev server's URL.
In a production build Tauri serves the bundled `dist/` through a virtual host: WebView2 requires an HTTP scheme (`http://tauri.localhost`), while WKWebView and WebKitGTK accept a custom scheme (`tauri://localhost`).

All three must be in the `CORS_ORIGIN` environment variable of the Render API service — see [deployment.md](deployment.md). Without them the browser blocks every API and WebSocket call with a CORS error.
