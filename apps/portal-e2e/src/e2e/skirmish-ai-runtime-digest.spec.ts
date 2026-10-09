import { expect, test } from "@playwright/test";
import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import {
  digestRuntimeValue,
  projectRuntimePresetQueueDigest,
  projectRuntimeOutcomeDigestInput
} from "./skirmish-ai-runtime-digest";
import { productionCheckpoint } from "./skirmish-ai-runtime-digest-fixtures";

function initial(itemId: string) {
  return [
    {
      producerFixtureActorId: "producer-fixture",
      producerActorId: "actual-producer",
      itemId,
      kind: "production" as const,
      objectName: "frontline",
      researchType: null
    }
  ];
}

test("setup digest retains semantic products and repeated seed order without per-match command IDs", () => {
  expect(projectRuntimePresetQueueDigest(initial("queue:actual-producer:match-one"))).toEqual(
    projectRuntimePresetQueueDigest(initial("queue:actual-producer:match-two"))
  );
  expect(digestRuntimeValue(projectRuntimePresetQueueDigest(initial("one")))).not.toBe(
    digestRuntimeValue(
      projectRuntimePresetQueueDigest(initial("one").map((item) => ({ ...item, objectName: "other" })))
    )
  );
  expect(
    projectRuntimePresetQueueDigest([...initial("one"), ...initial("two")]).map((item) => item.setupOrdinal)
  ).toEqual([0, 1]);
});

test("composition digest retains item continuity/replacement while command session suffixes change", () => {
  const first = [
    productionCheckpoint(20, "queue:producer:command-one:match-A"),
    productionCheckpoint(100, "queue:producer:command-one:match-A")
  ];
  const equivalent = [
    productionCheckpoint(20, "queue:producer:command-one:match-B"),
    productionCheckpoint(100, "queue:producer:command-one:match-B")
  ];
  expect(projectRuntimeOutcomeDigestInput(first, false, true)).toEqual(
    projectRuntimeOutcomeDigestInput(equivalent, false, true)
  );
  expect(projectRuntimeOutcomeDigestInput(first, false, true)).not.toEqual(
    projectRuntimeOutcomeDigestInput(
      [requireAiTestEntry(first, 0), productionCheckpoint(100, "queue:producer:replacement:match-A")],
      false,
      true
    )
  );
});
