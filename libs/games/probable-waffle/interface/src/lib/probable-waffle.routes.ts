import { inject, Injector } from "@angular/core";
import type { CanActivateFn, Routes } from "@angular/router";
import { environment } from "@fuzzy-waddle/environments/environment";
import { AuthGuard } from "@fuzzy-waddle/platform-identity/client/auth/auth.guard";

/**
 * Defers the game-instance guard and its Phaser-facing service graph until a protected game route is requested.
 * The injector must be captured before the dynamic import because `inject()` is unavailable after the asynchronous boundary.
 */
export const lazyGameInstanceGuard: CanActivateFn = (route, state) => {
  const injector = inject(Injector);
  return import("./gui/online/lobby-page/game-instance.guard").then(({ GameInstanceGuard }) =>
    injector.get(GameInstanceGuard).canActivate(route, state)
  );
};

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
            path: "profile",
            loadComponent: () =>
              import("@fuzzy-waddle/platform-identity/client/profile/profile.component").then(
                (m) => m.ProfileComponent
              ),
            canActivate: [AuthGuard]
          },
          {
            path: "options",
            loadComponent: () => import("./gui/options/options.component").then((m) => m.OptionsComponent)
          },
          {
            path: "lobby",
            loadComponent: () => import("./gui/lobby/lobby.component").then((m) => m.LobbyComponent),
            canActivate: [lazyGameInstanceGuard]
          },
          {
            path: "score-screen",
            loadComponent: () =>
              import("./gui/score-screen/score-screen.component").then((m) => m.ScoreScreenComponent),
            canActivate: [lazyGameInstanceGuard]
          },
          {
            path: "game",
            loadComponent: () =>
              import("./gui/main/probable-waffle-game.component").then((m) => m.ProbableWaffleGameComponent),
            canActivate: [lazyGameInstanceGuard]
          }
        ]
      },
      { path: "**", redirectTo: "home" }
    ]
  }
] satisfies Routes;
