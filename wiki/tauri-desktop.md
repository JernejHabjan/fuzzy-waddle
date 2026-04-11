# Tauri Desktop App (Probable Waffle)

Probable Waffle can be built as a standalone desktop app using [Tauri v2](https://tauri.app/).
The app is a thin native shell around the same Angular build — no game code is duplicated.

## Why Tauri?

- **Small installer** (~5–10 MB) — ideal for itch.io and Steam uploads
- **Low memory footprint** — important for an RTS running Phaser/WebGL
- **Cursor lock** — locks the cursor to the window for RTS edge-scroll panning
- **Cross-platform** — produces `.msi`/`.exe` (Windows), `.dmg` (macOS), `.AppImage`/`.deb` (Linux)

## Prerequisites

| Tool | Install |
| ---- | ------- |
| Rust (stable toolchain) | [rustup.rs](https://rustup.rs/) |
| Node.js + pnpm | As for normal web dev (see [Getting Started](getting-started.md)) |
| **Windows** | [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) + WebView2 (bundled with Windows 10/11) |
| **macOS** | Xcode Command Line Tools: `xcode-select --install` |
| **Linux** | `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf` (Debian/Ubuntu) |

After installing Rust, verify:

```bash
rustc --version
cargo --version
```

## Dev Workflow

Start the Angular dev server and the Tauri window in parallel:

```bash
pnpm tauri:dev
# equivalent: nx run probable-waffle-client:tauri-dev
```

This runs `nx serve probable-waffle-client --configuration=tauri` alongside `tauri dev` automatically.

## Build (Platform Installers)

```bash
pnpm tauri:build
# equivalent: nx run probable-waffle-client:tauri-build
```

Outputs land in `apps/probable-waffle-client/src-tauri/target/release/bundle/`.

| Platform | Output |
| -------- | ------ |
| Windows | `*.msi`, `*.exe` (NSIS) |
| macOS | `*.dmg`, `*.app` |
| Linux | `*.AppImage`, `*.deb` |

## Key Files

| Path | Purpose |
| ---- | ------- |
| `apps/probable-waffle-client/` | Standalone Angular app (only Probable Waffle routes) |
| `apps/probable-waffle-client/src-tauri/tauri.conf.json` | Tauri window, bundle, and path config |
| `apps/probable-waffle-client/src-tauri/src/lib.rs` | Rust commands (including `set_cursor_grab`) |
| `apps/probable-waffle-client/src/environments/environment.tauri.ts` | `isDesktop: true` build environment |
| `apps/probable-waffle-client/package.json` | Local scripts: `tauri:dev` and `tauri:build` (deps are in root `package.json`) |
| `apps/client/src/app/shared/services/tauri.service.ts` | Angular service for invoking Tauri commands |

## Cursor Lock

The `TauriService.setCursorGrab(true)` call in `ProbableWaffleGameComponent` locks the cursor to the window while a game is active and releases it on window blur or component destroy.
It is a no-op in browser builds (`environment.isDesktop === false`).

On macOS, cursor grab may fall back to cursor hiding only — this is a known OS/WKWebView limitation.

## Notes

- The desktop app connects to the same hosted NestJS API as the web version (`https://fuzzy-waddle-api.onrender.com`)
- Supabase OAuth deep-link support (`tauri://`) is not yet wired — only username/password or anonymous play works in the current build
- `apps/client` (the web monolith) is unaffected by these changes
