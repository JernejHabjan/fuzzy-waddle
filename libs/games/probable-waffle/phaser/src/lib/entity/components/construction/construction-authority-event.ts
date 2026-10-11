import type Phaser from "phaser";
import type { ConstructionAuthorityRecord } from "./construction-authority-record";

export const CONSTRUCTION_AUTHORITY_EVENT = "construction-authority";

/** Live site is projected by the marked observer before retention; no scene object enters save/relay data. */
export type ConstructionAuthorityEvent = ConstructionAuthorityRecord & { readonly site: Phaser.GameObjects.GameObject };
