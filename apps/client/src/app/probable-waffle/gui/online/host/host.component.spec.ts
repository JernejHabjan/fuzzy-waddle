import { ComponentFixture, TestBed } from "@angular/core/testing";

import { HostComponent } from "./host.component";
import { LobbyTestingComponent } from "../../lobby/lobby.component.spec";
import { Component } from "@angular/core";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.spec";
import { FormsModule } from "@angular/forms";

@Component({ selector: "probable-waffle-host", template: "" })
export class HostTestingComponent {}

describe("HostComponent", () => {
  let component: HostComponent;
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }],
      declarations: [HostComponent, LobbyTestingComponent],
      imports: [FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
