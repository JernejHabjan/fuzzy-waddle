import { isDeepStrictEqual } from "node:util";
// prettier-ignore
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";

/** Exact test-controller lineage; human/shared commands must never acquire an invented selected AI intent. */
export function projectRuntimeControlledCommands(capture: AiRuntimeProductionCaptureV1) {
  const facts = capture.facts.filter((fact) => fact.kind === "preset_control");
  const failures: string[] = [];
  const commands = facts
    .filter((fact) => fact.control.phase === "applied")
    .flatMap((application) => {
      const control = application.control;
      const requests = facts.filter((fact) => fact.control.id === control.id && fact.control.phase === "requested");
      const request = requests[0];
      const command = control.command;
      const execution = command?.execution;
      if (
        requests.length !== 1 ||
        !request ||
        !command ||
        !execution ||
        execution.source !== "human" ||
        execution.effectId ||
        execution.intentId ||
        request.sequence >= application.sequence ||
        request.tick !== control.requestedTick ||
        application.tick !== control.scheduledTick ||
        command.tick !== application.tick ||
        command.playerNumber !== application.playerNumber ||
        command.actorIds.length !== 1 ||
        command.actorIds[0] !== control.actorId ||
        request.control.actorId !== control.actorId ||
        request.control.setupItemId !== control.setupItemId ||
        request.control.scheduledTick !== control.scheduledTick ||
        !capture.facts.some(
          (fact) =>
            fact.kind === "command_delivered" &&
            fact.command.execution?.commandId === execution.commandId &&
            fact.tick === application.tick &&
            isDeepStrictEqual(fact.command, command)
        ) ||
        !capture.facts.some(
          (fact) =>
            fact.kind === "outcome" &&
            fact.outcome.commandId === execution.commandId &&
            fact.outcome.kind === "dispatched" &&
            fact.tick === application.tick
        )
      ) {
        failures.push("production_v2_controlled_command_lineage_invalid");
        return [];
      }
      return [
        {
          request,
          application,
          command,
          outcomes: capture.facts
            .filter((fact) => fact.kind === "outcome")
            .filter((fact) => fact.outcome.commandId === execution.commandId)
        }
      ];
    });
  if (
    new Set(commands.map((entry) => entry.request.control.id)).size !== commands.length ||
    facts.some((fact) => !commands.some((entry) => entry.request.control.id === fact.control.id))
  ) {
    failures.push("production_v2_controlled_command_incomplete");
  }
  return { commands, failures };
}
