import { NgModule } from "@angular/core";
import { WrapPipe } from "./wrap.pipe";

@NgModule({
  declarations: [WrapPipe],
  exports: [WrapPipe]
})
export class WrapPipeModule {}
