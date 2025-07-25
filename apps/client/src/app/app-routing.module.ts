import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuard } from "./auth/auth.guard";
import { LevelGuard } from "./fly-squasher/choose-level/level.guard";
import { environment } from "../environments/environment";
import { GameInstanceGuard } from "./probable-waffle/gui/online/lobby-page/game-instance.guard";

const littleMuncherRoutes = [
  {
    path: "little-muncher",
    children: [
      {
        path: "",
        loadComponent: () => import("./little-muncher/little-muncher.component").then((m) => m.LittleMuncherComponent)
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
          import("./probable-waffle/gui/router/probable-waffle.component").then((m) => m.ProbableWaffleComponent),
        children: [
          {
            path: "",
            loadComponent: () => import("./probable-waffle/gui/home/home.component").then((m) => m.HomeComponent)
          },
          {
            path: "campaign",
            loadComponent: () =>
              import("./probable-waffle/gui/campaign/campaign.component").then((m) => m.CampaignComponent)
          },
          {
            path: "online",
            loadComponent: () => import("./probable-waffle/gui/online/online.component").then((m) => m.OnlineComponent),
            canActivate: [() => !environment.production]
          },
          {
            path: "skirmish",
            loadComponent: () =>
              import("./probable-waffle/gui/skirmish/skirmish.component").then((m) => m.SkirmishComponent)
          },
          {
            path: "instant-game",
            loadComponent: () =>
              import("./probable-waffle/gui/instant-game/instant-game.component").then((m) => m.InstantGameComponent),
            canActivate: [() => !environment.production]
          },
          {
            path: "instant-network-match",
            loadComponent: () =>
              import("./probable-waffle/gui/online/instant-network-match/instant-network-match.component").then(
                (m) => m.InstantNetworkMatchComponent
              ),
            canActivate: [() => !environment.production]
          },
          {
            path: "load",
            loadComponent: () => import("./probable-waffle/gui/load/load.component").then((m) => m.LoadComponent)
          },
          {
            path: "replay",
            loadComponent: () => import("./probable-waffle/gui/replay/replay.component").then((m) => m.ReplayComponent)
          },
          {
            path: "progress",
            loadComponent: () =>
              import("./probable-waffle/gui/progress/progress.component").then((m) => m.ProgressComponent)
          },
          {
            path: "progress/:userId",
            loadComponent: () =>
              import("./probable-waffle/gui/progress/progress.component").then((m) => m.ProgressComponent)
          },
          {
            path: "options",
            loadComponent: () =>
              import("./probable-waffle/gui/options/options.component").then((m) => m.OptionsComponent)
          },
          {
            path: "lobby",
            loadComponent: () => import("./probable-waffle/gui/lobby/lobby.component").then((m) => m.LobbyComponent),
            canActivate: [GameInstanceGuard]
          },
          {
            path: "score-screen",
            loadComponent: () =>
              import("./probable-waffle/gui/score-screen/score-screen.component").then((m) => m.ScoreScreenComponent),
            canActivate: [GameInstanceGuard]
          },
          {
            path: "game",
            loadComponent: () =>
              import("./probable-waffle/gui/main/probable-waffle-game.component").then(
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
        loadComponent: () => import("./fly-squasher/home/home.component").then((m) => m.HomeComponent)
      },
      {
        path: "choose-level",
        loadComponent: () =>
          import("./fly-squasher/choose-level/choose-level.component").then((m) => m.ChooseLevelComponent)
      },
      {
        path: "play/:level",
        loadComponent: () => import("./fly-squasher/main/main.component").then((m) => m.MainComponent),
        canActivate: [LevelGuard]
      },
      {
        path: "high-score",
        loadComponent: () => import("./fly-squasher/high-score/high-score.component").then((m) => m.HighScoreComponent)
      },
      {
        path: "options",
        loadComponent: () => import("./fly-squasher/options/options.component").then((m) => m.OptionsComponent)
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
          import("./dungeon-crawler/dungeon-crawler.component").then((m) => m.DungeonCrawlerComponent)
      },
      { path: "**", redirectTo: "" }
    ]
  }
] satisfies Routes;

const routes = [
  {
    path: "",
    loadComponent: () => import("./home/page/home-page.component").then((m) => m.HomePageComponent)
  },
  {
    path: "profile",
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
