import { Component, ViewChild } from '@angular/core';
import { ModalConfig } from '../../../shared/components/modal/modal-config';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { Router } from '@angular/router';

@Component({
  selector: 'fly-squasher-game-interface',
  templateUrl: './game-interface.component.html',
  styleUrls: ['./game-interface.component.scss']
})
export class GameInterfaceComponent {
  @ViewChild('modal') private modalComponent!: ModalComponent;

  protected readonly leaveModalConfirm: ModalConfig = {
    modalTitle: 'Leave the game?',
    dismissButtonLabel: 'Continue',
    closeButtonLabel: 'Leave',
    onClose: async () => this.router.navigate(['/fly-squasher/choose-level'])
  };

  constructor(private readonly router: Router) {}

  protected async leave() {
    await this.openModal();
  }

  protected async openModal() {
    return await this.modalComponent.open();
  }
}
