import Phaser from "phaser";
import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type {
  ScenarioActorId,
  ScenarioCameraShotId,
  ScenarioGroupId,
  ScenarioPointId,
  ScenarioRegionId,
  ScenarioRouteId,
  ScenarioSpawnSetId,
  ScenarioTagId
} from "@fuzzy-waddle/probable-waffle-campaign";
import { asCampaignContentId, isCampaignContentId } from "@fuzzy-waddle/probable-waffle-campaign";
import { getActorComponent } from "../../data/actor-component";
import { getGameObjectLogicalTransform } from "../../data/game-object-helper";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
import { getSceneService } from "../../world/services/scene-component-helpers";
import type ScenarioCameraShotMarker from "../../prefabs/scenario/ScenarioCameraShot";
import type ScenarioGroupMarker from "../../prefabs/scenario/ScenarioGroup";
import type ScenarioRegionMarker from "../../prefabs/scenario/ScenarioRegion";
import type ScenarioRouteMarker from "../../prefabs/scenario/ScenarioRoute";
import type ScenarioSpawnSetMarker from "../../prefabs/scenario/ScenarioSpawnSet";
import { normalizeScenarioList, ScenarioActorReferenceComponent } from "./scenario-actor-reference.component";
import type { ScenarioMarker, ScenarioMarkerKind } from "./scenario-marker";
import { ScenarioRegionRuntime } from "./scenario-region";

type GameObject = Phaser.GameObjects.GameObject;

export interface ScenarioRouteRuntime {
  readonly id: ScenarioRouteId;
  readonly points: readonly Vector3Simple[];
  readonly loop: boolean;
  readonly facingAngles: readonly number[];
}

export interface ScenarioCameraShotRuntime {
  readonly id: ScenarioCameraShotId;
  readonly center: Vector3Simple;
  readonly zoom: number;
  readonly durationTicks: number;
  readonly letterbox: boolean;
}

export interface ScenarioSpawnSetRuntime {
  readonly id: ScenarioSpawnSetId;
  readonly points: readonly Vector3Simple[];
}

export interface ScenarioReferenceDebugGeometry {
  readonly id: string;
  readonly kind: ScenarioMarkerKind | "actor";
  readonly points: readonly Vector3Simple[];
}

export class ScenarioReferenceError extends Error {
  constructor(
    readonly code: "duplicate-scenario-id" | "missing-scenario-id" | "invalid-scenario-reference",
    readonly sceneKey: string,
    readonly scenarioId: string,
    message: string
  ) {
    super(message);
    this.name = "ScenarioReferenceError";
  }
}

export abstract class ScenarioReferenceRegistry {
  abstract initialize(scene: Phaser.Scene): void;
  abstract registerActor(actor: GameObject): void;
  abstract claimActorRole(actor: GameObject, id: ScenarioActorId, tags?: readonly string[]): void;
  abstract actor(id: ScenarioActorId): GameObject | undefined;
  abstract actorsWithTag(tag: ScenarioTagId): readonly GameObject[];
  abstract allActors(): readonly GameObject[];
  abstract point(id: ScenarioPointId): Vector3Simple | undefined;
  abstract region(id: ScenarioRegionId): ScenarioRegionRuntime | undefined;
  abstract route(id: ScenarioRouteId): ScenarioRouteRuntime | undefined;
  abstract group(id: ScenarioGroupId): readonly GameObject[];
  abstract cameraShot(id: ScenarioCameraShotId): ScenarioCameraShotRuntime | undefined;
  abstract spawnSet(id: ScenarioSpawnSetId): ScenarioSpawnSetRuntime | undefined;
  abstract regionsContaining(position: Vector3Simple): readonly ScenarioRegionRuntime[];
  abstract actorRegions(id: ScenarioActorId): readonly ScenarioRegionRuntime[];
  abstract debugGeometry(): readonly ScenarioReferenceDebugGeometry[];
  abstract debugFocus(id: string): Vector3Simple | undefined;
  abstract debugHighlight(id: ScenarioRegionId): boolean;
  abstract destroy(): void;
}

interface GroupDefinition {
  readonly memberActorIds: readonly ScenarioActorId[];
  readonly requiredTags: readonly string[];
}

/** One-time scene compiler plus indexed stable-reference queries for campaign gameplay. */
export class IndexedScenarioReferenceRegistry extends ScenarioReferenceRegistry {
  private scene?: Phaser.Scene;
  private initialized = false;
  private readonly namespaceById = new Map<string, ScenarioMarkerKind | "actor">();
  private readonly actors = new Map<ScenarioActorId, GameObject>();
  private readonly actorRoles = new Map<GameObject, ScenarioActorId>();
  private readonly actorsByTag = new Map<string, Set<GameObject>>();
  private readonly points = new Map<ScenarioPointId, Vector3Simple>();
  private readonly regions = new Map<ScenarioRegionId, ScenarioRegionRuntime>();
  private readonly routes = new Map<ScenarioRouteId, ScenarioRouteRuntime>();
  private readonly groups = new Map<ScenarioGroupId, GroupDefinition>();
  private readonly cameraShots = new Map<ScenarioCameraShotId, ScenarioCameraShotRuntime>();
  private readonly spawnSets = new Map<ScenarioSpawnSetId, ScenarioSpawnSetRuntime>();
  private readonly actorDestroyHandlers = new Map<GameObject, () => void>();
  private debugHighlightGraphics?: Phaser.GameObjects.Graphics;
  private debugHighlightTimer?: Phaser.Time.TimerEvent;

  initialize(scene: Phaser.Scene): void {
    if (this.initialized) return;
    this.initialized = true;
    this.scene = scene;
    for (const actor of getSceneService(scene, ActorIndexSystem)?.getAllIdActors() ?? []) this.registerActor(actor);
    for (const child of scene.children.list) {
      if (isScenarioMarker(child)) this.registerMarker(child);
    }
    this.compileRoutesAndSpawnSets(scene.children.list.filter(isScenarioMarker));
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  registerActor(actor: GameObject): void {
    const data = getActorComponent(actor, ScenarioActorReferenceComponent)?.getData();
    if (!data) return;
    const id = asCampaignContentId<"scenario-actor">(data.roleId);
    const existing = this.actors.get(id);
    if (existing === actor) return;
    this.assertUnique(id, "actor");
    this.actors.set(id, actor);
    this.actorRoles.set(actor, id);
    for (const tag of data.tags) {
      const actors = this.actorsByTag.get(tag) ?? new Set<GameObject>();
      actors.add(actor);
      this.actorsByTag.set(tag, actors);
    }
    const onDestroy = () => this.unregisterActor(actor);
    actor.once(Phaser.GameObjects.Events.DESTROY, onDestroy);
    this.actorDestroyHandlers.set(actor, onDestroy);
  }

  claimActorRole(actor: GameObject, id: ScenarioActorId, tags: readonly string[] = []): void {
    const component = getActorComponent(actor, ScenarioActorReferenceComponent);
    if (!component) throw this.error("invalid-scenario-reference", id, `Actor cannot claim scenario role '${id}'`);
    const existingKind = this.namespaceById.get(id);
    if (existingKind && this.actorRoles.get(actor) !== id) {
      throw this.error(
        "duplicate-scenario-id",
        id,
        `Actor cannot claim scenario role '${id}' in ${this.sceneKey}; it is already declared as ${existingKind}`
      );
    }
    this.unregisterActor(actor);
    component.setData({ roleId: id, tags: [...tags] });
    this.registerActor(actor);
  }

  actor(id: ScenarioActorId): GameObject | undefined {
    return this.actors.get(id);
  }

  actorsWithTag(tag: ScenarioTagId): readonly GameObject[] {
    return [...(this.actorsByTag.get(tag) ?? [])].sort((left, right) =>
      String(this.actorRoles.get(left)).localeCompare(String(this.actorRoles.get(right)))
    );
  }

  allActors(): readonly GameObject[] {
    return [...this.actors.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([, actor]) => actor);
  }

  point(id: ScenarioPointId): Vector3Simple | undefined {
    const point = this.points.get(id);
    return point ? { ...point } : undefined;
  }

  region(id: ScenarioRegionId): ScenarioRegionRuntime | undefined {
    return this.regions.get(id);
  }

  route(id: ScenarioRouteId): ScenarioRouteRuntime | undefined {
    return this.routes.get(id);
  }

  group(id: ScenarioGroupId): readonly GameObject[] {
    const definition = this.groups.get(id);
    if (!definition) return [];
    const result = new Set<GameObject>();
    for (const actorId of definition.memberActorIds) {
      const actor = this.actors.get(actorId);
      if (actor) result.add(actor);
    }
    if (definition.requiredTags.length > 0) {
      const [firstTag, ...remainingTags] = definition.requiredTags;
      for (const actor of this.actorsByTag.get(firstTag!) ?? []) {
        const component = getActorComponent(actor, ScenarioActorReferenceComponent);
        if (remainingTags.every((tag) => component?.hasTag(tag))) result.add(actor);
      }
    }
    return [...result].sort((left, right) =>
      String(this.actorRoles.get(left)).localeCompare(String(this.actorRoles.get(right)))
    );
  }

  cameraShot(id: ScenarioCameraShotId): ScenarioCameraShotRuntime | undefined {
    return this.cameraShots.get(id);
  }

  spawnSet(id: ScenarioSpawnSetId): ScenarioSpawnSetRuntime | undefined {
    return this.spawnSets.get(id);
  }

  regionsContaining(position: Vector3Simple): readonly ScenarioRegionRuntime[] {
    return [...this.regions.values()]
      .filter((region) => region.contains(position))
      .sort((left, right) => left.definition.id.localeCompare(right.definition.id));
  }

  actorRegions(id: ScenarioActorId): readonly ScenarioRegionRuntime[] {
    const actor = this.actor(id);
    const position = actor ? getGameObjectLogicalTransform(actor) : undefined;
    return position ? this.regionsContaining(position) : [];
  }

  debugGeometry(): readonly ScenarioReferenceDebugGeometry[] {
    const result: ScenarioReferenceDebugGeometry[] = [];
    for (const [id, point] of this.points) result.push({ id, kind: "point", points: [{ ...point }] });
    for (const [id, region] of this.regions) {
      result.push({
        id,
        kind: "region",
        points: region.definition.points.map((point) => ({ ...point, z: region.definition.elevation ?? 0 }))
      });
    }
    for (const [id, route] of this.routes) result.push({ id, kind: "route", points: route.points });
    for (const [id, shot] of this.cameraShots) result.push({ id, kind: "camera-shot", points: [shot.center] });
    for (const [id, set] of this.spawnSets) result.push({ id, kind: "spawn-set", points: set.points });
    for (const [id, actor] of this.actors) {
      const position = getGameObjectLogicalTransform(actor);
      if (position) result.push({ id, kind: "actor", points: [{ ...position }] });
    }
    return result.sort((left, right) => left.id.localeCompare(right.id));
  }

  debugFocus(id: string): Vector3Simple | undefined {
    const actor = this.actors.get(asCampaignContentId<"scenario-actor">(id));
    const actorPosition = actor ? getGameObjectLogicalTransform(actor) : undefined;
    if (actorPosition) return { ...actorPosition };
    const point = this.points.get(asCampaignContentId<"scenario-point">(id));
    if (point) return { ...point };
    const region = this.regions.get(asCampaignContentId<"scenario-region">(id));
    if (region) return centroid(region.definition.points, region.definition.elevation ?? 0);
    const route = this.routes.get(asCampaignContentId<"scenario-route">(id));
    if (route?.points[0]) return { ...route.points[0] };
    const shot = this.cameraShots.get(asCampaignContentId<"scenario-camera-shot">(id));
    if (shot) return { ...shot.center };
    const spawnSet = this.spawnSets.get(asCampaignContentId<"scenario-spawn-set">(id));
    if (spawnSet?.points[0]) return { ...spawnSet.points[0] };
    const groupActor = this.group(asCampaignContentId<"scenario-group">(id))[0];
    const groupPosition = groupActor ? getGameObjectLogicalTransform(groupActor) : undefined;
    return groupPosition ? { ...groupPosition } : undefined;
  }

  debugHighlight(id: ScenarioRegionId): boolean {
    const region = this.regions.get(id);
    if (!region || !this.scene) return false;
    this.debugHighlightTimer?.destroy();
    this.debugHighlightGraphics?.destroy();
    const graphics = this.scene.add.graphics().setDepth(20_000);
    const points = region.definition.points;
    graphics.lineStyle(3, 0xffd35a, 1);
    if (points.length > 1) {
      graphics.beginPath();
      graphics.moveTo(points[0]!.x, points[0]!.y);
      for (const point of points.slice(1)) graphics.lineTo(point.x, point.y);
      graphics.closePath().strokePath();
    }
    this.debugHighlightGraphics = graphics;
    this.debugHighlightTimer = this.scene.time.delayedCall(3_000, () => {
      graphics.destroy();
      if (this.debugHighlightGraphics === graphics) this.debugHighlightGraphics = undefined;
      this.debugHighlightTimer = undefined;
    });
    return true;
  }

  destroy = (): void => {
    this.debugHighlightTimer?.destroy();
    this.debugHighlightGraphics?.destroy();
    this.debugHighlightTimer = undefined;
    this.debugHighlightGraphics = undefined;
    for (const [actor, handler] of this.actorDestroyHandlers) actor.off(Phaser.GameObjects.Events.DESTROY, handler);
    this.actorDestroyHandlers.clear();
    this.namespaceById.clear();
    this.actors.clear();
    this.actorRoles.clear();
    this.actorsByTag.clear();
    this.points.clear();
    this.regions.clear();
    this.routes.clear();
    this.groups.clear();
    this.cameraShots.clear();
    this.spawnSets.clear();
    this.scene = undefined;
    this.initialized = false;
  };

  private registerMarker(marker: ScenarioMarker): void {
    const id = marker.scenarioId.trim();
    if (!isCampaignContentId(id)) {
      throw this.error(
        "invalid-scenario-reference",
        id,
        `Scenario ${marker.scenarioMarkerKind} ID '${id}' must use lowercase kebab-case`
      );
    }
    this.assertUnique(id, marker.scenarioMarkerKind);
    switch (marker.scenarioMarkerKind) {
      case "point":
        this.points.set(asCampaignContentId<"scenario-point">(id), markerPosition(marker));
        break;
      case "region":
        this.registerRegion(marker as ScenarioRegionMarker);
        break;
      case "route":
        break;
      case "group": {
        const group = marker as ScenarioGroupMarker;
        const requiredTags = normalizeScenarioList(group.requiredTags);
        const invalidTag = requiredTags.find((tag) => !isCampaignContentId(tag));
        if (invalidTag) {
          throw this.error(
            "invalid-scenario-reference",
            id,
            `Scenario group '${id}' tag '${invalidTag}' must use lowercase kebab-case`
          );
        }
        this.groups.set(asCampaignContentId<"scenario-group">(id), {
          memberActorIds: normalizeScenarioList(group.memberActorIds).map((value) =>
            asCampaignContentId<"scenario-actor">(value)
          ),
          requiredTags
        });
        break;
      }
      case "camera-shot": {
        const shot = marker as ScenarioCameraShotMarker;
        if (!(shot.zoom > 0) || shot.durationTicks < 0 || !Number.isInteger(shot.durationTicks)) {
          throw this.error(
            "invalid-scenario-reference",
            id,
            `Camera shot '${id}' requires a positive zoom and a non-negative integer durationTicks`
          );
        }
        this.cameraShots.set(asCampaignContentId<"scenario-camera-shot">(id), {
          id: asCampaignContentId<"scenario-camera-shot">(id),
          center: markerPosition(shot),
          zoom: shot.zoom,
          durationTicks: shot.durationTicks,
          letterbox: shot.letterbox
        });
        break;
      }
      case "spawn-set":
        break;
    }
  }

  private registerRegion(marker: ScenarioRegionMarker): void {
    const id = asCampaignContentId<"scenario-region">(marker.scenarioId.trim());
    if (marker.elevationPolicy === "range" && marker.minimumElevation > marker.maximumElevation) {
      throw this.error(
        "invalid-scenario-reference",
        id,
        `Scenario region '${id}' has minimumElevation greater than maximumElevation`
      );
    }
    const points =
      marker.shape === "polygon"
        ? this.parsePolygonPoints(marker.polygonPoints, id).map((point) => ({
            x: marker.x + point.x,
            y: marker.y + point.y
          }))
        : [
            { x: marker.x - marker.width / 2, y: marker.y - marker.height / 2 },
            { x: marker.x + marker.width / 2, y: marker.y - marker.height / 2 },
            { x: marker.x + marker.width / 2, y: marker.y + marker.height / 2 },
            { x: marker.x - marker.width / 2, y: marker.y + marker.height / 2 }
          ];
    this.regions.set(
      id,
      new ScenarioRegionRuntime({
        id,
        shape: marker.shape,
        points,
        elevationPolicy: marker.elevationPolicy,
        elevation: marker.elevation,
        minimumElevation: marker.minimumElevation,
        maximumElevation: marker.maximumElevation
      })
    );
  }

  private compileRoutesAndSpawnSets(markers: readonly ScenarioMarker[]): void {
    for (const marker of markers) {
      if (marker.scenarioMarkerKind === "route") {
        const route = marker as ScenarioRouteMarker;
        const id = asCampaignContentId<"scenario-route">(route.scenarioId.trim());
        const points = this.resolvePoints(route.pointIds, id);
        const facingAngles = this.parseNumberList(route.facingAngles, id);
        if (facingAngles.length !== 0 && facingAngles.length !== points.length) {
          throw this.error(
            "invalid-scenario-reference",
            id,
            `Scenario route '${id}' must define either zero facing angles or one per point`
          );
        }
        this.routes.set(id, {
          id,
          points,
          loop: route.loop,
          facingAngles
        });
      } else if (marker.scenarioMarkerKind === "spawn-set") {
        const set = marker as ScenarioSpawnSetMarker;
        const id = asCampaignContentId<"scenario-spawn-set">(set.scenarioId.trim());
        this.spawnSets.set(id, { id, points: this.resolvePoints(set.pointIds, id) });
      }
    }
  }

  private resolvePoints(value: string, sourceId: string): Vector3Simple[] {
    return parseScenarioSequence(value).map((pointId) => {
      const point = this.points.get(asCampaignContentId<"scenario-point">(pointId));
      if (!point) {
        throw this.error(
          "missing-scenario-id",
          pointId,
          `Scenario '${sourceId}' references missing point '${pointId}' in ${this.sceneKey}`
        );
      }
      return { ...point };
    });
  }

  private parsePolygonPoints(value: string, sourceId: string): { x: number; y: number }[] {
    const points = value
      .split(";")
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        const [x, y] = pair.split(",").map(Number);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          throw this.error(
            "invalid-scenario-reference",
            sourceId,
            `Scenario region '${sourceId}' contains invalid polygon point '${pair}'`
          );
        }
        return { x: x!, y: y! };
      });
    if (points.length < 3) {
      throw this.error(
        "invalid-scenario-reference",
        sourceId,
        `Scenario region '${sourceId}' requires at least three polygon points`
      );
    }
    return points;
  }

  private parseNumberList(value: string, sourceId: string): number[] {
    return parseScenarioSequence(value).map((entry) => {
      const number = Number(entry);
      if (!Number.isFinite(number)) {
        throw this.error(
          "invalid-scenario-reference",
          sourceId,
          `Scenario '${sourceId}' contains invalid numeric value '${entry}'`
        );
      }
      return number;
    });
  }

  private unregisterActor(actor: GameObject): void {
    const id = this.actorRoles.get(actor);
    if (!id) return;
    const data = getActorComponent(actor, ScenarioActorReferenceComponent)?.getData();
    this.actors.delete(id);
    this.actorRoles.delete(actor);
    this.namespaceById.delete(id);
    for (const tag of data?.tags ?? []) {
      const actors = this.actorsByTag.get(tag);
      actors?.delete(actor);
      if (actors?.size === 0) this.actorsByTag.delete(tag);
    }
    const handler = this.actorDestroyHandlers.get(actor);
    if (handler) actor.off(Phaser.GameObjects.Events.DESTROY, handler);
    this.actorDestroyHandlers.delete(actor);
  }

  private assertUnique(id: string, kind: ScenarioMarkerKind | "actor"): void {
    const existing = this.namespaceById.get(id);
    if (existing) {
      throw this.error(
        "duplicate-scenario-id",
        id,
        `Duplicate scenario ID '${id}' in ${this.sceneKey}; declared as ${existing} and ${kind}`
      );
    }
    this.namespaceById.set(id, kind);
  }

  private error(code: ScenarioReferenceError["code"], id: string, message: string): ScenarioReferenceError {
    return new ScenarioReferenceError(code, this.sceneKey, id, message);
  }

  private get sceneKey(): string {
    return this.scene?.scene.key ?? "uninitialized-scene";
  }
}

function isScenarioMarker(value: GameObject): value is GameObject & ScenarioMarker {
  const kind = (value as Partial<ScenarioMarker>).scenarioMarkerKind;
  return (
    kind === "point" ||
    kind === "region" ||
    kind === "route" ||
    kind === "group" ||
    kind === "camera-shot" ||
    kind === "spawn-set"
  );
}

function markerPosition(marker: ScenarioMarker): Vector3Simple {
  return { x: marker.x, y: marker.y, z: marker.z ?? 0 };
}

function parseScenarioSequence(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function centroid(points: readonly { x: number; y: number }[], z: number): Vector3Simple {
  const total = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
  return { x: total.x / points.length, y: total.y / points.length, z };
}
