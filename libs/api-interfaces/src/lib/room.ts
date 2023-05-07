export interface Room {
  gameInstanceId: string;
}

export interface RoomEvent {
  room: Room;
  action: RoomAction;
}

export type RoomAction = 'added' | 'existing' | 'removed';

export interface SpectatorEvent {
  room: Room;
  user_id: string;
  action: SpectatorAction;
}

export type SpectatorAction = 'joined' | 'left';

export enum GatewaySpectatorEvent {
  Spectator = 'room-spectator'
}

