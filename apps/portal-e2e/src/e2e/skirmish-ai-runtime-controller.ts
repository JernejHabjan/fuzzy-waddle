export interface RuntimePageControllerV1 {
  isDecisionBoundarySettled(): boolean;
  getCommittedObservation():
    | {
        tick: number;
        faction: number;
        actors: {
          actorId: string;
          relation: string;
          visibility: string;
          objectName: string;
          observedTick: number;
          logicalPosition:
            | { status: "known"; value: { x: number; y: number; z: number }; observedTick: number }
            | { status: "unknown" };
          healthPermille?: { status: "known"; value: number } | { status: "unknown" };
          queue:
            | {
                status: "known";
                value: {
                  capacity: number;
                  occupied: number;
                  items?: readonly { kind: string; objectName: string | null }[];
                };
              }
            | { status: "unknown" };
          mainBuilding?: { status: "known"; value: boolean } | { status: "unknown" };
          constructionProgress?: { status: "known"; value: number } | { status: "unknown" };
          activeOrder?:
            | { status: "known"; value: { orderType: string; targetActorId: string | null } | null }
            | { status: "unknown" };
          accessNodeId: { status: "known"; value: string } | { status: "unknown" };
          containedInActorId?: string | null;
          containerState?:
            | {
                status: "known";
                value: {
                  capacity: number;
                  passengerIds: readonly string[];
                  pendingPassengerIds: readonly string[];
                  mobileDomains: readonly string[];
                };
              }
            | { status: "unknown" };
        }[];
        resources: {
          resourceType: string;
          stockpile: number;
          deliveredIncomePerMinute: { status: "known"; value: number } | { status: "unknown" };
        }[];
        modeGoals: { id: string; owner: number | null; state: string }[];
        map?: {
          bounds: { status: string };
          constructionCells?: { groundPassable: boolean; observedBlocked: boolean }[];
          accessGraph?: {
            generation: number;
            status: string;
            nodes: readonly { nodeId: string; domain: string }[];
            links: readonly {
              domain: string;
              fromNodeId: string;
              toNodeId: string;
            }[];
            transferPoints: readonly {
              transferId: string;
              kind: string;
              fromNodeId: string;
              toNodeId: string;
              passengerPosition: { x: number; y: number; z: number };
              carrierPosition: { x: number; y: number; z: number };
              clearance: number;
              knowledge: string;
            }[];
          };
        };
      }
    | undefined;
  getBrainState():
    | {
        scheduler: { decisionSequence: number };
        profileDifficulty?: string;
        strategy: { stance: string };
        opening: {
          plan: {
            planId: string;
            steps: { stepId: string; state: string; completedTick: number | null }[];
          };
        };
        economyProduction: {
          demands: {
            demandId: string;
            purpose: string;
            desired: number;
            satisfiedActorIds: string[];
            queuedIds: string[];
            constructingIds: string[];
            acceptedNotObservedEffectIds: string[];
          }[];
          adaptation: {
            evidence: {
              kind: string;
              sourceContactId: string;
              observedTick: number;
              confidencePermille: number;
            }[];
          };
        };
        squads: {
          squadId: string;
          role: string;
          state: string;
          actorIds: string[];
          objectiveId: string | null;
          lifecycle?: {
            createdTick: number;
            lastUsefulEffectTick: number | null;
            terminalReason: string | null;
          };
        }[];
        bases: {
          baseId: string;
          lifecycle: string;
          anchorActorId: string | null;
          reservedSiteKey?: string | null;
          rejectedSiteKeys?: { siteKey: string }[];
        }[];
        reservations: {
          claimId: string;
          subjectKey?: string;
          ownerPlanId: string;
          state: { kind: string };
        }[];
        transport: {
          planId: string;
          phase: string;
          passengerIds: readonly string[];
          transportIds: readonly string[];
          lifecycle?: {
            route: { kind: string };
            assignedCapacity: number;
            requiredCapacity: number;
            terminalReason: string | null;
          };
        }[];
        skirmish: { timeline: { tick: number; kind: string; detail: string }[] };
      }
    | undefined;
  getCommittedCapabilityCatalog():
    | {
        entries: {
          gathers: unknown[];
          constructs: string[];
          produces: string[];
          movementDomains: string[];
          targetDomains: string[];
          sourceObjectName: string;
          cargoCapacity?: number | null;
        }[];
      }
    | undefined;
  getBrainDebugSnapshot():
    | {
        decisions: {
          outcome: string;
          reason: string;
          detail?: string;
          intent: { kind: string; reasonCode: string; objectName?: string };
        }[];
      }
    | undefined;
  getBrainDebugHistory(): readonly {
    decisions: readonly {
      outcome: string;
      reason: string;
      detail?: string;
      intent: { kind: string; reasonCode: string; objectName?: string };
    }[];
  }[];
  getBrainCommandBridgeSnapshot():
    | {
        outcomes: {
          kind: string;
          identity: { commandId: string; effectId: string; intentId: string };
          tick: number;
          reason?: string;
        }[];
      }
    | undefined;
}
