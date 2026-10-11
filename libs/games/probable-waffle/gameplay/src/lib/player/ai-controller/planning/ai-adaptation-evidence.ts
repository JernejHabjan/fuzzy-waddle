import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiEvidenceId } from "../contracts/ai-core-types";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiAdaptationRole } from "./ai-adaptation-role";

type EvidenceKind = AiBrainStateV1["economyProduction"]["adaptation"]["evidence"][number]["kind"];
const VISIBLE_EVIDENCE_CONFIDENCE_PERMILLE = 700;

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

export function mergeAdaptationEvidence(
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

export function adaptationRoleTargets(
  evidence: AiBrainStateV1["economyProduction"]["adaptation"]["evidence"],
  state: AiBrainStateV1
): readonly {
  readonly role: AiAdaptationRole;
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
  const targets: { role: AiAdaptationRole; desired: number; evidenceIds: readonly AiEvidenceId[] }[] = [
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
