import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";
import type { Page } from "@playwright/test";
import { parseChunked } from "@discoveryjs/json-ext";
// prettier-ignore
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";

/** Retains diagnostic authority facts, without converting incomplete provenance into passing production evidence. */
export async function captureRuntimeProductionAuthority(
  page: Page,
  playerNumber: number,
  latestTick?: number,
  omitSharedLedger = false
): Promise<AiRuntimeProductionCaptureV1> {
  const compressed = await page.evaluate(
    async ({ owner, horizon, omitLedger }) => {
      const host = window as unknown as {
        __fuzzyWaddleAiRuntimeBrowserTestV1?: {
          productionCapture?: { capture(player: number, horizon?: number): AiRuntimeProductionCaptureV1 };
        };
      };
      const capture = host.__fuzzyWaddleAiRuntimeBrowserTestV1?.productionCapture;
      if (!capture) throw new Error("runtime_production_capture_unavailable");
      const record = capture.capture(owner, horizon);
      const detached = omitLedger ? { ...record, recipientResourceFacts: undefined } : record;
      const serialize = function* (value: unknown, arrayItem = false): Generator<string> {
        if (value === null || value === undefined || typeof value === "function" || typeof value === "symbol") {
          if (value === null || arrayItem) yield "null";
          return;
        }
        if (Array.isArray(value)) {
          yield "[";
          for (let index = 0; index < value.length; index++) {
            if (index) yield ",";
            yield* serialize(value[index], true);
          }
          yield "]";
          return;
        }
        if (typeof value === "object") {
          yield "{";
          let first = true;
          for (const key of Object.keys(value)) {
            const item = (value as Record<string, unknown>)[key];
            if (item === undefined || typeof item === "function" || typeof item === "symbol") continue;
            if (!first) yield ",";
            first = false;
            yield `${JSON.stringify(key)}:`;
            yield* serialize(item);
          }
          yield "}";
          return;
        }
        yield JSON.stringify(value) ?? "null";
      };
      const encoder = new TextEncoder();
      let iterator: Generator<string> | undefined;
      const json = new ReadableStream<Uint8Array>({
        start() {
          iterator = serialize(detached);
        },
        pull(controller) {
          if (!iterator) throw new Error("runtime_production_capture_stream_unavailable");
          let text = "";
          while (text.length < 16_384) {
            const next = iterator.next();
            if (next.done) {
              if (text) controller.enqueue(encoder.encode(text));
              controller.close();
              return;
            }
            text += next.value;
          }
          controller.enqueue(encoder.encode(text));
        }
      });
      const stream = json.pipeThrough(
        new CompressionStream("gzip") as unknown as TransformStream<Uint8Array, Uint8Array>
      );
      const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
      let binary = "";
      for (let offset = 0; offset < bytes.length; offset += 0x8000)
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
      return btoa(binary);
    },
    { owner: playerNumber, horizon: latestTick, omitLedger: omitSharedLedger }
  );
  const compressedBytes = Buffer.from(compressed, "base64");
  const capture = await parseChunked(Readable.from([compressedBytes]).pipe(createGunzip()));
  return capture as AiRuntimeProductionCaptureV1;
}
