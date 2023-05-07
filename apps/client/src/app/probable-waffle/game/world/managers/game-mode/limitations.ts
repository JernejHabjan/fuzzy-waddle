import { Actor } from '../../../entity/actor/actor';

export class Limitations {
  constructor(public actorLimitation: (typeof Actor)[] = []) {}
}
