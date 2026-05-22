import type { ProbableWaffleReplayCommandBatch, ProbableWaffleReplayTickDigest } from "@fuzzy-waddle/api-interfaces";

/**
 * Build deterministic replay digests for one tick.
 * Inputs are normalized by playerNumber so digest output is stable regardless of array order.
 */
export function buildReplayTickDigest(
  tick: number,
  tickBatches: readonly ProbableWaffleReplayCommandBatch[]
): ProbableWaffleReplayTickDigest {
  const sortedBatches = [...tickBatches].sort((left, right) => left.playerNumber - right.playerNumber);
  const playerDigests: Record<number, string> = {};
  let commandCount = 0;
  for (const batch of sortedBatches) {
    commandCount += batch.commands.length;
    playerDigests[batch.playerNumber] = djb2(stableSerialize(batch.commands));
  }

  const digestInput = sortedBatches.map((batch) => `${batch.playerNumber}:${playerDigests[batch.playerNumber]}`).join("|");
  return {
    tick,
    digest: djb2(digestInput),
    playerDigests,
    batchCount: sortedBatches.length,
    commandCount
  };
}

function stableSerialize(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return "undefined";
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${key}:${stableSerialize(record[key])}`)
      .join(",")}}`;
  }
  return String(value);
}

function djb2(str: string): string {
  let hash = 5381;
  for (let index = 0; index < str.length; index++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(index);
    hash = hash | 0;
  }
  return (hash >>> 0).toString(16);
}
