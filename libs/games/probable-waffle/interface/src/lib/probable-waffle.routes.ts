import type { Routes } from "@angular/router";
import { environment } from "@fuzzy-waddle/environments/environment";
import { ensurePhaserGlobal } from "@fuzzy-waddle/platform-game-host/phaser/ensure-phaser-global";
import { GameInstanceGuard } from "./gui/online/lobby-page/game-instance.guard";

async function loadGameComponent<T>(loader: () => Promise<T>): Promise<T> {
  await ensurePhaserGlobal();
  return loader();
}

export const probableWaffleRoutes = [
  {
    path: "aota",
    children: [
      {
        path: "",
        loadComponent: () => import("./gui/router/probable-waffle.component").then((m) => m.ProbableWaffleComponent),
        children: [
          {
            path: "",
            loadComponent: () => import("./gui/home/home.component").then((m) => m.HomeComponent)
          },
          {
            path: "campaign",
            loadComponent: () => import("./gui/campaign/campaign.component").then((m) => m.CampaignComponent)
          },
          {
            path: "campaign/:chapterId",
            loadComponent: () =>
              import("./gui/campaign/mission-screen/mission-screen.component").then((m) => m.MissionScreenComponent)
          },
          {
            path: "campaign/:chapterId/:missionId",
            loadComponent: () =>
              import("./gui/campaign/mission-screen/mission-screen.component").then((m) => m.MissionScreenComponent)
          },
          {
            path: "online",
            loadComponent: () => import("./gui/online/online.component").then((m) => m.OnlineComponent)
            // canActivate: [() => !environment.production] // set to alpha in #606
          },
          {
            path: "skirmish",
            loadComponent: () => import("./gui/skirmish/skirmish.component").then((m) => m.SkirmishComponent)
          },
          {
            path: "instant-game",
            loadComponent: () =>
              import("./gui/instant-game/instant-game.component").then((m) => m.InstantGameComponent),
            canActivate: [() => !environment.production]
          },
          {
            path: "instant-network-match",
            loadComponent: () =>
              import("./gui/online/instant-network-match/instant-network-match.component").then(
                (m) => m.InstantNetworkMatchComponent
              ),
            canActivate: [() => !environment.production]
          },
          {
            path: "load",
            loadComponent: () => import("./gui/load/load.component").then((m) => m.LoadComponent)
          },
          {
            path: "replay",
            loadComponent: () => import("./gui/replay/replay.component").then((m) => m.ReplayComponent)
          },
          {
            path: "match-history",
            loadComponent: () =>
              import("./gui/match-history/match-history-page.component").then((m) => m.MatchHistoryPageComponent)
          },
          {
            path: "match-details/:gameInstanceId",
            loadComponent: () =>
              import("./gui/match-history/match-details.component").then((m) => m.MatchDetailsComponent)
          },
          {
            path: "progress",
            loadComponent: () => import("./gui/progress/progress.component").then((m) => m.ProgressComponent)
          },
          {
            path: "progress/:userId",
            loadComponent: () => import("./gui/progress/progress.component").then((m) => m.ProgressComponent)
          },
          {
            path: "options",
            loadComponent: () => import("./gui/options/options.component").then((m) => m.OptionsComponent)
          },
          {
            path: "lobby",
            loadComponent: () => import("./gui/lobby/lobby.component").then((m) => m.LobbyComponent),
            canActivate: [GameInstanceGuard]
          },
          {
            path: "score-screen",
            loadComponent: () =>
              import("./gui/score-screen/score-screen.component").then((m) => m.ScoreScreenComponent),
            canActivate: [GameInstanceGuard]
          },
          {
            path: "game",
            loadComponent: () =>
              loadGameComponent(() => import("./gui/main/probable-waffle-game.component")).then(
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
