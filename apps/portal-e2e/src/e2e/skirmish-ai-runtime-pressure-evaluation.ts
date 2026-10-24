import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";

export type PressureVariant = Pick<
  RuntimeVariantResultV1,
  "variantId" | "pressureBranch" | "initialWorldDigest" | "presetResourceStartCount" |
  "presetInitialResourceBalances" | "initialWorkerCount" | "perturbations"
> & {
  readonly checkpoints: readonly Pick<
    RuntimeCheckpointV1,
    "tick" | "visibleEnemyFacts" | "economyPosture" | "workforcePolicy" | "squads" |
    "appliedCommands" | "workerCount" | "deliveredIncome"
  >[];
};

/** Compares one genuine raid against an otherwise identical low-resource world. */
export function evaluateRuntimePressureResponse(variants: readonly PressureVariant[]): string[] {
  const raids = variants.filter((variant) => variant.pressureBranch === "raid");
  const controls = variants.filter((variant) => variant.pressureBranch === "safe_control");
  if (!raids.length || !controls.length) return ["pressure_branches_missing"];
  const failures = raids.length === controls.length ? [] : ["pressure_repetition_count"];
  for (let index = 0; index < Math.min(raids.length, controls.length); index += 1) {
    const raid = raids[index];
    const control = controls[index];
    if (raid && control) failures.push(...evaluatePressurePair(raid, control));
  }
  return failures;
}

function evaluatePressurePair(raid: PressureVariant, control: PressureVariant): string[] {
  const failures: string[] = [];
  if (raid.initialWorldDigest !== control.initialWorldDigest) failures.push("pressure_initial_world_mismatch");
  for (const variant of [raid, control]) {
    const balances = variant.presetInitialResourceBalances[2];
    if (variant.presetResourceStartCount < 1 ||
      ["food", "wood", "stone", "minerals"].some((resource) => balances?.[resource] !== 200)) {
      failures.push(`${variant.variantId}:pressure_resource_start`);
    }
  }
  const dispatch = raid.perturbations.find((event) => event.id === "home-raid");
  if (!dispatch || dispatch.dispatchedActors < 1) failures.push("pressure_raid_not_dispatched");
  const firstContact = raid.checkpoints.find((checkpoint) =>
    checkpoint.visibleEnemyFacts.some((enemy) => enemy.objectName === "Banshee" && enemy.visibility === "visible")
  );
  if (!firstContact) failures.push("pressure_contact_not_observed");
  else {
    const responded = raid.checkpoints.some((checkpoint) =>
      checkpoint.tick >= firstContact.tick && checkpoint.tick <= firstContact.tick + 600 &&
      ["pressured", "emergency"].includes(checkpoint.economyPosture ?? "") &&
      (checkpoint.workforcePolicy?.defensePermille ?? 0) > (checkpoint.workforcePolicy?.economyPermille ?? 1000) &&
      checkpoint.squads.some((squad) =>
        squad.role === "defense" && squad.actorNames.includes("TivaraSlingshotFemale")
      ) &&
      checkpoint.appliedCommands.some((command) =>
        !firstContact.appliedCommands.some((prior) => prior.effectId === command.effectId)
      )
    );
    if (!responded) failures.push("pressure_defense_not_applied");
  }
  const controlThreat = control.checkpoints.some((checkpoint) =>
    checkpoint.visibleEnemyFacts.some((enemy) => enemy.objectName === "Banshee" && enemy.visibility === "visible")
  );
  if (controlThreat) failures.push("pressure_control_not_safe");
  if (control.checkpoints.some((checkpoint) => checkpoint.economyPosture && checkpoint.economyPosture !== "safe")) {
    failures.push("pressure_control_abandoned_economy");
  }
  if (!control.checkpoints.some((checkpoint) =>
    checkpoint.economyPosture === "safe" &&
    (checkpoint.workforcePolicy?.economyPermille ?? 0) > (checkpoint.workforcePolicy?.defensePermille ?? 1000)
  )) {
    failures.push("pressure_control_safe_budget_missing");
  }
  if (!control.checkpoints.some((checkpoint) => checkpoint.workerCount > control.initialWorkerCount &&
    checkpoint.deliveredIncome > 0)) {
    failures.push("pressure_control_no_growth");
  }
  return failures;
}
