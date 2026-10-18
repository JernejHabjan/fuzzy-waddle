import { test } from "@playwright/test";

test("debug html", async ({ page }) => {
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.stack || err.message));

  await page.goto("/");
  try {
    await page.waitForSelector(".navbar-brand", { timeout: 10000 });
  } catch (e) {
    console.log("navbar-brand NOT FOUND");
  }
  const html = await page.content();
  console.log(html);
});
