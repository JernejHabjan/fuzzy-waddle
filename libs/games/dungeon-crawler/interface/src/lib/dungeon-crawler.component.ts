import { Component } from "@angular/core";

import { dungeonCrawlerGameConfig } from "@fuzzy-waddle/dungeon-crawler-gameplay/game-config";
import { GameContainerComponent } from "@fuzzy-waddle/platform-game-host/game-container/game-container.component";
import { type BaseGameData } from "@fuzzy-waddle/platform-game-host/phaser/game/base-game-data";

@Component({
  selector: "fuzzy-waddle-dungeon-crawler",
  imports: [GameContainerComponent],
  templateUrl: "./dungeon-crawler.component.html",
  styleUrl: "./dungeon-crawler.component.scss",
  host: { class: "d-flex flex-column h-100" }
})
export class DungeonCrawlerComponent {
  protected readonly gameData = undefined as any as BaseGameData<any, any, any>;
  protected readonly dungeonCrawlerGameConfig = dungeonCrawlerGameConfig;
}
