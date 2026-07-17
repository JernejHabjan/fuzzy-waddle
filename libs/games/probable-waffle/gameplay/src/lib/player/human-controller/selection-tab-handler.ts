import { BehaviorSubject, Observable } from "rxjs";
import { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { getSelectedActors } from "../../data/scene-data";
import GameObject = Phaser.GameObjects.GameObject;

/**
 * Groups actors by their name (GameObject.name) for tab switching.
 * This allows cycling through different actor types, e.g., warriors, workers, buildings separately.
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
   * Groups actors by their name.
   * Returns array of actor groups, ordered by first occurrence in selection.
   */
  private groupActorsByType(actors: GameObject[]): GameObject[][] {
    const groupsByName = new Map<string, GameObject[]>();

    actors.forEach((actor) => {
      const actorName = actor.name;
      if (!groupsByName.has(actorName)) {
        groupsByName.set(actorName, []);
      }
      groupsByName.get(actorName)!.push(actor);
    });

    // Return groups in order of first occurrence
    return Array.from(groupsByName.values());
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
