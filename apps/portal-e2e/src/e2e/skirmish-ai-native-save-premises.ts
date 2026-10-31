import type { AiRuntimeProductionCaptureV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";

type NativeSaveSetupApplication = {
  readonly initialQueueItems: readonly {
    readonly itemId: string;
    readonly producerActorId: string;
    readonly kind: "production" | "research";
  }[];
  readonly queueApplications: readonly {
    readonly itemId: string;
    readonly command: { readonly execution?: { readonly commandId: string } };
    readonly outcomes: readonly { readonly kind: string }[];
    readonly resourcesBefore: Readonly<Record<string, number>>;
    readonly resourcesAfter: Readonly<Record<string, number>>;
  }[];
  readonly constructionApplications: readonly {
    readonly siteActorId: string;
    readonly command: { readonly actorName: string; readonly playerNumber: number };
    readonly outcomes: readonly { readonly kind: string; readonly worldLinkIds: readonly string[] }[];
    readonly resourcesBefore: Readonly<Record<string, number>>;
    readonly resourcesAfter: Readonly<Record<string, number>>;
  }[];
  readonly resetAfterCharge: boolean;
};

/** Extract actual original queue/site/receipt premises before rewinding. Full captures never enter save reports. */
export function nativeSavePremises(
  capture: AiRuntimeProductionCaptureV1,
  tick: number,
  siteId?: string,
  setup?: NativeSaveSetupApplication
) {
  const snapshot = capture.snapshots.filter((entry) => entry.tick === tick).at(-1);
  if (!snapshot) throw new Error("native_save_exact_snapshot_missing");
  const items = snapshot.queues.flatMap((queue) => queue.lanes.flatMap((lane) => lane.items));
  const heldApplied = capture.facts.filter(
    (fact) =>
      fact.tick <= tick &&
      fact.kind === "authority_delivery" &&
      fact.delivery.phase === "held" &&
      fact.delivery.outcome?.kind === "applied"
  );
  const itemBySetupId = new Map((setup?.initialQueueItems ?? []).map((item) => [item.itemId, item]));
  const paidSetupCommands = (setup?.queueApplications ?? []).filter((application) => {
    const item = itemBySetupId.get(application.itemId);
    return (
      !!item &&
      application.command.execution?.commandId !== undefined &&
      application.outcomes.some((outcome) => outcome.kind === "applied") &&
      Object.keys(application.resourcesBefore).some(
        (resource) => (application.resourcesBefore[resource] ?? 0) > (application.resourcesAfter[resource] ?? 0)
      )
    );
  });
  const paidCommandIds = new Set(paidSetupCommands.flatMap((application) =>
    application.command.execution?.commandId ? [application.command.execution.commandId] : []));
  const paidTrainingItems = items.filter(
    (item) =>
      item.objectName !== null &&
      item.remainingTimeMs > 0 &&
      item.remainingTimeMs < item.totalTimeMs &&
      Object.values(item.charge).some((amount) => (amount ?? 0) > 0)
  );
  const paidResearchItems = items.filter(
    (item) => item.researchType !== null && item.payment === "immediate" && item.remainingTimeMs > 0
  );
  const hasPaidSetupItem = (captured: typeof items) =>
    captured.some(
      (item) => item.identitySource === "command" && item.commandId !== null && paidCommandIds.has(item.commandId)
    );
  const siteApplication = (setup?.constructionApplications ?? []).find(
    (application) =>
      application.siteActorId === siteId &&
      application.outcomes.some(
        (outcome) => outcome.kind === "applied" && outcome.worldLinkIds.includes(application.siteActorId)
      )
  );
  const constructionCharges = capture.facts.filter(
    (fact) =>
      fact.tick <= tick &&
      fact.kind === "construction_authority" &&
      fact.construction.kind === "resource" &&
      fact.construction.operation === "start_charge" &&
      fact.construction.status === "returned" &&
      fact.construction.site.actorId === siteId
  );
  const appliedPaidSite =
    !!siteApplication &&
    constructionCharges.length === 1 &&
    (() => {
      const chargeFact = constructionCharges[0];
      const charge = chargeFact?.kind === "construction_authority" ? chargeFact.construction : undefined;
      if (
        !charge ||
        charge.kind !== "resource" ||
        charge.configuredCostType !== 0 ||
        charge.ownerArgument !== siteApplication.command.playerNumber ||
        charge.snapshotRestoreInProgress ||
        charge.nestedEmission ||
        charge.callbackCount !== 1 ||
        !charge.balanceMatches ||
        !charge.before ||
        !charge.after ||
        !charge.configuredCost ||
        !charge.requested ||
        charge.site.canonicalObjectName !== siteApplication.command.actorName ||
        !Object.values(charge.configuredCost).some((amount) => typeof amount === "number" && amount > 0)
      )
        return false;
      const resources = Object.keys(charge.configuredCost) as (keyof typeof charge.configuredCost)[];
      return resources.every(
        (resource) =>
          Number.isFinite(charge.configuredCost?.[resource]) &&
          Number.isFinite(charge.requested?.[resource]) &&
          charge.configuredCost?.[resource] === charge.requested?.[resource] &&
          charge.after?.[resource] === (charge.before?.[resource] ?? Number.NaN) - (charge.requested?.[resource] ?? 0)
      );
    })();
  return {
    tick,
    paidTrainingItems: paidTrainingItems.length,
    paidResearchItems: paidResearchItems.length,
    paidTrainingProvenance: hasPaidSetupItem(paidTrainingItems),
    paidResearchProvenance: hasPaidSetupItem(paidResearchItems),
    paidConstructionProvenance: appliedPaidSite,
    postChargeResourceReset: setup?.resetAfterCharge ?? true,
    unfinishedOriginalSite:
      !!siteId &&
      snapshot.world?.actors.some(
        (actor) => actor.actorId === siteId && actor.active && actor.alive && actor.indexed && !actor.finished
      ) === true,
    heldAppliedReceipts: heldApplied.length,
    captureDropped: capture.droppedFactCount > 0 || capture.droppedSnapshotCount > 0,
    captureGaps: [...capture.gaps]
  };
}
