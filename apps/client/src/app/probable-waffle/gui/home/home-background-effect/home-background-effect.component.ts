import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, type OnInit } from "@angular/core";
import { ConstellationEffectComponent } from "../constellation-effect/constellation-effect.component";
import { AshfallEffectComponent } from "../ashfall-effect/ashfall-effect.component";
import { OptionsService } from "../../options/options.service";
import { type HomeScreenBackground } from "../../../game/core/gameSettings";

@Component({
  selector: "probable-waffle-home-background-effect",
  templateUrl: "./home-background-effect.component.html",
  styleUrls: ["./home-background-effect.component.scss"],
  imports: [ConstellationEffectComponent, AshfallEffectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeBackgroundEffectComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly optionsService = inject(OptionsService);
  protected readonly backgroundType = signal<HomeScreenBackground>("ashfall");

  ngOnInit(): void {
    this.optionsService.init();
    this.backgroundType.set(this.optionsService.gameSettings.homeScreenBackground);

    const subscription = this.optionsService.settingsChanged.subscribe((change) => {
      if (change.type === "game") {
        this.backgroundType.set(change.payload.homeScreenBackground);
      }
    });

    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
}
