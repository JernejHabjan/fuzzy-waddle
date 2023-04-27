import { Guid } from './uuid';

export interface GameCreateDto {
  gameInstanceId: string;
}

export interface GameDestroyDto {
  gameInstanceId: string;
}

export class GameInstance {
  id: string;

  constructor(id: string | null = null) {
    if (id) {
      this.id = id;
      return;
    }
    this.id = new Guid().value;
  }
}
