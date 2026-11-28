import type { nativeScenarioContext } from "../contracts/skirmish-ai-native-scenario-context";
import type { RuntimePresetWorld } from "../setup/skirmish-ai-runtime-preset-world";
import { nativeWeaponHits } from "../combat/effects/skirmish-ai-native-combat-effects";
import { nativeCompletedFortification } from "./skirmish-ai-native-completed-fortification";

type Axis = "x" | "y";

interface FortificationFront {
  readonly lineAxis: Axis;
  readonly crossingAxis: Axis;
  readonly fixedCoordinate: number;
  readonly lineStart: number;
  readonly lineEnd: number;
}

/** Preset actor positions are world-space isometric centers; fortification evidence uses tile coordinates. */
function worldPositionToTile(position: { readonly x: number; readonly y: number }) {
  const diagonal = (position.y - 16) / 16;
  const horizontal = (position.x - 32) / 32;
  return {
    x: Math.round((diagonal + horizontal) / 2),
    y: Math.round((diagonal - horizontal) / 2)
  };
}

/** Infer the line and crossing directions from the two physical terrain anchors. */
function fortificationFront(preset: RuntimePresetWorld): FortificationFront | undefined {
  const anchors = (preset.terrainPatches ?? []).filter((patch) => patch.blocked);
  if (anchors.length !== 2) return undefined;
  const [first, second] = anchors;
  if (!first || !second) return undefined;
  if (first.x === second.x && first.y !== second.y)
    return {
      lineAxis: "y",
      crossingAxis: "x",
      fixedCoordinate: first.x,
      lineStart: Math.min(first.y, second.y),
      lineEnd: Math.max(first.y, second.y)
    };
  if (first.y === second.y && first.x !== second.x)
    return {
      lineAxis: "x",
      crossingAxis: "y",
      fixedCoordinate: first.y,
      lineStart: Math.min(first.x, second.x),
      lineEnd: Math.max(first.x, second.x)
    };
  return undefined;
}

/** Prove that the paid line protects the asset against a real approach from outside its opening. */
export function evaluateNativeWallApproach(
  branch: string,
  context: ReturnType<typeof nativeScenarioContext>,
  preset: RuntimePresetWorld
): string[] {
  const deposit = context.role("protected-deposit");
  if (branch === "no_value") {
    const lost = context.result.perturbations.find(
      (event) =>
        event.id === "loss-protected-deposit" && event.affectedActorId === deposit && event.dispatchedActors === 1
    );
    if (!lost) return ["fortification_protected_asset_loss_missing"];
    const front = fortificationFront(preset);
    if (!front) return ["fortification_control_front_missing"];
    const paidSites = new Set(
      context.capture?.facts.flatMap((fact) => {
        if (fact.kind !== "construction_authority") return [];
        const entry = fact.construction;
        return entry.kind === "resource" &&
          entry.operation === "start_charge" &&
          entry.status === "returned" &&
          entry.ownerArgument === 2 &&
          entry.callbackCount === 1 &&
          entry.balanceMatches
          ? [entry.site.actorId]
          : [];
      })
    );
    return context.capture?.facts.some((fact) => {
      if (fact.tick <= lost.tick || fact.kind !== "spatial_authority" || fact.spatial.kind !== "placement")
        return false;
      const { command, site } = fact.spatial;
      const linePosition = command.tileVec3[front.lineAxis];
      const crossingPosition = command.tileVec3[front.crossingAxis];
      return (
        command.execution?.source === "ai" &&
        paidSites.has(site.actorId) &&
        ["Wall", "Stairs", "WatchTower"].includes(site.canonicalObjectName) &&
        linePosition >= front.lineStart &&
        linePosition <= front.lineEnd &&
        Math.abs(crossingPosition - front.fixedCoordinate) <= 2
      );
    })
      ? ["fortification_obsolete_remote_asset_still_funded"]
      : [];
  }

  const line = nativeCompletedFortification(context, preset);
  if (!line) return ["fortification_completed_anchored_line_missing"];
  const front = fortificationFront(preset);
  if (!front) return ["fortification_control_front_missing"];
  const openingCoordinate = line.opening[front.crossingAxis];
  const route = context.result.productionPreset?.placementBaseline?.routes.find(
    (entry) =>
      entry.declaration.id === "production-army" && entry.declaration.playerNumber === context.capture?.playerNumber
  )?.path;
  const routeStart = route?.[0]?.[front.crossingAxis];
  const routeEnd = route?.at(-1)?.[front.crossingAxis];
  const crossAxis = front.crossingAxis === "x" ? "y" : "x";
  const crossesOpeningCorridor = route?.some(
    (position) =>
      position[front.crossingAxis] === openingCoordinate && Math.abs(position[crossAxis] - line.opening[crossAxis]) <= 2
  );
  if (
    !crossesOpeningCorridor ||
    routeStart === undefined ||
    routeEnd === undefined ||
    (routeStart - openingCoordinate) * (routeEnd - openingCoordinate) > 0
  )
    return ["fortification_friendly_route_does_not_cross_opening"];

  const invader = context.role("wall-approach-probe");
  const controls = preset.controls?.filter((control) => control.producerFixtureActorId === "wall-approach-probe");
  const attack = controls?.find((control) => control.action.kind === "attack");
  const move = controls
    ?.filter(
      (control) => control.action.kind === "move" && (!attack || control.applicationTick < attack.applicationTick)
    )
    .at(-1);
  const opponent = context.opponent;
  const invaderStart = preset.actors.find((actor) => actor.fixtureActorId === "wall-approach-probe")?.position;
  const protectedPosition = preset.actors.find((actor) => actor.fixtureActorId === "protected-deposit")?.position;
  const invaderStartTile = invaderStart ? worldPositionToTile(invaderStart) : undefined;
  const protectedPositionTile = protectedPosition ? worldPositionToTile(protectedPosition) : undefined;
  const exteriorDirection = invaderStartTile ? Math.sign(invaderStartTile[front.crossingAxis] - openingCoordinate) : 0;
  if (
    !opponent ||
    !invaderStartTile ||
    !protectedPositionTile ||
    exteriorDirection === 0 ||
    Math.sign(protectedPositionTile[front.crossingAxis] - openingCoordinate) !== -exteriorDirection ||
    !move ||
    !attack ||
    attack.action.kind !== "attack" ||
    attack.action.targetFixtureActorId !== "protected-deposit"
  )
    return ["fortification_approach_controls_missing"];
  const staged = opponent.facts.find(
    (fact) => fact.kind === "preset_control" && fact.control.phase === "applied" && fact.control.id === move.id
  );
  const command = staged?.kind === "preset_control" ? staged.control.command : undefined;
  if (
    staged?.kind !== "preset_control" ||
    staged.control.actorId !== invader ||
    command?.type !== "MOVE" ||
    !command.execution ||
    Math.sign(command.tileVec3[front.crossingAxis] - openingCoordinate) !== exteriorDirection ||
    !opponent.facts.some(
      (fact) =>
        fact.kind === "spatial_authority" &&
        fact.spatial.kind === "movement" &&
        fact.spatial.phase === "started" &&
        fact.spatial.source.actorId === invader &&
        fact.spatial.caller?.order?.commandContext?.execution.commandId === command.execution?.commandId
    ) ||
    !opponent.facts.some(
      (fact) =>
        fact.kind === "spatial_authority" &&
        fact.spatial.kind === "movement" &&
        fact.spatial.source.actorId === invader &&
        fact.spatial.phase !== "started" &&
        fact.spatial.actualTile != null &&
        Math.sign(fact.spatial.actualTile[front.crossingAxis] - openingCoordinate) === exteriorDirection &&
        fact.spatial.caller?.order?.commandContext?.execution.commandId === command.execution?.commandId &&
        fact.tick <= attack.applicationTick
    )
  )
    return ["fortification_hostile_exterior_staging_not_proven"];
  const attackApplied = opponent.facts.some((fact) => {
    if (fact.kind !== "preset_control" || fact.tick !== attack.applicationTick) return false;
    const control = fact.control;
    const command = control.command;
    return (
      control.phase === "applied" &&
      control.id === attack.id &&
      control.actorId === invader &&
      command?.type === "ACTOR_ACTION" &&
      !!command.execution &&
      command.targetObjectIds?.includes(deposit) &&
      control.outcomes.some(
        (outcome) => outcome.commandId === command.execution?.commandId && outcome.kind === "applied"
      ) &&
      !control.outcomes.some((outcome) => ["failed", "rejected"].includes(outcome.kind))
    );
  });
  if (!attackApplied) return ["fortification_protected_asset_attack_not_applied"];
  const hit = nativeWeaponHits(context, invader, attack.applicationTick + 1).some(
    (fact) => fact.damage.initiator?.actorId && line.towerIds.has(fact.damage.initiator.actorId)
  );
  return hit ? [] : ["fortification_completed_line_did_not_intercept_native_approach"];
}
