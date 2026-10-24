import { test, expect } from "@playwright/test";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { productionAuthorityFixture } from "./skirmish-ai-runtime-production-authority-fixture";
import { projectRuntimeControlledCommands } from "./skirmish-ai-runtime-production-controlled-commands";
// prettier-ignore
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";

function fixture() {
  const {
    raw: { capture }
  } = productionAuthorityFixture();
  const command = {
    type: "PRODUCTION" as const,
    playerNumber: 1,
    actorIds: ["producer"],
    actorName: ObjectNames.TivaraMacemanMale,
    tick: 4,
    execution: {
      schemaVersion: 1 as const,
      source: "human" as const,
      commandId: "native-command",
      commitmentKey: "native-command",
      authorityEpoch: 0,
      sequence: 0
    }
  };
  const control = {
    id: "controlled-production",
    playerNumber: 1,
    actorId: "producer",
    requestedTick: 1,
    scheduledTick: 4,
    setupItemId: null,
    outcomes: []
  };
  const facts: AiRuntimeProductionFactV1[] = [
    {
      kind: "preset_control",
      playerNumber: 1,
      sequence: 1,
      tick: 1,
      control: { ...control, phase: "requested", command: null }
    },
    {
      kind: "outcome",
      playerNumber: 1,
      sequence: 2,
      tick: 4,
      scheduledTick: 4,
      outcome: {
        schemaVersion: 1,
        kind: "dispatched",
        reason: "accepted_for_dispatch",
        tick: 4,
        playerNumber: 1,
        commandId: "native-command",
        commitmentKey: "native-command",
        authorityEpoch: 0,
        sequence: 0,
        actorIds: ["producer"],
        worldLinkIds: []
      }
    },
    { kind: "command_delivered", playerNumber: 1, sequence: 3, tick: 4, command },
    {
      kind: "preset_control",
      playerNumber: 1,
      sequence: 4,
      tick: 4,
      control: { ...control, phase: "applied", command }
    }
  ];
  return { ...capture, facts };
}

test("controlled commands retain native human identity without selected AI records", () => {
  const result = projectRuntimeControlledCommands(fixture());
  expect(result.failures).toEqual([]);
  expect(result.commands).toHaveLength(1);
  expect(result.commands[0]?.command.execution?.source).toBe("human");
});

test("controlled source, delayed identity, duplicate request and missing native delivery fail closed", () => {
  for (const defect of ["source", "date", "duplicate", "delivery"] as const) {
    const capture = fixture();
    if (defect === "delivery") capture.facts = capture.facts.filter((fact) => fact.kind !== "command_delivered");
    if (defect === "duplicate") {
      const first = capture.facts[0];
      if (!first) throw new Error("control_request_missing");
      capture.facts.push({ ...first, sequence: 5 });
    }
    if (defect === "source" || defect === "date")
      capture.facts = capture.facts.map((fact) => {
        if (fact.kind !== "preset_control" || fact.control.phase !== "applied" || !fact.control.command?.execution)
          return fact;
        return {
          ...fact,
          control: {
            ...fact.control,
            ...(defect === "date"
              ? { requestedTick: 2 }
              : {
                  command: {
                    ...fact.control.command,
                    execution: { ...fact.control.command.execution, source: "ai" as const }
                  }
                })
          }
        };
      });
    expect(projectRuntimeControlledCommands(capture).failures.length).toBeGreaterThan(0);
  }
});
