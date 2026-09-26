import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { OrderType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "./ai-manager-proposal";
import { canAffordAiEconomyCost } from "./ai-economy-policy";
import { createAiResourceCostClaims } from "./ai-resource-cost-claims";

const SERVICE_RADIUS = 10;
const SITE_RADIUS = 6;
const MAX_PENDING_TICKS = 1200;

function position(actor: AiObservedActorV1): Vector3Simple | null {
  return actor.logicalPosition.status === "known" ? actor.logicalPosition.value : null;
}

function distance(left: Vector3Simple, right: Vector3Simple): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
}

function ready(actor: AiObservedActorV1): boolean {
  return actor.constructionProgress?.status !== "known" || actor.constructionProgress.value >= 100;
}

function pendingSite(state: AiBrainStateV1, sourceId: string, tick: number): boolean {
  return state.reservations.some((reservation) => {
    if (!reservation.subjectKey?.startsWith(`site:resource-service:${sourceId}:`)) return false;
    if (reservation.state.kind === "applied_spending") return false;
    if (reservation.state.kind === "provisional" && reservation.state.expiresAt.dueTick <= tick) return false;
    return reservation.createdTick + MAX_PENDING_TICKS > tick;
  });
}

function selectSite(
  observation: AiObservationV1,
  sourcePosition: Vector3Simple,
  nearestServiceDistance: number,
  footprintRadius: number,
  rejectedAttempts: number
): Vector3Simple | null {
  const cells = observation.map?.constructionCells ?? [];
  const byKey = new Map(cells.map((cell) => [cell.tileKey, cell]));
  const candidates = cells
    .filter((cell) => {
      const travel = distance(cell.position, sourcePosition);
      if (travel < footprintRadius + 1 || travel > SITE_RADIUS || travel * 4 > nearestServiceDistance * 3) {
        return false;
      }
      for (let y = -footprintRadius; y <= footprintRadius; y += 1) {
        for (let x = -footprintRadius; x <= footprintRadius; x += 1) {
          const footprint = byKey.get(`${cell.position.x + x},${cell.position.y + y}`);
          if (!footprint?.groundPassable || footprint.observedBlocked) return false;
        }
      }
      return true;
    })
    .sort(
      (left, right) =>
        distance(left.position, sourcePosition) - distance(right.position, sourcePosition) ||
        left.tileKey.localeCompare(right.tileKey)
    );
  return candidates[rejectedAttempts % Math.max(1, candidates.length)]?.position ?? null;
}

/** Adds local resource service only where a visible source and legal definition justify its marginal travel value. */
export class AiResourceServiceManager implements AiProposalManagerV1 {
  readonly managerId = "resource-service";

  constructor(private readonly getCatalog: () => AiCapabilityCatalogV1 | undefined) {}

  propose(observation: AiObservationV1, state: AiBrainStateV1): AiManagerProposalV1 {
    const catalog = this.getCatalog();
    if (!catalog || catalog.generation !== observation.generation) {
      return {
        managerId: this.managerId,
        lane: "essential_economy",
        evaluated: false,
        intents: [],
        reasons: ["catalog_not_ready"]
      };
    }
    const owned = observation.actors.filter((actor) => actor.relation === "self" && actor.visibility === "owned");
    const workers = owned.filter((actor) =>
      catalog.entries.some((entry) => entry.sourceObjectName === actor.objectName && entry.gathers.length > 0)
    );
    const sources = observation.actors
      .filter((actor) => actor.relation !== "enemy" && actor.visibility !== "last_seen")
      .filter(
        (actor) => actor.resourceState.status === "known" && actor.resourceState.value.available.status === "known"
      )
      .filter((actor) => actor.resourceState.status === "known" && actor.resourceState.value.available.value >= 100)
      .filter(
        (actor) => actor.resourceState.status === "known" && actor.resourceState.value.resourceType !== ResourceType.Food
      )
      .filter((actor) => position(actor) !== null)
      .sort((left, right) => left.actorId.localeCompare(right.actorId));
    for (const source of sources) {
      if (source.resourceState.status !== "known") continue;
      const type = source.resourceState.value.resourceType;
      const sourcePosition = position(source)!;
      const assignedWorkers = workers.filter(
        (worker) =>
          worker.activeOrder?.status === "known" &&
          worker.activeOrder.value?.orderType === OrderType.Gather &&
          worker.activeOrder.value.targetActorId === source.actorId
      ).length;
      const forecast = state.economyProduction.forecasts.find((entry) => entry.resourceType === type)?.amount ?? 0;
      if (assignedWorkers === 0 && (workers.length < 6 || forecast <= 0)) continue;
      const services = owned.filter(
        (actor) =>
          catalog.entries.some(
            (entry) => entry.sourceObjectName === actor.objectName && entry.acceptsResources?.includes(type)
          ) && position(actor) !== null
      );
      const nearestServiceDistance = Math.min(
        Number.POSITIVE_INFINITY,
        ...services.map((service) => distance(position(service)!, sourcePosition))
      );
      if (nearestServiceDistance <= SERVICE_RADIUS || pendingSite(state, source.actorId, observation.tick)) continue;
      const serviceEntry = catalog.entries
        .filter((entry) => entry.acceptsResources?.includes(type) && entry.constructionProfile)
        .filter((entry) =>
          workers.some((worker) =>
            catalog.entries.some(
              (builder) =>
                builder.sourceObjectName === worker.objectName && builder.constructs.includes(entry.sourceObjectName)
            )
          )
        )
        .sort(
          (left, right) =>
            (left.acceptsResources?.length ?? 0) - (right.acceptsResources?.length ?? 0) ||
            left.sourceObjectName.localeCompare(right.sourceObjectName)
        )[0];
      if (!serviceEntry || !canAffordAiEconomyCost(observation, serviceEntry.constructionProfile!.resourceCost)) continue;
      if (
        services.some(
          (actor) =>
            actor.objectName === serviceEntry.sourceObjectName &&
            !ready(actor) &&
            distance(position(actor)!, sourcePosition) <= SERVICE_RADIUS
        )
      ) continue;
      const builder = workers
        .filter((actor) => actor.activeOrder?.status !== "known" || actor.activeOrder.value?.orderType !== OrderType.Build)
        .sort(
          (left, right) =>
            distance(position(left) ?? sourcePosition, sourcePosition) -
              distance(position(right) ?? sourcePosition, sourcePosition) ||
            left.actorId.localeCompare(right.actorId)
        )
        .find((actor) =>
          catalog.entries.some(
            (entry) => entry.sourceObjectName === actor.objectName && entry.constructs.includes(serviceEntry.sourceObjectName)
          )
        );
      if (!builder) continue;
      const rejectedAttempts = state.pendingOutcomes.filter(
        (outcome) =>
          outcome.identity.effectId.startsWith(`effect:resource-service:${source.actorId}:`) &&
          ["rejected", "failed", "cancelled"].includes(outcome.kind)
      ).length;
      const site = selectSite(
        observation,
        sourcePosition,
        nearestServiceDistance,
        serviceEntry.constructionProfile!.footprintRadiusTiles,
        rejectedAttempts
      );
      if (!site) continue;
      const suffix = `${source.actorId}:${state.scheduler.decisionSequence}`;
      const intentId = `intent:resource-service:${suffix}` as AiIntentV1["intentId"];
      const effectId = `effect:resource-service:${suffix}` as AiIntentV1["effectId"];
      const claimId = `claim:resource-service:${suffix}` as AiIntentV1["claims"][number]["claimId"];
      const siteKey = `resource-service:${source.actorId}:${site.x},${site.y}`;
      const intent: AiIntentV1 = {
        intentId,
        effectId,
        kind: "construct",
        spendingCategory: "economy",
        planId: `plan:resource-service:${source.actorId}` as AiIntentV1["planId"],
        demandId: `demand:resource-service:${source.actorId}` as AiIntentV1["demandId"],
        lane: "optional_infrastructure_tech",
        proposedTick: observation.tick,
        urgencyClass: 4,
        utility: 590,
        preconditions: [{ kind: "actor_exists", actorId: builder.actorId }, { kind: "actor_exists", actorId: source.actorId }],
        claims: [
          { claimId, kind: "actor", actorId: builder.actorId },
          { claimId: `${claimId}:site` as typeof claimId, kind: "site", siteKey },
          ...createAiResourceCostClaims(claimId, serviceEntry.constructionProfile!.resourceCost),
          { claimId: `${claimId}:effect` as typeof claimId, kind: "effect", effectId }
        ],
        reasonCode: `resource_service:${type}:${source.actorId}:existing_distance=${nearestServiceDistance}`,
        builderIds: [builder.actorId],
        objectName: serviceEntry.sourceObjectName,
        logicalPosition: site,
        siteKey
      };
      return {
        managerId: this.managerId,
        lane: "optional_infrastructure_tech",
        evaluated: true,
        intents: [intent],
        reasons: [`resource_service:${type}:${source.actorId}`]
      };
    }
    return {
      managerId: this.managerId,
      lane: "optional_infrastructure_tech",
      evaluated: true,
      intents: [],
      reasons: ["resource_service:not_needed_or_not_legal"]
    };
  }
}
