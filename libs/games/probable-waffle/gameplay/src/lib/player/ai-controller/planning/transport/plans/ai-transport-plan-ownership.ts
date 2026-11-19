import type { AiTransportPlanContext } from "./ai-transport-plan-context";
import type { AiTransportPlanWithLifecycle } from "./ai-transport-plan-lifecycle";
import { withAiTransportPhase } from "./ai-transport-plan-state";

export function claimAiTransportPlanOwnership(
  plan: AiTransportPlanWithLifecycle,
  context: AiTransportPlanContext
): AiTransportPlanWithLifecycle | undefined {
  const lifecycle = plan.lifecycle;
  const transferSlot = (id: string | null) =>
    id ? `${id}:${Math.floor(lifecycle.phaseDeadline.dueTick / 200)}` : null;
  const pickupSlot = transferSlot(lifecycle.pickupTransferId);
  const landingSlot = transferSlot(lifecycle.landingTransferId);
  const conflicts = [
    ...lifecycle.manifest.map((member) => member.actorId),
    ...lifecycle.assignedTransportIds,
    ...lifecycle.escortIds
  ].some((actorId) => context.occupiedActors.has(actorId));
  if (
    conflicts ||
    [pickupSlot, landingSlot].some((id) => id && context.occupiedTransfers.has(id)) ||
    context.occupiedDestinations.has(lifecycle.route.destinationNodeId)
  ) {
    return withAiTransportPhase(plan, "cancelled", context.observation.tick, 1, {
      terminalReason: "transport_ownership_conflict"
    });
  }
  lifecycle.manifest.forEach((member) => context.occupiedActors.add(member.actorId));
  lifecycle.assignedTransportIds.forEach((actorId) => context.occupiedActors.add(actorId));
  lifecycle.escortIds.forEach((actorId) => context.occupiedActors.add(actorId));
  if (pickupSlot) context.occupiedTransfers.add(pickupSlot);
  if (landingSlot) context.occupiedTransfers.add(landingSlot);
  context.occupiedDestinations.add(lifecycle.route.destinationNodeId);
  return undefined;
}
