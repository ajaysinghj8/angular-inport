import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InviewDirective } from './inview.directive';
import { ScrollObservable } from './utils/scroll-observable';
import { WindowRuler } from './utils/viewport-ruler';
@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [InviewDirective],
  exports: [InviewDirective],
  providers: [ScrollObservable, WindowRuler]
})
export class Ng2InviewModule { }
