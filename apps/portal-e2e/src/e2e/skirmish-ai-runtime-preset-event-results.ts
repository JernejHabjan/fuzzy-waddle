import type { Page } from "@playwright/test";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";

/** Read applied preset-event facts only after the normal browser service has executed them. */
export async function collectRuntimePresetEvents(
  page: Page,
  variant: RuntimeVariantV1
): Promise<RuntimeVariantResultV1["perturbations"]> {
  if (!variant.presetWorld?.events?.length) return [];
  const eventResults = await page.evaluate(() => {
    const host = (
      window as unknown as {
        __fuzzyWaddleAiRuntimeBrowserTestV1?: {
          presetApplication?: {
            eventResults: { id: string; tick: number; affectedActors: number; subjectName: string }[];
          };
        };
      }
    ).__fuzzyWaddleAiRuntimeBrowserTestV1;
    return host?.presetApplication?.eventResults ?? [];
  });
  if (eventResults.length !== variant.presetWorld.events.length) throw new Error("runtime_preset_events_incomplete");
  return eventResults.map((event) => ({
    id: event.id, tick: event.tick, dispatchedActors: event.affectedActors, subjectName: event.subjectName
  }));
}
