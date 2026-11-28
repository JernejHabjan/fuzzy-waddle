import type Phaser from "phaser";
import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Actual native mutation cause. A reset discards provenance; added resource type is the retained extraction definition. */
export interface ResourceCargoChange {
  readonly reason: "added" | "removed" | "reset" | "restore";
  readonly execution?: object;
  readonly transfer?: object;
  readonly target?: Phaser.GameObjects.GameObject;
  readonly resourceType?: ResourceType | null;
  readonly delta?: number;
}
