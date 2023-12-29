import { IsNotEmpty, IsString } from "class-validator";

export class RoomDto {
  @IsString()
  @IsNotEmpty()
  roomName: string;

  @IsString()
  @IsNotEmpty()
  roomDescription: string;

  @IsString()
  @IsNotEmpty()
  roomType: string;
}
