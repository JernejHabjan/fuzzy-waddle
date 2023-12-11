import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HomeNavComponent } from "./home-nav/home-nav.component";
import { RouterLink } from "@angular/router";
import { ModalComponent } from "./modal/modal.component";
import { NgbActiveModal, NgbAlert } from "@ng-bootstrap/ng-bootstrap";
import { SwRefreshComponent } from "./sw-refresh/sw-refresh.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

@NgModule({
  declarations: [HomeNavComponent, ModalComponent, SwRefreshComponent],
  imports: [CommonModule, RouterLink, NgbAlert, FaIconComponent],
  exports: [HomeNavComponent, ModalComponent, SwRefreshComponent],
  providers: [NgbActiveModal]
})
export class ComponentsModule {}
