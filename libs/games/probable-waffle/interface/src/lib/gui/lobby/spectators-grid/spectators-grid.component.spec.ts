import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SpectatorsGridComponent } from "./spectators-grid.component";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.stub";
import { Component } from "@angular/core";

@Component({ selector: "probable-waffle-spectators-grid", template: "", standalone: true, imports: [] })
export class SpectatorsGridTestingComponent {}

describe("SpectatorsGridComponent", () => {
  let component: SpectatorsGridComponent;
  let fixture: ComponentFixture<SpectatorsGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }],
      imports: [SpectatorsGridComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SpectatorsGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
