import { expect, test } from "@playwright/test";
import { getFeaturedGame, getGameTiles, getPortalBrand } from "../support/app.po";

test("displays the game portal", async ({ page }) => {
  await page.goto("/");

  await expect(getPortalBrand(page)).toContainText("Fuzzy Waddle");
  await expect(getFeaturedGame(page)).toBeVisible();
  await expect(getFeaturedGame(page)).toContainText("Featured");
  await expect.poll(() => getGameTiles(page).count()).toBeGreaterThanOrEqual(4);
});
