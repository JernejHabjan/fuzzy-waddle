import { Component, inject } from "@angular/core";
import { ProbableWaffleDataChangeEventProperty, ProbableWaffleGameModeData } from "@fuzzy-waddle/api-interfaces";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";

import { FormsModule } from "@angular/forms";

@Component({
  selector: "probable-waffle-game-mode-definition",
  templateUrl: "./game-mode-definition.component.html",
  styleUrls: ["./game-mode-definition.component.scss"],
  imports: [FormsModule]
})
export class GameModeDefinitionComponent {
  private readonly gameInstanceClientService = inject(GameInstanceClientService);

  protected async onValueChange(
    property: ProbableWaffleDataChangeEventProperty<ProbableWaffleGameModeData>,
    data: Partial<ProbableWaffleGameModeData>
  ): Promise<void> {
    console.log("game mode changed", property, data);
    await this.gameInstanceClientService.gameModeChanged(property, data);
  }

  protected get gameMode(): ProbableWaffleGameModeData | undefined {
    return this.gameInstanceClientService.gameInstance?.gameMode?.data;
  }
}
