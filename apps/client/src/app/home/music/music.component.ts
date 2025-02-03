import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AngularHost } from "../../shared/consts";
import { HomeNavComponent } from "../../shared/components/home-nav/home-nav.component";

@Component({
  selector: "fuzzy-waddle-music",
  imports: [CommonModule, HomeNavComponent],
  templateUrl: "./music.component.html",
  styleUrl: "./music.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: AngularHost.contentFlexFullHeight
})
export class MusicComponent {
  protected readonly ost = [
    { name: "Here and There", path: "assets/fly-squasher/sound/ost/here-and-there.m4a" },
    { name: "It's an Adventure", path: "assets/little-muncher/ost/its-an-adventure.m4a" },
    { name: "Land of Ice", path: "assets/probable-waffle/ost/skaduwee/land-of-ice.mp3" },
    { name: "Winter Tale", path: "assets/probable-waffle/ost/skaduwee/winter-tale.mp3" }
  ];
}
