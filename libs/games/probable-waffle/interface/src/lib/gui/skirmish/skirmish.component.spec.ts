import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SkirmishComponent } from "./skirmish.component";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../communicators/game-instance-client.service.stub";

describe("SkirmishComponent", () => {
  let component: SkirmishComponent;
  let fixture: ComponentFixture<SkirmishComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }],
      imports: [SkirmishComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SkirmishComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
