import { NgModule } from '@angular/core';
import { InviewDirective } from './inview.directive';
import { ScrollObservable } from './utils/scroll-observable';
import { WindowRuler } from './utils/viewport-ruler';
@NgModule({
  imports: [],
  declarations: [InviewDirective],
  exports: [InviewDirective],
  providers: [ScrollObservable, WindowRuler]
})
export class Ng2InviewModule { }
