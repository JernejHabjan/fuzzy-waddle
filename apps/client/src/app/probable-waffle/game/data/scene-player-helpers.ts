import { getAllPlayers, getSelectableSceneChildren } from "./scene-data";
import { getActorComponent } from "./actor-component";
import { OwnerComponent } from "../entity/actor/components/owner-component";

export class ScenePlayerHelpers {
  static getActorsByPlayer(
    scene: Phaser.Scene,
    currentPlayer: number
  ): {
    actorsByPlayer: Map<number, Phaser.GameObjects.GameObject[]>;
    currentPlayerActors: Phaser.GameObjects.GameObject[];
    enemyActors: Map<number, Phaser.GameObjects.GameObject[]>;
  } {
    const selectableActors = getSelectableSceneChildren(scene);
    const allPlayers = getAllPlayers(scene);
    // iterate over selectable actors and group by player
    const actorsByPlayer = new Map<number, Phaser.GameObjects.GameObject[]>();
    const currentPlayerActors: Phaser.GameObjects.GameObject[] = [];
    const enemyActors = new Map<number, Phaser.GameObjects.GameObject[]>();
    selectableActors.forEach((actor) => {
      const ownerComponent = getActorComponent(actor, OwnerComponent);
      if (!ownerComponent) return;
      const playerNr = ownerComponent.getOwner();
      if (!playerNr) return;
      if (!allPlayers.some((player) => player.playerNumber === playerNr)) return;
      if (!actorsByPlayer.has(playerNr)) actorsByPlayer.set(playerNr, []);
      actorsByPlayer.get(playerNr)?.push(actor);
      if (playerNr === currentPlayer) {
        currentPlayerActors.push(actor);
      } else {
        if (!enemyActors.has(playerNr)) enemyActors.set(playerNr, []);
        enemyActors.get(playerNr)?.push(actor);
      }
    });
    return { actorsByPlayer, currentPlayerActors, enemyActors };
  }
}
