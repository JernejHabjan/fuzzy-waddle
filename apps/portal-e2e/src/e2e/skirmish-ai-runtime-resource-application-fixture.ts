import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import { resourceAdmissionFixture } from "./skirmish-ai-runtime-resource-admission-fixture";
import { resourceServiceFixture } from "./skirmish-ai-runtime-resource-service-fixture";

/** Application at tick 3, publication at tick 15, with real-shaped read frontiers enclosing the native pair. */
export function resourceApplicationFixture() {
  const f = resourceAdmissionFixture(), service = resourceServiceFixture();
  const credit = { ...f.credit, fact: { ...f.credit.fact, tick: 15 } };
  const facts = f.capture.facts.map((fact) => fact.sequence === credit.fact.sequence ? credit.fact :
    { ...fact, tick: fact.sequence >= 13 ? 3 : fact.sequence >= 9 ? 2 : 0 });
  const declaration = { ...service.interval, need: { ...service.interval.need, selectedTick: 0 },
    startTick: 1, endTick: 20, runCeilingTick: 20, windowTicks: 9, finalWindow: { ticks: 1, minimumUsefulDelivery: 1 } };
  const coverage = (tick: number, captureSequence: number) => ({ ...service.coverage(tick, captureSequence), startedTick: 0 });
  const template = service.capture.snapshots[0];
  const capture = { ...f.capture, facts, recipientResourceFacts: f.capture.recipientResourceFacts.map((fact) =>
    facts.find((candidate) => candidate.sequence === fact.sequence) ?? fact), resourceCoverage: coverage(20, 15),
    resourceIntervalDeclaration: { boundary: { tick: 0, captureSequence: 0 }, overflow: false, intervals: [declaration] },
    snapshots: [{ tick: 1, sequence: 8 }, { tick: 10, sequence: 14 }, { tick: 19, sequence: 15 }, { tick: 20, sequence: 15 }]
      .map(({ tick, sequence }) => ({ ...template, tick, afterSequence: sequence, resourceCoverage: coverage(tick, sequence) }))
  } satisfies AiRuntimeProductionCaptureV1;
  return { ...f, credit, capture, declaration, coverage };
}
