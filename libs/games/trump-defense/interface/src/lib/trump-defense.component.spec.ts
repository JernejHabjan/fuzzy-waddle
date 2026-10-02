import { TestBed, type ComponentFixture } from "@angular/core/testing";
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
      imports: [TrumpDefenseComponent]
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
    expect(fixture.nativeElement.textContent).toContain("Hold that wall!");
    expect(fixture.nativeElement.textContent).toContain("200");
    expect(fixture.nativeElement.textContent).toContain("10");
  });

  it("offers a level choice before loading the selected map", () => {
    fixture.destroy();
    jest.mocked(loadLevel).mockClear();
    fixture = TestBed.createComponent(TrumpDefenseComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll(".td-level-choice")).toHaveLength(3);
    expect(fixture.nativeElement.textContent).toContain("First Line");
    expect(fixture.nativeElement.textContent).toContain("Night Watch");
    expect(fixture.nativeElement.textContent).toContain("Final Stand");
    expect(fixture.nativeElement.textContent).not.toContain("amigo");
    expect(loadLevel).not.toHaveBeenCalled();
  });

  it("reveals the 2016 school project details from the level picker info button", () => {
    fixture.destroy();
    fixture = TestBed.createComponent(TrumpDefenseComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const infoButton = root.querySelector<HTMLButtonElement>(".td-info-button");
    expect(infoButton?.getAttribute("aria-expanded")).toBe("false");
    expect(root.querySelector("#td-project-info")).toBeNull();
    infoButton?.click();
    fixture.detectChanges();
    expect(infoButton?.getAttribute("aria-expanded")).toBe("true");
    expect(root.querySelector("#td-project-info")?.textContent).toContain(
      "school project for the Computer Graphics class"
    );
    expect(root.querySelector("#td-project-info")?.textContent).toContain("University of Ljubljana");
  });

  it("starts from a user gesture and builds on a picked tile", () => {
    const root = fixture.nativeElement as HTMLElement;
    const startButtons = Array.from(root.querySelectorAll("button"));
    startButtons.find((button) => button.textContent?.includes("Let's roll"))?.click();
    fixture.detectChanges();
    const viewport: HTMLElement = fixture.nativeElement.querySelector(".td-viewport");
    viewport.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    fixture.detectChanges();
    const sniper = Array.from(root.querySelectorAll("button")).find((button) => button.textContent?.includes("Sniper"));
    const upgrade = Array.from(root.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Upgrade")
    );
    expect(sniper?.disabled).toBe(false);
    expect(upgrade?.disabled).toBe(true);
    sniper?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("180");
    expect(fixture.nativeElement.textContent).toContain("Sniper tower built");
    expect(upgrade?.disabled).toBe(false);
  });

  it("disables placement without a selected tile and omits tile details while paused", () => {
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>(".td-panel button")?.click();
    fixture.detectChanges();
    const sniper = Array.from(root.querySelectorAll("button")).find((button) => button.textContent?.includes("Sniper"));
    expect(sniper?.disabled).toBe(true);
    const pause = Array.from(root.querySelectorAll("button")).find((button) => button.textContent?.includes("Pause"));
    pause?.click();
    fixture.detectChanges();
    expect(root.querySelector(".td-panel")?.textContent).toContain("Paused");
    expect(root.querySelector(".td-panel")?.textContent).not.toContain("Tile");
  });

  it("keeps camera controls off the HUD while wheel zoom still works", () => {
    const scene = jest.mocked(ThreeScene).mock.results.at(-1)?.value as jest.Mocked<ThreeScene>;
    const stage: HTMLElement = fixture.nativeElement.querySelector(".td-stage");
    stage.dispatchEvent(new WheelEvent("wheel", { deltaY: -120, bubbles: true, cancelable: true }));
    expect(fixture.nativeElement.querySelector(".td-camera-controls")).toBeNull();
    expect(scene.zoom).toHaveBeenCalledWith(-120);
  });

  it("keeps the status, sound and placement controls over the game viewport", () => {
    const root = fixture.nativeElement as HTMLElement;
    const start = Array.from(root.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Let's roll")
    );
    start?.click();
    fixture.detectChanges();
    const stage: HTMLElement = fixture.nativeElement.querySelector(".td-stage");
    expect(stage.querySelector(".td-hud")).not.toBeNull();
    expect(stage.querySelector(".td-sound")).not.toBeNull();
    expect(stage.querySelector(".td-controls")).not.toBeNull();
    expect(fixture.nativeElement.querySelector(".td-help")).toBeNull();
    expect(fixture.nativeElement.querySelector(".td-credits")).toBeNull();
  });

  it("releases the scene when the route component is destroyed", () => {
    const scene = jest.mocked(ThreeScene).mock.results.at(-1)?.value as jest.Mocked<ThreeScene>;
    fixture.destroy();
    expect(scene.dispose).toHaveBeenCalled();
  });
});
