import { BehaviorSubject, Observable } from "rxjs";
import { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { getSelectedActors } from "../../data/scene-data";
import { getActorComponent } from "../../data/actor-component";
import { AttackComponent } from "../../entity/components/combat/components/attack-component";
import { ProductionComponent } from "../../entity/components/production/production-component";
import { GathererComponent } from "../../entity/components/resource/gatherer-component";
import GameObject = Phaser.GameObjects.GameObject;

/**
 * Groups actors by their type/capability for tab switching.
 * Priority:
 * - Attack units (combat units)
 * - Production buildings
 * - Gatherer units (workers)
 * - Others
 */
export class SelectionTabHandler {
  private currentTabIndexSubject = new BehaviorSubject<number>(0);
  private groupedActorsSubject = new BehaviorSubject<GameObject[][]>([]);
  
  constructor(private readonly scene: ProbableWaffleScene) {
    this.setupKeyboardListener();
  }

  /**
   * Returns the current tab index as an observable
   */
  get currentTabIndex$(): Observable<number> {
    return this.currentTabIndexSubject.asObservable();
  }

  /**
   * Returns the grouped actors as an observable
   */
  get groupedActors$(): Observable<GameObject[][]> {
    return this.groupedActorsSubject.asObservable();
  }

  /**
   * Returns the current tab index
   */
  get currentTabIndex(): number {
    return this.currentTabIndexSubject.value;
  }

  /**
   * Returns all grouped actors
   */
  get groupedActors(): GameObject[][] {
    return this.groupedActorsSubject.value;
  }

  /**
   * Returns the actors in the current tab group
   */
  get currentTabActors(): GameObject[] {
    const groups = this.groupedActorsSubject.value;
    if (groups.length === 0) return [];
    const index = this.currentTabIndexSubject.value;
    return groups[index] || [];
  }

  /**
   * Updates the grouped actors based on current selection.
   * Called when selection changes.
   */
  updateGroupedActors(): void {
    const selectedActors = getSelectedActors(this.scene);
    if (selectedActors.length === 0) {
      this.groupedActorsSubject.next([]);
      this.currentTabIndexSubject.next(0);
      return;
    }

    const groups = this.groupActorsByType(selectedActors);
    this.groupedActorsSubject.next(groups);
    
    // Reset to first group when selection changes
    this.currentTabIndexSubject.next(0);
  }

  /**
   * Cycles to the next tab group
   */
  nextTab(): void {
    const groups = this.groupedActorsSubject.value;
    if (groups.length <= 1) return; // No need to switch if only one group

    const currentIndex = this.currentTabIndexSubject.value;
    const nextIndex = (currentIndex + 1) % groups.length;
    this.currentTabIndexSubject.next(nextIndex);
  }

  /**
   * Groups actors by their type/capability.
   * Returns array of actor groups, ordered by priority.
   */
  private groupActorsByType(actors: GameObject[]): GameObject[][] {
    const attackActors: GameObject[] = [];
    const productionActors: GameObject[] = [];
    const gathererActors: GameObject[] = [];
    const otherActors: GameObject[] = [];

    actors.forEach((actor) => {
      // Prioritize by most important capability
      const attackComponent = getActorComponent(actor, AttackComponent);
      if (attackComponent) {
        attackActors.push(actor);
        return;
      }

      const productionComponent = getActorComponent(actor, ProductionComponent);
      if (productionComponent) {
        productionActors.push(actor);
        return;
      }

      const gathererComponent = getActorComponent(actor, GathererComponent);
      if (gathererComponent) {
        gathererActors.push(actor);
        return;
      }

      otherActors.push(actor);
    });

    // Return only non-empty groups
    const groups: GameObject[][] = [];
    if (attackActors.length > 0) groups.push(attackActors);
    if (productionActors.length > 0) groups.push(productionActors);
    if (gathererActors.length > 0) groups.push(gathererActors);
    if (otherActors.length > 0) groups.push(otherActors);

    return groups;
  }

  /**
   * Sets up keyboard listener for Tab key
   */
  private setupKeyboardListener(): void {
    if (!this.scene.input.keyboard) return;
    
    this.scene.input.keyboard.on("keydown", this.handleKeyDown, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.input.keyboard?.off("keydown", this.handleKeyDown, this);
    });
  }

  /**
   * Handles keyboard input for Tab key
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "Tab") {
      this.nextTab();
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.scene.input.keyboard?.off("keydown", this.handleKeyDown, this);
    this.currentTabIndexSubject.complete();
    this.groupedActorsSubject.complete();
  }
}
