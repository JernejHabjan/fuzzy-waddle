import { GameInstanceClientServiceInterface } from "./game-instance-client.service.interface";

export const gameInstanceClientServiceStub = {
  get gameInstanceId(): string | null {
    return null;
  },
  startGame(): Promise<void> {
    return Promise.resolve();
  },
  stopGame() {
    //
  },
  startLevel() {
    //
  },
  openLevelSpectator(): Promise<void> {
    return Promise.resolve();
  },
  openLevel(): Promise<void> {
    return Promise.resolve();
  },
  stopLevel(): Promise<void> {
    return Promise.resolve();
  }
} satisfies GameInstanceClientServiceInterface;
