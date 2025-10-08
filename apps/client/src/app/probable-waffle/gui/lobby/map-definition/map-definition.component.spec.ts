import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MapDefinitionComponent } from "./map-definition.component";
import { FormsModule } from "@angular/forms";
import { Component } from "@angular/core";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.stub";
import { SceneCommunicatorClientService } from "../../../communicators/scene-communicator-client.service";
import { sceneCommunicatorClientServiceStub } from "../../../../fly-squasher/main/scene-communicator-client.service.stub";
import { AuthService } from "../../../../auth/auth.service";
import { authServiceStub } from "../../../../auth/auth.service.stub";

@Component({ selector: "probable-waffle-map-definition", template: "", standalone: true, imports: [] })
export class MapDefinitionTestingComponent {}

describe("MapDefinitionComponent", () => {
  let component: MapDefinitionComponent;
  let fixture: ComponentFixture<MapDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapDefinitionComponent, FormsModule],
      providers: [
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: SceneCommunicatorClientService, useValue: sceneCommunicatorClientServiceStub },
        { provide: AuthService, useValue: authServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MapDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
