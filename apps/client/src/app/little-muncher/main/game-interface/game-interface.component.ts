import { Component, ViewChild } from '@angular/core';
import { ModalConfig } from '../../../shared/components/modal/modal-config';
import { Router } from '@angular/router';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'fuzzy-waddle-game-interface',
  templateUrl: './game-interface.component.html',
  styleUrls: ['./game-interface.component.scss']
})
export class GameInterfaceComponent {
  score = 0; // todo
  @ViewChild('modal') private modalComponent!: ModalComponent;

  protected leaveModalConfirm: ModalConfig = {
    modalTitle: 'Leave the game?',
    dismissButtonLabel: 'Continue',
    closeButtonLabel: 'Leave',
    onClose: async () => await this.router.navigate(['/']) // todo
  };

  constructor(private readonly router: Router) {}

  async leave() {
    await this.openModal();
  }

  async openModal() {
    return await this.modalComponent.open();
  }
}
