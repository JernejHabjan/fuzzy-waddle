import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ProbableWaffleGameComponent } from "./probable-waffle-game.component";
import { EditorDrawerTestingComponent } from "../game-interface/editor-drawer/editor-drawer.component.spec";
import { GameContainerTestingComponent } from "../../../shared/game/game-container/game-container.component.spec";
import { SelectionGroupTestingComponent } from "../game-interface/selection/selection-group/selection-group.component.spec";
import { gameInstanceClientServiceStub } from "../../communicators/game-instance-client.service.spec";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";

jest.mock("../../game/world/const/game-config", () => ({
  probableWaffleGameConfig: {}
}));

describe("ProbableWaffleGameComponent", () => {
  let component: ProbableWaffleGameComponent;
  let fixture: ComponentFixture<ProbableWaffleGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }],
      declarations: [
        ProbableWaffleGameComponent,
        GameContainerTestingComponent,
        EditorDrawerTestingComponent,
        SelectionGroupTestingComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProbableWaffleGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
