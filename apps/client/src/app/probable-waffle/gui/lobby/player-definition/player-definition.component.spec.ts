import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PlayerDefinitionComponent } from "./player-definition.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { FormsModule } from "@angular/forms";
import { Component } from "@angular/core";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.stub";

@Component({ selector: "probable-waffle-player-definition", template: "", standalone: true, imports: [] })
export class PlayerDefinitionTestingComponent {}

describe("PlayerDefinitionComponent", () => {
  let component: PlayerDefinitionComponent;
  let fixture: ComponentFixture<PlayerDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerDefinitionComponent, FontAwesomeTestingModule, FormsModule],
      providers: [{ provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }]
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
