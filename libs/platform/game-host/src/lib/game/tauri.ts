/**
 * Returns true when running inside a Tauri desktop window.
 *
 * Framework-agnostic — no Angular imports — safe to use from plain game classes
 * (e.g. GameSettings) as well as Angular services and components.
 *
 * Guards against non-browser contexts (SSR, Node scripts) by checking
 * `typeof window` before accessing it.
 */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
