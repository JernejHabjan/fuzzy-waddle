# Tauri Desktop App (Probable Waffle)

Probable Waffle can be built as a standalone desktop app using [Tauri v2](https://tauri.app/).
The app is a thin native shell around the same Angular build.

## Prerequisites

| Tool | Install |
| ---- | ------- |
| Rust (stable toolchain) | [rustup.rs](https://rustup.rs/) |
| Node.js + pnpm | As for normal web dev (see [Getting Started](getting-started.md)) |
| **Windows** | [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) + WebView2 (bundled with Windows 10/11) |
| **macOS** | Xcode Command Line Tools: `xcode-select --install` |
| **Linux** | `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf` (Debian/Ubuntu) |

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

## Notes

- **CSP (`app.security.csp: null`)** — Content Security Policy is disabled in `tauri.conf.json`. Phaser inlines scripts/blobs and loads assets from `tauri://localhost` in ways that conflict with most restrictive CSP rules. Re-enable and tighten once a working policy is established.
