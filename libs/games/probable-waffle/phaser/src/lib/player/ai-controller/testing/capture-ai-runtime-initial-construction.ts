import type Phaser from "phaser";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { ConstructionSiteComponent } from "../../../entity/components/construction/construction-site-component";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import type { AiRuntimeInitialConstructionV1 } from "./ai-runtime-initial-construction-v1";

/** Reuses the installation's indexed actor list once. No later snapshot can backfill this membership. */
export function captureAiRuntimeInitialConstruction(
  scene: ProbableWaffleScene, actors: readonly Phaser.GameObjects.GameObject[], tick: number
): Map<number, AiRuntimeInitialConstructionV1> {
  const records = new Map<number, { sites: AiRuntimeInitialConstructionV1["sites"][number][]; gaps: Set<string> }>();
  for (const player of scene.players) {
    if (player.playerNumber !== undefined) records.set(player.playerNumber, { sites: [], gaps: new Set() });
  }
  let readerFailed = false;
  for (const actor of actors) {
    if (actor.scene !== scene) continue;
    try {
      const construction = getActorComponent(actor, ConstructionSiteComponent);
      if (!construction) continue;
      const site = captureAiRuntimeCreatedActor(actor);
      if (site.playerNumber === null) { readerFailed = true; continue; }
      const record = records.get(site.playerNumber);
      if (!record) continue;
      if (record.gaps.has("production_construction_initial_overflow")) continue;
      if (record.sites.length === 256) {
        record.sites.length = 0;
        record.gaps.add("production_construction_initial_overflow");
        continue;
      }
      const data = construction.getData();
      record.sites.push({ site, state: data.state, remainingWorkMs: data.remainingConstructionTime });
    } catch { readerFailed = true; }
  }
  const snapshotRestoreInProgress = isSnapshotApplyInProgress(scene);
  return new Map<number, AiRuntimeInitialConstructionV1>([...records].map(([playerNumber, record]) =>
    [playerNumber, structuredClone({ tick, snapshotRestoreInProgress, sites: readerFailed ? [] : record.sites,
      gaps: [...record.gaps, ...(readerFailed ? ["production_construction_initial_reader_missing"] : [])].sort()
    } satisfies AiRuntimeInitialConstructionV1)]));
}
