import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MatchmakingComponent } from "./matchmaking.component";
import { FormsModule } from "@angular/forms";
import { Component } from "@angular/core";
import { RoomsService } from "../../../communicators/rooms/rooms.service";
import { roomsServiceStub } from "../../../communicators/rooms/rooms.service.spec";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.spec";
import { CommonModule } from "@angular/common";

@Component({ selector: "probable-waffle-matchmaking", template: "", standalone: true, imports: [CommonModule] })
export class MatchmakingTestingComponent {}

describe("MatchmakingComponent", () => {
  let component: MatchmakingComponent;
  let fixture: ComponentFixture<MatchmakingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: RoomsService, useValue: roomsServiceStub },
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }
      ],
      imports: [MatchmakingComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MatchmakingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
