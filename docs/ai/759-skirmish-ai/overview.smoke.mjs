/** Offline documentation smoke; this does not validate the planned game AI. */
import assert from "node:assert/strict";
import { access, mkdir, readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const directory = dirname(fileURLToPath(import.meta.url));
const artifactDirectory = resolve(directory, "../../../tmp/ai-overview-smoke");
await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.AI_OVERVIEW_BROWSER ? { executablePath: process.env.AI_OVERVIEW_BROWSER } : {})
});
const errors = [];
const externalRequests = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (request) => {
    if (/^https?:/.test(request.url())) externalRequests.push(request.url());
  });
  await page.goto(pathToFileURL(resolve(directory, "overview.html")).href);
  assert.match(await page.locator(".status").innerText(), /NOT IMPLEMENTED GAMEPLAY/);
  assert.equal(await page.locator(".summary li").count(), 6);
  const goals = {
    growth: "prepare_pressure",
    raid: "defend_workers",
    air: "prepare_anti_air",
    blocked: "restore_construction",
    island: "establish_island"
  };
  for (const [scene, goal] of Object.entries(goals)) {
    await page.selectOption("#situation", scene);
    assert.equal(await page.locator("#actions li").count(), 3);
    for (let step = 0; step < 6; step += 1) {
      await page.locator(`[data-step="${step}"]`).click();
      const record = JSON.parse(await page.locator("#diagnostic-record").textContent());
      assert.equal(record.goal, goal);
      assert.equal(record.example, true);
      assert.equal(record.not_live_gameplay, true);
      assert.equal(record.next_evidence, await page.locator("#step-text").innerText());
      assert.equal(await page.locator('[data-step][aria-pressed="true"]').count(), 1);
    }
    for (const [id, visibleScene] of [
      ["raid-route", "raid"],
      ["flyers", "air"],
      ["blocked-mark", "blocked"],
      ["boat-route", "island"]
    ]) {
      assert.equal(await page.locator(`#${id}`).isVisible(), scene === visibleScene);
    }
  }
  for (const [profile, seconds, missions] of [
    ["easy", "2 s", 1],
    ["normal", "1 s", 2],
    ["hard", "0.5 s", 3]
  ]) {
    const button = page.locator(`[data-difficulty="${profile}"]`);
    await button.focus();
    await page.keyboard.press("Enter");
    assert.equal(await button.getAttribute("aria-pressed"), "true");
    assert.equal(await page.locator('[data-difficulty][aria-pressed="true"]').count(), 1);
    assert.equal(await page.locator("#profile-tempo").innerText(), `${seconds} decision interval`);
    assert.match(await page.locator("#profile-missions").innerText(), new RegExp(`up to ${missions} voluntary`));
    assert.equal(JSON.parse(await page.locator("#diagnostic-record").textContent()).profile, profile);
  }
  for (const [desired, ready, pending, needed] of [
    [2, 1, 1, 0],
    [4, 1, 1, 2],
    [0, 8, 8, 0],
    [8, 0, 0, 8],
    [-3, 0, 0, 0],
    [99, 0, 0, 8],
    [3.9, 1, 0, 2]
  ]) {
    for (const [id, value] of [
      ["desired", desired],
      ["ready", ready],
      ["pending", pending]
    ])
      await page.fill(`#${id}`, String(value));
    assert.match(await page.locator("#capacity-result").innerText(), new RegExp(`^${needed} additional`));
  }
  await page.locator("#diagnostics summary").focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#diagnostic-record").isVisible(), true);
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true,
      `Overflow at ${width}px`
    );
    const labelsFit = await page.locator(".map").evaluate((svg) =>
      [...svg.querySelectorAll("text")].every((label) => {
        const box = label.getBBox();
        return box.x >= 0 && box.y >= 0 && box.x + box.width <= 560 && box.y + box.height <= 300;
      })
    );
    assert.equal(labelsFit, true, `Map labels clipped at ${width}px`);
    await page.screenshot({ path: resolve(artifactDirectory, `overview-${width}.png`), fullPage: true });
  }
  for (const href of await page
    .locator("footer a")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href"))))
    await access(resolve(directory, href));
  // Keep the cross-linked specification runnable without silently dropping new catalog rows.
  const ids = [];
  for (const file of await readdir(directory)) {
    if (!file.endsWith(".md")) continue;
    const source = await readFile(resolve(directory, file), "utf8");
    for (const match of source.matchAll(/\]\(([^\s)]+)\)/g)) {
      if (/^(https?:|#)/.test(match[1])) continue;
      await access(resolve(directory, decodeURIComponent(match[1].split("#")[0])));
    }
    if (/^(08|10|11|12)-/.test(file)) {
      for (const match of source.matchAll(/^\|\s*([A-Z]+-\d{2})(?:\s|\s*\/)/gm)) ids.push(match[1]);
    }
  }
  assert.equal(ids.length, 121, "All named scenario rows must be present");
  assert.equal(new Set(ids).size, 121, "Scenario IDs must be unique");
  const noScript = await browser.newPage({ javaScriptEnabled: false });
  await noScript.goto(pathToFileURL(resolve(directory, "overview.html")).href);
  assert.equal(await noScript.locator(".summary li").count(), 6);
  assert.equal(await noScript.locator("noscript").isVisible(), true);
  assert.deepEqual(errors, []);
  assert.deepEqual(externalRequests, []);
  console.log(
    "PASS: 30 scenario/stage combinations, 3 keyboard-operated profiles, capacity boundaries, 3 layouts, offline fallback, local document links and 121 unique scenario IDs."
  );
  console.log(`Screenshots: ${artifactDirectory}`);
} finally {
  await browser.close();
}
