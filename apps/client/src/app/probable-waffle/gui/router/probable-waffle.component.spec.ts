import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ProbableWaffleComponent } from "./probable-waffle.component";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../communicators/game-instance-client.service.spec";
import { provideRouter } from "@angular/router";

describe("ProbableWaffleComponent", () => {
  let component: ProbableWaffleComponent;
  let fixture: ComponentFixture<ProbableWaffleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: GameInstanceClientService,
          useValue: gameInstanceClientServiceStub
        }
      ],
      imports: [ProbableWaffleComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProbableWaffleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
