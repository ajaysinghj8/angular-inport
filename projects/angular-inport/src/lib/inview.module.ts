import { NgModule } from '@angular/core';
import { InviewDirective } from './inview.directive';
import { InviewContainerDirective } from './inview-container.directive';
import { InviewItemDirective } from './inview-item.directive';

/**
 * @deprecated Import standalone directives directly instead:
 * `imports: [InviewDirective, InviewContainerDirective, InviewItemDirective]`
 * NgInviewModule will be removed in a future major version.
 */
@NgModule({
	imports: [InviewDirective, InviewContainerDirective, InviewItemDirective],
	exports: [InviewDirective, InviewContainerDirective, InviewItemDirective],
})
export class NgInviewModule {}
