import { ComponentFixture, TestBed } from "@angular/core/testing";

import { HostComponent } from "./host.component";
import { LobbyTestingComponent } from "../../lobby/lobby.component.spec";
import { Component } from "@angular/core";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.spec";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { LobbyComponent } from "../../lobby/lobby.component";

@Component({ selector: "probable-waffle-host", template: "", standalone: true, imports: [CommonModule] })
export class HostTestingComponent {}

describe("HostComponent", () => {
  let component: HostComponent;
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }],
      imports: [HostComponent, FormsModule]
    })
      .overrideComponent(HostComponent, {
        remove: {
          imports: [LobbyComponent]
        },
        add: {
          imports: [LobbyTestingComponent]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
