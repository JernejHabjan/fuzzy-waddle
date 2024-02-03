import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { dungeonCrawlerGameConfig } from "./game/game-config";
import { GameContainerComponent } from "../shared/game/game-container/game-container.component";
import { BaseGameData } from "../shared/game/phaser/game/base-game-data";

@Component({
  selector: "fuzzy-waddle-dungeon-crawler",
  standalone: true,
  imports: [CommonModule, GameContainerComponent],
  templateUrl: "./dungeon-crawler.component.html",
  styleUrl: "./dungeon-crawler.component.scss"
})
export class DungeonCrawlerComponent {
  protected readonly gameData = undefined as any as BaseGameData<any, any, any>;
  protected readonly dungeonCrawlerGameConfig = dungeonCrawlerGameConfig;
}
