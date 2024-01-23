import Hedgehog from "../prefabs/animals/Hedgehog";
import Sheep from "../prefabs/animals/Sheep";
import GeneralWarrior from "../prefabs/characters/general/GeneralWarrior";
import TivaraMacemanMale from "../prefabs/characters/tivara/TivaraMacemanMale";
import TivaraSlingshotFemale from "../prefabs/characters/tivara/TivaraSlingshotFemale";
import TivaraWorkerFemale from "../prefabs/characters/tivara/TivaraWorkerFemale";
import TivaraWorkerMale from "../prefabs/characters/tivara/TivaraWorkerMale";
import AnkGuard from "../prefabs/buildings/tivara/AnkGuard";
import Olival from "../prefabs/buildings/tivara/Olival";
import Sandhold from "../prefabs/buildings/tivara/Sandhold";
import Temple from "../prefabs/buildings/tivara/Temple";
import WorkMill from "../prefabs/buildings/tivara/WorkMill";
import SkaduweeOwl from "../prefabs/units/skaduwee/SkaduweeOwl";
import SkaduweeRangedFemale from "../prefabs/characters/skaduwee/SkaduweeRangedFemale";
import SkaduweeMagicianFemale from "../prefabs/characters/skaduwee/SkaduweeMagicianFemale";
import SkaduweeWarriorMale from "../prefabs/characters/skaduwee/SkaduweeWarriorMale";
import SkaduweeWorkerMale from "../prefabs/characters/skaduwee/SkaduweeWorkerMale";
import SkaduweeWorkerFemale from "../prefabs/characters/skaduwee/SkaduweeWorkerFemale";
import FrostForge from "../prefabs/buildings/skaduwee/FrostForge";
import InfantryInn from "../prefabs/buildings/skaduwee/InfantryInn";
import Owlery from "../prefabs/buildings/skaduwee/Owlery";
import Tree1 from "../prefabs/outside/foliage/trees/resources/Tree1";
import Tree4 from "../prefabs/outside/foliage/trees/resources/Tree4";
import Tree5 from "../prefabs/outside/foliage/trees/resources/Tree5";
import Tree6 from "../prefabs/outside/foliage/trees/resources/Tree6";
import Tree7 from "../prefabs/outside/foliage/trees/resources/Tree7";
import Tree9 from "../prefabs/outside/foliage/trees/resources/Tree9";
import Tree10 from "../prefabs/outside/foliage/trees/resources/Tree10";
import Tree11 from "../prefabs/outside/foliage/trees/resources/Tree11";
import { ActorDefinition } from "@fuzzy-waddle/api-interfaces";
import { DepthHelper } from "../world/map/depth.helper";
import GameObject = Phaser.GameObjects.GameObject;
import Transform = Phaser.GameObjects.Components.Transform;
import { getActorComponent } from "./actor-component";
import { OwnerComponent } from "../entity/actor/components/owner-component";
import { SelectableComponent } from "../entity/actor/components/selectable-component";

export type ActorConstructor = new (scene: Phaser.Scene) => GameObject;
export class ActorManager {
  public static actorMap: { [name: string]: ActorConstructor } = {
    // ANIMALS
    [Hedgehog.name]: Hedgehog,
    [Sheep.name]: Sheep,
    // END ANIMALS

    // GENERAL
    [GeneralWarrior.name]: GeneralWarrior,
    // END GENERAL

    // TIVARA
    [TivaraMacemanMale.name]: TivaraMacemanMale,
    [TivaraSlingshotFemale.name]: TivaraSlingshotFemale,
    [TivaraWorkerFemale.name]: TivaraWorkerFemale,
    [TivaraWorkerMale.name]: TivaraWorkerMale,
    [AnkGuard.name]: AnkGuard,
    [Olival.name]: Olival,
    [Sandhold.name]: Sandhold,
    [Temple.name]: Temple,
    [WorkMill.name]: WorkMill,
    // END TIVARA

    // SKADUWEE
    [SkaduweeOwl.name]: SkaduweeOwl,
    [SkaduweeRangedFemale.name]: SkaduweeRangedFemale,
    [SkaduweeMagicianFemale.name]: SkaduweeMagicianFemale,
    [SkaduweeWarriorMale.name]: SkaduweeWarriorMale,
    [SkaduweeWorkerMale.name]: SkaduweeWorkerMale,
    [SkaduweeWorkerFemale.name]: SkaduweeWorkerFemale,
    [FrostForge.name]: FrostForge,
    [InfantryInn.name]: InfantryInn,
    [Owlery.name]: Owlery,
    // END SKADUWEE

    // Trees
    [Tree1.name]: Tree1,
    [Tree4.name]: Tree4,
    [Tree5.name]: Tree5,
    [Tree6.name]: Tree6,
    [Tree7.name]: Tree7,
    [Tree9.name]: Tree9,
    [Tree10.name]: Tree10,
    [Tree11.name]: Tree11
    // END Trees
  } as const;

  static getActorDefinitionFromActor(actor: GameObject): ActorDefinition | undefined {
    const actorName = actor.constructor.name;
    if (!this.actorMap[actorName]) {
      // console.error(`Actor ${actorName} not found`);
      return undefined;
    }
    const actorDefinition: ActorDefinition = {
      name: actorName
    };
    const transform = actor as any as Transform;
    if (transform.x !== undefined) actorDefinition["x"] = transform.x;
    if (transform.y !== undefined) actorDefinition["y"] = transform.y;
    if (transform.z !== undefined) actorDefinition["z"] = transform.z;
    const ownerComponent = getActorComponent(actor, OwnerComponent);
    if (ownerComponent) actorDefinition["owner"] = ownerComponent.getOwner();
    const selectableComponent = getActorComponent(actor, SelectableComponent);
    if (selectableComponent) actorDefinition["selectable"] = selectableComponent.getSelected();
    return actorDefinition;
  }

  static createActor(scene: Phaser.Scene, name: string, properties: any): GameObject {
    let actor: GameObject | undefined = undefined;
    const actorConstructor = this.actorMap[name];
    if (!actorConstructor) {
      console.error(`Actor ${name} not found`);
      throw new Error(`Actor ${name} not found`);
    }
    actor = new actorConstructor(scene);

    const transform = actor as any as Transform;
    if (transform.x !== undefined) transform.x = properties.x;
    if (transform.y !== undefined) transform.y = properties.y;
    if (transform.z !== undefined) transform.z = properties.z;
    if (properties.owner) getActorComponent(actor, OwnerComponent)?.setOwner(properties.owner);
    if (properties.selectable) getActorComponent(actor, SelectableComponent)?.setSelected(properties.selectable);
    DepthHelper.setActorDepth(actor);
    return actor;
  }
}
