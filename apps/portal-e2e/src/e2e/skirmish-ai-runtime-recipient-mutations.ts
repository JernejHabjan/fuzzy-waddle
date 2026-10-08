import { isDeepStrictEqual } from "node:util";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";

/** Strict bounded all-beneficiary replay. Inspect every supplied tail; never add the older resources_applied observations. */
export function normalizeRuntimeRecipientMutations(capture: AiRuntimeProductionCaptureV1) {
  const failures: string[] = [], gaps = new Set<string>();
  const facts = capture.recipientResourceFacts;
  const operations: { entry: Extract<AiRuntimeProductionFactV1, { kind: "recipient_resource_mutation" }>;
    terminal: Extract<AiRuntimeProductionFactV1, { kind: "recipient_resource_mutation" }> }[] = [];
  if (!facts) return { operations, failures, gaps: ["production_recipient_journal_missing"] };
  if (capture.resourceCoverage?.lost) gaps.add("production_recipient_capture_lost");
  if (facts.length > 8192 || capture.facts.length > 8192 || capture.droppedFactCount) {
    failures.push("production_recipient_journal_overflow");
  }
  const installed = new Map<number, Record<ResourceType, number> | null>();
  const rootFacts = new Map(capture.facts.map((fact) => [fact.sequence, fact]));
  if (rootFacts.size !== capture.facts.length) failures.push("production_recipient_root_sequence_conflict");
  const supplied = new Map<number, AiRuntimeProductionFactV1>();
  const openPlayers = new Set<number>();
  const open = new Map<number, Extract<AiRuntimeProductionFactV1, { kind: "recipient_resource_mutation" }>>();
  const ids = new Set<number>();
  const integer = (value: number) => Number.isSafeInteger(value) && value >= 0;
  let sequence = 0, tick = capture.startedTick;
  for (const fact of facts) {
    if (!fact || !integer(fact.sequence) || fact.sequence <= sequence || !integer(fact.tick) || fact.tick < tick ||
      !integer(fact.playerNumber) || !capture.resourceCoverage ||
      fact.sequence > capture.resourceCoverage.frontier.captureSequence || fact.tick > capture.resourceCoverage.frontier.tick) {
      failures.push("production_recipient_journal_order_invalid"); continue;
    }
    sequence = fact.sequence; tick = fact.tick;
    supplied.set(fact.sequence, fact);
    const duplicate = rootFacts.get(fact.sequence);
    if (duplicate && !isDeepStrictEqual(duplicate, fact)) failures.push("production_recipient_journal_reference_conflict");
    if (fact.kind === "resource_need_fence") {
      if (typeof fact.reason !== "string" || !fact.reason) failures.push("production_need_fence_invalid");
      continue;
    }
    if (fact.kind === "resource_input_read") {
      const read = fact.read;
      if (!read || read.captureEpoch !== 1 || read.sequence !== fact.sequence || read.playerNumber !== fact.playerNumber ||
        !integer(read.lossEpoch) || read.lossEpoch > 8192 || !integer(read.generation) || !Array.isArray(fact.resources) ||
        fact.resources.length !== Object.values(ResourceType).length ||
        new Set(fact.resources.map((entry) => entry?.resourceType)).size !== Object.values(ResourceType).length ||
        fact.resources.some((entry) => !entry || !Object.values(ResourceType).includes(entry.resourceType) ||
          ![entry.stockpile, entry.reservedUnspent, entry.obligationsDue].every((value) => Number.isFinite(value) && value >= 0))) {
        failures.push("production_need_input_read_invalid"); continue;
      }
      if (openPlayers.has(fact.playerNumber) || !installed.get(fact.playerNumber) || fact.resources.some((entry) =>
        installed.get(fact.playerNumber)?.[entry.resourceType] !== entry.stockpile)) gaps.add("production_need_input_balance_missing");
      continue;
    }
    if (fact.kind === "recipient_resources_installed") {
      if (installed.has(fact.playerNumber)) failures.push("production_recipient_installation_reused");
      if (!vector(fact.resources, true)) gaps.add("production_recipient_initial_balance_missing");
      if (installed.size < 256) installed.set(fact.playerNumber, fact.resources);
      else failures.push("production_recipient_installation_overflow");
      continue;
    }
    if (fact.kind !== "recipient_resource_mutation") { failures.push("production_recipient_journal_kind_invalid"); continue; }
    const value = fact.mutation;
    if (!value || !integer(value.operationId) || value.operationId === 0 || !integer(value.entrySequence) ||
      !integer(value.lossEpoch) || value.lossEpoch > 8192 || typeof value.bindingValid !== "boolean" ||
      value.lossEpoch > (capture.resourceCoverage?.lossEpoch ?? 0) ||
      !["add", "pay"].includes(value.action) || !["before", "returned", "threw"].includes(value.phase)) {
      failures.push("production_recipient_mutation_invalid"); continue;
    }
    if (!installed.has(fact.playerNumber)) gaps.add("production_recipient_installation_missing");
    if (!value.bindingValid || value.lossEpoch) gaps.add("production_recipient_mutation_lost");
    if (!vector(value.before, true) || !vector(value.requested, false)) gaps.add("production_recipient_mutation_sample_missing");
    if (value.phase === "before") {
      if (ids.has(value.operationId) || value.entrySequence !== fact.sequence ||
        openPlayers.has(fact.playerNumber) || value.after !== null) {
        failures.push("production_recipient_operation_reused_or_nested");
      }
      ids.add(value.operationId);
      openPlayers.add(fact.playerNumber);
      if (!isDeepStrictEqual(installed.get(fact.playerNumber), value.before)) gaps.add("production_recipient_balance_discontinuity");
      if (open.size < 8192) open.set(value.operationId, fact);
      continue;
    }
    const entry = open.get(value.operationId);
    if (!entry || entry.playerNumber !== fact.playerNumber || entry.sequence >= fact.sequence ||
      entry.mutation.entrySequence !== value.entrySequence || entry.mutation.action !== value.action ||
      entry.mutation.lossEpoch > value.lossEpoch ||
      !isDeepStrictEqual(entry.mutation.before, value.before) || !isDeepStrictEqual(entry.mutation.requested, value.requested)) {
      failures.push("production_recipient_terminal_conflict"); continue;
    }
    open.delete(value.operationId);
    openPlayers.delete(fact.playerNumber);
    const sign = value.action === "add" ? 1 : -1;
    if (value.phase !== "returned" || !vector(value.after, true) || !vector(value.before, true) ||
      !vector(value.requested, false) || !Object.values(ResourceType).every((type) =>
        value.after?.[type] === (value.before?.[type] ?? NaN) + sign * (value.requested?.[type] ?? 0))) {
      gaps.add("production_recipient_quantitative_history_missing");
    }
    installed.set(fact.playerNumber, value.after);
    if (operations.length < 4096) operations.push({ entry, terminal: fact });
  }
  if (open.size) gaps.add("production_recipient_operation_still_open");
  for (const fact of capture.facts) {
    if ((fact.kind === "recipient_resource_mutation" || fact.kind === "recipient_resources_installed" ||
      fact.kind === "resource_input_read" || fact.kind === "resource_need_fence") &&
      !isDeepStrictEqual(supplied.get(fact.sequence), fact)) failures.push("production_recipient_projection_omitted");
  }
  return { operations: failures.length ? [] : operations, failures: [...new Set(failures)], gaps: [...gaps] };
}

function vector(value: Readonly<Partial<Record<ResourceType, number>>> | null, full: boolean): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const types = Object.values(ResourceType);
  return Object.keys(value).every((key) => types.some((type) => type === key)) &&
    types.every((type) => value[type] === undefined ? !full : typeof value[type] === "number" &&
      Number.isFinite(value[type]) && (value[type] ?? -1) >= 0);
}
