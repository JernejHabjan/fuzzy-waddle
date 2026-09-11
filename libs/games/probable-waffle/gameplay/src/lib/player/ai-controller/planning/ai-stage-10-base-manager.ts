import type { ActorId, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBaseStateV1, AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "./ai-manager-proposal";

/** Sustained saturated local service before an expansion becomes a candidate. */
export const AI_STAGE_10_EXPANSION_SATURATION_TICKS = 600;
const BASE_MEMBER_RADIUS = 12;

function selfOwned(observation: AiObservationV1): AiObservedActorV1[] {
  return observation.actors.filter((actor) => actor.relation === "self" && actor.visibility === "owned");
}

function position(actor: AiObservedActorV1): Vector3Simple | null {
  return actor.logicalPosition.status === "known" ? actor.logicalPosition.value : null;
}

function distance(left: Vector3Simple, right: Vector3Simple): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
}

function baseId(anchorActorId: ActorId): AiBaseStateV1["baseId"] {
  return `base:main:${anchorActorId}`;
}

function stableSiteKey(base: AiBaseStateV1, candidate: Vector3Simple): string {
  return `${base.baseId}:${candidate.x}:${candidate.y}:${candidate.z}`;
}

function isMainBuilding(actor: AiObservedActorV1): boolean {
  return actor.mainBuilding?.status === "known" && actor.mainBuilding.value;
}

function resourceActors(observation: AiObservationV1): AiObservedActorV1[] {
  return observation.actors
    .filter((actor) => actor.relation !== "enemy" && actor.visibility !== "last_seen")
    .filter(
      (actor) =>
        actor.resourceState.status === "known" &&
        actor.resourceState.value.available.status === "known" &&
        actor.resourceState.value.available.value > 0
    )
    .filter((actor) => position(actor) !== null)
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
}

function siteCandidates(anchor: Vector3Simple, profile: AiProfileConfigV1): Vector3Simple[] {
  const rings = [4, 6, 8, 10];
  const candidates: Vector3Simple[] = [];
  for (const radius of rings) {
    for (const [x, y] of [
      [radius, 0],
      [0, radius],
      [-radius, 0],
      [0, -radius]
    ] as const) {
      candidates.push({ x: anchor.x + x, y: anchor.y + y, z: anchor.z });
      if (candidates.length >= profile.maxPlacementCandidatesPerStep) return candidates;
    }
  }
  return candidates;
}

/**
 * Stage 10 maintains stable bases from definition-backed main structures. It deliberately
 * creates only deterministic candidate reservations; the shared construction application
 * remains the authoritative footprint, terrain, collision and builder revalidation owner.
 */
export class AiStage10BaseManagerV1 implements AiProposalManagerV1 {
  readonly managerId = "stage-10-bases";

  constructor(
    private readonly profile: AiProfileConfigV1,
    private readonly getCatalog: () => AiCapabilityCatalogV1 | undefined
  ) {}

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

    const owned = selfOwned(observation);
    const anchors = owned
      .filter(isMainBuilding)
      .filter((actor) => position(actor) !== null)
      .sort((left, right) => left.actorId.localeCompare(right.actorId));
    const activeRejectedSiteHistory = state.bases
      .flatMap((base) => base.rejectedSiteKeys ?? [])
      .filter((entry) => entry.retryAfterTick > observation.tick)
      .filter(
        (entry, index, all) =>
          all.findIndex((candidate) => candidate.siteKey === entry.siteKey) === index
      )
      .sort((left, right) => left.siteKey.localeCompare(right.siteKey));
    const priorByAnchor = new Map(
      state.bases.filter((base) => base.anchorActorId).map((base) => [base.anchorActorId!, base])
    );
    const bases: AiBaseStateV1[] = anchors.map((anchor, anchorIndex) => {
      const anchorPosition = position(anchor)!;
      const prior = priorByAnchor.get(anchor.actorId);
      const establishedExpansion = state.bases
        .filter((base) => base.anchorActorId === null && base.anchorPosition)
        .filter((base) => distance(base.anchorPosition!, anchorPosition) <= 3)
        .sort((left, right) => left.baseId.localeCompare(right.baseId))[0];
      const memberActorIds = owned
        .filter((actor) => {
          const candidatePosition = position(actor);
          return candidatePosition !== null && distance(anchorPosition, candidatePosition) <= BASE_MEMBER_RADIUS;
        })
        .map((actor) => actor.actorId)
        .sort();
      return {
        baseId: prior?.baseId ?? establishedExpansion?.baseId ?? baseId(anchor.actorId),
        anchorActorId: anchor.actorId,
        memberActorIds,
        active: true,
        lifecycle: prior?.lifecycle === "evacuating" ? "evacuating" : "active",
        accessNodeId: anchor.accessNodeId.status === "known" ? anchor.accessNodeId.value : null,
        anchorPosition,
        reservedSiteKey: prior?.reservedSiteKey ?? establishedExpansion?.reservedSiteKey ?? null,
        rejectedSiteKeys:
          anchorIndex === 0
            ? activeRejectedSiteHistory
            : (prior?.rejectedSiteKeys ?? establishedExpansion?.rejectedSiteKeys ?? []).filter(
                (entry) => entry.retryAfterTick > observation.tick
              ),
        expansion: prior?.expansion ?? establishedExpansion?.expansion
      };
    });
    for (const prior of state.bases.filter(
      (base) => base.anchorActorId && !anchors.some((anchor) => anchor.actorId === base.anchorActorId)
    )) {
      bases.push({ ...prior, active: false, lifecycle: prior.lifecycle === "evacuating" ? "evacuating" : "lost" });
    }
    for (const prior of state.bases.filter((base) => base.anchorActorId === null)) {
      if (bases.some((base) => base.baseId === prior.baseId)) continue;
      // Stage 12 transfers a rejected site's backoff history to the next Stage 10
      // decision by clearing its reservation. The primary base now owns that global
      // history, so the terminal shell must not accumulate as a fake reserved base.
      if (prior.lifecycle === "reserved" && !prior.reservedSiteKey) continue;
      bases.push({
        ...prior,
        rejectedSiteKeys: (prior.rejectedSiteKeys ?? []).filter((entry) => entry.retryAfterTick > observation.tick)
      });
    }

    const primary = bases.find((base) => base.lifecycle === "active") ?? null;
    if (!primary || !primary.anchorPosition) {
      return {
        managerId: this.managerId,
        lane: "essential_economy",
        evaluated: true,
        intents: [],
        reasons: ["main_structure_not_observed"],
        statePatch: { bases }
      };
    }

    const nearbyResources = resourceActors(observation).filter(
      (resource) => distance(primary.anchorPosition!, position(resource)!) <= BASE_MEMBER_RADIUS
    );
    const localResourceValue = nearbyResources.reduce(
      (total, resource) =>
        total +
        (resource.resourceState.status === "known" && resource.resourceState.value.available.status === "known"
          ? resource.resourceState.value.available.value
          : 0),
      0
    );
    const deliveredIncome = observation.resources.reduce(
      (total, entry) =>
        total + (entry.deliveredIncomePerMinute.status === "known" ? entry.deliveredIncomePerMinute.value : 0),
      0
    );
    const openingComplete = state.opening.plan.lifecycle === "completed";
    const expansionTrigger = !openingComplete
      ? null
      : localResourceValue === 0
        ? "resource_life"
        : deliveredIncome === 0 && observation.tick >= AI_STAGE_10_EXPANSION_SATURATION_TICKS
          ? "worker_capacity"
          : null;
    const distantResource = resourceActors(observation)
      .filter((resource) => distance(primary.anchorPosition!, position(resource)!) > BASE_MEMBER_RADIUS)
      .sort(
        (left, right) =>
          distance(primary.anchorPosition!, position(left)!) - distance(primary.anchorPosition!, position(right)!) ||
          left.actorId.localeCompare(right.actorId)
      )[0];
    const intents: AiIntentV1[] = [];
    const existingExpansion = bases.find(
      (base) =>
        base.baseId.startsWith("base:expansion:") &&
        (base.lifecycle === "proposed" || base.lifecycle === "active" || base.lifecycle === "evacuating")
    );
    const rejectedSiteKeys = new Set(
      bases.flatMap((base) => base.rejectedSiteKeys?.map((entry) => entry.siteKey) ?? [])
    );
    if (expansionTrigger && distantResource && !existingExpansion) {
      const resourcePosition = position(distantResource)!;
      const candidate = siteCandidates(resourcePosition, this.profile).find(
        (entry) => !rejectedSiteKeys.has(stableSiteKey(primary, entry))
      );
      if (candidate) {
        const siteKey = stableSiteKey(primary, candidate);
        bases.push({
          baseId: `base:expansion:${siteKey}`,
          anchorActorId: null,
          memberActorIds: [],
          active: false,
          lifecycle: "proposed",
          accessNodeId: distantResource.accessNodeId.status === "known" ? distantResource.accessNodeId.value : null,
          anchorPosition: candidate,
          reservedSiteKey: siteKey,
          rejectedSiteKeys: [],
          expansion: {
            trigger: expansionTrigger,
            requestedAtTick: observation.tick,
            transportPlanId: null,
            evacuationRouteNodeId: primary.accessNodeId ?? null
          }
        });
      }
    }
    const expansion = bases.find(
      (base) => base.lifecycle === "proposed" && base.anchorPosition && base.reservedSiteKey
    );
    const macroOpening = state.opening.archetypeId.endsWith(":macro");
    const mainObject = anchors[0]?.objectName;
    const observedExpansionSite =
      expansion && mainObject
        ? owned.some(
            (actor) =>
              actor.objectName === mainObject &&
              position(actor) !== null &&
              distance(position(actor)!, expansion.anchorPosition!) <= 3
          )
        : false;
    const builder = mainObject
      ? owned
          .filter(
            (actor) => actor.activeOrder?.status !== "known" || actor.activeOrder.value?.orderType !== OrderType.Build
          )
          .find((actor) =>
            catalog.entries.some(
              (entry) => entry.sourceObjectName === actor.objectName && entry.constructs.includes(mainObject)
            )
          )
      : undefined;
    if (expansion && builder && expansion.anchorPosition && !observedExpansionSite) {
      // Main-building construction capability is definition-derived. If the faction has no legal
      // expansion structure exposed, the saved proposal remains explicit rather than guessing one.
      const canConstructMain =
        mainObject &&
        catalog.entries.some(
          (entry) => entry.sourceObjectName === builder.objectName && entry.constructs.includes(mainObject)
        );
      if (canConstructMain) {
        const ordinal = state.identities.nextIntent;
        const intentId = `intent:expansion:${ordinal}` as AiIntentV1["intentId"];
        const effectId = `effect:expansion:${ordinal}` as AiIntentV1["effectId"];
        const claimId = `claim:expansion:${ordinal}` as AiIntentV1["claims"][number]["claimId"];
        intents.push({
          intentId,
          effectId,
          planId: `plan:expansion:${expansion.baseId}` as AiIntentV1["planId"],
          demandId: `demand:expansion:${expansion.baseId}` as AiDemandV1["demandId"],
          kind: "construct",
          lane: "optional_infrastructure_tech",
          proposedTick: observation.tick,
          urgencyClass: 4,
          utility: macroOpening ? 660 : 520,
          preconditions: [{ kind: "actor_exists", actorId: builder.actorId }],
          claims: [
            { claimId, kind: "site", siteKey: expansion.reservedSiteKey! },
            {
              claimId: `${claimId}:builder` as AiIntentV1["claims"][number]["claimId"],
              kind: "actor",
              actorId: builder.actorId
            },
            { claimId: `${claimId}:effect` as AiIntentV1["claims"][number]["claimId"], kind: "effect", effectId }
          ],
          reasonCode: `expansion:${expansion.expansion?.trigger ?? "unknown"}:${macroOpening ? "macro_priority" : "candidate_reserved"}`,
          builderIds: [builder.actorId],
          objectName: mainObject!,
          logicalPosition: expansion.anchorPosition,
          siteKey: expansion.reservedSiteKey!
        });
      }
    }
    return {
      managerId: this.managerId,
      lane: "essential_economy",
      evaluated: true,
      intents,
      reasons: [
        `bases:${bases.filter((base) => base.lifecycle === "active").length}`,
        `local_resource:${localResourceValue}`,
        `expansion:${expansionTrigger ?? "not_needed"}`,
        `placement_authority:shared_command_application`
      ],
      statePatch: { bases }
    };
  }
}
