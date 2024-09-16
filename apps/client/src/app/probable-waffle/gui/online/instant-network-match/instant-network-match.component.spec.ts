import { ComponentFixture, TestBed } from "@angular/core/testing";
import { InstantNetworkMatchComponent } from "./instant-network-match.component";

describe("InstantNetworkMatchComponent", () => {
  let component: InstantNetworkMatchComponent;
  let fixture: ComponentFixture<InstantNetworkMatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstantNetworkMatchComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(InstantNetworkMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
