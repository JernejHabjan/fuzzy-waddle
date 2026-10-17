import { expect, test } from "@playwright/test";
import { advanceRuntimeFrames } from "./skirmish-ai-runtime-frame-driver";

test("native frame driver yields through nested Promise work before the next tick", async ({ page }) => {
  await page.setContent("<body></body>");
  await page.evaluate(() => {
    let ready = true;
    let paused = true;
    const frames: number[] = [];
    const tickService = {
      currentTick: 0,
      setSimulationTimeScale: (scale: number) => {
        if (scale !== 1) throw new Error("scaled_frame");
      },
      resumeTick: () => {
        paused = false;
      },
      pauseTick: () => {
        paused = true;
        document.body.dataset["paused"] = "true";
      }
    };
    Object.assign(window, {
      __fuzzyWaddleAiRuntimePartsV1: () => ({ tickService }),
      __fuzzyWaddleAiRuntimeBrowserTestV1: {
        game: {
          loop: {
            now: 100,
            sleep: () => {
              document.body.dataset["sleep"] = "true";
            }
          },
          headlessStep: (time: number, delta: number) => {
            if (!ready || paused || delta !== 50) throw new Error("native_work_not_settled");
            frames.push(time);
            tickService.currentTick++;
            ready = false;
            Promise.resolve()
              .then(() => Promise.resolve())
              .then(() => {
                ready = true;
                document.body.dataset["frames"] = JSON.stringify(frames);
              });
          }
        }
      }
    });
  });
  await advanceRuntimeFrames(page, 2, 3);
  expect(await page.locator("body").getAttribute("data-frames")).toBe("[150,200,250]");
  expect(await page.locator("body").getAttribute("data-paused")).toBe("true");
  expect(await page.locator("body").getAttribute("data-sleep")).toBe("true");
});

test("native frame driver refuses a missing game instead of supplying simulated evidence", async ({ page }) => {
  await page.setContent("<body></body>");
  await expect(advanceRuntimeFrames(page, 2, 10)).rejects.toThrow("runtime_frame_driver_unavailable");
});
