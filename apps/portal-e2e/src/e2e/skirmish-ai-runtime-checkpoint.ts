export interface RuntimeCheckpointV1 {
  readonly targetTick: number;
  readonly tick: number;
  readonly observationTick: number;
  readonly decisionSequence: number;
  readonly faction: number;
  readonly openingPlanId: string;
  readonly openingSteps: Readonly<Record<string, { readonly state: string; readonly completedTick: number | null }>>;
  readonly workerCount: number;
  readonly readyHousingCapacity?: number;
  readonly usedPopulation?: number;
  readonly queuedPopulation?: number;
  readonly readyHousingActorNames?: readonly string[];
  readonly deliveredIncome: number;
  readonly appliedCommands: readonly { readonly commandId: string; readonly effectId: string }[];
  readonly terminalFailureCount: number;
  readonly terminalFailureReasons: Readonly<Record<string, number>>;
  readonly recentCommandFailures: readonly {
    readonly kind: string;
    readonly reason: string;
    readonly detail: string | null;
    readonly effectId: string | null;
  }[];
  readonly ownedActorNames: readonly string[];
  readonly rawOwnedActorNames: readonly string[];
  readonly ownedConstruction: readonly {
    readonly actorId: string;
    readonly objectName: string;
    readonly progress: number;
  }[];
  readonly workerOrders: readonly {
    readonly actorId: string;
    readonly orderType: string | null;
    readonly targetActorId: string | null;
  }[];
  readonly workerConstructs: Readonly<Record<string, readonly string[]>>;
  readonly constructionCellCount: number;
  readonly legalConstructionCellCount: number;
  readonly ownedMainBuildingNames: readonly string[];
  readonly sceneComponentNames: readonly string[];
  readonly mapBoundsStatus: string;
  readonly resourceStockpiles: Readonly<Record<string, number>>;
  readonly resourceServiceActors?: readonly {
    readonly actorId: string;
    readonly objectName: string;
    readonly relation: string;
    readonly x: number;
    readonly y: number;
    readonly ready: boolean;
    readonly resourceType: string | null;
  }[];
  readonly recentMacroDecisions: readonly string[];
  readonly accessTopology: {
    readonly status: string;
    readonly groundNodes: number;
    readonly waterNodes: number;
    readonly airNodes: number;
    readonly shoreTransfers: number;
  };
  readonly carrierCatalog: readonly {
    readonly objectName: string;
    readonly capacity: number;
    readonly domains: readonly string[];
    readonly producerNames: readonly string[];
  }[];
  readonly mobileTransports: readonly {
    readonly actorId: string;
    readonly objectName: string;
    readonly capacity: number;
    readonly passengerIds: readonly string[];
    readonly pendingPassengerIds: readonly string[];
    readonly domains: readonly string[];
  }[];
  readonly transportPlans: readonly {
    readonly planId: string;
    readonly phase: string;
    readonly routeKind: string | null;
    readonly passengerCount: number;
    readonly transportCount: number;
    readonly assignedCapacity: number;
    readonly requiredCapacity: number;
    readonly terminalReason: string | null;
  }[];
  readonly transportDecisions: readonly string[];
  readonly transportOutcomes: readonly {
    readonly tick: number;
    readonly intentId: string;
    readonly effectId: string;
    readonly kind: string;
    readonly reason: string | null;
  }[];
  readonly profileDifficulty: string | null;
  readonly strategyStance: string;
  readonly strategyAssessment?: {
    readonly choice: string;
    readonly reason: string;
    readonly targetActorId: string | null;
    readonly routeDomain: string | null;
    readonly readyForce: number;
    readonly requiredForce: number;
  } | null;
  readonly visibleEnemyFacts: readonly {
    readonly objectName: string;
    readonly relation: string;
    readonly visibility: string;
    readonly position: { readonly x: number; readonly y: number; readonly z: number } | null;
    readonly healthPermille: number | null;
  }[];
  readonly decisionFacts: readonly {
    readonly outcome: string;
    readonly reason: string;
    readonly kind: string;
    readonly reasonCode: string;
    readonly objectName: string | null;
  }[];
  readonly demands: readonly {
    readonly demandId: string;
    readonly purpose: string;
    readonly desired: number;
    readonly satisfied: number;
    readonly queued: number;
    readonly constructing: number;
    readonly accepted: number;
  }[];
  readonly militaryActorNames: readonly string[];
  readonly militaryProducerNames: readonly string[];
  readonly militaryProducerQueues: readonly {
    readonly actorId: string;
    readonly objectName: string;
    readonly capacity: number;
    readonly occupied: number;
    readonly queuedObjectNames: readonly string[];
  }[];
  readonly squads: readonly {
    readonly squadId: string;
    readonly role: string;
    readonly state: string;
    readonly domain: string;
    readonly actorNames: readonly string[];
    readonly actorCount: number;
    readonly objectiveId: string | null;
    readonly createdTick: number | null;
    readonly lastUsefulEffectTick: number | null;
    readonly terminalReason: string | null;
  }[];
  readonly objectiveContacts: readonly {
    readonly squadId: string;
    readonly actorId: string;
    readonly objectName: string | null;
    readonly visibility: string | null;
    readonly observedTick: number | null;
    readonly positionObservedTick: number | null;
    readonly healthPermille: number | null;
  }[];
  readonly adaptationEvidence: readonly {
    readonly kind: string;
    readonly sourceContactId: string;
    readonly observedTick: number;
    readonly confidencePermille: number;
  }[];
  readonly bases: readonly {
    readonly baseId: string;
    readonly lifecycle: string;
    readonly anchorActorId: string | null;
    readonly reservedSiteKey: string | null;
    readonly rejectedSiteCount: number;
  }[];
  readonly reservations: readonly {
    readonly claimId: string;
    readonly subjectKey: string | null;
    readonly ownerPlanId: string;
    readonly state: string;
  }[];
  readonly missionTimeline: readonly { readonly tick: number; readonly detail: string }[];
  readonly modeGoals: readonly { readonly id: string; readonly owner: number | null; readonly state: string }[];
  readonly scoreMetrics: Readonly<Record<string, number>>;
  readonly gameResult: string | null;
}
