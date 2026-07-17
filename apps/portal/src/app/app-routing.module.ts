import { inject, NgModule } from "@angular/core";
import { Router, RouterModule, type Routes } from "@angular/router";
import { AuthGuard } from "@fuzzy-waddle/platform-identity/client/auth/auth.guard";
import { AppRoleGuard } from "@fuzzy-waddle/platform-identity/client/auth/app-role.guard";
import { LevelGuard } from "@fuzzy-waddle/fly-squasher-interface/choose-level/level.guard";
import { isTauri } from "@fuzzy-waddle/platform-game-host/tauri";
import { ensurePhaserGlobal } from "@fuzzy-waddle/platform-game-host/phaser/ensure-phaser-global";
import { probableWaffleRoutes } from "@fuzzy-waddle/probable-waffle-interface";

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
