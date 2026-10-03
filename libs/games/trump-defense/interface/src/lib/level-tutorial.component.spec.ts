import { TestBed } from "@angular/core/testing";
import { LevelTutorialComponent } from "./level-tutorial.component";
import { getLevelTutorial } from "./level-tutorial";

describe("LevelTutorialComponent", () => {
  it("walks through ground defenses, site selection, lives and the wall before deployment", async () => {
    await TestBed.configureTestingModule({ imports: [LevelTutorialComponent] }).compileComponents();
    const fixture = TestBed.createComponent(LevelTutorialComponent);
    fixture.componentRef.setInput("level", 1);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain("GROUND FORCES");
    expect(root.textContent).toContain("Cannons hit them hard");
    const next = (): void => {
      root.querySelector<HTMLButtonElement>('[aria-label="Next briefing"]')?.click();
      fixture.detectChanges();
    };
    next();
    expect(root.textContent).toContain("CANNON");
    expect(root.textContent).toContain("Sniper towers unlock on the next battlefield");
    next();
    expect(root.textContent).toContain("PICK A BUILD SITE");
    next();
    expect(root.textContent).toContain("HEARTS ARE LIVES");
    next();
    expect(root.textContent).toContain("RAISE THE WALL");
    expect(root.querySelector<HTMLButtonElement>('[aria-label="Next briefing"]')?.textContent).toContain("START LEVEL");
  });

  it("introduces ballooners, sniper towers and night lights on level two", async () => {
    await TestBed.configureTestingModule({ imports: [LevelTutorialComponent] }).compileComponents();
    const fixture = TestBed.createComponent(LevelTutorialComponent);
    fixture.componentRef.setInput("level", 2);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain("AIR RAID");
    root.querySelector<HTMLButtonElement>('[aria-label="Next briefing"]')?.click();
    fixture.detectChanges();
    expect(root.textContent).toContain("SNIPER TOWER");
    root.querySelector<HTMLButtonElement>('[aria-label="Next briefing"]')?.click();
    fixture.detectChanges();
    expect(root.textContent).toContain("NIGHT WATCH");
    expect(root.textContent).toContain("Spotlights reveal the spawn areas");
  });

  it("explains random placement and features both defenses together on level three", async () => {
    await TestBed.configureTestingModule({ imports: [LevelTutorialComponent] }).compileComponents();
    const fixture = TestBed.createComponent(LevelTutorialComponent);
    fixture.componentRef.setInput("level", 3);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain("random available tile");
    expect(getLevelTutorial(3)[0]?.showcase).toEqual(["Cannon", "SniperTower"]);
  });
});
