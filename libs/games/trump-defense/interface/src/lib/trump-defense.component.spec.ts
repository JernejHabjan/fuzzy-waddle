import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import type { LevelDefinition } from "@fuzzy-waddle/trump-defense-gameplay";
import level1 from "../assets/trump-defense/levels/level-1.json";
import { loadLevel } from "./asset-paths";
import { ThreeScene } from "./three-scene";
import { TrumpDefenseComponent } from "./trump-defense.component";

jest.mock("./asset-paths", () => ({ loadLevel: jest.fn(), assetUrl: (path: string) => path }));
jest.mock("./game-audio", () => ({
  GameAudio: jest.fn().mockImplementation(() => ({
    startMusic: jest.fn(),
    play: jest.fn(),
    setMuted: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    stop: jest.fn(),
    updateCameraArea: jest.fn(),
    dispose: jest.fn()
  }))
}));
jest.mock("./three-scene", () => ({
  ThreeScene: jest.fn().mockImplementation(() => ({
    load: jest.fn().mockResolvedValue(undefined),
    sync: jest.fn(),
    render: jest.fn(),
    pick: jest.fn().mockReturnValue([8, 8]),
    pan: jest.fn(),
    zoom: jest.fn(),
    dispose: jest.fn()
  }))
}));

describe("TrumpDefenseComponent", () => {
  let fixture: ComponentFixture<TrumpDefenseComponent>;

  beforeEach(async () => {
    jest.mocked(loadLevel).mockResolvedValue(level1 as unknown as LevelDefinition);
    await TestBed.configureTestingModule({
      imports: [TrumpDefenseComponent],
      providers: [provideRouter([])]
    }).compileComponents();
    fixture = TestBed.createComponent(TrumpDefenseComponent);
    fixture.detectChanges();
    const levelButton = fixture.nativeElement.querySelector(".td-level-choice") as HTMLButtonElement;
    levelButton.click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it("loads a level and presents the original resources", () => {
    expect(fixture.nativeElement.textContent).toContain("Defend the border");
    expect(fixture.nativeElement.textContent).toContain("200");
    expect(fixture.nativeElement.textContent).toContain("10");
  });

  it("offers a level choice before loading the selected map", () => {
    fixture.destroy();
    jest.mocked(loadLevel).mockClear();
    fixture = TestBed.createComponent(TrumpDefenseComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll(".td-level-choice")).toHaveLength(3);
    expect(loadLevel).not.toHaveBeenCalled();
  });

  it("starts from a user gesture and builds on a picked tile", () => {
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll("button"));
    buttons.find((button) => button.textContent?.includes("Start level"))?.click();
    fixture.detectChanges();
    const viewport: HTMLElement = fixture.nativeElement.querySelector(".td-viewport");
    viewport.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    buttons.find((button) => button.textContent?.includes("Sniper"))?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("180");
    expect(fixture.nativeElement.textContent).toContain("Sniper tower built");
  });

  it("offers pointer controls for camera panning and zooming", () => {
    const scene = jest.mocked(ThreeScene).mock.results.at(-1)?.value as jest.Mocked<ThreeScene>;
    const pan = fixture.nativeElement.querySelector('[aria-label="Pan left"]') as HTMLButtonElement;
    const zoom = fixture.nativeElement.querySelector('[aria-label="Zoom in"]') as HTMLButtonElement;
    pan.click();
    zoom.click();
    expect(scene.pan).toHaveBeenCalledWith(-8, 0);
    expect(scene.zoom).toHaveBeenCalledWith(-120);
  });

  it("releases the scene when the route component is destroyed", () => {
    const scene = jest.mocked(ThreeScene).mock.results.at(-1)?.value as jest.Mocked<ThreeScene>;
    fixture.destroy();
    expect(scene.dispose).toHaveBeenCalled();
  });

  it("credits the original game's identified third-party sources", () => {
    const credits: HTMLElement = fixture.nativeElement.querySelector(".td-credits");
    expect(credits.textContent).toContain("Stronghold Crusader");
    expect(credits.textContent).toContain("Red Alert");
  });
});
