import {
  ChangeDetectorRef,
  Component,
  inject,
  type OnDestroy,
  type OnInit,
  ChangeDetectionStrategy
} from "@angular/core";
import { ProbableWaffleGameInstance, ProbableWaffleUserInfo } from "@fuzzy-waddle/probable-waffle-protocol";
import { type BaseGameData } from "@fuzzy-waddle/platform-game-host/phaser/game/base-game-data";
import { ProbableWaffleCommunicatorService } from "../../communicators/probable-waffle-communicator.service";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { probableWaffleGameConfig } from "@fuzzy-waddle/probable-waffle-phaser/world/const/game-config";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { GameContainerComponent } from "@fuzzy-waddle/platform-game-host/game-container/game-container.component";
import { AngularHost } from "@fuzzy-waddle/platform-game-host/angular/consts";
import { Subscription } from "rxjs";
import { OptionsService } from "../options/options.service";
import { AchievementService } from "../../services/achievement/achievement.service";
import { GameSaveService } from "../../services/game-save/game-save.service";
import type { Game, Types } from "phaser";
import { environment } from "@fuzzy-waddle/environments/environment";
import { RouterLink } from "@angular/router";
import { activeAiScenarios } from "../ai-scenarios/active-ai-scenario";
import {
  clearAiRuntimeBrowserTestHost,
  publishAiRuntimeBrowserTestHost,
  readAiRuntimeBrowserTestConfig
} from "./ai-runtime-browser-test-host";
import {
  clearMultiplayerBrowserTestHost,
  multiplayerBrowserTestRequested,
  publishMultiplayerBrowserTestHost
} from "./ai-multiplayer-browser-test-host";

@Component({
  templateUrl: "./probable-waffle-game.component.html",
  styleUrls: ["./probable-waffle-game.component.scss"],
  imports: [GameContainerComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.Eager,
  host: AngularHost.contentFlexFullHeight
})
export class ProbableWaffleGameComponent implements OnInit, OnDestroy {
  protected gameConfig?: Types.Core.GameConfig;
  protected scenarioTitle?: string;
  protected gameData?: BaseGameData<
    ProbableWaffleCommunicatorService,
    ProbableWaffleGameInstance,
    ProbableWaffleUserInfo
  >;

  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly communicatorService = inject(ProbableWaffleCommunicatorService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly optionsService = inject(OptionsService);
  private readonly achievementService = inject(AchievementService);
  private readonly gameSaveService = inject(GameSaveService);
  private refreshSubscription?: Subscription;
  private runtimeTestGame?: Game;

  ngOnInit(): void {
    this.setData();

    this.refreshSubscription = this.gameInstanceClientService.gameInstanceToGameComponentCommunicator.subscribe(
      (data) => {
        if (data === "refresh") {
          this.clearRuntimeTestHost();
          this.gameData = undefined;
          this.cdr.detectChanges();
          setTimeout(() => {
            this.setData();
            this.cdr.detectChanges();
          }, 50);
        }
      }
    );
  }

  private setData() {
    const gameInstance = this.gameInstanceClientService.gameInstance;
    if (!gameInstance) return;

    const scenario = environment.production ? undefined : activeAiScenarios.get(gameInstance);
    this.scenarioTitle = scenario?.title;
    const runtimeTestConfig = environment.production ? null : scenario?.config ?? readAiRuntimeBrowserTestConfig();
    if (runtimeTestConfig && !gameInstance.gameInstanceMetadata.data.startOptions.loadFromSave) {
      gameInstance.gameInstanceMetadata.data.rndSeed = runtimeTestConfig.seed;
      // Actor identity includes the session ID, so continuous seeded worlds need the same stable test salt as presets.
      if (!scenario) {
        gameInstance.gameInstanceMetadata.data.gameInstanceId =
          `runtime-fixture-${runtimeTestConfig.seed}-${runtimeTestConfig.presetWorld?.fixtureId ?? "continuous"}`;
      }
    }

    // Derive seed from rndSeed for deterministic lock-stepping
    const seed = gameInstance.gameInstanceMetadata.data.rndSeed;
    const configuredPostBoot = probableWaffleGameConfig.callbacks?.postBoot;

    // Create game config with seed
    this.gameConfig = {
      ...probableWaffleGameConfig,
      seed: [seed.toString()],
      ...(runtimeTestConfig || multiplayerBrowserTestRequested()
        ? {
            callbacks: {
              ...probableWaffleGameConfig.callbacks,
              postBoot: (game: Game) => {
                configuredPostBoot?.(game);
                this.runtimeTestGame = game;
                if (runtimeTestConfig) publishAiRuntimeBrowserTestHost(game, runtimeTestConfig, !!scenario);
                else publishMultiplayerBrowserTestHost(game);
              }
            }
          }
        : {})
    };

    this.gameData = {
      gameInstance,
      communicator: this.communicatorService,
      components: [this.optionsService, this.achievementService, this.gameSaveService],
      user: new ProbableWaffleUserInfo(this.authService.userId, this.gameInstanceClientService.currentPlayerNumber)
    } as const;
  }
  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.clearRuntimeTestHost();
  }

  private clearRuntimeTestHost(): void {
    clearAiRuntimeBrowserTestHost(this.runtimeTestGame);
    clearMultiplayerBrowserTestHost(this.runtimeTestGame);
    this.runtimeTestGame = undefined;
  }
}
