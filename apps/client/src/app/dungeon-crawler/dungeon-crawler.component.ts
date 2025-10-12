import { Component } from "@angular/core";

import { dungeonCrawlerGameConfig } from "./game/game-config";
import { GameContainerComponent } from "../shared/game/game-container/game-container.component";
import { type BaseGameData } from "../shared/game/phaser/game/base-game-data";
import { AngularHost } from "../shared/consts";

@Component({
  selector: "fuzzy-waddle-dungeon-crawler",
  imports: [GameContainerComponent],
  templateUrl: "./dungeon-crawler.component.html",
  styleUrl: "./dungeon-crawler.component.scss",
  host: AngularHost.contentFlexFullHeight
})
export class DungeonCrawlerComponent {
  protected readonly gameData = undefined as any as BaseGameData<any, any, any>;
  protected readonly dungeonCrawlerGameConfig = dungeonCrawlerGameConfig;
}
