import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuard } from "./auth/auth.guard";
import { GameInstanceGuard } from "./probable-waffle/gui/lobby-page/game-instance.guard";
import { ChooseLevelComponent } from "./fly-squasher/choose-level/choose-level.component";
import { LevelGuard } from "./fly-squasher/choose-level/level.guard";

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
    path: "probable-waffle",
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
            loadComponent: () => import("./probable-waffle/gui/online/online.component").then((m) => m.OnlineComponent)
          },
          {
            path: "skirmish",
            loadComponent: () =>
              import("./probable-waffle/gui/skirmish/skirmish.component").then((m) => m.SkirmishComponent)
          },
          {
            path: "progress",
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
              )
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
  ...littleMuncherRoutes,
  ...probableWaffleRoutes,
  ...flySquasherRoutes,
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
