import { Component, inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { SceneCommunicatorService } from "../../../communicators/scene-communicator.service";
import { Router } from "@angular/router";
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
  protected editorVisible = false;
  protected showObjectPlacement = false;
  protected readonly MapDefinitions = MapDefinitions;
  protected nrReplacedTiles = SceneCommunicatorService.DEFAULT_TILE_REPLACE;
  protected layerNr = SceneCommunicatorService.DEFAULT_LAYER;
  protected tileAtlasFrames: TileAtlasFrame[] | null = null;
  protected spriteAtlases: AtlasJsonWrapper[] | null = null;

  protected tileTypes: { tileType: TileType; fn: (frameWithMeta: TileFrame) => boolean }[] = [
    { tileType: "flat", fn: TileTypes.getWalkableHeight0 },
    { tileType: "water", fn: TileTypes.getWalkableWater },
    { tileType: "slopes", fn: TileTypes.getWalkableSlopes },
    { tileType: "blocks", fn: TileTypes.getWalkableHeightBlock },
    { tileType: "other", fn: TileTypes.getOtherTiles }
  ];
  protected selectedType: { tileType: TileType; fn: (frameWithMeta: TileFrame) => boolean };
  protected selectedAtlas: AtlasFrame | null = null;
  protected selectedTile: number | null = null;
  protected readonly leaveModalConfirm: ModalConfig = {
    modalTitle: "Leave the game?",
    dismissButtonLabel: "Continue",
    closeButtonLabel: "Leave",
    onClose: async () => await this.router.navigate(["probable-waffle"]) // todo
  };
  private emitterSubjectSubscription?: Subscription;
  private atlasEmitterSubscription?: Subscription;
  @ViewChild("modal") private modalComponent!: ModalComponent;

  private readonly router = inject(Router);
  private readonly atlasLoaderService = inject(AtlasLoaderService);

  constructor() {
    this.selectedType = this.tileTypes[0];
  }

  protected async openModal() {
    return await this.modalComponent.open();
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadMapAtlas(), this.loadSpriteAtlases()]);
    this.listenToSelectionEvents();
  }

  protected removeTile() {
    SceneCommunicatorService.tileEmitterSubject.next(-1);
  }

  protected selectAtlas(tilesetName: string, atlasFrame: AtlasFrame) {
    SceneCommunicatorService.atlasEmitterSubject.next({ tilesetName, atlasFrame });
  }

  protected nrReplacedTilesChanged() {
    SceneCommunicatorService.tileEmitterNrSubject.next(this.nrReplacedTiles);
  }

  protected layerNrChanged() {
    SceneCommunicatorService.layerEmitterSubject.next(this.layerNr);
  }

  private async loadMapAtlas() {
    this.tileAtlasFrames = await this.atlasLoaderService.loadMap();
  }

  private async loadSpriteAtlases() {
    this.spriteAtlases = [
      await this.atlasLoaderService.loadAtlasJson(MapDefinitions.atlasMegaset),
      await this.atlasLoaderService.loadAtlasJson(MapDefinitions.atlasBuildings),
      await this.atlasLoaderService.loadAtlasJson(MapDefinitions.atlasCharacters)
    ];
  }

  protected async leave() {
    await this.openModal();
  }

  protected saveMap() {
    // todo
  }

  protected loadMap() {
    // todo
  }

  protected formatAtlasFileName(filename: string) {
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
