import { Directive, ElementRef, inject, input } from '@angular/core';
import { ElementClientRect } from './utils/models';
import { PositionResolver } from './utils/position-resolver';

@Directive({
	selector: '[in-view-item]',
	standalone: true,
})
export class InviewItemDirective {
	private readonly _element = inject(ElementRef);

	readonly id = input<any>(undefined);
	readonly data = input<any>(undefined);

	getELementRect(): ElementClientRect {
		return PositionResolver.getBoundingClientRect(this._element.nativeElement);
	}
	isVisible(): boolean {
		return PositionResolver.isVisible(this._element.nativeElement);
	}
	getData(): any {
		return { id: this.id(), data: this.data() };
	}
}
