import { Guid } from './uuid';

export interface GameCreateDto {
  gameInstanceId: string;
}

export interface GameDestroyDto {
  gameInstanceId: string;
}

export class GameInstance {
  gameInstanceId: string;

  constructor(id: string | null = null) {
    if (id) {
      this.gameInstanceId = id;
      return;
    }
    this.gameInstanceId = new Guid().value;
  }
}
