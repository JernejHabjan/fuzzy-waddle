import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { tivaraWorkerDefinition } from "../prefabs/characters/tivara/tivara-worker/tivara-worker.definition";
import { skaduweeWorkerDefinition } from "../prefabs/characters/skaduwee/skaduwee-worker/skaduwee-worker.definition";
import { skaduweeWorkerMaleDefinition } from "../prefabs/characters/skaduwee/skaduwee-worker/skaduwee-worker-male/skaduwee-worker-male.definition";
import { skaduweeWorkerFemaleDefinition } from "../prefabs/characters/skaduwee/skaduwee-worker/skaduwee-worker-female/skaduwee-worker-female.definition";
import { frostForgeDefinition } from "../prefabs/buildings/skaduwee/FrostForge/frost-forge.definition";
import { infantryInnDefinition } from "../prefabs/buildings/skaduwee/InfantryInn/infantry-inn.definition";
import { wallDefinition } from "../prefabs/buildings/tivara/wall/wall.definition";
import { watchTowerDefinition } from "../prefabs/buildings/tivara/WatchTower/watch-tower.definition";
import { stairsDefinition } from "../prefabs/buildings/tivara/stairs/stairs.definition";
import { ankGuardDefinition } from "../prefabs/buildings/tivara/AnkGuard/ank-guard.definition";
import { olivalDefinition } from "../prefabs/buildings/tivara/Olival/olival.definition";
import { sandholdDefinition } from "../prefabs/buildings/tivara/Sandhold/sandhold.definition";
import { templeDefinition } from "../prefabs/buildings/tivara/Temple/temple.definition";
import { workMillDefinition } from "../prefabs/buildings/tivara/WorkMill/work-mill.definition";
import { owleryDefinition } from "../prefabs/buildings/skaduwee/Owlery/owlery.definition";
import { hedgehogDefinition } from "../prefabs/animals/hedgehog/hedgehog.definition";
import { sheepDefinition } from "../prefabs/animals/sheep/sheep.definition";
import { badgerDefinition } from "../prefabs/animals/badger/badger.definition";
import { tivaraSlingshotFemaleDefinition } from "../prefabs/characters/tivara/tivara-slingshot-female/tivara-slingshot-female.definition";
import { skaduweeOwlDefinition } from "../prefabs/characters/skaduwee/skaduwee-owl/skaduwee-owl.definition";
import { skaduweeRangedFemaleDefinition } from "../prefabs/characters/skaduwee/skaduwee-ranged-female/skaduwee-ranged-female.definition";
import { skaduweeMagicianFemaleDefinition } from "../prefabs/characters/skaduwee/skaduwee-magician-female/skaduwee-magician-female.definition";
import { skaduweeWarriorMaleDefinition } from "../prefabs/characters/skaduwee/skaduwee-warrior-male/skaduwee-warrior-male.definition";
import { tivaraWorkerFemaleDefinition } from "../prefabs/characters/tivara/tivara-worker/tivara-worker-female/tivara-worker-female.definition";
import { tivaraWorkerMaleDefinition } from "../prefabs/characters/tivara/tivara-worker/tivara-worker-male/tivara-worker-male.definition";
import { tivaraMacemanMaleDefinition } from "../prefabs/characters/tivara/tivara-maceman-male/tivara-maceman-male.definition";
import { generalWarriorDefinition } from "../prefabs/characters/general/general-warrior/general-warrior.definition";
import { wolfDefinition } from "../prefabs/animals/wolf/wolf.definition";
import { stagDefinition } from "../prefabs/animals/stag/stag.definition";
import { boarDefinition } from "../prefabs/animals/boar/boar.definition";
import { tree1Definition } from "../prefabs/outside/foliage/trees/resources/tree1.definition";
import { tree4Definition } from "../prefabs/outside/foliage/trees/resources/tree4.definition";
import { tree5Definition } from "../prefabs/outside/foliage/trees/resources/tree5.definition";
import { tree6Definition } from "../prefabs/outside/foliage/trees/resources/tree6.definition";
import { tree7Definition } from "../prefabs/outside/foliage/trees/resources/tree7.definition";
import { tree9Definition } from "../prefabs/outside/foliage/trees/resources/tree9.definition";
import { tree10Definition } from "../prefabs/outside/foliage/trees/resources/tree10.definition";
import { tree11Definition } from "../prefabs/outside/foliage/trees/resources/tree11.definition";
import { mineralsDefinition } from "../prefabs/outside/resources/minerals/minerals.definition";
import { stonePileDefinition } from "../prefabs/outside/resources/stone-pile/stone-pile.definition";
import type { PrefabDefinition } from "./prefab-definition";

export const pwActorDefinitions: {
  [key in ObjectNames]: PrefabDefinition;
} = {
  Hedgehog: hedgehogDefinition,
  Sheep: sheepDefinition,
  Badger: badgerDefinition,
  Boar: boarDefinition,
  Stag: stagDefinition,
  Wolf: wolfDefinition,
  GeneralWarrior: generalWarriorDefinition,
  TivaraMacemanMale: tivaraMacemanMaleDefinition,
  TivaraSlingshotFemale: tivaraSlingshotFemaleDefinition,
  TivaraWorker: tivaraWorkerDefinition,
  TivaraWorkerFemale: tivaraWorkerFemaleDefinition,
  TivaraWorkerMale: tivaraWorkerMaleDefinition,
  AnkGuard: ankGuardDefinition,
  Olival: olivalDefinition,
  Sandhold: sandholdDefinition,
  Temple: templeDefinition,
  WorkMill: workMillDefinition,
  SkaduweeOwl: skaduweeOwlDefinition,
  SkaduweeRangedFemale: skaduweeRangedFemaleDefinition,
  SkaduweeMagicianFemale: skaduweeMagicianFemaleDefinition,
  SkaduweeWarriorMale: skaduweeWarriorMaleDefinition,
  SkaduweeWorkerMale: skaduweeWorkerMaleDefinition,
  SkaduweeWorker: skaduweeWorkerDefinition,
  SkaduweeWorkerFemale: skaduweeWorkerFemaleDefinition,
  FrostForge: frostForgeDefinition,
  InfantryInn: infantryInnDefinition,
  Owlery: owleryDefinition,
  Tree1: tree1Definition,
  Tree4: tree4Definition,
  Tree5: tree5Definition,
  Tree6: tree6Definition,
  Tree7: tree7Definition,
  Tree9: tree9Definition,
  Tree10: tree10Definition,
  Tree11: tree11Definition,
  Stairs: stairsDefinition,
  WatchTower: watchTowerDefinition,
  Wall: wallDefinition,
  Minerals: mineralsDefinition,
  StonePile: stonePileDefinition
};
