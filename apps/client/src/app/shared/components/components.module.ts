import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeNavComponent } from './home-nav/home-nav.component';
import { RouterLink } from '@angular/router';
import { ModalComponent } from './modal/modal.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [HomeNavComponent, ModalComponent],
  imports: [CommonModule, RouterLink],
  exports: [HomeNavComponent, ModalComponent],
  providers: [NgbActiveModal]
})
export class ComponentsModule {}
