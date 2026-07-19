import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MainMenuButtonsComponent } from "./main-menu-buttons.component";
import { ActivatedRoute } from "@angular/router";

describe("MainMenuButtonsComponent", () => {
  let component: MainMenuButtonsComponent;
  let fixture: ComponentFixture<MainMenuButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainMenuButtonsComponent],
      providers: [{ provide: ActivatedRoute, useValue: {} }]
    }).compileComponents();

    fixture = TestBed.createComponent(MainMenuButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
