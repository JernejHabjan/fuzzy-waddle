import ComponentService from './services/component.service';
import { v4 as uuidv4 } from 'uuid';
export abstract class Actor {
  components: ComponentService;
  /**
   * unique name
   */
  readonly name: string;
  protected constructor() {
    this.name = uuidv4();
    this.components = new ComponentService(this.name);
  }

  update(time: number, delta: number) {
    this.components.update(time, delta);
  }
}
