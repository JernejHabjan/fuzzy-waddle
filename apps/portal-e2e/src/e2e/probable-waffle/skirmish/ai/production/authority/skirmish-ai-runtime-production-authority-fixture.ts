import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
// prettier-ignore
import type { AiRuntimeProductionSetup } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/fixtures/ai-runtime-production-setup";
import type { RuntimeNativeProductionEvidence } from "../evidence/skirmish-ai-runtime-native-production-evidence";
import { normalizeRuntimeProductionSetup } from "../fixtures/skirmish-ai-runtime-production-setup";
import { productionConsumedDecisionFixture } from "../decisions/skirmish-ai-runtime-production-consumed-decision-fixture";

/** Invented authority controls only. They never enter the browser runner or certify a physical world. */
export function productionAuthorityFixture() {
  const raw = productionConsumedDecisionFixture();
  const setup = {
    tick: 0,
    seed: ["759"],
    map: "open",
    content: [],
    topology: [],
    players: [],
    commandAuthority: {
      schemaVersion: 1,
      authorityEpoch: 1,
      nextSequenceByPlayer: {},
      processedCommandIds: [],
      outcomes: []
    },
    actors: [{ actorId: "enemy", position: { x: 5, y: 5, z: 0 }, definition: { name: ObjectNames.TivaraMacemanMale } }]
  } satisfies AiRuntimeProductionSetup;
  const evidence = {
    schemaVersion: 2,
    setup: normalizeRuntimeProductionSetup(setup, { threat: "enemy" }),
    decisions: [
      {
        inputTick: raw.selected.decision.identity.tick,
        inputGeneration: raw.selected.decision.identity.generation,
        selectedTick: raw.selected.tick,
        selectedSequence: raw.selected.sequence,
        result: raw.selected.decision
      }
    ],
    coverage: {
      latestTick: 600,
      closedThroughTick: 600,
      requiredTicks: [600],
      gaps: [],
      intervals: [
        {
          capturedAtTick: 601,
          closedFromTick: 0,
          closedThroughTick: 600,
          afterSequence: 10,
          actors: [],
          queues: [],
          completedResearch: []
        }
      ]
    },
    lifecycle: {
      queues: [],
      cancellationRequests: [],
      construction: [],
      setupConstruction: [],
      constructionDefinitions: [],
      rejections: [],
      setupPayments: [],
      losses: [],
      failures: [],
      gaps: []
    },
    definitions: [],
    spatial: { placements: [], spawns: [], paths: [] },
    routes: { outputs: [], paths: [] },
    movements: [],
    failures: [],
    gaps: []
  } satisfies RuntimeNativeProductionEvidence;
  return { setup, evidence, raw };
}
