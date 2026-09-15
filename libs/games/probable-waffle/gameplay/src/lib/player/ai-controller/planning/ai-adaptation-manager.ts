import type { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogEntryV1, AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";
import type { AiEffectId, AiEvidenceId } from "../contracts/ai-core-types";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "./ai-manager-proposal";

type AdaptationRole = AiBrainStateV1["economyProduction"]["adaptation"]["activeRoleTargets"][number]["role"];
type EvidenceKind = AiBrainStateV1["economyProduction"]["adaptation"]["evidence"][number]["kind"];
const VISIBLE_EVIDENCE_CONFIDENCE_PERMILLE = 700;

function owned(observation: AiObservationV1) {
  return observation.actors.filter((actor) => actor.relation === "self" && actor.visibility === "owned");
}

function ids(state: AiBrainStateV1, prefix: string, ordinal: number) {
  const suffix = `${state.scheduler.decisionSequence}:${ordinal}`;
  return {
    intentId: `intent:stage14:${prefix}:${suffix}` as AiIntentV1["intentId"],
    effectId: `effect:stage14:${prefix}:${suffix}` as AiIntentV1["effectId"],
    claimId: `claim:stage14:${prefix}:${suffix}` as AiIntentV1["claims"][number]["claimId"]
  };
}

function enemyEvidence(observation: AiObservationV1): readonly {
  readonly evidenceId: AiEvidenceId;
  readonly kind: EvidenceKind;
  readonly sourceContactId: string;
  readonly confidencePermille: number;
  readonly permittedFacts: readonly string[];
}[] {
  return observation.actors
    .filter((actor) => actor.relation === "enemy" && actor.visibility !== "last_seen")
    .flatMap((actor) => {
      const kinds: { kind: EvidenceKind; facts: string[] }[] = [];
      if (actor.capabilities.some((capability) => capability.domains.includes("air"))) {
        kinds.push({ kind: "flyer", facts: ["visible_air_movement"] });
      }
      if (
        (actor.housingCost.status === "known" &&
          actor.housingCost.value > 0 &&
          actor.capabilities.some((capability) => capability.domains.includes("water"))) ||
        (actor.containerState?.status === "known" && actor.containerState.value.mobileDomains.length > 0)
      ) {
        kinds.push({ kind: "water_or_transport", facts: ["visible_water_or_container"] });
      }
      if (
        actor.combatProfile?.status === "known" &&
        actor.combatProfile.value.attacks.some((attack) => attack.areaRadius > 0)
      ) {
        kinds.push({ kind: "area_damage", facts: ["visible_area_attack"] });
      }
      if (
        actor.capabilities.every((capability) => capability.domains.length === 0) &&
        actor.combatProfile?.status === "known" &&
        actor.combatProfile.value.attacks.length > 0
      ) {
        kinds.push({ kind: "static_fortification", facts: ["visible_static_attack"] });
      }
      return kinds.map(({ kind, facts }) => ({
        evidenceId: `evidence:adapt:${kind}:${actor.evidenceId}` as AiEvidenceId,
        kind,
        sourceContactId: actor.actorId,
        confidencePermille: VISIBLE_EVIDENCE_CONFIDENCE_PERMILLE,
        permittedFacts: facts
      }));
    })
    .sort((left, right) => left.evidenceId.localeCompare(right.evidenceId));
}

function mergeEvidence(
  state: AiBrainStateV1,
  observation: AiObservationV1
): AiBrainStateV1["economyProduction"]["adaptation"]["evidence"] {
  const previous = new Map(state.economyProduction.adaptation.evidence.map((entry) => [entry.evidenceId, entry]));
  const visible = enemyEvidence(observation).map((entry) => {
    const earlier = previous.get(entry.evidenceId);
    return {
      ...entry,
      observedTick: observation.tick,
      confidencePermille: Math.max(entry.confidencePermille, earlier?.confidencePermille ?? 0),
      consecutiveEvaluations: Math.min(2, (earlier?.consecutiveEvaluations ?? 0) + 1),
      permittedFacts: [...new Set([...(earlier?.permittedFacts ?? []), ...entry.permittedFacts])].sort()
    };
  });
  const rememberedContactIds = new Set(
    observation.actors
      .filter((actor) => actor.relation === "enemy" && actor.visibility === "last_seen")
      .map((actor) => actor.actorId)
  );
  const decayed = state.economyProduction.adaptation.evidence
    .filter((entry) => rememberedContactIds.has(entry.sourceContactId))
    .filter((entry) => !visible.some((current) => current.evidenceId === entry.evidenceId))
    .map((entry) => ({
      ...entry,
      confidencePermille: Math.max(
        0,
        VISIBLE_EVIDENCE_CONFIDENCE_PERMILLE - Math.max(0, observation.tick - entry.observedTick)
      ),
      consecutiveEvaluations: 0
    }))
    .filter((entry) => entry.confidencePermille > 0);
  return [...visible, ...decayed].sort((left, right) => left.evidenceId.localeCompare(right.evidenceId));
}

function roleTargets(
  evidence: AiBrainStateV1["economyProduction"]["adaptation"]["evidence"],
  state: AiBrainStateV1
): readonly {
  readonly role: AdaptationRole;
  readonly desired: number;
  readonly evidenceIds: readonly AiEvidenceId[];
}[] {
  const confirmed = evidence.filter((entry) => entry.consecutiveEvaluations >= 2 && entry.confidencePermille >= 500);
  const byKind = (kind: EvidenceKind) =>
    confirmed
      .filter((entry) => entry.kind === kind)
      .map((entry) => entry.evidenceId)
      .sort();
  const offensiveObjective = ["pressure", "expand", "finish"].includes(state.strategy.stance);
  const targets: { role: AdaptationRole; desired: number; evidenceIds: readonly AiEvidenceId[] }[] = [
    { role: "anti_air", desired: Math.min(2, byKind("flyer").length), evidenceIds: byKind("flyer") },
    {
      role: "water_control",
      desired: Math.min(2, byKind("water_or_transport").length),
      evidenceIds: byKind("water_or_transport")
    },
    { role: "ranged", desired: Math.min(2, byKind("area_damage").length), evidenceIds: byKind("area_damage") },
    { role: "support", desired: Math.min(1, byKind("area_damage").length), evidenceIds: byKind("area_damage") },
    {
      role: "fortification_breaker",
      desired: offensiveObjective ? Math.min(2, byKind("static_fortification").length) : 0,
      evidenceIds: byKind("static_fortification")
    }
  ];
  return targets.filter((target) => target.desired > 0);
}

function entryFor(catalog: AiCapabilityCatalogV1, objectName: ObjectNames): AiCapabilityCatalogEntryV1 | undefined {
  return catalog.entries.find((entry) => entry.sourceObjectName === objectName);
}

function matchesRole(entry: AiCapabilityCatalogEntryV1, role: AdaptationRole): boolean {
  const family = entry.family.toLowerCase();
  switch (role) {
    case "anti_air":
      return entry.targetDomains.includes("air");
    case "water_control":
      return entry.movementDomains.includes("water") && entry.targetDomains.includes("water");
    case "ranged":
      return family.includes("range") || family.includes("spell");
    case "support":
      return family.includes("heal") || family.includes("support") || family.includes("spell");
    case "fortification_breaker":
      return entry.movementDomains.includes("air") || family.includes("range") || family.includes("spell");
    case "frontline":
      return !family.includes("range") && !family.includes("heal") && entry.targetDomains.includes("ground");
  }
}

function currentRoleActorIds(
  observation: AiObservationV1,
  catalog: AiCapabilityCatalogV1,
  role: AdaptationRole
): readonly ActorId[] {
  return owned(observation)
    .filter((actor) => {
      const entry = entryFor(catalog, actor.objectName);
      return entry !== undefined && matchesRole(entry, role);
    })
    .map((actor) => actor.actorId)
    .sort();
}

/** Accepted counter production remains a counted commitment until shared reconciliation releases it. */
function pendingRoleCommitments(state: AiBrainStateV1, role: AdaptationRole): number {
  return state.reservations.filter(
    (reservation) => reservation.subjectKey?.startsWith(`effect:effect:stage14:${role}:`) === true
  ).length;
}

function pendingRoleEffectIds(state: AiBrainStateV1, role: AdaptationRole): readonly AiEffectId[] {
  return state.reservations
    .map((reservation) => reservation.subjectKey)
    .filter((subjectKey): subjectKey is string => subjectKey?.startsWith(`effect:effect:stage14:${role}:`) === true)
    .map((subjectKey) => subjectKey.slice("effect:".length) as AiEffectId)
    .sort();
}

function producerForRole(
  observation: AiObservationV1,
  catalog: AiCapabilityCatalogV1,
  role: AdaptationRole,
  remainingResources: ReadonlyMap<ResourceType, number>
):
  | {
      readonly producerId: ActorId;
      readonly objectName: ObjectNames;
      readonly resourceCost: Readonly<Partial<Record<ResourceType, number>>>;
    }
  | undefined {
  for (const producer of owned(observation).sort((left, right) => left.actorId.localeCompare(right.actorId))) {
    if (producer.queue.status === "known" && producer.queue.value.occupied >= producer.queue.value.capacity) continue;
    const producerEntry = entryFor(catalog, producer.objectName);
    const product = producerEntry?.produces
      .map((candidate) => ({ candidate, entry: entryFor(catalog, candidate) }))
      .filter(
        (candidate): candidate is { candidate: ObjectNames; entry: AiCapabilityCatalogEntryV1 } =>
          candidate.entry !== undefined
      )
      .filter((candidate) => matchesRole(candidate.entry, role))
      .filter((candidate) =>
        Object.entries(candidate.entry.constructionProfile?.resourceCost ?? {}).every(
          ([resourceType, amount]) => (remainingResources.get(resourceType as ResourceType) ?? 0) >= (amount ?? 0)
        )
      )
      .sort((left, right) => {
        const totalCost = (entry: AiCapabilityCatalogEntryV1) =>
          Object.values(entry.constructionProfile?.resourceCost ?? {}).reduce<number>(
            (total, amount) => total + (amount ?? 0),
            0
          );
        return totalCost(left.entry) - totalCost(right.entry) || left.candidate.localeCompare(right.candidate);
      })[0];
    if (product)
      return {
        producerId: producer.actorId,
        objectName: product.candidate,
        resourceCost: product.entry.constructionProfile?.resourceCost ?? {}
      };
  }
  return undefined;
}

function archetypeFallback(
  state: AiBrainStateV1,
  observation: AiObservationV1,
  catalog: AiCapabilityCatalogV1
): { readonly id: string; readonly reason: string } | undefined {
  const archetypeParts = state.opening.archetypeId.split(":");
  const purpose = archetypeParts[archetypeParts.length - 1];
  const producerPathAvailable = (role: AdaptationRole) =>
    catalog.entries.some((entry) =>
      entry.produces.some((candidate) => {
        const product = entryFor(catalog, candidate);
        return product !== undefined && matchesRole(product, role);
      })
    );
  const mapHasWater = observation.map?.accessGraph?.nodes.some((node) => node.domain === "water") ?? false;
  const transport = catalog.entries.some((entry) =>
    entry.produces.some((candidate) => {
      const product = entryFor(catalog, candidate);
      return product !== undefined && (product.cargoCapacity ?? 0) > 0 && product.movementDomains.length > 0;
    })
  );
  const unsupported =
    (purpose === "air_control" && !producerPathAvailable("anti_air")) ||
    (purpose === "naval" && (!mapHasWater || !producerPathAvailable("water_control"))) ||
    (purpose === "expeditionary" && !transport);
  return unsupported
    ? {
        id: `opening:${observation.faction}:balanced`,
        reason: `archetype_fallback:${purpose}:capability_or_access_unavailable`
      }
    : undefined;
}

function researchScore(
  candidate: AiObservationV1["researchCandidates"][number],
  observation: AiObservationV1,
  catalog: AiCapabilityCatalogV1,
  state: AiBrainStateV1
): number {
  const self = owned(observation);
  const upgradeTarget = candidate.benefit.kind === "unit_level" ? candidate.benefit.targetObjectName : null;
  const beneficiaries = upgradeTarget
    ? self.filter((actor) => actor.objectName === upgradeTarget).length +
      self.filter((actor) => entryFor(catalog, actor.objectName)?.produces.includes(upgradeTarget)).length
    : self.filter(
        (actor) =>
          actor.combatProfile?.status === "known" &&
          actor.combatProfile.value.spells.some((spell) => spell.spellType === candidate.benefit.spellType)
      ).length;
  const resources = Object.values(candidate.cost).reduce((total, value) => total + (value ?? 0), 0);
  const researchProducer = self.find((actor) => actor.actorId === candidate.producerId);
  const queueDelay = researchProducer?.queue.status === "known" ? researchProducer.queue.value.occupied * 60 : 0;
  const survivalCost = observation.threatSummary.visibleEnemyActorIds.length > 0 ? 400 : 0;
  const archetypeParts = state.opening.archetypeId.split(":");
  const purpose = archetypeParts[archetypeParts.length - 1];
  const archetypeBias = purpose === "tech" ? 200 : purpose === "rush" || purpose === "pressure" ? -100 : 0;
  return Math.max(
    0,
    Math.min(
      1000,
      beneficiaries * 180 +
        180 -
        Math.round(resources / 2) -
        Math.round(candidate.durationTicks / 10) -
        queueDelay -
        survivalCost +
        archetypeBias
    )
  );
}

/**
 * Stage-14 pure adaptation owner. It consumes only recorded visible evidence and
 * runtime-legal tech candidates, preserving useful production commitments while
 * adding bounded counter roles or a demonstrably valuable upgrade.
 */
export class AiAdaptationManager implements AiProposalManagerV1 {
  readonly managerId = "stagez14.adaptation";

  constructor(
    private readonly profile: AiProfileConfigV1,
    private readonly getCatalog: () => AiCapabilityCatalogV1 | undefined
  ) {}

  propose(observation: AiObservationV1, state: AiBrainStateV1): AiManagerProposalV1 {
    const catalog = this.getCatalog();
    if (!catalog || catalog.generation !== observation.generation) {
      return {
        managerId: this.managerId,
        lane: "optional_infrastructure_tech",
        evaluated: false,
        intents: [],
        reasons: ["catalog_not_ready"]
      };
    }
    const evidence = mergeEvidence(state, observation);
    const targets = roleTargets(evidence, state);
    const prior = state.economyProduction.adaptation;
    const canTransition =
      prior.lastTransitionTick === null ||
      observation.tick - prior.lastTransitionTick >= this.profile.compositionReconsiderationTicks;
    const adaptationDemands: AiDemandV1[] = [];
    const intents: AiIntentV1[] = [];
    const remainingResources = new Map(
      observation.resources.map(
        (resource) =>
          [resource.resourceType, resource.stockpile - resource.reservedUnspent - resource.obligationsDue] as const
      )
    );
    let ordinal = 0;

    for (const target of targets) {
      const currentActorIds = currentRoleActorIds(observation, catalog, target.role);
      const acceptedEffectIds = pendingRoleEffectIds(state, target.role);
      const current = currentActorIds.length;
      const committed = pendingRoleCommitments(state, target.role);
      adaptationDemands.push({
        demandId: `demand:adapt:${target.role}` as AiDemandV1["demandId"],
        purpose: "evidence_backed_counter",
        capabilityOrRole: target.role,
        unit: "actor_count",
        desired: target.desired,
        satisfiedActorIds: currentActorIds,
        queuedIds: [],
        constructingIds: [],
        acceptedNotObservedEffectIds: acceptedEffectIds,
        preferredObjectNames: [],
        resourceObligations: {}
      });
      if (!canTransition || current + committed >= target.desired) continue;
      const producer = producerForRole(observation, catalog, target.role, remainingResources);
      if (!producer) continue;
      const next = ids(state, target.role, ordinal++);
      const resourceClaims = Object.entries(producer.resourceCost)
        .filter((entry): entry is [ResourceType, number] => entry[1] !== undefined && entry[1] > 0)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([resourceType, amount]) => ({
          claimId: `${next.claimId}:${resourceType}` as AiIntentV1["claims"][number]["claimId"],
          kind: "resource" as const,
          resourceType,
          amount
        }));
      intents.push({
        ...next,
        kind: "produce",
        planId: state.opening.plan.planId,
        demandId: `demand:adapt:${target.role}` as AiDemandV1["demandId"],
        lane: "supply_production",
        proposedTick: observation.tick,
        urgencyClass: 2,
        utility: target.role === "fortification_breaker" && state.opening.archetypeId.endsWith(":rush") ? 800 : 760,
        preconditions: [{ kind: "actor_exists", actorId: producer.producerId }],
        claims: [
          { claimId: next.claimId, kind: "production_slot", producerId: producer.producerId, slot: 0 },
          ...resourceClaims,
          {
            claimId: `${next.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
            kind: "effect",
            effectId: next.effectId
          }
        ],
        reasonCode: `adapt:${target.role}:confirmed=${target.evidenceIds.join(",")}:current=${current}:committed=${committed}/${target.desired}`,
        producerId: producer.producerId,
        objectName: producer.objectName
      });
      for (const [resourceType, amount] of Object.entries(producer.resourceCost)) {
        remainingResources.set(
          resourceType as ResourceType,
          Math.max(0, (remainingResources.get(resourceType as ResourceType) ?? 0) - (amount ?? 0))
        );
      }
    }

    const pendingResearch = state.reservations.some(
      (reservation) => reservation.subjectKey?.startsWith("effect:effect:stage14:research:") === true
    );
    const survivalThreatVisible = observation.threatSummary.visibleEnemyActorIds.length > 0;
    const scoredResearch =
      pendingResearch || survivalThreatVisible
        ? undefined
        : observation.researchCandidates
            .map((candidate) => ({ candidate, score: researchScore(candidate, observation, catalog, state) }))
            .filter((entry) => entry.score > 0)
            .sort(
              (left, right) =>
                right.score - left.score ||
                left.candidate.researchType.localeCompare(right.candidate.researchType) ||
                left.candidate.producerId.localeCompare(right.candidate.producerId)
            )[0];
    if (scoredResearch) {
      const next = ids(state, "research", ordinal++);
      const resourceClaims = Object.entries(scoredResearch.candidate.cost)
        .filter((entry): entry is [ResourceType, number] => entry[1] !== undefined && entry[1] > 0)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([resourceType, amount]) => ({
          claimId: `${next.claimId}:${resourceType}` as AiIntentV1["claims"][number]["claimId"],
          kind: "resource" as const,
          resourceType,
          amount
        }));
      intents.push({
        ...next,
        kind: "research",
        planId: state.opening.plan.planId,
        demandId: null,
        lane: "optional_infrastructure_tech",
        proposedTick: observation.tick,
        urgencyClass: 4,
        utility: scoredResearch.score,
        preconditions: [{ kind: "actor_exists", actorId: scoredResearch.candidate.producerId }],
        claims: [
          { claimId: next.claimId, kind: "production_slot", producerId: scoredResearch.candidate.producerId, slot: 0 },
          ...resourceClaims,
          {
            claimId: `${next.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
            kind: "effect",
            effectId: next.effectId
          }
        ],
        reasonCode: `research:${scoredResearch.candidate.researchType}:benefit_over_1200_ticks=${scoredResearch.score}`,
        producerId: scoredResearch.candidate.producerId,
        researchType: scoredResearch.candidate.researchType
      });
    }

    const fallback = archetypeFallback(state, observation, catalog);
    const activeRoleTargets = canTransition ? targets : prior.activeRoleTargets;
    return {
      managerId: this.managerId,
      lane: "optional_infrastructure_tech",
      evaluated: true,
      intents,
      reasons: [
        `adaptation_evidence:${evidence.length}`,
        `composition_transition:${canTransition ? "eligible" : "cooldown"}`,
        `committed_production:${prior.cancellationPolicy}`,
        scoredResearch ? `research_score:${scoredResearch.score}` : "research:no_positive_legal_candidate",
        fallback?.reason ?? `archetype:${state.opening.archetypeId}`
      ],
      statePatch: {
        ...(fallback ? { openingArchetypeId: fallback.id } : {}),
        adaptationDemands,
        adaptation: {
          evidence,
          activeRoleTargets,
          lastTransitionTick: canTransition && targets.length > 0 ? observation.tick : prior.lastTransitionTick,
          lastTransitionReason:
            canTransition && targets.length > 0
              ? targets.map((target) => target.role).join(",")
              : prior.lastTransitionReason,
          selectedResearchType: scoredResearch?.candidate.researchType ?? null,
          selectedResearchScore: scoredResearch?.score ?? null,
          cancellationPolicy: "retain_committed_production"
        }
      }
    };
  }
}
