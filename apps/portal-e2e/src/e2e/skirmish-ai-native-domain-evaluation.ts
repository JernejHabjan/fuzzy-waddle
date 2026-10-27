import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeWeaponHits, nativeRetainedActor } from "./skirmish-ai-native-combat-effects";
import { nativePaidMissionOutputs, nativeLandingFailures } from "./skirmish-ai-native-mission-evidence";

/** A useful domain effect must hit a fair, observed objective selected by the squad containing the paid unit. */
export function nativeDomainMissionTargetsActor(
  squad: {
    readonly role?: string;
    readonly domain?: string;
    readonly actorIds?: readonly string[];
    readonly objectiveId?: string | null;
  },
  target: { readonly actorId: string; readonly evidenceId: string },
  domain: "air" | "water",
  attackerActorId: string,
  assessment?: {
    readonly targetActorId?: string | null;
    readonly alternatives?: readonly { readonly targetActorId: string }[];
  } | null
): boolean {
  const objectiveMatches = squad.objectiveId === target.actorId || squad.objectiveId === `hypothesis:${target.evidenceId}`;
  const assessmentConsidersTarget = assessment?.targetActorId === target.actorId ||
    assessment?.alternatives?.some((alternative) => alternative.targetActorId === target.actorId) === true;
  return squad.role === "attack" && squad.domain === domain && squad.actorIds?.includes(attackerActorId) === true &&
    (objectiveMatches || assessmentConsidersTarget);
}

function paidMissionEffect(
  context: ReturnType<typeof nativeScenarioContext>,
  outputs: ReturnType<typeof nativePaidMissionOutputs>,
  domain: "air" | "water"
): boolean {
  const hits = nativeWeaponHits(context);
  return outputs.some(({ actor, fact }) => hits.some((hit) => {
    if (hit.kind !== "native_damage" || hit.damage.initiator?.actorId !== actor.actorId || hit.tick < fact.tick) return false;
    return context.frames.some((frame) => {
      const target = frame.decision.input?.observation?.actors.find((candidate) =>
        candidate.actorId === hit.damage.target.actorId && candidate.relation === "enemy" &&
        ["visible", "last_seen"].includes(candidate.visibility));
      return frame.tick <= hit.tick && target !== undefined &&
        frame.decision.missionState?.squads.some((squad) =>
          nativeDomainMissionTargetsActor(squad, target, domain, actor.actorId, frame.decision.strategy?.assessment));
    });
  }));
}

/** Domain investment needs a real catalog capability and a native mission effect, never just a water/air map label. */
export function evaluateNativeDomain(id: string, branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [], target = context.roles["contact-group"];
  const catalog = context.frames[0]?.decision.input?.capabilityCatalog;
  if (!catalog?.entries.length) return ["domain_real_faction_catalog_missing"];
  const offers = catalog.entries.flatMap((entry) => entry.produces);
  const ships = new Set(catalog.entries.filter((entry) => entry.movementDomains.includes("water") &&
    offers.includes(entry.sourceObjectName)).map((entry) => entry.sourceObjectName));
  const air = new Set(catalog.entries.filter((entry) => entry.movementDomains.includes("air") &&
    offers.includes(entry.sourceObjectName)).map((entry) => entry.sourceObjectName));
  const paid = nativePaidMissionOutputs(context);
  const selected = context.frames.flatMap((frame) => frame.decision.acceptedIntents.flatMap((intent) =>
    intent.kind === "produce" ? [{ frame, intent }] : []));
  if (id !== "DOMAIN-05") {
    if (!context.capture?.setup?.topology.some((layer) => layer.cells.some((cell) =>
      JSON.stringify(cell.properties).includes('"water"'))) ||
        !context.frames.some((frame) => frame.decision.input?.accessGraph?.nodes.some((node) => node.domain === "water")))
      failures.push("domain_native_water_or_consumed_water_adapter_missing");
    if (["irrelevant", "unreachable", "unsupported"].includes(branch)) {
      if (selected.some(({ intent }) => ships.has(intent.objectName)) ||
          paid.some(({ objectName }) => ships.has(objectName))) failures.push("domain_unjustified_water_purchase");
      if (!nativeWeaponHits(context).length) failures.push("domain_negative_control_has_no_useful_land_effect");
    } else {
      const outputs = paid.filter(({ objectName }) => ships.has(objectName));
      if (!ships.size || !outputs.length) failures.push("domain_useful_fleet_has_no_native_paid_faction_output");
      if (!paidMissionEffect(context, outputs, "water"))
        failures.push("domain_paid_ship_has_no_compatible_native_objective_hit");
      if (branch === "intercept" && !context.frames.some((frame) => frame.tacticalBoundary?.actors.some((actor) =>
        actor.identity.actorId === target && actor.identity.canonicalObjectName === "VikingBoat" && actor.visible)))
        failures.push("domain_hostile_ship_not_actually_seen");
      if (branch === "escort") {
        failures.push(...nativeLandingFailures(context, "escort"));
        if (!nativeRetainedActor(context, context.roles["escort-carrier"])) failures.push("domain_native_escorted_carrier_lost");
      }
    }
    if (branch === "unsupported" && (context.result.aiFaction !== "Skaduwee" || ships.size ||
        !catalog.entries.some((entry) => entry.sourceObjectName === "FrostForge" && !entry.produces.some((name) =>
          ["CommonBoat", "VikingBoat"].includes(name)))))
      failures.push("domain_missing_fleet_capability_not_explicitly_projected");
    if (branch === "unsupported" && selected.some(({ intent }) => ["CommonBoat", "VikingBoat"].includes(intent.objectName)))
      failures.push("domain_unsupported_faction_invented_foreign_ship_intent");
  } else {
    if (!air.size) failures.push("domain_legal_air_capability_unavailable");
    const outputs = paid.filter(({ objectName }) => air.has(objectName));
    if (branch === "backline" && !paidMissionEffect(context, outputs, "air"))
      failures.push("domain_paid_air_output_has_no_physical_backline_effect");
    if (branch === "anti_air") {
      const known = context.frames.find((frame) => (frame.decision.input?.observation?.actors.filter((actor) =>
        actor.relation === "enemy" && actor.visibility === "visible" && actor.combatProfile?.status === "known" &&
        actor.combatProfile.value.attacks.some((attack) => attack.targetDomains.includes("air")))?.length ?? 0) >= 4);
      if (!known) failures.push("domain_strong_anti_air_never_fairly_observed");
      if (outputs.filter(({ fact }) => fact.tick > (known?.tick ?? Infinity) + 400).length > 2)
        failures.push("domain_excessive_air_investment_after_strong_anti_air");
    }
    if (branch === "no_value" && selected.some(({ frame, intent }) => air.has(intent.objectName) &&
      frame.decision.missionState?.squads.some((squad) => squad.domain === "air" && squad.tactics?.targetActorId === target)))
      failures.push("domain_low_value_accessible_contact_justified_air_purchase");
  }
  return [...new Set(failures)];
}
