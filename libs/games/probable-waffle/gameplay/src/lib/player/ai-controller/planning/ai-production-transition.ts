import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiProductionTransitionV1 } from "../contracts/brain-state/ai-production-transition-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import { canAffordAiEconomyCost, hasCredibleAiEconomyThreat } from "./ai-economy-policy";
import { producerMilitaryProducts } from "./ai-military-catalog";
import { isAvailableBuilder, isFinishedActor, owned } from "./ai-macro-observation";

/** Retains the existing bounded eight-work producer horizon while replacing its timing with definition facts. */
const WORK_PER_LANE_HORIZON = 8;

/**
 * Macro owns at most one future schedule, admitted after the opening from an affordable visible objective and idle queue.
 * Dates use current definition work rates and retain the established bounded work horizon, without assuming application.
 * A changed objective/emergency abandons optional work; expiry is explicit and never moves the deadline forward.
 * The terminal record prevents repeatedly reviving the same objective. A different objective may establish a new schedule.
 */
export function observeAiProductionTransition(args: {
  readonly observation: AiObservationV1;
  readonly state: AiBrainStateV1;
  readonly catalog: AiCapabilityCatalogV1;
  readonly domain: "ground" | "air";
  readonly readyForce: number;
  readonly queuedForce: number;
  readonly openingComplete: boolean;
}): AiProductionTransitionV1 | undefined {
  const { observation, state, catalog, domain, readyForce, queuedForce, openingComplete } = args;
  const previous = state.economyProduction.transition;
  const assessment = state.strategy.assessment;
  const emergency = hasCredibleAiEconomyThreat(observation);
  if (previous?.status === "committed") {
    if (emergency || !assessment || assessment.targetActorId !== previous.targetActorId ||
      (assessment.choice !== "pressure" && assessment.choice !== "finish") || domain !== previous.domain) {
      return { ...previous, status: "abandoned", reason: emergency ? "essential_defense" : "objective_changed" };
    }
    if (observation.tick > previous.forceDeadlineTick) return { ...previous, status: "expired", reason: "force_deadline" };
    const readyProducts = owned(observation).filter((actor) => actor.objectName === previous.productObjectName &&
      isFinishedActor(actor)).length;
    if (readyProducts >= previous.desiredForce) return { ...previous, status: "fulfilled", reason: "ready_force_observed" };
    return previous;
  }
  if (!openingComplete || emergency || observation.tick <= 0 || !assessment ||
    assessment.choice !== "pressure" || assessment.routeDomain !== domain || !assessment.targetActorId ||
    !Number.isSafeInteger(assessment.requiredForce) || assessment.requiredForce < 1 ||
    assessment.requiredForce <= readyForce + queuedForce || assessment.expectedEffectTick === null ||
    (previous && previous.targetActorId === assessment.targetActorId)) return previous;
  const objective = observation.actors.find((actor) => actor.actorId === assessment.targetActorId);
  if (objective?.relation !== "enemy" || objective.visibility !== "visible") return previous;
  const self = owned(observation);
  const producer = self.filter(isFinishedActor).filter((actor) =>
    producerMilitaryProducts(actor.objectName, catalog, domain).length > 0 &&
    actor.queue.status === "known" && actor.queue.value.occupied === 0
  ).sort((left, right) => left.actorId.localeCompare(right.actorId))[0];
  if (!producer) return previous;
  const definition = catalog.entries.find((entry) => entry.sourceObjectName === producer.objectName);
  const timing = definition?.productionTiming;
  if (!definition?.constructionProfile || !timing?.singleBuilderTicks || timing.singleBuilderTicks <= 0 ||
    !Number.isSafeInteger(timing.singleBuilderTicks) || timing.lanes <= 0 || !Number.isSafeInteger(timing.lanes)) return previous;
  if (!self.some((builder) => isAvailableBuilder(builder) && catalog.entries.some((entry) =>
    entry.sourceObjectName === builder.objectName && entry.constructs.includes(producer.objectName)))) return previous;
  const product = producerMilitaryProducts(producer.objectName, catalog, domain).flatMap((objectName) => {
    const entry = catalog.entries.find((candidate) => candidate.sourceObjectName === objectName);
    return entry?.constructionProfile && entry.productionTiming && entry.productionTiming.durationTicks > 0 &&
      Number.isSafeInteger(entry.productionTiming.durationTicks) ? [entry] : [];
  }).sort((left, right) => {
    const total = (entry: AiCapabilityCatalogV1["entries"][number]) =>
      Object.values(entry.constructionProfile?.resourceCost ?? {}).reduce<number>((sum, amount) => sum + (amount ?? 0), 0);
    return total(left) - total(right) || left.sourceObjectName.localeCompare(right.sourceObjectName);
  })[0];
  if (!product?.productionTiming) return previous;
  const desiredForce = Math.min(24, assessment.requiredForce);
  const readyProducts = self.filter((actor) => actor.objectName === product.sourceObjectName && isFinishedActor(actor)).length;
  const queuedProducts = self.flatMap((actor) => actor.queue.status === "known" ? actor.queue.value.items ?? [] : [])
    .filter((item) => item.kind === "production" && item.objectName === product.sourceObjectName).length;
  const missing = Math.max(0, desiredForce - readyProducts - queuedProducts);
  const desiredProducers = Math.ceil(missing / (WORK_PER_LANE_HORIZON * timing.lanes));
  const compatible = self.filter(isFinishedActor).filter((actor) =>
    producerMilitaryProducts(actor.objectName, catalog, domain).includes(product.sourceObjectName));
  if (desiredProducers <= compatible.length || desiredProducers > 3) return previous;
  const cost = Object.fromEntries(Object.values(ResourceType).map((resourceType) => [resourceType,
    (definition.constructionProfile?.resourceCost[resourceType] ?? 0) * (desiredProducers - compatible.length) +
      (product.constructionProfile?.resourceCost[resourceType] ?? 0) * missing]));
  if (!canAffordAiEconomyCost(observation, cost)) return previous;
  const unitDurationTicks = product.productionTiming.durationTicks;
  // One unit cycle is an admission/travel allowance, not evidence that a builder or footprint has already succeeded.
  const beginsTick = observation.tick + timing.singleBuilderTicks + unitDurationTicks;
  const planId = `plan:production-transition:${state.playerNumber}:${state.scheduler.decisionSequence}` as const;
  return {
    planId,
    demandId: `demand:production-transition:${state.playerNumber}:${state.scheduler.decisionSequence}`,
    targetActorId: objective.actorId,
    domain,
    producerObjectName: producer.objectName,
    productObjectName: product.sourceObjectName,
    status: "committed",
    committedTick: observation.tick,
    beginsTick,
    forceDeadlineTick: beginsTick + WORK_PER_LANE_HORIZON * unitDurationTicks,
    desiredForce,
    desiredProducers,
    unitDurationTicks,
    reason: "affordable_observed_objective"
  };
}
