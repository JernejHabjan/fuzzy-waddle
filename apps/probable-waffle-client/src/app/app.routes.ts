import { type Routes } from "@angular/router";
import { AuthGuard } from "@fuzzy-waddle/client/app/auth/auth.guard";
import { GameInstanceGuard } from "@fuzzy-waddle/client/app/probable-waffle/gui/online/lobby-page/game-instance.guard";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "aota",
    pathMatch: "full"
  },
  {
    path: "aota",
    children: [
      {
        path: "",
        loadComponent: () =>
          import(
            "@fuzzy-waddle/client/app/probable-waffle/gui/router/probable-waffle.component"
          ).then((m) => m.ProbableWaffleComponent),
        children: [
          {
            path: "",
            loadComponent: () =>
              import("@fuzzy-waddle/client/app/probable-waffle/gui/home/home.component").then(
                (m) => m.HomeComponent
              )
          },
          {
            path: "campaign",
            loadComponent: () =>
              import("@fuzzy-waddle/client/app/probable-waffle/gui/campaign/campaign.component").then(
                (m) => m.CampaignComponent
              )
          },
          {
            path: "skirmish",
            loadComponent: () =>
              import("@fuzzy-waddle/client/app/probable-waffle/gui/skirmish/skirmish.component").then(
                (m) => m.SkirmishComponent
              )
          },
          {
            path: "load",
            loadComponent: () =>
              import("@fuzzy-waddle/client/app/probable-waffle/gui/load/load.component").then(
                (m) => m.LoadComponent
              )
          },
          {
            path: "replay",
            loadComponent: () =>
              import("@fuzzy-waddle/client/app/probable-waffle/gui/replay/replay.component").then(
                (m) => m.ReplayComponent
              )
          },
          {
            path: "match-history",
            loadComponent: () =>
              import(
                "@fuzzy-waddle/client/app/probable-waffle/gui/match-history/match-history-page.component"
              ).then((m) => m.MatchHistoryPageComponent)
          },
          {
            path: "match-details/:gameInstanceId",
            loadComponent: () =>
              import(
                "@fuzzy-waddle/client/app/probable-waffle/gui/match-history/match-details.component"
              ).then((m) => m.MatchDetailsComponent)
          },
          {
            path: "progress",
            loadComponent: () =>
              import("@fuzzy-waddle/client/app/probable-waffle/gui/progress/progress.component").then(
                (m) => m.ProgressComponent
              )
          },
          {
            path: "progress/:userId",
            loadComponent: () =>
              import("@fuzzy-waddle/client/app/probable-waffle/gui/progress/progress.component").then(
                (m) => m.ProgressComponent
              )
          },
          {
            path: "options",
            loadComponent: () =>
              import("@fuzzy-waddle/client/app/probable-waffle/gui/options/options.component").then(
                (m) => m.OptionsComponent
              )
          },
          {
            path: "lobby",
            loadComponent: () =>
              import("@fuzzy-waddle/client/app/probable-waffle/gui/lobby/lobby.component").then(
                (m) => m.LobbyComponent
              ),
            canActivate: [GameInstanceGuard]
          },
          {
            path: "score-screen",
            loadComponent: () =>
              import("@fuzzy-waddle/client/app/probable-waffle/gui/score-screen/score-screen.component").then(
                (m) => m.ScoreScreenComponent
              ),
            canActivate: [GameInstanceGuard]
          },
          {
            path: "game",
            loadComponent: () =>
              import("@fuzzy-waddle/client/app/probable-waffle/gui/main/probable-waffle-game.component").then(
                (m) => m.ProbableWaffleGameComponent
              ),
            canActivate: [GameInstanceGuard]
          }
        ]
      },
      { path: "**", redirectTo: "" }
    ]
  },
  {
    path: "profile",
    loadComponent: () =>
      import("@fuzzy-waddle/client/app/home/profile/profile.component").then((m) => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: "**",
    redirectTo: "aota"
  }
];
