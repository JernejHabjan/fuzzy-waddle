import { expect, test } from "@playwright/test";
// prettier-ignore
import { AI_RUNTIME_MAX_FACTS } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/append-ai-runtime-production-fact";
import { routeOrderFixture } from "./skirmish-ai-runtime-route-order-fixture";
import { validateRuntimeRouteOrders } from "./skirmish-ai-runtime-route-order-validation";

test("root sequences use the aggregate cap while per-channel route identities keep their own limit", () => {
  const f = routeOrderFixture();
  const shifted = { ...f.capture, facts: f.capture.facts.map((fact) => ({ ...fact, sequence: fact.sequence + 8192 })) };
  expect(validateRuntimeRouteOrders(shifted).failures).not.toContain("production_route_order_boundary_invalid");
  const overflow = {
    ...shifted,
    facts: shifted.facts.map((fact) => ({ ...fact, sequence: fact.sequence + AI_RUNTIME_MAX_FACTS }))
  };
  expect(validateRuntimeRouteOrders(overflow).failures).toContain("production_route_order_boundary_invalid");
  const invalidOrder = {
    ...shifted,
    facts: shifted.facts.map((fact) =>
      fact.kind === "spatial_authority" && fact.spatial.kind === "route_order"
        ? { ...fact, spatial: { ...fact.spatial, order: { ...fact.spatial.order, orderId: 8193 } } }
        : fact
    )
  };
  expect(validateRuntimeRouteOrders(invalidOrder).failures).toContain("production_route_order_payload_invalid");
});
