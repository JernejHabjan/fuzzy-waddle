import { isDeepStrictEqual } from "node:util";

const branches = ["expand", "home_pressure", "pressure_withdrawn", "combat_resolved"];
const raiderRoles = ["home-raider", "home-raider-1", "home-raider-2", "home-raider-3"];

/** Full EXP-02 binding. Only the declared opposing attack/withdrawal may change the paired economic world. */
export function validExpansionPressureRecipe(recipe, assertion, scenarioId) {
  const contract = assertion?.requiredExpansionPressure;
  if (scenarioId !== "EXP-02" || contract?.latestTick !== 3000 || contract.humanPlayerNumber !== 1 ||
      recipe?.aiPlayerNumber !== 2 || recipe.fixedStepFrames !== true || recipe.simulationTimeScale !== 1 ||
      recipe.checkpointTicks?.at(-1) !== 3000 || assertion.maximumTick !== 3000 ||
      !Array.isArray(assertion.requiredAiFactions) ||
      !isDeepStrictEqual([...assertion.requiredAiFactions].sort(), ["Skaduwee", "Tivara"]) ||
      !contract.branchByVariant || typeof contract.branchByVariant !== "object" || Array.isArray(contract.branchByVariant) ||
      !Array.isArray(recipe.variants) || recipe.variants.length !== 8 ||
      !isDeepStrictEqual(Object.keys(contract.branchByVariant).sort(), recipe.variants.map((variant) => variant.id).sort())) return false;
  for (const faction of assertion.requiredAiFactions) {
    const variants = recipe.variants.filter((variant) => variant.aiFaction === faction);
    const branch = (variant) => contract.branchByVariant[variant.id];
    if (variants.length !== 4 || !isDeepStrictEqual(variants.map(branch).sort(), [...branches].sort())) return false;
    const safe = variants.find((variant) => branch(variant) === "expand");
    const combat = variants.find((variant) => branch(variant) === "combat_resolved");
    if (safe?.role !== "control" || combat?.role !== "subject" || !safe.pairId || safe.pairId !== combat.pairId ||
        new Set(variants.map((variant) => variant.presetWorld?.fixtureId)).size !== 4) return false;
    let attackActors;
    for (const variant of variants) {
      const mode = branch(variant), preset = variant.presetWorld;
      if (!preset || !Array.isArray(preset.actors) || preset.requireFactionRoster !== true ||
          variant.executionKind !== "focused_preset" ||
          variant.captureConstruction !== true || variant.captureCombat !== true || variant.evidenceStop !== undefined ||
          (variant.scenarioIds !== undefined && !variant.scenarioIds.includes(scenarioId)) ||
          variant.seed !== safe.seed || variant.humanFaction !== safe.humanFaction || variant.difficulty !== safe.difficulty ||
          (variant.mapLabel ?? recipe.mapLabel) !== (safe.mapLabel ?? recipe.mapLabel) ||
          !isDeepStrictEqual(variant.checkpointTicks ?? recipe.checkpointTicks, recipe.checkpointTicks) ||
          (preset.events?.length ?? 0) !== 0 || (preset.constructionOrders?.length ?? 0) !== 0 ||
          (preset.initialOrders?.length ?? 0) !== 0) return false;
      if (!["expand", "combat_resolved"].includes(mode) && (variant.role !== "standalone" || variant.pairId !== undefined)) return false;
      const actors = preset.actors.filter((actor) => raiderRoles.includes(actor.fixtureActorId));
      if (mode === "expand" ? actors.length !== 0 : actors.length !== 4 ||
          !raiderRoles.every((role) => actors.some((actor) => actor.fixtureActorId === role && actor.owner === 1 &&
            actor.actorName === (faction === "Tivara" ? "SkaduweeWarriorMale" : "TivaraMacemanMale")))) return false;
      if (mode !== "expand") {
        if (attackActors && !isDeepStrictEqual(actors, attackActors)) return false;
        attackActors = actors;
      }
      const withoutAttack = (world) => ({ ...world, fixtureId: undefined, controls: undefined,
        actors: world.actors.filter((actor) => !raiderRoles.includes(actor.fixtureActorId)) });
      if (!isDeepStrictEqual(withoutAttack(preset), withoutAttack(safe.presetWorld))) return false;
      const controls = preset.controls ?? [];
      if (controls.length !== (mode === "expand" ? 0 : mode === "pressure_withdrawn" ? 8 : 4)) return false;
      for (const [index, role] of raiderRoles.entries()) {
        if (mode === "expand") break;
        const attackId = index ? `attack-original-home-${index}` : "attack-original-home";
        const attack = controls.find((control) => control.id === attackId);
        if (!attack || attack.producerFixtureActorId !== role || attack.requestTick !== 0 || attack.applicationTick !== 0 ||
            !isDeepStrictEqual(attack.action, { kind: "attack", targetFixtureActorId: "original-home" })) return false;
        if (mode === "pressure_withdrawn") {
          const withdrawalId = index ? `withdraw-home-pressure-${index}` : "withdraw-home-pressure";
          const withdrawal = controls.find((control) => control.id === withdrawalId);
          if (!withdrawal || withdrawal.producerFixtureActorId !== role || withdrawal.requestTick !== 500 ||
              withdrawal.applicationTick !== 500 || withdrawal.action?.kind !== "move" ||
              !isDeepStrictEqual(withdrawal.action.worldPosition, { x: -320 + index * 64, y: 256, z: 0 })) return false;
        }
      }
    }
  }
  return true;
}
