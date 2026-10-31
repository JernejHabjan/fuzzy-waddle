import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { getActorComponent } from "../../../data/actor-component";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { ResourceSourceComponent } from "../../../entity/components/resource/resource-source-component";
import { GathererComponent } from "../../../entity/components/resource/gatherer-component";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { emitResource, getPlayer } from "../../../data/scene-data";
import { AI_RUNTIME_RECOVERY_SETUP_EVENT, type AiRuntimeRecoverySetup } from "./ai-runtime-recovery-setup";

/**
 * Exact scarce bank authoring after ordinary actors/stocks exist, before orders/first tick. No grant after tick zero.
 * With every existing source exhausted, only the explicitly priced renewable chain can produce the first income.
 * Unsupported definitions, existing free food, hidden unexhausted sources or extra workers fail the premise.
 */
export function applyAiRuntimeRecoveryStart(scene: ProbableWaffleScene, branch: AiRuntimeRecoverySetup["branch"]): void {
  const index = getSceneService(scene, ActorIndexSystem), player = getPlayer(scene, 2);
  if (!index || !player) throw new Error("recovery_setup_native_owner_missing");
  if (getSceneService(scene, SimulationTickService)?.currentTick !== 0) throw new Error("recovery_setup_not_pre_tick");
  const self = index.getOwnedActors(2);
  const workers = self.filter((actor) => getActorComponent(actor, GathererComponent));
  if (workers.length !== (branch === "bootstrap" ? 0 : 1)) throw new Error("recovery_setup_worker_count_mismatch");
  const producer = self.find((actor) => getPwActorDefinition(actor.name as ObjectNames, null)?.components?.production
    ?.availableProduceActors.some((name) => getPwActorDefinition(name, null)?.components?.gatherer));
  const workerObjectName = producer && getPwActorDefinition(producer.name as ObjectNames, null)?.components?.production
    ?.availableProduceActors.find((name) => getPwActorDefinition(name, null)?.components?.gatherer);
  if (!workerObjectName) throw new Error("recovery_setup_no_legal_worker_producer");
  const sources: AiRuntimeRecoverySetup["sources"][number][] = [];
  for (const actor of index.getAllIdActors()) {
    const source = getActorComponent(actor, ResourceSourceComponent);
    if (!source) continue;
    const actorId = getActorComponent(actor, IdComponent)?.id;
    if (!actorId || sources.length >= 128 || source.getCurrentResources() !== 0 || source.resourceSourceDefinition.respawnOnDepletion)
      throw new Error("recovery_setup_source_exhaustion_not_proven");
    sources.push({ actorId, resourceType: source.getResourceType(), available: source.getCurrentResources(), renewable: false });
  }
  if (!sources.length) throw new Error("recovery_setup_source_inventory_missing");
  const steps: AiRuntimeRecoverySetup["steps"][number][] = [], visited = new Set<ObjectNames>();
  const existing = new Set(self.map((actor) => actor.name));
  const price = (name: ObjectNames) => {
    if (existing.has(name)) return;
    if (visited.has(name)) throw new Error("recovery_setup_cyclic_definitions");
    visited.add(name);
    const definition = getPwActorDefinition(name, null);
    const cost = definition?.components?.productionCost?.resources;
    if (!cost || Object.values(cost).some((amount) => amount === undefined || !Number.isFinite(amount) || amount < 0))
      throw new Error("recovery_setup_missing_definition_price");
    for (const required of definition?.components?.requirements?.actors ?? []) price(required);
    steps.push({ objectName: name, cost: { ...cost } });
    existing.add(name);
    visited.delete(name);
  };
  if (branch === "bootstrap") price(workerObjectName);
  price(ObjectNames.Field);
  if (!steps.some((step) => step.objectName === ObjectNames.Field)) throw new Error("recovery_setup_free_existing_food");
  const bank = { food: 0, wood: 0, stone: 0, minerals: 0 } satisfies Record<ResourceType, number>;
  if (branch !== "infeasible") for (const step of steps) for (const resource of Object.values(ResourceType))
    bank[resource] += step.cost[resource] ?? 0;
  const current = player.getResources();
  for (const resource of Object.values(ResourceType)) {
    const delta = bank[resource] - (current[resource] ?? 0);
    if (delta > 0) emitResource(scene, "resource.added", { [resource]: delta }, 2);
    if (delta < 0) emitResource(scene, "resource.removed", { [resource]: -delta }, 2);
  }
  const workerIds = workers.map((actor) => getActorComponent(actor, IdComponent)?.id);
  if (workerIds.some((id) => !id)) throw new Error("recovery_setup_worker_identity_missing");
  scene.events.emit(AI_RUNTIME_RECOVERY_SETUP_EVENT, { playerNumber: 2, branch, workerObjectName,
    workerIds: workerIds.filter((id): id is string => !!id).sort(), steps, bank,
    sources: sources.sort((a, b) => a.actorId.localeCompare(b.actorId)) } satisfies AiRuntimeRecoverySetup);
}
