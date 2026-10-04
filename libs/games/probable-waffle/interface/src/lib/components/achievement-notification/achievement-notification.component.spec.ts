import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AudioAtlasService } from "../../services/audio-atlas/audio-atlas.service";
import { AchievementNotificationComponent } from "./achievement-notification.component";

describe("AchievementNotificationComponent", () => {
  let fixture: ComponentFixture<AchievementNotificationComponent>;
  const audioAtlasService = {
    playSound: jest.fn().mockResolvedValue(7),
    stopSound: jest.fn()
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [AchievementNotificationComponent],
      providers: [{ provide: AudioAtlasService, useValue: audioAtlasService }]
    })
      .overrideComponent(AchievementNotificationComponent, {
        set: { imports: [], template: "" }
      })
      .compileComponents();

    fixture = TestBed.createComponent(AchievementNotificationComponent);
  });

  it("shows the notification and plays its sound", async () => {
    const component = fixture.componentInstance;

    component.show();
    await Promise.resolve();

    expect(component.visible).toBe(true);
    expect(audioAtlasService.playSound).toHaveBeenCalledWith("achievement");
  });

  it("stops an active sound when destroyed", async () => {
    fixture.componentInstance.show();
    await Promise.resolve();

    fixture.componentInstance.ngOnDestroy();

    expect(audioAtlasService.stopSound).toHaveBeenCalledWith(7);
  });
});
