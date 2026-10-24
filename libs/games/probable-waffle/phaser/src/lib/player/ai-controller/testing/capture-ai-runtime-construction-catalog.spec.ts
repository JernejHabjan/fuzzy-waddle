import type Phaser from "phaser";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import type { ProductionSpatialAuthorityEvent } from "../../../world/services/multiplayer/production-spatial-authority-event";
import { captureAiRuntimeConstructionCatalog } from "./capture-ai-runtime-construction-catalog";

jest.mock("../../../prefabs/definitions/actor-definitions", () => ({ getPwActorDefinition: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

/** Synthetic authorities prove projection distinctions, never native payment or a live researched site. */
function fixture() {
  const site = { name: ObjectNames.Sandhold, scene: {} } as Phaser.GameObjects.GameObject;
  const event = {
    kind: "placement",
    site,
    legal: true,
    footprint: [{ x: 7, y: 9 }],
    admissionCost: { food: 7 },
    command: {
      type: "CONSTRUCT",
      tick: 20,
      playerNumber: 1,
      actorIds: ["builder"],
      actorName: ObjectNames.Sandhold,
      tileVec3: { x: 7, y: 9, z: 0 },
      siteKey: "site:key"
    }
  } satisfies Extract<ProductionSpatialAuthorityEvent, { kind: "placement" }>;
  const level = jest.fn(() => 2);
  jest.mocked(getSceneService).mockReturnValue({ getResearchedLevelForUnit: level } as never);
  const definition = {
    components: {
      productionCost: {
        costType: PaymentType.PayImmediately,
        productionTime: 150,
        resources: { food: 11 },
        refundFactor: 1
      }
    }
  };
  jest.mocked(getPwActorDefinition).mockReturnValue(definition as never);
  return { event, level, definition };
}

describe("construction command catalog", () => {
  it("keeps base admission separate from effective definition, configured payment and required work", () => {
    const f = fixture();
    const result = captureAiRuntimeConstructionCatalog(f.event);
    expect(result.gaps).toEqual([]);
    expect(result.catalog).toEqual({
      priceSource: "shared_command_base_definition",
      admissionCost: { food: 7 },
      siteDefinition: { researchedLevel: 2, cost: { food: 11 }, configuredPayment: "immediate", requiredWorkMs: 150 }
    });
    expect(f.level).toHaveBeenCalledWith(1, ObjectNames.Sandhold);
    expect(getPwActorDefinition).toHaveBeenLastCalledWith(ObjectNames.Sandhold, 2);
    f.event.admissionCost.food = 99;
    f.definition.components.productionCost.resources.food = 88;
    expect(result.catalog.admissionCost).toEqual({ food: 7 });
    expect(result.catalog.siteDefinition?.cost).toEqual({ food: 11 });
  });

  it("uses the component's null base-level lookup and distinguishes configured per-tick payment", () => {
    const f = fixture();
    f.level.mockReturnValue(1);
    f.definition.components.productionCost.costType = PaymentType.PayOverTime;
    const result = captureAiRuntimeConstructionCatalog(f.event);
    expect(getPwActorDefinition).toHaveBeenLastCalledWith(ObjectNames.Sandhold, null);
    expect(result.catalog.siteDefinition).toMatchObject({
      researchedLevel: 1,
      configuredPayment: "per_successful_tick"
    });
  });

  it("keeps missing tech and invalid effective values unavailable while retaining native admission", () => {
    for (const defect of ["tech", "level", "definition", "cost", "work"] as const) {
      const f = fixture();
      if (defect === "tech") jest.mocked(getSceneService).mockReturnValue(undefined);
      if (defect === "level") f.level.mockReturnValue(0);
      if (defect === "definition") jest.mocked(getPwActorDefinition).mockReturnValue(undefined);
      if (defect === "cost") f.definition.components.productionCost.resources.food = Number.NaN;
      if (defect === "work") f.definition.components.productionCost.productionTime = -1;
      const result = captureAiRuntimeConstructionCatalog(f.event);
      expect(result.catalog).toMatchObject({ admissionCost: { food: 7 }, siteDefinition: null });
      expect(result.gaps.length).toBeGreaterThan(0);
    }
  });
});
