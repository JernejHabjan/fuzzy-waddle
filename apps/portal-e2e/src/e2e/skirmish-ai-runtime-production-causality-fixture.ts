import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { ResourceType, type GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { multiplayerSharedQueueFixture } from "./skirmish-ai-multiplayer-shared-queue-fixture";

/** Synthetic causal contracts only: adding accepted intents here never turns the human socket world into AI proof. */
export function productionCausalityFixture(branch: "shared_contention" | "cancel_research" = "shared_contention"):
  AiRuntimeProductionCaptureV1 {
  const world = multiplayerSharedQueueFixture(branch);
  if (!world.capture || !world.setup) throw new Error("synthetic_causal_world_missing");
  const sourceCapture = world.capture;
  const setup = world.setup;
  const commands = world.commands.map(({ role, command }) => ({
    role, command: { ...command, execution: { ...command.execution, schemaVersion: 1, source: "ai",
      commandId: role, authorityEpoch: 0, sequence: command.execution?.sequence ?? 0,
      intentId: role, effectId: role, commitmentKey: `ai:effect:${role}` } } satisfies GameCommand
  }));
  const byId = (id: string | undefined) => commands.find((entry) => entry.command.execution.commandId === id)?.command;
  const facts: AiRuntimeProductionFactV1[] = sourceCapture.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
    if (fact.kind === "outcome") {
      if (fact.outcome.kind === "dispatched") return [];
      const command = byId(fact.outcome.commandId);
      if (!command) throw new Error("synthetic_causal_command_missing");
      return [{ ...fact, outcome: { ...fact.outcome, ...command.execution } }];
    }
    if (fact.kind === "command_delivered") {
      const command = byId(fact.command.execution?.commandId);
      if (!command) throw new Error("synthetic_causal_delivery_missing");
      return [{ ...fact, command }];
    }
    if (fact.kind === "queue_resource") {
      const origin = byId(fact.resource.originatingCommandContext?.execution.commandId);
      if (!origin) throw new Error("synthetic_causal_payment_missing");
      return [{ ...fact, resource: { ...fact.resource,
        originatingCommandContext: { execution: origin.execution, playerNumber: 1, actorIds: ["producer"] },
        cancellationCommand: fact.resource.cancellationCommand ? byId("cancel") ?? null : null
      } }];
    }
    return [fact];
  });
  for (const { role, command } of commands) {
    const requestedTick = command.tick - 2;
    const price = role === "train" ? setup.train.price :
      role === "probe" || role === "resume" ? setup.replacement.price : setup.research.price;
    const common = { intentId: `intent:${role}`, effectId: `effect:${role}`, planId: "plan:force", demandId: "demand:force",
      lane: "supply_production", proposedTick: requestedTick, urgencyClass: 2, utility: 10, preconditions: [],
      claims: command.type === "CANCEL_RESEARCH" ? [] : Object.values(ResourceType).flatMap((resourceType) =>
        (price[resourceType] ?? 0) > 0 ? [{ kind: "resource", claimId: `claim:${role}:${resourceType}`,
          resourceType, amount: price[resourceType] ?? 0 } as const] : []), reasonCode: "synthetic_force" } as const;
    const intent: AiIntentV1 = command.type === "PRODUCTION"
      ? { ...common, kind: "produce", producerId: "producer", objectName: command.actorName }
      : command.type === "RESEARCH"
        ? { ...common, kind: "research", producerId: "producer", researchType: command.researchType }
        : { ...common, kind: "cancel", actorId: "producer", queueIndex: 0 };
    const correlation = { intentId: role, effectId: role, commitmentKey: command.execution.commitmentKey };
    facts.push(
      { sequence: 0, tick: requestedTick, playerNumber: 1, kind: "intent_dispatch", event: {
        kind: "requested", playerNumber: 1, correlation, command, claims: intent.claims,
        proposedTick: requestedTick, acceptedIntent: intent
      } },
      { sequence: 0, tick: requestedTick, playerNumber: 1, kind: "outcome", scheduledTick: command.tick, outcome: {
        ...command.execution, kind: "dispatched", reason: "accepted_for_dispatch", tick: command.tick,
        playerNumber: 1, actorIds: ["producer"], worldLinkIds: []
      } },
      { sequence: 0, tick: requestedTick, playerNumber: 1, kind: "intent_dispatch", event: {
        kind: "finished", playerNumber: 1, correlation, receipt: { status: "dispatched", command }
      } }
    );
  }
  return { ...sourceCapture, facts: facts.sort((left, right) => left.tick - right.tick)
    .map((fact, index) => ({ ...fact, sequence: index + 1 })) };
}
