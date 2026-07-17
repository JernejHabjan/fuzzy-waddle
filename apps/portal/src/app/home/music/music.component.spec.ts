import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MusicComponent } from "./music.component";
import { HomeNavComponent } from "../../shared/components/home-nav/home-nav.component";
import { HomeNavTestingComponent } from "../../shared/components/home-nav/home-nav.component.spec";

describe("MusicComponent", () => {
  let component: MusicComponent;
  let fixture: ComponentFixture<MusicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MusicComponent]
    })
      .overrideComponent(MusicComponent, {
        remove: {
          imports: [HomeNavComponent]
        },
        add: {
          imports: [HomeNavTestingComponent]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(MusicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
