import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { HomePageComponent } from "./home/page/home-page.component";
import { ProfileComponent } from "./home/profile/profile.component";
import { AuthGuard } from "./auth/auth.guard";

const routes: Routes = [
  {
    path: "",
    component: HomePageComponent
  },
  {
    path: "profile",
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "little-muncher",
    loadChildren: () => import("./little-muncher/little-muncher.module").then((m) => m.LittleMuncherModule)
  },
  {
    path: "probable-waffle",
    loadChildren: () =>
      import("./probable-waffle/gui/router/probable-waffle.module").then((m) => m.ProbableWaffleModule)
  },
  {
    path: "fly-squasher",
    loadChildren: () => import("./fly-squasher/fly-squasher.module").then((m) => m.FlySquasherModule)
  },
  {
    path: "**",
    redirectTo: ""
  }
];

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
