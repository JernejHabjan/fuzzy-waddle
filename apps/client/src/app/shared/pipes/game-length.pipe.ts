import { Pipe, PipeTransform } from "@angular/core";
import { ProbableWaffleGameInstanceData } from "@fuzzy-waddle/api-interfaces";

@Pipe({
  name: "gameLength",
  pure: true
})
export class GameLengthPipe implements PipeTransform {
  transform(value: ProbableWaffleGameInstanceData): string {
    const created = value.gameInstanceMetadataData!.createdOn!.getMilliseconds();
    const ended = value.gameInstanceMetadataData!.updatedOn!.getMilliseconds();

    // return h, m or s depending on the length of the game
    const diff = ended - created;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return hours > 0 ? `${hours}h` : minutes > 0 ? `${minutes}m` : `${seconds}s`;
  }
}
