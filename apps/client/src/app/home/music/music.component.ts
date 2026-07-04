import { ChangeDetectionStrategy, Component } from "@angular/core";

import { AngularHost } from "../../shared/consts";
import { HomeNavComponent } from "../../shared/components/home-nav/home-nav.component";

@Component({
  selector: "fuzzy-waddle-music",
  imports: [HomeNavComponent],
  templateUrl: "./music.component.html",
  styleUrl: "./music.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: AngularHost.contentFlexFullHeight
})
export class MusicComponent {
  protected readonly ost = [
    {
      name: "Here and There",
      game: "Fly Squasher",
      note: "Kitchen-run tension with room to breathe between streaks.",
      path: "assets/fly-squasher/sound/ost/here-and-there.m4a"
    },
    {
      name: "It's an Adventure",
      game: "Little Muncher",
      note: "Light-footed runner music for steady cake-chasing runs.",
      path: "assets/little-muncher/ost/its-an-adventure.m4a"
    },
    {
      name: "Land of Ice",
      game: "Probable Waffle",
      note: "Colder strategy atmosphere from the main tactics roster.",
      path: "assets/probable-waffle/ost/skaduwee/land-of-ice.mp3"
    },
    {
      name: "Winter Tale",
      game: "Probable Waffle",
      note: "A calmer track from the broader Fuzzy Waddle music library.",
      path: "assets/probable-waffle/ost/skaduwee/winter-tale.mp3"
    }
  ];
}
