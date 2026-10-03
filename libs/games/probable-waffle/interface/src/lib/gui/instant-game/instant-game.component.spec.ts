import { ComponentFixture, TestBed } from "@angular/core/testing";
import { InstantGameComponent } from "./instant-game.component";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../communicators/game-instance-client.service.stub";

describe("InstantGameComponent", () => {
  let component: InstantGameComponent;
  let fixture: ComponentFixture<InstantGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstantGameComponent],
      providers: [
        {
          provide: GameInstanceClientService,
          useValue: gameInstanceClientServiceStub
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InstantGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
