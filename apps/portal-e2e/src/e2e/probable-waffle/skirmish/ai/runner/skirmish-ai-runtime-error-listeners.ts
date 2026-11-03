import type { Page, ConsoleMessage } from "@playwright/test";

const detachByPage = new WeakMap<Page, () => void>();

/** A retained browser page has one current match's error collector; previous results own detached snapshots. */
export function installRuntimeErrorListeners(page: Page, aiErrors: string[]) {
  detachByPage.get(page)?.();
  const consoleListener = (message: ConsoleMessage) => {
    const text = message.text();
    if (/Error (stepping behaviour tree|updating AI on simulation tick|scheduling next AI step)/i.test(text)) aiErrors.push(text);
  };
  const errorListener = (error: Error) => {
    if (/\bAI\b|player-ai|brain/i.test(error.message)) aiErrors.push(error.message);
  };
  page.on("console", consoleListener);
  page.on("pageerror", errorListener);
  detachByPage.set(page, () => {
    page.off("console", consoleListener);
    page.off("pageerror", errorListener);
  });
}
