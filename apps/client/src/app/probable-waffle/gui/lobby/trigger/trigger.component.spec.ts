import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TriggerComponent } from "./trigger.component";
import { Component } from "@angular/core";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.spec";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { provideRouter } from "@angular/router";

@Component({ selector: "probable-waffle-trigger", template: "", standalone: true, imports: [] })
export class TriggerTestingComponent {}

describe("TriggerComponent", () => {
  let component: TriggerComponent;
  let fixture: ComponentFixture<TriggerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TriggerComponent],
      providers: [provideRouter([]), { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }]
    }).compileComponents();

    fixture = TestBed.createComponent(TriggerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
