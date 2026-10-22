import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

export const PINNED_CALIBRATION_BASELINE = "de47f482889db30420692bf4406fba463d7db296";
const digest = (text) => `sha256:${createHash("sha256").update(text).digest("hex")}`;
const key = "fuzzy-waddle:ai-calibration-legacy-v1";

/** Only the detached pinned checkout receives this observable setup adapter; no candidate AI or rules code is copied. */
export function installPinnedCalibrationAdapter(worktree) {
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: worktree, encoding: "utf8" }).trim();
  if (head !== PINNED_CALIBRATION_BASELINE || execFileSync("git", ["status", "--porcelain"],
    { cwd: worktree, encoding: "utf8" }).trim()) throw new Error("calibration_baseline_not_clean_pinned_checkout");
  const component = "libs/games/probable-waffle/interface/src/lib/gui/main/probable-waffle-game.component.ts";
  const clock = "libs/games/probable-waffle/phaser/src/lib/world/services/simulation-tick.service.ts";
  const patches = [];
  const edit = (path, transform) => {
    const original = readFileSync(join(worktree, path), "utf8"), changed = transform(original);
    if (changed === original) throw new Error(`calibration_baseline_adapter_did_not_bind:${path}`);
    writeFileSync(join(worktree, path), changed);
    patches.push({ path, originalDigest: digest(original), adaptedDigest: digest(changed) });
  };
  edit(component, (source) => {
    source = replaceOnce(source, "ProbableWaffleGameInstance, ProbableWaffleUserInfo",
      "ProbableWaffleGameInstance, ProbableWaffleUserInfo, ProbableWafflePlayerType, " +
      "ProbableWaffleAiDifficulty, ProbableWaffleGameInstanceType");
    source = replaceOnce(source, "    if (!gameInstance) return;", `    if (!gameInstance) return;
    const calibrationInput = ["localhost", "127.0.0.1"].includes(window.location.hostname)
      ? JSON.parse(window.sessionStorage.getItem("${key}") ?? "null") as {
        enabled: boolean; seed: number; calibration: { targetPlayerNumber: 1 | 2 } } | null : null;
    if (calibrationInput?.enabled) {
      if (gameInstance.gameInstanceMetadata.data.type !== ProbableWaffleGameInstanceType.Skirmish ||
          gameInstance.gameInstanceMetadata.data.startOptions.loadFromSave ||
          !Number.isSafeInteger(calibrationInput.seed) || gameInstance.players.length !== 2 ||
          ![1,2].includes(calibrationInput.calibration.targetPlayerNumber)) throw new Error("legacy_calibration_setup_invalid");
      gameInstance.gameInstanceMetadata.data.rndSeed = calibrationInput.seed;
      gameInstance.gameInstanceMetadata.data.gameInstanceId = "runtime-fixture-" + calibrationInput.seed + "-continuous";
      for (const player of gameInstance.players) {
        const definition = player.playerController.data.playerDefinition;
        if (!definition || definition.factionType === undefined) throw new Error("legacy_calibration_faction_missing");
        definition.playerType = ProbableWafflePlayerType.AI;
        definition.difficulty = ProbableWaffleAiDifficulty.Medium;
      }
    }`);
    return replaceOnce(source, "      seed: [seed.toString()]", `      seed: [seed.toString()],
      ...(calibrationInput?.enabled ? { callbacks: { ...probableWaffleGameConfig.callbacks,
        postBoot: (game: import("phaser").Game) => {
          probableWaffleGameConfig.callbacks?.postBoot?.(game);
          (window as unknown as { __nativeCalibrationLegacy?: { game: import("phaser").Game;
            config: typeof calibrationInput } }).__nativeCalibrationLegacy = { game, config: calibrationInput };
        } } } : {})`);
  });
  edit(clock, (source) => replaceOnce(source, "  constructor(private readonly scene: Phaser.Scene) {",
    `  constructor(private readonly scene: Phaser.Scene) {
    if (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
        JSON.parse(window.sessionStorage.getItem("${key}") ?? "null")?.enabled === true)
      this.pauseTick(SimulationPauseReason.Manual);`));
  return { adapter: "legacy-runtime-command-and-world-projection-v1", version: 1, sourceRevision: head, patches,
    adapterDigest: digest(JSON.stringify(patches)),
    supported: ["ordinary_two_ai_legal_start", "native_commands", "legacy_world_hash", "native_terminal_metrics"],
    unsupported: ["new_difficulty_profiles", "fixed_new_opening_opponents", "pure_brain", "new_command_authority"] };
}

function replaceOnce(source, needle, replacement) {
  if (source.split(needle).length !== 2) throw new Error("calibration_pinned_adapter_source_contract_changed");
  return source.replace(needle, replacement);
}
