import { inject, NgModule } from "@angular/core";
import { Router, RouterModule, type Routes } from "@angular/router";
import { AuthGuard } from "./auth/auth.guard";
import { AppRoleGuard } from "./auth/app-role.guard";
import { LevelGuard } from "@fuzzy-waddle/fly-squasher-interface/choose-level/level.guard";
import { environment } from "@fuzzy-waddle/environments/environment";
import { GameInstanceGuard } from "@fuzzy-waddle/probable-waffle-interface/gui/online/lobby-page/game-instance.guard";
import { isTauri } from "./shared/utils/tauri";
import { ensurePhaserGlobal } from "@fuzzy-waddle/platform-game-host/phaser/ensure-phaser-global";

/** In Tauri the only published game is Probable Waffle — redirect root to /aota. */
const tauriHomeRedirect = () => (isTauri() ? inject(Router).createUrlTree(["/aota"]) : true);

async function loadGameComponent<T>(loader: () => Promise<T>): Promise<T> {
  await ensurePhaserGlobal();
  return loader();
}

const littleMuncherRoutes = [
  {
    path: "little-muncher",
    children: [
      {
        path: "",
        loadComponent: () =>
          loadGameComponent(() => import("@fuzzy-waddle/little-muncher-interface/little-muncher.component")).then(
            (m) => m.LittleMuncherComponent
          )
      },
      {
        path: "high-score",
        loadComponent: () =>
          import("@fuzzy-waddle/little-muncher-interface/high-score/high-score.component").then((m) => m.HighScoreComponent)
      },
      { path: "**", redirectTo: "" }
    ]
  }
] satisfies Routes;

const probableWaffleRoutes = [
  {
    path: "aota",
    children: [
      {
        path: "",
        loadComponent: () =>
          import("@fuzzy-waddle/probable-waffle-interface/gui/router/probable-waffle.component").then((m) => m.ProbableWaffleComponent),
        children: [
          {
            path: "",
            loadComponent: () => import("@fuzzy-waddle/probable-waffle-interface/gui/home/home.component").then((m) => m.HomeComponent)
          },
          {
            path: "campaign",
            loadComponent: () =>
              import("@fuzzy-waddle/probable-waffle-interface/gui/campaign/campaign.component").then((m) => m.CampaignComponent)
          },
          {
            path: "campaign/:chapterId",
            loadComponent: () =>
              import("@fuzzy-waddle/probable-waffle-interface/gui/campaign/mission-screen/mission-screen.component").then(
                (m) => m.MissionScreenComponent
              )
          },
          {
            path: "campaign/:chapterId/:missionId",
            loadComponent: () =>
              import("@fuzzy-waddle/probable-waffle-interface/gui/campaign/mission-screen/mission-screen.component").then(
                (m) => m.MissionScreenComponent
              )
          },
          {
            path: "online",
            loadComponent: () => import("@fuzzy-waddle/probable-waffle-interface/gui/online/online.component").then((m) => m.OnlineComponent)
            // canActivate: [() => !environment.production] // set to alpha in #606
          },
          {
            path: "skirmish",
            loadComponent: () =>
              import("@fuzzy-waddle/probable-waffle-interface/gui/skirmish/skirmish.component").then((m) => m.SkirmishComponent)
          },
          {
            path: "instant-game",
            loadComponent: () =>
              import("@fuzzy-waddle/probable-waffle-interface/gui/instant-game/instant-game.component").then((m) => m.InstantGameComponent),
            canActivate: [() => !environment.production]
          },
          {
            path: "instant-network-match",
            loadComponent: () =>
              import("@fuzzy-waddle/probable-waffle-interface/gui/online/instant-network-match/instant-network-match.component").then(
                (m) => m.InstantNetworkMatchComponent
              ),
            canActivate: [() => !environment.production]
          },
          {
            path: "load",
            loadComponent: () => import("@fuzzy-waddle/probable-waffle-interface/gui/load/load.component").then((m) => m.LoadComponent)
          },
          {
            path: "replay",
            loadComponent: () => import("@fuzzy-waddle/probable-waffle-interface/gui/replay/replay.component").then((m) => m.ReplayComponent)
          },
          {
            path: "match-history",
            loadComponent: () =>
              import("@fuzzy-waddle/probable-waffle-interface/gui/match-history/match-history-page.component").then(
                (m) => m.MatchHistoryPageComponent
              )
          },
          {
            path: "match-details/:gameInstanceId",
            loadComponent: () =>
              import("@fuzzy-waddle/probable-waffle-interface/gui/match-history/match-details.component").then((m) => m.MatchDetailsComponent)
          },
          {
            path: "progress",
            loadComponent: () =>
              import("@fuzzy-waddle/probable-waffle-interface/gui/progress/progress.component").then((m) => m.ProgressComponent)
          },
          {
            path: "progress/:userId",
            loadComponent: () =>
              import("@fuzzy-waddle/probable-waffle-interface/gui/progress/progress.component").then((m) => m.ProgressComponent)
          },
          {
            path: "options",
            loadComponent: () =>
              import("@fuzzy-waddle/probable-waffle-interface/gui/options/options.component").then((m) => m.OptionsComponent)
          },
          {
            path: "lobby",
            loadComponent: () => import("@fuzzy-waddle/probable-waffle-interface/gui/lobby/lobby.component").then((m) => m.LobbyComponent),
            canActivate: [GameInstanceGuard]
          },
          {
            path: "score-screen",
            loadComponent: () =>
              import("@fuzzy-waddle/probable-waffle-interface/gui/score-screen/score-screen.component").then((m) => m.ScoreScreenComponent),
            canActivate: [GameInstanceGuard]
          },
          {
            path: "game",
            loadComponent: () =>
              loadGameComponent(() => import("@fuzzy-waddle/probable-waffle-interface/gui/main/probable-waffle-game.component")).then(
                (m) => m.ProbableWaffleGameComponent
              ),
            canActivate: [GameInstanceGuard]
          }
        ]
      },
      { path: "**", redirectTo: "home" }
    ]
  }
] satisfies Routes;

const flySquasherRoutes = [
  {
    path: "fly-squasher",
    children: [
      {
        path: "",
        loadComponent: () => import("@fuzzy-waddle/fly-squasher-interface/home/home.component").then((m) => m.HomeComponent)
      },
      {
        path: "choose-level",
        loadComponent: () =>
          import("@fuzzy-waddle/fly-squasher-interface/choose-level/choose-level.component").then((m) => m.ChooseLevelComponent)
      },
      {
        path: "play/:level",
        loadComponent: () =>
          loadGameComponent(() => import("@fuzzy-waddle/fly-squasher-interface/main/main.component")).then((m) => m.MainComponent),
        canActivate: [LevelGuard]
      },
      {
        path: "high-score",
        loadComponent: () => import("@fuzzy-waddle/fly-squasher-interface/high-score/high-score.component").then((m) => m.HighScoreComponent)
      },
      {
        path: "options",
        loadComponent: () => import("@fuzzy-waddle/fly-squasher-interface/options/options.component").then((m) => m.OptionsComponent)
      },
      { path: "**", redirectTo: "" }
    ]
  }
] satisfies Routes;

const dungeonCrawlerRoutes = [
  {
    path: "dungeon-crawler",
    children: [
      {
        path: "",
        loadComponent: () =>
          loadGameComponent(() => import("@fuzzy-waddle/dungeon-crawler-interface/dungeon-crawler.component")).then(
            (m) => m.DungeonCrawlerComponent
          )
      },
      { path: "**", redirectTo: "" }
    ]
  }
] satisfies Routes;

const routes = [
  {
    path: "",
    loadComponent: () => import("./home/page/home-page.component").then((m) => m.HomePageComponent),
    canActivate: [tauriHomeRedirect]
  },
  {
    path: "profile",
    loadComponent: () => import("./home/profile/profile.component").then((m) => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: "profile/:userId",
    loadComponent: () => import("./home/profile/profile.component").then((m) => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: "music",
    loadComponent: () => import("./home/music/music.component").then((m) => m.MusicComponent)
  },
  {
    path: "attributions",
    loadComponent: () => import("./home/attribution/attribution.component").then((m) => m.AttributionComponent)
  },
  {
    path: "moderation",
    loadComponent: () => import("./home/moderation/moderation.component").then((m) => m.ModerationComponent),
    canActivate: [AuthGuard, AppRoleGuard]
  },
  ...littleMuncherRoutes,
  ...probableWaffleRoutes,
  ...flySquasherRoutes,
  ...dungeonCrawlerRoutes,
  {
    path: "**",
    redirectTo: ""
  }
] satisfies Routes;

@NgModule({
  imports: [
    RouterModule.forRoot(
      routes,
      {
        bindToComponentInputs: true
        // useHash: true // not needed
      }
      // when deployed, set a rewrite rule for SPA application:
      // source: "/*"
      // destination: "/index.html"
      // action: "rewrite"
      // docs for render.com: https://render.com/docs/deploy-create-react-app#using-client-side-routing
      // docs for azure: https://learn.microsoft.com/en-us/azure/static-web-apps/configuration?WT.mc_id=javascript-17844-cxa#fallback-routes
    )
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
