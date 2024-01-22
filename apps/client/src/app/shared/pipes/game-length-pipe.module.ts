import { NgModule } from "@angular/core";
import { GameLengthPipe } from "./game-length.pipe";

@NgModule({
  declarations: [GameLengthPipe],
  exports: [GameLengthPipe]
})
export class GameLengthPipeModule {}
