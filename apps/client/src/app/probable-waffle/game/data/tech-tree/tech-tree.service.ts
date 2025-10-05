// Runtime service that stores per-faction tech graphs & unlock state.
import type { TechTreeGraph } from "./tech-tree.types";
import { FactionType, ObjectNames, ProbableWafflePlayer } from "@fuzzy-waddle/api-interfaces";
import { TechTreeBuilder } from "./tech-tree.builder";

export class TechTreeService {
  private readonly graphs: Record<FactionType, TechTreeGraph>;
  private unlocks: Record<FactionType, Set<string>> = {
    [FactionType.Tivara]: new Set<string>(),
    [FactionType.Skaduwee]: new Set<string>()
  } as const;

  constructor() {
    this.graphs = TechTreeBuilder.build();
    // Auto-unlock roots
    Object.values(this.graphs).forEach((g) => g.roots.forEach((r) => this.unlocks[g.faction].add(r)));
  }

  getGraph(faction: FactionType): TechTreeGraph | undefined {
    return this.graphs[faction];
  }

  isUnlocked(faction: FactionType, id: ObjectNames | string): boolean {
    return this.unlocks[faction].has(id);
  }

  advanceOnSpawn(player: ProbableWafflePlayer, id: ObjectNames | string) {
    const faction = player.factionType;
    if (!faction) return;
    this.unlocks[faction].add(id);
  }

  /** Return (locked) prerequisite chain for a target node (depth-first). */
  getPrerequisites(faction: FactionType, target: ObjectNames): ObjectNames[] {
    const graph = this.graphs[faction];
    if (!graph) return [];
    const node = graph.nodes[target];
    if (!node) return [];
    const needed: ObjectNames[] = [];
    const visit = (id: ObjectNames, stack: Set<string>) => {
      if (this.isUnlocked(faction, id)) return;
      const n = graph.nodes[id];
      if (!n) return;
      for (const pre of n.prerequisites) {
        if (!stack.has(pre)) {
          stack.add(pre);
          visit(pre, stack);
          stack.delete(pre);
        }
      }
      if (!this.isUnlocked(faction, id)) needed.push(id);
    };
    visit(target, new Set());
    return needed;
  }

  getNode(faction: FactionType, id: string) {
    return this.graphs[faction]?.nodes[id];
  }
  isAvailable(faction: FactionType, id: ObjectNames): boolean {
    return this.isUnlocked(faction, id) || this.getPrerequisites(faction, id).length === 0; // unlocked or no prereqs
  }
}
