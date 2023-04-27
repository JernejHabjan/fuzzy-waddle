import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ModalConfig } from '../../../shared/components/modal/modal-config';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { GameInstanceClientService } from '../game-instance-client.service';
import { CommunicatorService } from '../../game/communicator.service';
import { Subscription } from 'rxjs';
import { LittleMuncherGameSessionInstance } from '@fuzzy-waddle/api-interfaces';
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'fuzzy-waddle-game-interface',
  templateUrl: './game-interface.component.html',
  styleUrls: ['./game-interface.component.scss']
})
export class GameInterfaceComponent implements OnInit, OnDestroy {
  score = 0;
  @ViewChild('modal') private modalComponent!: ModalComponent;
  @Input() gameSessionInstance!: LittleMuncherGameSessionInstance;
  protected readonly faPause = faPause;
  protected readonly faPlay = faPlay;
  paused = false;

  protected leaveModalConfirm: ModalConfig = {
    modalTitle: 'Leave the game?',
    dismissButtonLabel: 'Continue',
    closeButtonLabel: 'Leave',
    onClose: async () =>
      await this.gameInstanceClientService.stopLevel(this.gameSessionInstance, 'localAndRemote').then()
  };
  private scoreSubscription?: Subscription;
  private pauseSubscription?: Subscription;

  constructor(
    private readonly gameInstanceClientService: GameInstanceClientService,
    private readonly communicatorService: CommunicatorService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {}

  async leave() {
    await this.openModal();
  }

  async openModal() {
    return await this.modalComponent.open();
  }

  ngOnInit(): void {
    this.scoreSubscription = this.communicatorService.score?.on.subscribe((event) => {
      this.score = event.score;
      this.changeDetectorRef.detectChanges();
    });
    this.pauseSubscription = this.communicatorService.pause?.on.subscribe((event) => {
      this.paused = event.pause;
      this.changeDetectorRef.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.scoreSubscription?.unsubscribe();
    this.pauseSubscription?.unsubscribe();
  }

  pauseToggle() {
    this.paused = !this.paused;
    this.communicatorService.pause?.send({ pause: this.paused });
  }
}
