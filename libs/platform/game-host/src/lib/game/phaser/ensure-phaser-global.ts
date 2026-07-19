let phaserReady: Promise<void> | undefined;

export function ensurePhaserGlobal(): Promise<void> {
  if (!phaserReady) {
    // Phaser 4 expects a global in a few lazy game entry paths; initialize it once
    // only when a Phaser route is actually opened so the home route avoids that cost.
    // needed as Phaser 4.1.0 changed ESM builds - see https://phaser.io/news/2026/04/phaser-4-1-0-salusa-release
    phaserReady = import("phaser").then((module) => {
      const Phaser = module.default;
      Object.assign(globalThis, { Phaser });
    });
  }

  return phaserReady;
}
