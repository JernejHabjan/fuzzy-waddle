import type { Page } from "@playwright/test";

export const getPortalBrand = (page: Page) => page.locator(".navbar-brand .title");
export const getFeaturedGame = (page: Page) => page.locator(".tile-featured");
export const getGameTiles = (page: Page) => page.locator(".tile-game");
