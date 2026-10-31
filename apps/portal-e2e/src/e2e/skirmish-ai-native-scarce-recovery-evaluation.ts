import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeCompletedPlacements } from "./skirmish-ai-native-construction-evidence";
import { hasNativeSourceDelivery } from "./skirmish-ai-source-delivery";
import { nativePaidMissionOutputs } from "./skirmish-ai-native-mission-evidence";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";

/** Independently price the complete native closure; zero cash alone never establishes impossibility. */
export function evaluateNativeScarceRecovery(branch: string, context: ReturnType<typeof nativeScenarioContext>): string[] {
  const records = context.facts.filter((fact): fact is Extract<AiRuntimeProductionFactV1, { kind: "recovery_setup" }> =>
    fact.kind === "recovery_setup" && fact.playerNumber === 2);
  const setup = records[0]?.recovery, input = context.frames[0]?.decision.input;
  const catalog = input?.capabilityCatalog, actors = context.capture?.setup?.actors;
  if (records.length !== 1 || !setup || records[0]?.tick !== 0 || setup.branch !== branch || !catalog || !actors)
    return ["scarce_native_definition_setup_missing"];
  const failures: string[] = [];
  const actualSources = actors.filter((actor) => actor.definition.resourceSource !== undefined);
  if (actualSources.length !== setup.sources.length || new Set(setup.sources.map((source) => source.actorId)).size !== setup.sources.length ||
      actualSources.some((actor) => actor.definition.resourceSource?.currentResources !== 0 ||
        !setup.sources.some((source) => source.actorId === actor.actorId))) failures.push("scarce_native_source_inventory_incomplete");
  if (setup.workerIds.length !== (branch === "bootstrap" ? 0 : 1) || !setup.sources.length ||
      setup.sources.some((source) => source.available !== 0 || source.renewable)) failures.push("scarce_exhausted_source_premise_missing");
  const expected = new Map<ObjectNames, Readonly<Partial<Record<ResourceType, number>>>>();
  const existing = new Set(actors.filter((actor) => actor.definition.owner?.ownerId === 2).map((actor) => actor.definition.name));
  const visiting = new Set<ObjectNames>();
  const price = (name: ObjectNames): boolean => {
    if (existing.has(name) || expected.has(name)) return true;
    if (visiting.has(name)) return false;
    visiting.add(name);
    const profile = catalog.entries.find((entry) => entry.sourceObjectName === name)?.constructionProfile;
    if (!profile || !(profile.requiredObjectNames ?? []).every(price)) return false;
    expected.set(name, profile.resourceCost);
    visiting.delete(name);
    return true;
  };
  if ((branch === "bootstrap" && !price(setup.workerObjectName)) || !price(ObjectNames.Field))
    failures.push("scarce_independent_complete_chain_unavailable");
  const vector = (cost: Readonly<Partial<Record<ResourceType, number>>>) => Object.values(ResourceType).map((type) => cost[type] ?? 0);
  if (setup.steps.length !== expected.size || setup.steps.some((step) =>
      !expected.has(step.objectName) || JSON.stringify(vector(expected.get(step.objectName) ?? {})) !== JSON.stringify(vector(step.cost))))
    failures.push("scarce_fixture_chain_does_not_match_definitions");
  const fullCost = Object.values(ResourceType).map((type) => [...expected.values()].reduce((sum, cost) => sum + (cost[type] ?? 0), 0));
  if (!fullCost.some((amount) => amount > 0) || Object.values(ResourceType).some((type, index) =>
      setup.bank[type] !== (branch === "infeasible" ? 0 : fullCost[index]))) failures.push("scarce_bank_not_exact_complete_chain");
  if (context.frames.some((frame) => frame.decision.missionState?.authority.health === "technical_fault"))
    failures.push("scarce_resource_failure_misclassified_as_technical");
  if (branch === "infeasible") {
    if (!context.frames.some((frame) => frame.decision.decisions.some((decision) =>
        decision.outcome === "rejected" && decision.reason === "resource_conflict") ||
        frame.decision.missionState?.blockers.some((blocker) => blocker.cause === "resource")))
      failures.push("scarce_confirmed_infeasibility_not_distinguished");
    if (nativeCompletedPlacements(context).length || nativePaidMissionOutputs(context).length)
      failures.push("scarce_infeasible_world_obtained_unfunded_work");
    return failures;
  }
  const placements = nativeCompletedPlacements(context);
  const field = placements.find((entry) => entry.value.site.canonicalObjectName === ObjectNames.Field);
  const granary = placements.find((entry) => entry.value.site.canonicalObjectName === ObjectNames.Granary);
  if (!field || !granary || granary.completionTick > field.fact.tick) failures.push("scarce_paid_complete_food_chain_missing");
  const delivered = field && hasNativeSourceDelivery(context.capture?.facts ?? [], {
    sourceActorId: field.siteId, sourceOwner: 2, playerNumber: 2, resourceType: ResourceType.Food,
    fromTick: field.completionTick, throughTick: 4000
  });
  if (!delivered) failures.push("scarce_native_harvest_delivery_missing");
  if (!nativePaidMissionOutputs(context).some((output) => output.objectName === setup.workerObjectName))
    failures.push("scarce_worker_replacement_did_not_resume");
  return [...new Set(failures)];
}
