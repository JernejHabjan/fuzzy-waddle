import { getActorComponent } from "../actor-component";
import { ConstructionSiteComponent } from "../../entity/components/construction/construction-site-component";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import GameObject = Phaser.GameObjects.GameObject;

/**
 * Check if an actor should be considered "unlocked" for prerequisite purposes.
 * Buildings must be finished, and actors must be alive.
 */
export function shouldConsiderActorUnlocked(actor: GameObject): boolean {
  // If it should have a construction site, check if it's attached and finished
  const constructionSite = getActorComponent(actor, ConstructionSiteComponent);
  if (!constructionSite || !constructionSite.isFinished) {
    return false; // Not unlocked if construction site not attached or not finished
  }

  // Check if actor is alive
  const health = getActorComponent(actor, HealthComponent);
  // noinspection RedundantIfStatementJS
  if (health && !health.alive) {
    return false;
  }

  return true;
}
