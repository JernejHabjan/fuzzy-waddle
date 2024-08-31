import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TriggerComponent } from "./trigger.component";
import { RouterTestingModule } from "@angular/router/testing";
import { Component } from "@angular/core";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.spec";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";

@Component({ selector: "probable-waffle-trigger", template: "", standalone: true, imports: [] })
export class TriggerTestingComponent {}

describe("TriggerComponent", () => {
  let component: TriggerComponent;
  let fixture: ComponentFixture<TriggerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TriggerComponent, RouterTestingModule],
      providers: [{ provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }]
    }).compileComponents();

    fixture = TestBed.createComponent(TriggerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
