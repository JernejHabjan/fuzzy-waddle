import { assertAiNonNegativeFinite, assertAiNonNegativeInteger } from "./ai-core-types";
import type { AiWaitEdgeV1 } from "./ai-dependency-contracts";
import { assertUnique } from "./ai-validation-primitives";

/** Rejects duplicate and immediate self-dependent plan edges at admission boundaries. */
export function assertAiWaitEdgesV1(edges: readonly AiWaitEdgeV1[]): void {
  assertUnique(
    edges.map((edge) => edge.edgeId),
    "waitEdges.edgeId"
  );
  if (edges.some((edge) => edge.toPlanId !== null && edge.fromPlanId === edge.toPlanId)) {
    throw new Error("invalid_ai_dependency:self_dependency");
  }
  for (const edge of edges) {
    assertAiNonNegativeInteger(edge.deadline.dueTick, `waitEdges.${edge.edgeId}.deadline`);
    if (edge.prerequisite.kind === "resource" || edge.prerequisite.kind === "supply") {
      assertAiNonNegativeFinite(edge.prerequisite.amount, `waitEdges.${edge.edgeId}.amount`);
    }
  }
}
