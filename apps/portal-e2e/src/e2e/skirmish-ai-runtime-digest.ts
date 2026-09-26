import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";

export function digestRuntimeValue(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a32:${hash.toString(16).padStart(8, "0")}`;
}

export function projectRuntimeOutcomeDigestInput(
  checkpoints: readonly RuntimeCheckpointV1[],
  includeTerminalResult: boolean
): unknown {
  const final = checkpoints.at(-1);
  const producerCounts = (objectName: string) =>
    checkpoints.map((checkpoint) => checkpoint.militaryProducerNames.filter((name) => name === objectName).length);
  const producerNames = [...new Set(checkpoints.flatMap((checkpoint) => checkpoint.militaryProducerNames))].sort();
  return {
    decisionWorkObserved: (final?.decisionSequence ?? 0) > 0,
    workerEconomyEstablished: checkpoints.some((checkpoint) => checkpoint.workerCount > 0),
    workerEconomyRetained: (final?.workerCount ?? 0) > 0,
    deliveredIncome: checkpoints.some((checkpoint) => checkpoint.deliveredIncome > 0),
    resourceServiceProgress: checkpoints.map((checkpoint) => ({
      readyServices: (checkpoint.resourceServiceActors ?? [])
        .filter((actor) => actor.relation === "self" && actor.ready && actor.resourceType === null)
        .reduce<Record<string, number>>((counts, actor) => {
          counts[actor.objectName] = (counts[actor.objectName] ?? 0) + 1;
          return counts;
        }, {}),
      appliedResourceService: checkpoint.appliedCommands.filter((command) =>
        command.effectId.startsWith("effect:resource-service:")
      ).length
    })),
    viableArmyRetained: (final?.militaryActorNames.length ?? 0) > 0,
    producerLifecycle: producerNames.map((objectName) => {
      const counts = producerCounts(objectName);
      const lowestAfterStart = Math.min(...counts.slice(1));
      const lossIndex = counts.findIndex((count, index) => index > 0 && count < (counts[0] ?? 0));
      return {
        objectName,
        lossObserved: lowestAfterStart < (counts[0] ?? 0),
        recoveredAfterLoss: counts.slice(lossIndex + 1).some((count) => count > lowestAfterStart)
      };
    }),
    dealtDamage: checkpoints.some((checkpoint) => (checkpoint.scoreMetrics["damage_dealt"] ?? 0) > 0),
    lostUnit: checkpoints.some((checkpoint) => (checkpoint.scoreMetrics["units_lost"] ?? 0) > 0),
    lostBuilding: checkpoints.some((checkpoint) => (checkpoint.scoreMetrics["buildings_lost"] ?? 0) > 0),
    ...(includeTerminalResult ? { terminalResult: final?.gameResult ?? null } : {})
  };
}
