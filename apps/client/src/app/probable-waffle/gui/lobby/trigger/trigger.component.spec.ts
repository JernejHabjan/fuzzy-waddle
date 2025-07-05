import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TriggerComponent } from "./trigger.component";
import { Component } from "@angular/core";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.stub";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { provideRouter } from "@angular/router";
import { AuthService } from "../../../../auth/auth.service";
import { authServiceStub } from "../../../../auth/auth.service.stub";

@Component({ selector: "probable-waffle-trigger", template: "", standalone: true, imports: [] })
export class TriggerTestingComponent {}

describe("TriggerComponent", () => {
  let component: TriggerComponent;
  let fixture: ComponentFixture<TriggerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TriggerComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TriggerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
