import type { Page } from "@playwright/test";
import type { RuntimeVariant } from "./skirmish-ai-runtime-variant";
import type { RuntimeVariantResult } from "../runner/skirmish-ai-runtime-variant-result";
// prettier-ignore
import type { AiRuntimePresetApplication } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/presets/setup/ai-runtime-preset-application";

export function assertRuntimePresetEvents(
  variant: RuntimeVariant,
  application: Pick<AiRuntimePresetApplication, "eventResults" | "createdActorIds">
): void {
  const expected = variant.presetWorld?.events ?? [];
  const outages = variant.presetWorld?.routeOutages ?? [];
  const count = expected.length + outages.length;
  if (
    application.eventResults.length !== count ||
    new Set(application.eventResults.map((event) => event.id)).size !== count
  ) {
    throw new Error("runtime_preset_events_incomplete");
  }
  for (const result of application.eventResults) {
    const outage = outages.find((outage) => outage.id === result.id);
    if (outage) {
      const target = [...(variant.presetWorld?.actors ?? []), ...(variant.presetWorld?.existingActorBindings ?? [])]
        .find((actor) => outage.fixtureActorIds.includes(actor.fixtureActorId) &&
          application.createdActorIds[actor.fixtureActorId] === result.affectedActorId);
      if (!target || result.subjectName !== target.actorName || result.affectedActors !== 1 ||
          result.tick < outage.fromTick || result.tick > outage.throughTick)
        throw new Error(`runtime_route_outage_target_mismatch:${result.id}`);
      continue;
    }
    const event = expected.find((event) => event.id === result.id);
    const expectedActorId = event?.fixtureActorId
      ? application.createdActorIds[event.fixtureActorId] ?? "missing"
      : "unbound";
    if (
      !event ||
      result.tick !== event.tick ||
      result.subjectName !== event.objectName ||
      result.affectedActors !== 1 ||
      (event.fixtureActorId !== undefined &&
        (!application.createdActorIds[event.fixtureActorId] ||
          result.affectedActorId !== application.createdActorIds[event.fixtureActorId]))
    ) {
      throw new Error(
        `runtime_preset_event_target_mismatch:${result.id}:tick=${result.tick}/${event?.tick ?? "missing"}:` +
          `subject=${result.subjectName}/${event?.objectName ?? "missing"}:affected=${result.affectedActors}:` +
          `actor=${result.affectedActorId ?? "missing"}/${expectedActorId}`
      );
    }
  }
}

/** Read applied preset-event facts only after the normal browser service has executed them. */
export async function collectRuntimePresetEvents(
  page: Page,
  variant: RuntimeVariant
): Promise<RuntimeVariantResult["perturbations"]> {
  if (!variant.presetWorld?.events?.length && !variant.presetWorld?.routeOutages?.length) return [];
  const application = await page.evaluate(() => {
    const host = (
      window as unknown as {
        __fuzzyWaddleAiRuntimeBrowserTest?: {
          presetApplication?: AiRuntimePresetApplication;
        };
      }
    ).__fuzzyWaddleAiRuntimeBrowserTest;
    return host?.presetApplication;
  });
  if (!application) throw new Error("runtime_preset_events_incomplete");
  assertRuntimePresetEvents(variant, application);
  return application.eventResults.map((event) => ({
    id: event.id,
    tick: event.tick,
    dispatchedActors: event.affectedActors,
    subjectName: event.subjectName,
    ...(event.affectedActorId !== undefined ? { affectedActorId: event.affectedActorId } : {})
  }));
}
