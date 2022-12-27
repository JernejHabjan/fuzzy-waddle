import { Actor } from '../actor';

export class Limitations {
  constructor(public actorLimitation: typeof Actor[] = []) {}
}
