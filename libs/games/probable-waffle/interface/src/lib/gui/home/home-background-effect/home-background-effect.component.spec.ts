import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Subject } from "rxjs";
import { OptionsService } from "../../options/options.service";
import { HomeBackgroundEffectComponent } from "./home-background-effect.component";

describe("HomeBackgroundEffectComponent", () => {
  let fixture: ComponentFixture<HomeBackgroundEffectComponent>;
  const settingsChanged = new Subject<{
    type: "game";
    payload: { homeScreenBackground: "ashfall" | "constellation" };
  }>();
  const optionsService = {
    init: jest.fn(),
    gameSettings: { homeScreenBackground: "ashfall" },
    settingsChanged
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [HomeBackgroundEffectComponent],
      providers: [{ provide: OptionsService, useValue: optionsService }]
    })
      .overrideComponent(HomeBackgroundEffectComponent, {
        set: { imports: [], template: "" }
      })
      .compileComponents();

    fixture = TestBed.createComponent(HomeBackgroundEffectComponent);
  });

  it("initializes the persisted background setting", () => {
    fixture.detectChanges();

    expect(optionsService.init).toHaveBeenCalledTimes(1);
  });
});
