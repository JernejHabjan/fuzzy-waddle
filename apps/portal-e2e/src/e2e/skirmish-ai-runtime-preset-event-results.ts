import type { Page } from "@playwright/test";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
// prettier-ignore
import type { AiRuntimePresetApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-application-v1";

export function assertRuntimePresetEvents(
  variant: RuntimeVariantV1,
  application: Pick<AiRuntimePresetApplicationV1, "eventResults" | "createdActorIds">
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
    if (
      !event ||
      result.tick !== event.tick ||
      result.subjectName !== event.objectName ||
      result.affectedActors !== 1 ||
      (event.fixtureActorId !== undefined &&
        (!application.createdActorIds[event.fixtureActorId] ||
          result.affectedActorId !== application.createdActorIds[event.fixtureActorId]))
    ) {
      throw new Error(`runtime_preset_event_target_mismatch:${result.id}`);
    }
  }
}

/** Read applied preset-event facts only after the normal browser service has executed them. */
export async function collectRuntimePresetEvents(
  page: Page,
  variant: RuntimeVariantV1
): Promise<RuntimeVariantResultV1["perturbations"]> {
  if (!variant.presetWorld?.events?.length && !variant.presetWorld?.routeOutages?.length) return [];
  const application = await page.evaluate(() => {
    const host = (
      window as unknown as {
        __fuzzyWaddleAiRuntimeBrowserTestV1?: {
          presetApplication?: AiRuntimePresetApplicationV1;
        };
      }
    ).__fuzzyWaddleAiRuntimeBrowserTestV1;
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
