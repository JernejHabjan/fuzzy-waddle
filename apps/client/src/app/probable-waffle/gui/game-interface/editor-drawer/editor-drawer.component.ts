import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { SceneCommunicatorService } from "../../../communicators/scene-communicator.service";
import { ActivatedRoute, Router } from "@angular/router";
import { AtlasFrame, AtlasJsonWrapper, AtlasLoaderService, TileAtlasFrame, TileFrame } from "./atlas-loader.service";
import { MapDefinitions } from "../../../game/world/const/map-size.info";
import { TileTypes } from "../../../game/world/map/tile/manual-tiles/tile-types";
import { Subscription } from "rxjs";
import { ModalConfig } from "../../../../shared/components/modal/modal-config";
import { ModalComponent } from "../../../../shared/components/modal/modal.component";

type TileType = "flat" | "water" | "slopes" | "blocks" | "other";

@Component({
  selector: "probable-waffle-editor-drawer",
  templateUrl: "./editor-drawer.component.html",
  styleUrls: ["./editor-drawer.component.scss"]
})
export class EditorDrawerComponent implements OnInit, OnDestroy {
  editorVisible = false;
  showObjectPlacement = false;
  MapDefinitions = MapDefinitions;
  nrReplacedTiles = SceneCommunicatorService.DEFAULT_TILE_REPLACE;
  layerNr = SceneCommunicatorService.DEFAULT_LAYER;
  tileAtlasFrames: TileAtlasFrame[] | null = null;
  spriteAtlases: AtlasJsonWrapper[] | null = null;

  tileTypes: { tileType: TileType; fn: (frameWithMeta: TileFrame) => boolean }[] = [
    { tileType: "flat", fn: TileTypes.getWalkableHeight0 },
    { tileType: "water", fn: TileTypes.getWalkableWater },
    { tileType: "slopes", fn: TileTypes.getWalkableSlopes },
    { tileType: "blocks", fn: TileTypes.getWalkableHeightBlock },
    { tileType: "other", fn: TileTypes.getOtherTiles }
  ];
  selectedType: { tileType: TileType; fn: (frameWithMeta: TileFrame) => boolean };
  selectedAtlas: AtlasFrame | null = null;
  selectedTile: number | null = null;
  leaveModalConfirm: ModalConfig = {
    modalTitle: "Leave the game?",
    dismissButtonLabel: "Continue",
    closeButtonLabel: "Leave",
    onClose: async () => await this.router.navigate(["probable-waffle/skirmish"]) // todo
  };
  private emitterSubjectSubscription?: Subscription;
  private atlasEmitterSubscription?: Subscription;
  @ViewChild("modal") private modalComponent!: ModalComponent;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private atlasLoaderService: AtlasLoaderService
  ) {
    this.selectedType = this.tileTypes[0];
  }

  async openModal() {
    return await this.modalComponent.open();
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadMapAtlas(), this.loadSpriteAtlases()]);
    this.listenToSelectionEvents();
  }

  removeTile() {
    SceneCommunicatorService.tileEmitterSubject.next(-1);
  }

  selectAtlas(tilesetName: string, atlasFrame: AtlasFrame) {
    SceneCommunicatorService.atlasEmitterSubject.next({ tilesetName, atlasFrame });
  }

  nrReplacedTilesChanged() {
    SceneCommunicatorService.tileEmitterNrSubject.next(this.nrReplacedTiles);
  }

  layerNrChanged() {
    SceneCommunicatorService.layerEmitterSubject.next(this.layerNr);
  }

  async loadMapAtlas() {
    this.tileAtlasFrames = await this.atlasLoaderService.loadMap();
  }

  async loadSpriteAtlases() {
    this.spriteAtlases = [
      await this.atlasLoaderService.loadAtlasJson(MapDefinitions.atlasMegaset),
      await this.atlasLoaderService.loadAtlasJson(MapDefinitions.atlasBuildings),
      await this.atlasLoaderService.loadAtlasJson(MapDefinitions.atlasCharacters)
    ];
  }

  async leave() {
    await this.openModal();
  }

  saveMap() {
    // todo
  }

  loadMap() {
    // todo
  }

  formatAtlasFileName(filename: string) {
    // replace "_" with " "
    return filename.replace(/_/g, " ");
  }

  ngOnDestroy(): void {
    this.emitterSubjectSubscription?.unsubscribe();
    this.atlasEmitterSubscription?.unsubscribe();
  }

  private listenToSelectionEvents() {
    this.emitterSubjectSubscription = SceneCommunicatorService.tileEmitterSubject.subscribe((tileId) => {
      this.selectedTile = tileId;
    });
    this.atlasEmitterSubscription = SceneCommunicatorService.atlasEmitterSubject.subscribe((a) => {
      this.selectedAtlas = a?.atlasFrame ?? null;
    });
  }
}
