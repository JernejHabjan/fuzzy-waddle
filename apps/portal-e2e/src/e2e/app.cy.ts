import { getFeaturedGame, getGameTiles, getPortalBrand } from "../support/app.po";

describe("portal", () => {
  beforeEach(() => cy.visit("/"));

  it("displays the game portal", () => {
    getPortalBrand().should("contain.text", "Fuzzy Waddle");
    getFeaturedGame().should("be.visible").and("contain.text", "Featured");
    getGameTiles().should("have.length.at.least", 4);
  });
});
