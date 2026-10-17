import type Phaser from "phaser";
import { ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
// prettier-ignore
import { createAiTestOwnedActor } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { getActorComponent } from "../../../data/actor-component";
import { projectResearchCandidates } from "./ai-observation-context";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));

it("offers research only after the observed producer finishes, even when its component already exists", () => {
  const actor = createAiTestOwnedActor("producer");
  const native = {} as Phaser.GameObjects.GameObject;
  jest.mocked(getActorComponent).mockReturnValue({
    isResearching: false,
    availableResearch: [ResearchType.TivaraMacemanUpgradeLevel2],
    canStartResearch: () => ({ canStart: true })
  } as never);
  const current = (value: number) => ({
    ...actor,
    constructionProgress: { status: "known" as const, value, observedTick: 0 }
  });
  const live = new Map([[actor.actorId, native]]);
  expect(projectResearchCandidates([current(99)], live)).toEqual([]);
  expect(projectResearchCandidates([current(100)], live)).toHaveLength(1);
});
