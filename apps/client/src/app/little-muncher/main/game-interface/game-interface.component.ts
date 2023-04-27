import { Component, ViewChild } from '@angular/core';
import { ModalConfig } from '../../../shared/components/modal/modal-config';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { GameInstanceClientService } from '../game-instance-client.service';

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
    onClose: async () => await this.gameInstanceClientService.stopLevel('localAndRemote').then()
  };

  constructor(private readonly gameInstanceClientService: GameInstanceClientService) {}

  async leave() {
    await this.openModal();
  }

  async openModal() {
    return await this.modalComponent.open();
  }
}
