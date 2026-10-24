import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";

/** Independent fixed dates/floors; validate every declaration tail and reject overlapping use of one beneficiary/resource. */
export function validateRuntimeResourceIntervals(capture: AiRuntimeProductionCaptureV1) {
  const failures: string[] = [],
    gaps: string[] = [];
  const declaration = capture.resourceIntervalDeclaration;
  if (!declaration) return { declarations: [], failures, gaps: ["production_resource_interval_declaration_missing"] };
  const integer = (value: number) => Number.isSafeInteger(value) && value >= 0;
  const amount = (value: number) => Number.isFinite(value) && value >= 0;
  if (
    !integer(declaration.boundary.tick) ||
    declaration.boundary.tick !== capture.startedTick ||
    declaration.boundary.captureSequence !== 0 ||
    typeof declaration.overflow !== "boolean"
  ) {
    failures.push("production_resource_interval_declaration_boundary_invalid");
  }
  if (declaration.overflow || declaration.intervals.length > 256)
    failures.push("production_resource_interval_overflow");
  const ids = new Set<string>();
  let windowCount = 0;
  for (const interval of declaration.intervals) {
    const remainder = (interval.endTick - interval.startTick) % interval.windowTicks;
    if (
      !interval.intervalId ||
      ids.has(interval.intervalId) ||
      !integer(interval.beneficiary) ||
      !Object.values(ResourceType).includes(interval.resourceType) ||
      !interval.need.intentId ||
      !interval.need.effectId ||
      !interval.actorIds.length ||
      interval.actorIds.length > 256 ||
      interval.actorIds.some((id) => !id) ||
      new Set(interval.actorIds).size !== interval.actorIds.length ||
      !integer(interval.need.selectedTick) ||
      interval.need.selectedTick > interval.startTick ||
      ![interval.startTick, interval.endTick, interval.runCeilingTick, interval.windowTicks].every(integer) ||
      interval.startTick < declaration.boundary.tick ||
      interval.endTick <= interval.startTick ||
      interval.windowTicks === 0 ||
      interval.endTick > interval.runCeilingTick ||
      !amount(interval.minimumUsefulDelivery) ||
      (remainder > 0 && (!interval.finalWindow || interval.finalWindow.ticks !== remainder)) ||
      (remainder === 0 && interval.finalWindow !== undefined) ||
      (interval.finalWindow &&
        (!integer(interval.finalWindow.ticks) ||
          interval.finalWindow.ticks === 0 ||
          !amount(interval.finalWindow.minimumUsefulDelivery)))
    )
      failures.push("production_resource_interval_invalid");
    ids.add(interval.intervalId);
    windowCount += Math.ceil((interval.endTick - interval.startTick) / interval.windowTicks);
  }
  // Sweep after inspecting every tail. Adjacent half-open intervals share an endpoint but never an application.
  const sorted = [...declaration.intervals].sort(
    (left, right) =>
      left.beneficiary - right.beneficiary ||
      left.resourceType.localeCompare(right.resourceType) ||
      left.startTick - right.startTick
  );
  for (let index = 1; index < sorted.length; index++) {
    const left = sorted[index - 1],
      right = sorted[index];
    if (
      left &&
      right &&
      left.beneficiary === right.beneficiary &&
      left.resourceType === right.resourceType &&
      left.endTick > right.startTick
    ) {
      failures.push("production_resource_intervals_overlap");
    }
  }
  if (!Number.isSafeInteger(windowCount) || windowCount > 256) failures.push("production_resource_window_overflow");
  if (!declaration.intervals.length) gaps.push("production_resource_interval_declaration_missing");
  return { declarations: failures.length ? [] : declaration.intervals, failures: [...new Set(failures)], gaps };
}
