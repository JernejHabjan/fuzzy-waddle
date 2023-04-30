import { BaseData } from './game-mode';

export abstract class BaseGameMode<TData extends BaseData = BaseData> {
  data: TData;
}
