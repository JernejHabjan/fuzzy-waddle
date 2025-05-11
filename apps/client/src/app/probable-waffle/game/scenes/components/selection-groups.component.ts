import { HealthComponent } from "../../entity/combat/components/health-component";
import { emitEventSelection, getSelectedActors } from "../../data/scene-data";
import { onSceneInitialized } from "../../data/game-object-helper";
import { CrossSceneCommunicationService } from "../services/CrossSceneCommunicationService";
import { getSceneService } from "./scene-component-helpers";
import { getActorComponent } from "../../data/actor-component";
import { IdComponent } from "../../entity/actor/components/id-component";

export interface SelectionGroup {
  actors: Phaser.GameObjects.GameObject[];
  groupKey: number;
  timestamp: number;
}

export interface ActorGroupEvent {
  groupKey: number;
  count: number;
  leadActor: Phaser.GameObjects.GameObject | null;
  actors: Phaser.GameObjects.GameObject[];
}

export class SelectionGroupsComponent {
  static readonly GroupCreatedEvent = "group-created";
  static readonly GroupUpdatedEvent = "group-updated";
  static readonly GroupSelectedEvent = "group-selected";

  private groups: Map<number, SelectionGroup> = new Map();
  private doubleTapDelay = 300; // ms
  private lastTapTimestamp: Map<number, number> = new Map();
  private crossSceneCommunicationService?: CrossSceneCommunicationService;

  constructor(private scene: Phaser.Scene) {
    onSceneInitialized(scene, this.init, this);
    this.setupEventListeners();
  }

  private init(): void {
    this.crossSceneCommunicationService = getSceneService(this.scene, CrossSceneCommunicationService);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.scene.input.keyboard) return;
    // Listen for keyboard events
    this.scene.input.keyboard.on("keydown", this.handleKeyDown, this);

    // Listen for killed events to update groups
    this.scene.events.on(HealthComponent.KilledEvent, this.handleActorKilled, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Check for Ctrl+1-9 combinations to create groups
    if (event.ctrlKey && event.key >= "1" && event.key <= "9") {
      const groupKey = parseInt(event.key);
      this.createGroup(groupKey);
      event.preventDefault(); // Prevent default action for Ctrl+1-9
      event.stopPropagation();
    }
    // Check for numeric keys 1-9 without Ctrl to select groups
    else if (!event.ctrlKey && event.key >= "1" && event.key <= "9") {
      const groupKey = parseInt(event.key);
      const currentTime = Date.now();
      const lastTapTime = this.lastTapTimestamp.get(groupKey) || 0;

      // Check if this is a double tap
      if (currentTime - lastTapTime < this.doubleTapDelay) {
        this.selectGroup(groupKey);
        // Reset to prevent triple-tap being treated as another double-tap
        this.lastTapTimestamp.delete(groupKey);
      } else {
        this.lastTapTimestamp.set(groupKey, currentTime);
      }

      event.preventDefault(); // Prevent default action for Ctrl+1-9
      event.stopPropagation();
    }
  }

  private createGroup(groupKey: number): void {
    const selectedActors = getSelectedActors(this.scene);
    if (selectedActors.length === 0) {
      return;
    }

    const group = {
      actors: [...selectedActors],
      groupKey,
      timestamp: Date.now()
    } satisfies SelectionGroup;

    this.groups.set(groupKey, group);
    this.emitGroupEvent(SelectionGroupsComponent.GroupCreatedEvent, groupKey);
    this.emitGroupEvent(SelectionGroupsComponent.GroupSelectedEvent, groupKey);
  }

  selectGroup(groupKey: number): void {
    const group = this.groups.get(groupKey);
    if (!group || group.actors.length === 0) {
      return;
    }

    // Filter out destroyed actors
    const validActors = group.actors.filter((actor) => actor.active);

    // Update the group with only valid actors
    if (validActors.length !== group.actors.length) {
      group.actors = validActors;
      this.emitGroupEvent(SelectionGroupsComponent.GroupUpdatedEvent, groupKey);
      this.emitGroupEvent(SelectionGroupsComponent.GroupSelectedEvent, groupKey);
    }

    if (validActors.length > 0) {
      // Emit event to signal group selection
      const eventBody = {
        groupKey,
        count: validActors.length,
        leadActor: validActors[0],
        actors: validActors
      } as ActorGroupEvent;
      this.crossSceneCommunicationService?.emit(SelectionGroupsComponent.GroupSelectedEvent, eventBody);
      emitEventSelection(
        this.scene,
        "selection.set",
        validActors.map((actor) => getActorComponent(actor, IdComponent)!.id)
      );
    }
  }

  private handleActorKilled(gameObject: Phaser.GameObjects.GameObject): void {
    let updatedGroups = false;

    // Check all groups for the killed actor and remove it
    this.groups.forEach((group, key) => {
      const initialLength = group.actors.length;
      group.actors = group.actors.filter((actor) => actor !== gameObject);

      if (initialLength !== group.actors.length) {
        updatedGroups = true;
        this.emitGroupEvent(SelectionGroupsComponent.GroupUpdatedEvent, key);
      }
    });
  }

  private emitGroupEvent(eventName: string, groupKey: number): void {
    const group = this.groups.get(groupKey);
    if (!group) return;

    const eventBody = {
      groupKey,
      count: group.actors.length,
      leadActor: group.actors.length > 0 ? group.actors[0] : null
    } as ActorGroupEvent;
    this.crossSceneCommunicationService?.emit(eventName, eventBody);
  }

  destroy(): void {
    this.scene.input.keyboard?.off("keydown", this.handleKeyDown, this);
    this.scene.events.off(HealthComponent.KilledEvent, this.handleActorKilled, this);
    this.groups.clear();
    this.lastTapTimestamp.clear();
  }
}
