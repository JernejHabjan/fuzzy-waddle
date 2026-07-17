// Ambient module declaration to augment the phaser mock
// This allows importing createMockScene from "phaser" in tests

declare module "phaser" {
  /**
   * Creates a generic mock scene with common properties
   * @param overrides - Properties to override in the mock scene
   * @returns Mock scene object
   */
  export function createMockScene(overrides?: any): any;
}
