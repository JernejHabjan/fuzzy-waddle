import { Pipe, type PipeTransform } from "@angular/core";
import type { ProbableWaffleGameInstanceData } from "@fuzzy-waddle/api-interfaces";

@Pipe({
  name: "gameLength",
  pure: true,
  standalone: true
})
export class GameLengthPipe implements PipeTransform {
  transform(value: ProbableWaffleGameInstanceData): string {
    const created = this.getTimestamp(value.gameInstanceMetadataData?.createdOn);
    const ended = this.getTimestamp(value.gameInstanceMetadataData?.updatedOn);
    if (created === null || ended === null || ended < created) {
      return "";
    }

    // return h, m or s depending on the length of the game
    const diff = ended - created;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return hours > 0 ? `${hours}h` : minutes > 0 ? `${minutes}m` : `${seconds}s`;
  }

  private getTimestamp(value: Date | string | number | undefined): number | null {
    if (value === undefined) {
      return null;
    }
    const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
  }
}
