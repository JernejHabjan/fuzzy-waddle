import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MainMenuButtonsComponent } from "./main-menu-buttons.component";

describe("MainMenuButtonsComponent", () => {
  let component: MainMenuButtonsComponent;
  let fixture: ComponentFixture<MainMenuButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainMenuButtonsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MainMenuButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
