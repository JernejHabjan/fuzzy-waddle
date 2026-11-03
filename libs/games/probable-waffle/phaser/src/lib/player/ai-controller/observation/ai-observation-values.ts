import type { AiDomain, AiKnownValue } from "@fuzzy-waddle/probable-waffle-gameplay";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";

export function knownValue<T>(value: T, observedTick: number): AiKnownValue<T> {
  return { status: "known", value, observedTick };
}

export function unknownValue(reason: "not_observed" | "not_supported" | "query_pending"): AiKnownValue<never> {
  return { status: "unknown", reason };
}

export function uniqueDomain(domain: AiDomain, index: number, values: readonly AiDomain[]): boolean {
  return values.indexOf(domain) === index;
}

/** Converts component millisecond timing to the simulation's fixed 20 Hz clock. */
export function millisecondsToSimulationTicks(milliseconds: number): number {
  return Math.max(0, Math.ceil(milliseconds / SimulationTickService.TICK_INTERVAL_MS));
}
