import type { Page } from "@playwright/test";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import { digestRuntimeValue } from "./skirmish-ai-runtime-digest";
import { writeFileSync } from "node:fs";

export async function captureRuntimeStrategyCheckpoint(
  page: Page,
  aiPlayerNumber: number,
  captureFairness = false
): Promise<Partial<RuntimeCheckpointV1>> {
  const diagnosticTick = Number(process.env.AI_SKIRMISH_CAPTURE_DECISION_TICK ?? -1);
  const { fairnessObservation, diagnosticInputs, ...checkpoint } = await page.evaluate(
    ({ playerNumber, captureFairness, diagnosticTick }) => {
      const parts = window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber);
      if (!parts) throw new Error("runtime_controller_unavailable");
      const observation = parts.controller.getCommittedObservation();
      const state = parts.controller.getBrainState();
      const catalog = parts.controller.getCommittedCapabilityCatalog();
      if (!observation || !state || !catalog) throw new Error("runtime_checkpoint_not_committed");
      const tacticalCells = observation.map?.tacticalCells;
      const selfActors = observation.actors.filter(
        (actor) => actor.relation === "self" && actor.visibility === "owned"
      );
      const militaryNames = new Set(
        catalog.entries
          .filter(
            (entry) =>
              entry.gathers.length === 0 && entry.targetDomains.length > 0 && entry.movementDomains.length > 0
          )
          .map((entry) => entry.sourceObjectName)
      );
      const militaryProducerNames = new Set(
        catalog.entries
          .filter((entry) => entry.produces.some((objectName) => militaryNames.has(objectName)))
          .map((entry) => entry.sourceObjectName)
      );
      const score = parts.getScore(playerNumber);
      const decisions = parts.controller.getBrainDebugSnapshot()?.decisions ?? [];
      return {
        diagnosticInputs: observation.tick === diagnosticTick ? { observation, state, catalog } : undefined,
        decisionIntentsTruncated: decisions.length > 64,
        fairnessObservation: captureFairness ? observation : undefined,
        decisionIntents: decisions.slice(0, 64).map((decision) => decision.intent),
        profileDifficulty: state.profileDifficulty ?? null,
        opponentAssets: [
          ...new Set(
            observation.actors.flatMap((actor) =>
              actor.relation === "enemy" && actor.owner !== null ? [actor.owner] : []
            )
          )
        ]
          .sort((left, right) => left - right)
          .map((owner) => ({ playerNumber: owner, actorNames: [...parts.getRawOwnedActorNames(owner)] })),
        strategyStance: state.strategy.stance,
        strategyAssessment: state.strategy.assessment
          ? {
              choice: state.strategy.assessment.choice,
              reason: state.strategy.assessment.reason,
              ...(state.strategy.assessment.selectionSource
                ? { selectionSource: state.strategy.assessment.selectionSource }
                : {}),
              targetActorId: state.strategy.assessment.targetActorId,
              routeDomain: state.strategy.assessment.routeDomain ?? null,
              readyForce: state.strategy.assessment.readyForce,
              requiredForce: state.strategy.assessment.requiredForce,
              alternatives: state.strategy.assessment.alternatives
            }
          : null,
        visibleEnemyFacts: observation.actors
          .filter((actor) => actor.relation !== "self")
          .map((actor) => ({
            actorId: actor.actorId,
            objectName: actor.objectName,
            owner: actor.owner,
            relation: actor.relation,
            visibility: actor.visibility,
            mainBuilding: actor.mainBuilding?.status === "known" ? actor.mainBuilding.value : null,
            position: actor.logicalPosition.status === "known" ? actor.logicalPosition.value : null,
            healthPermille: actor.healthPermille?.status === "known" ? actor.healthPermille.value : null
          }))
          .sort((left, right) =>
            `${left.objectName}:${JSON.stringify(left.position)}`.localeCompare(
              `${right.objectName}:${JSON.stringify(right.position)}`
            )
          ),
        decisionFacts: (parts.controller.getBrainDebugSnapshot()?.decisions ?? []).map((decision) => ({
          outcome: decision.outcome,
          reason: decision.reason,
          kind: decision.intent.kind,
          reasonCode: decision.intent.reasonCode,
          objectName: "objectName" in decision.intent ? decision.intent.objectName : null
        })),
        demands: state.economyProduction.demands
          .map((demand) => ({
            demandId: demand.demandId,
            purpose: demand.purpose,
            desired: demand.desired,
            satisfied: demand.satisfiedActorIds.length,
            queued: demand.queuedIds.length,
            constructing: demand.constructingIds.length,
            accepted: demand.acceptedNotObservedEffectIds.length
          }))
          .sort((left, right) => left.demandId.localeCompare(right.demandId)),
        militaryActorNames: selfActors
          .filter((actor) => militaryNames.has(actor.objectName))
          .map((actor) => actor.objectName)
          .sort(),
        militaryActors: selfActors
          .filter((actor) => militaryNames.has(actor.objectName))
          .filter((actor) => actor.constructionProgress?.status !== "known" || actor.constructionProgress.value >= 100)
          .map((actor) => ({
            actorId: actor.actorId,
            objectName: actor.objectName,
            position: actor.logicalPosition.status === "known" ? actor.logicalPosition.value : null,
            accessNodeId: actor.accessNodeId.status === "known" ? actor.accessNodeId.value : null,
            activeOrder:
              actor.activeOrder?.status === "known"
                ? actor.activeOrder.value
                  ? {
                      orderType: actor.activeOrder.value.orderType,
                      targetActorId: actor.activeOrder.value.targetActorId,
                      targetPosition: actor.activeOrder.value.targetPosition ?? null
                    }
                  : null
                : null
          }))
          .sort((left, right) => left.actorId.localeCompare(right.actorId)),
        militaryProducerNames: selfActors
          .filter(
            (actor) =>
              militaryProducerNames.has(actor.objectName) &&
              (actor.constructionProgress?.status !== "known" || actor.constructionProgress.value >= 100)
          )
          .map((actor) => actor.objectName)
          .sort(),
        militaryProducerQueues: selfActors
          .filter((actor) => militaryProducerNames.has(actor.objectName) && actor.queue.status === "known")
          .map((actor) => ({
            actorId: actor.actorId,
            objectName: actor.objectName,
            capacity: actor.queue.status === "known" ? actor.queue.value.capacity : 0,
            occupied: actor.queue.status === "known" ? actor.queue.value.occupied : 0,
            queuedObjectNames:
              actor.queue.status === "known"
                ? (actor.queue.value.items ?? [])
                    .flatMap((item) => (item.kind === "production" && item.objectName ? [item.objectName] : []))
                    .sort()
                : [],
            queuedItems:
              actor.queue.status === "known"
                ? (actor.queue.value.items ?? [])
                    .map((item) => ({
                      itemId: item.itemId,
                      kind: item.kind,
                      objectName: item.objectName,
                      researchType: item.researchType
                    }))
                    .sort((left, right) => left.itemId.localeCompare(right.itemId))
                : []
          }))
          .sort((left, right) => left.actorId.localeCompare(right.actorId)),
        squads: state.squads
          .map((squad) => ({
            squadId: squad.squadId,
            role: squad.role,
            state: squad.state,
            domain: squad.domain,
            actorNames: squad.actorIds
              .flatMap((actorId) => {
                const actor = observation.actors.find((candidate) => candidate.actorId === actorId);
                return actor ? [actor.objectName] : [];
              })
              .sort(),
            actorCount: squad.actorIds.length,
            objectiveId: squad.objectiveId,
            tacticalTargetActorId: squad.tactics?.targetActorId ?? null,
            engagementRatioPermille: squad.tactics?.engagementRatioPermille ?? null,
            engagementConfidencePermille: squad.tactics?.confidencePermille ?? null,
            assignedPositions: (squad.tactics?.assignedPositions ?? []).map((assignment) => ({
              actorId: assignment.actorId,
              position: assignment.position,
              groundAccessNodeId:
                tacticalCells?.find(
                  (cell) => cell.position.x === assignment.position.x && cell.position.y === assignment.position.y
                )?.groundAccessNodeId ?? null
            })),
            createdTick: squad.lifecycle?.createdTick ?? null,
            lastUsefulEffectTick: squad.lifecycle?.lastUsefulEffectTick ?? null,
            terminalReason: squad.lifecycle?.terminalReason ?? null
          }))
          .sort((left, right) => left.squadId.localeCompare(right.squadId)),
        objectiveContacts: state.squads
          .flatMap((squad) => {
            if (!squad.objectiveId) return [];
            const actor = observation.actors.find((candidate) => candidate.actorId === squad.objectiveId);
            return [
              {
                squadId: squad.squadId,
                actorId: squad.objectiveId,
                objectName: actor?.objectName ?? null,
                visibility: actor?.visibility ?? null,
                observedTick: actor?.observedTick ?? null,
                positionObservedTick:
                  actor?.logicalPosition.status === "known" ? actor.logicalPosition.observedTick : null,
                healthPermille: actor?.healthPermille?.status === "known" ? actor.healthPermille.value : null
              }
            ];
          })
          .sort((left, right) => left.squadId.localeCompare(right.squadId)),
        adaptationEvidence: state.economyProduction.adaptation.evidence
          .map((entry) => ({
            kind: entry.kind,
            sourceContactId: entry.sourceContactId,
            observedTick: entry.observedTick,
            confidencePermille: entry.confidencePermille
          }))
          .sort(
            (left, right) =>
              left.kind.localeCompare(right.kind) || left.sourceContactId.localeCompare(right.sourceContactId)
          ),
        bases: state.bases
          .map((base) => ({
            baseId: base.baseId,
            lifecycle: base.lifecycle ?? null,
            anchorActorId: base.anchorActorId,
            reservedSiteKey: base.reservedSiteKey ?? null,
            rejectedSiteCount: base.rejectedSiteKeys?.length ?? 0
          }))
          .sort((left, right) => left.baseId.localeCompare(right.baseId)),
        reservations: state.reservations
          .map((reservation) => ({
            claimId: reservation.claimId,
            subjectKey: reservation.subjectKey ?? null,
            ownerPlanId: reservation.ownerPlanId,
            state: reservation.state.kind
          }))
          .sort((left, right) => left.claimId.localeCompare(right.claimId)),
        missionTimeline: state.skirmish.timeline
          .filter((event) => event.kind === "mission")
          .map((event) => ({ tick: event.tick, detail: event.detail })),
        modeGoals: observation.modeGoals.map((goal) => ({ id: goal.id, owner: goal.owner, state: goal.state })),
        scoreMetrics: score.metrics,
        gameResult: score.gameResult
      };
    },
    { playerNumber: aiPlayerNumber, captureFairness, diagnosticTick }
  );
  if (diagnosticInputs && process.env.AI_SKIRMISH_CAPTURE_DECISION_PATH) {
    writeFileSync(process.env.AI_SKIRMISH_CAPTURE_DECISION_PATH, JSON.stringify(diagnosticInputs));
  }
  return {
    ...checkpoint,
    ...(fairnessObservation ? { permittedObservationDigest: digestRuntimeValue(fairnessObservation) } : {})
  };
}
